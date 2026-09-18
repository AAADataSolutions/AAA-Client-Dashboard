import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: prop, error } = await supabase
      .from('properties')
      .select(`
        *,
        org_links:organization_properties(
          id,
          status,
          organization:organizations(id, name, email, phone),
          onboardings(id, status, target_date),
          services_links:organization_property_services(id, service_id)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      const { data: simpleProp, error: sErr } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: simpleProp });
    }

    return NextResponse.json({ success: true, data: prop });
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

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.address !== undefined) updatePayload.address = body.address.trim();
    if (body.city !== undefined) updatePayload.city = body.city.trim();
    if (body.state !== undefined) updatePayload.state = body.state.trim();
    if (body.zip_code !== undefined) updatePayload.zip_code = body.zip_code.trim();
    if (body.country !== undefined) updatePayload.country = body.country.trim();
    if (body.main_phone !== undefined) updatePayload.main_phone = body.main_phone ? body.main_phone.trim() : null;
    if (body.fax !== undefined) updatePayload.fax = body.fax ? body.fax.trim() : null;
    if (body.contact_person_name !== undefined) updatePayload.contact_person_name = body.contact_person_name ? body.contact_person_name.trim() : null;
    if (body.contact_person_email !== undefined) updatePayload.contact_person_email = body.contact_person_email ? body.contact_person_email.trim() : null;
    if (body.general_manager_name !== undefined) updatePayload.general_manager_name = body.general_manager_name ? body.general_manager_name.trim() : null;
    if (body.general_manager_phone !== undefined) updatePayload.general_manager_phone = body.general_manager_phone ? body.general_manager_phone.trim() : null;
    if (body.general_manager_email !== undefined) updatePayload.general_manager_email = body.general_manager_email ? body.general_manager_email.trim() : null;
    if (body.ray_baud_and_logs_enabled !== undefined) updatePayload.ray_baud_and_logs_enabled = body.ray_baud_and_logs_enabled;
    if (body.status !== undefined) updatePayload.status = body.status;

    const { data: updatedProp, error: propErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    // Reassign organization if specified (Rule 1: One property can only belong to one organization)
    if (body.organization_id !== undefined) {
      // Remove old link
      await supabase.from('organization_properties').delete().eq('property_id', id);
      // Add new link if not null/empty
      if (body.organization_id && body.organization_id !== 'UNASSIGNED') {
        await supabase.from('organization_properties').insert({
          organization_id: body.organization_id,
          property_id: id,
          status: body.status || 'ACTIVE',
        });
      }
    }

    // Central Audit Log
    await logAuditEvent({
      action: body.status && body.status !== updatedProp.status ? 'PROPERTY_STATUS_CHANGED' : 'PROPERTY_UPDATED',
      entity_type: 'PROPERTY',
      entity_id: id,
      entity_name: updatedProp.name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedProp });
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

    const { data: prop } = await supabase.from('properties').select('name').eq('id', id).maybeSingle();

    const { error } = await supabase
      .from('properties')
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'PROPERTY_ARCHIVED',
      entity_type: 'PROPERTY',
      entity_id: id,
      entity_name: prop?.name || `Property ID ${id}`,
      changes: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ success: true, message: 'Property archived successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
