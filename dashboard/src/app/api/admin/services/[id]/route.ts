import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';

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

    if (body.custom_service_id !== undefined) {
      updatePayload.custom_service_id = body.custom_service_id.trim();
    }
    if (body.service_name !== undefined) {
      updatePayload.service_name = body.service_name ? body.service_name.trim() : null;
    }
    if (body.phone_number !== undefined) updatePayload.phone_number = body.phone_number.trim();
    if (body.service_type_id !== undefined) {
      updatePayload.service_type_id = body.service_type_id;
    } else if (body.service_type !== undefined || body.service_type_name !== undefined) {
      const serviceTypeName = body.service_type ?? body.service_type_name;
      const { data: stRow } = await supabase
        .from('service_types')
        .select('id')
        .ilike('name', serviceTypeName.trim())
        .maybeSingle();
      if (stRow) {
        updatePayload.service_type_id = stRow.id;
      }
    }
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

    // Reassign organization_property / property if provided
    const targetPropertyId = body.property_id;
    let targetOrgPropId = body.organization_property_id;

    if (targetPropertyId && !targetOrgPropId) {
      // Look up organization_property record for this property
      const { data: op } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('property_id', targetPropertyId)
        .maybeSingle();

      if (op) {
        targetOrgPropId = op.id;
      }
    }

    if (targetOrgPropId) {
      // Enforce Rule 2: One service can only be assigned to one property
      await supabase.from('organization_property_services').delete().eq('service_id', id);
      await supabase.from('organization_property_services').insert({
        organization_property_id: targetOrgPropId,
        service_id: id,
      });
    } else if (targetPropertyId === '' || targetPropertyId === null || body.unassign === true) {
      // Explicitly unassigned from property
      await supabase.from('organization_property_services').delete().eq('service_id', id);
    }

    // Audit Log
    await logAdminAction({
      action: body.status !== undefined ? 'SERVICE_STATUS_CHANGED' : 'SERVICE_UPDATED',
      entity_type: 'SERVICE',
      entity_id: id,
      entity_name: updatedService.service_name || updatedService.phone_number,
      description: body.status !== undefined
        ? `Changed service status of '${updatedService.phone_number}' to ${body.status}`
        : `Updated service configuration for '${updatedService.phone_number}'`,
      changes: updatePayload,
    });

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

    const { data: existingSvc } = await supabase
      .from('services')
      .select('phone_number, service_name')
      .eq('id', id)
      .maybeSingle();

    if (!existingSvc) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    // Unlink any property assignments
    await supabase.from('organization_property_services').delete().eq('service_id', id);

    // Delete service
    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      // Fallback: If foreign key prevents hard deletion, set to DISCONNECTED
      const { error: updateErr } = await supabase
        .from('services')
        .update({ status: 'DISCONNECTED', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
      }
    }

    // Audit Log
    await logAdminAction({
      action: 'SERVICE_DELETED',
      entity_type: 'SERVICE',
      entity_id: id,
      entity_name: existingSvc.phone_number || `Service ${id}`,
      description: `Deleted service line '${existingSvc.phone_number || id}'`,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
