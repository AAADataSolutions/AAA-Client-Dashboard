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
    if (body.monthly_price !== undefined) {
      updatePayload.monthly_price = body.monthly_price === null || body.monthly_price === '' ? null : Number(body.monthly_price);
    }
    if (body.ray_baud_and_logs_enabled !== undefined) {
      updatePayload.ray_baud_and_logs_enabled = Boolean(body.ray_baud_and_logs_enabled);
    } else if (body.e911_status !== undefined) {
      updatePayload.ray_baud_and_logs_enabled = body.e911_status === 'VERIFIED' || body.e911_status === 'ACTIVE';
    }
    if (body.ray_baum_status !== undefined) updatePayload.ray_baum_status = body.ray_baum_status;
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
      // Find existing organization_properties link
      const { data: existingOp } = await supabase
        .from('organization_properties')
        .select('id, organization_id')
        .eq('property_id', id)
        .maybeSingle();

      if (!body.organization_id || body.organization_id === 'UNASSIGNED') {
        // Unassign property from organization
        await supabase.from('organization_properties').delete().eq('property_id', id);
      } else if (!existingOp) {
        // Insert new assignment
        const { data: newOp } = await supabase
          .from('organization_properties')
          .insert({
            organization_id: body.organization_id,
            property_id: id,
            status: body.status || 'ACTIVE',
          })
          .select('id')
          .single();

        if (newOp) {
          // Auto create onboarding record (Rule 3)
          await supabase.from('onboardings').insert({
            organization_property_id: newOp.id,
            status: 'DRAFT',
          });

          // Auto create e911 record
          await supabase.from('e911_records').insert({
            organization_property_id: newOp.id,
            emergency_address: `${updatedProp.address}, ${updatedProp.city}, ${updatedProp.state} ${updatedProp.zip_code}`,
            status: updatedProp.ray_baud_and_logs_enabled ? 'VERIFIED' : 'PENDING',
            verified_at: updatedProp.ray_baud_and_logs_enabled ? new Date().toISOString() : null,
          });
        }
      } else if (existingOp.organization_id !== body.organization_id) {
        // Update existing link to new org
        await supabase
          .from('organization_properties')
          .update({ organization_id: body.organization_id, status: body.status || 'ACTIVE' })
          .eq('id', existingOp.id);
      }
    }

    // Keep e911_records in sync with property e911 status
    if (updatePayload.ray_baud_and_logs_enabled !== undefined) {
      const { data: op } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('property_id', id)
        .maybeSingle();

      if (op) {
        const isVer = updatePayload.ray_baud_and_logs_enabled;
        await supabase
          .from('e911_records')
          .update({
            status: isVer ? 'VERIFIED' : 'PENDING',
            verified_at: isVer ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_property_id', op.id);
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

    if (!prop) {
      return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
    }

    // Try hard delete after unlinking relations
    try {
      await supabase.from('organization_properties').delete().eq('property_id', id);
      await supabase.from('ray_baum_records').delete().eq('property_id', id);
      await supabase.from('e911_records').delete().eq('property_id', id);
      const { error: delErr } = await supabase.from('properties').delete().eq('id', id);
      if (delErr) {
        // Fallback to ARCHIVED if constraint still prevents deletion
        await supabase
          .from('properties')
          .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch {
      await supabase
        .from('properties')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'PROPERTY_DELETED',
      entity_type: 'PROPERTY',
      entity_id: id,
      entity_name: prop.name,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, message: 'Property deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
