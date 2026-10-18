import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portingId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient() || supabase;

    // Fetch services joined with porting_request_services
    const { data: links, error: lErr } = await admin
      .from('porting_request_services')
      .select(`
        id,
        service_id,
        service:services(
          id,
          phone_number,
          description,
          price,
          status,
          service_name,
          custom_service_id,
          service_type:service_types(id, name),
          created_at
        )
      `)
      .eq('porting_request_id', portingId);

    if (lErr) {
      return NextResponse.json({ success: false, error: lErr.message }, { status: 400 });
    }

    const services = (links || [])
      .map((item: any) => item.service)
      .filter(Boolean)
      .map((s: any) => ({
        id: s.id,
        phone_number: s.phone_number,
        service_name: s.service_name || '',
        custom_service_id: s.custom_service_id || '',
        service_type: s.service_type?.name || 'Voice Line',
        description: s.description || '',
        price: Number(s.price || 0),
        status: s.status || 'ACTIVE',
        created_at: s.created_at,
      }));

    return NextResponse.json({ success: true, data: services });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portingId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient() || supabase;
    const body = await request.json();

    const { service_id } = body;
    if (!service_id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    // 1. Link to porting_request_services
    // First remove any existing link for this service in this porting request
    await admin
      .from('porting_request_services')
      .delete()
      .eq('porting_request_id', portingId)
      .eq('service_id', service_id);

    const { data: newLink, error: linkErr } = await admin
      .from('porting_request_services')
      .insert({
        porting_request_id: portingId,
        service_id: service_id,
      })
      .select()
      .single();

    if (linkErr) {
      return NextResponse.json({ success: false, error: linkErr.message }, { status: 400 });
    }

    // 2. If porting request has organization_property_id, also link to organization_property_services
    const { data: pr } = await admin
      .from('porting_requests')
      .select('organization_property_id')
      .eq('id', portingId)
      .maybeSingle();

    if (pr?.organization_property_id) {
      await admin
        .from('organization_property_services')
        .delete()
        .eq('service_id', service_id);

      await admin
        .from('organization_property_services')
        .insert({
          organization_property_id: pr.organization_property_id,
          service_id: service_id,
        });
    }

    await syncPropertyMonthlyPrice(admin, portingId);

    return NextResponse.json({ success: true, data: newLink });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portingId } = await params;
    const supabase = await createClient();
    const admin = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    // Unlink from porting_request_services
    const { error } = await admin
      .from('porting_request_services')
      .delete()
      .eq('porting_request_id', portingId)
      .eq('service_id', serviceId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Also unlink from organization_property_services if linked
    const { data: pr } = await admin
      .from('porting_requests')
      .select('organization_property_id')
      .eq('id', portingId)
      .maybeSingle();

    if (pr?.organization_property_id) {
      await admin
        .from('organization_property_services')
        .delete()
        .eq('organization_property_id', pr.organization_property_id)
        .eq('service_id', serviceId);
    }

    await syncPropertyMonthlyPrice(admin, portingId);

    return NextResponse.json({ success: true, message: 'Service unassigned successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function syncPropertyMonthlyPrice(admin: any, portingId: string) {
  try {
    const { data: pr } = await admin
      .from('porting_requests')
      .select('property_name, organization_property:organization_properties(property_id)')
      .eq('id', portingId)
      .maybeSingle();

    let propId = (pr as any)?.organization_property?.property_id;
    if (!propId && pr?.property_name) {
      const { data: matched } = await admin
        .from('properties')
        .select('id')
        .ilike('name', pr.property_name.trim())
        .maybeSingle();
      propId = matched?.id;
    }

    if (propId) {
      const [{ data: propData }, { data: links }] = await Promise.all([
        admin.from('properties').select('base_price, monthly_price').eq('id', propId).maybeSingle(),
        admin.from('porting_request_services').select('service:services(price)').eq('porting_request_id', portingId),
      ]);

      const servicesTotal = (links || []).reduce((acc: number, l: any) => {
        return acc + Number((l.service as any)?.price || 0);
      }, 0);

      const base = Number(propData?.base_price ?? propData?.monthly_price ?? 0);
      const newTotal = base + servicesTotal;
      await admin.from('properties').update({
        base_price: base,
        monthly_price: newTotal,
        updated_at: new Date().toISOString(),
      }).eq('id', propId);
    }
  } catch (e) {
    console.error('Error syncing property monthly price:', e);
  }
}
