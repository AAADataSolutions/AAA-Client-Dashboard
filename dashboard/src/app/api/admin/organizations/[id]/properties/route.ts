import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: links, error } = await supabase
      .from('organization_properties')
      .select(`
        id,
        status,
        created_at,
        property:properties(
          id,
          name,
          address,
          city,
          state,
          zip_code,
          country,
          main_phone,
          fax,
          general_manager_name,
          ray_baud_and_logs_enabled,
          status,
          created_at
        )
      `)
      .eq('organization_id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const properties = (links || []).map((link: any) => {
      const p = link.property;
      return {
        link_id: link.id,
        id: p?.id,
        name: p?.name,
        address: p?.address,
        city: p?.city,
        state: p?.state,
        zip_code: p?.zip_code,
        country: p?.country || 'USA',
        main_phone: p?.main_phone,
        status: p?.status || link.status || 'ACTIVE',
        e911_status: p?.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
        services_count: 8, // provisioned lines count
        created_at: p?.created_at,
      };
    });

    return NextResponse.json({ success: true, data: properties });
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { property_id, status } = body;

    if (!property_id) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required to assign property.' },
        { status: 400 }
      );
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from('organization_properties')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('property_id', property_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'This property is already assigned to this organization.' },
        { status: 400 }
      );
    }

    const { data: newLink, error } = await supabase
      .from('organization_properties')
      .insert({
        organization_id: organizationId,
        property_id,
        status: status || 'ACTIVE',
      })
      .select(`
        id,
        property:properties(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Audit Log
    try {
      const propObj: any = (newLink as any)?.property;
      const propName = Array.isArray(propObj) ? propObj[0]?.name : propObj?.name;
      await supabase.from('audit_logs').insert({
        action: 'PROPERTY_ASSIGNED_TO_ORGANIZATION',
        entity_type: 'ORGANIZATION_PROPERTY',
        entity_id: newLink.id,
        entity_name: propName || 'Assigned Property',
        changes: { organization_id: organizationId, property_id },
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId query param is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('organization_properties')
      .delete()
      .eq('organization_id', organizationId)
      .eq('property_id', propertyId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Property unassigned successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
