import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        service_type:service_types(*),
        property_links:organization_property_services(
          id,
          org_property:organization_properties(
            id,
            property:properties(*),
            organization:organizations(*)
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: service });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.phone_number !== undefined) updatePayload.phone_number = body.phone_number.trim();
    if (body.service_type_id !== undefined) updatePayload.service_type_id = body.service_type_id;
    if (body.description !== undefined) updatePayload.description = body.description ? body.description.trim() : null;
    if (body.status !== undefined) updatePayload.status = body.status;

    const { data: updatedService, error } = await supabase
      .from('services')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Reassign organization_property if provided
    if (body.organization_property_id) {
      await supabase.from('organization_property_services').delete().eq('service_id', id);
      await supabase.from('organization_property_services').insert({
        organization_property_id: body.organization_property_id,
        service_id: id,
      });
    }

    return NextResponse.json({ success: true, data: updatedService });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('services')
      .update({ status: 'DISCONNECTED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Service disconnected successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
