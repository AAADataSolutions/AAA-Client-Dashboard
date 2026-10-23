import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import { syncPropertyMonthlyPrice } from '@/lib/properties/pricing';

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
    if (body.price !== undefined) updatePayload.price = body.price === null || body.price === '' ? 0 : Math.max(0, parseFloat(String(body.price)));
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
    const affectedPropIds = new Set<string>();

    // Check existing service property link
    const { data: currentSvcData } = await supabase
      .from('services')
      .select('property_id')
      .eq('id', id)
      .maybeSingle();

    if (currentSvcData?.property_id) {
      affectedPropIds.add(currentSvcData.property_id);
    }

    if (targetPropertyId !== undefined) {
      const cleanPropId = targetPropertyId && targetPropertyId !== 'UNASSIGNED' ? targetPropertyId : null;
      if (cleanPropId) affectedPropIds.add(cleanPropId);

      // Direct assignment on service row
      await supabase.from('services').update({ property_id: cleanPropId }).eq('id', id);

      if (cleanPropId && !targetOrgPropId) {
        // Look up organization_property record for this property if one exists
        const { data: op } = await supabase
          .from('organization_properties')
          .select('id')
          .eq('property_id', cleanPropId)
          .maybeSingle();

        if (op) {
          targetOrgPropId = op.id;
        }
      }

      if (targetOrgPropId) {
        await supabase.from('organization_property_services').delete().eq('service_id', id);
        await supabase.from('organization_property_services').insert({
          organization_property_id: targetOrgPropId,
          service_id: id,
        });
      } else if (!cleanPropId || body.unassign === true) {
        await supabase.from('organization_property_services').delete().eq('service_id', id);
      }
    }

    // Sync affected property pricing
    for (const pId of affectedPropIds) {
      await syncPropertyMonthlyPrice(supabase, pId);
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
      .select('phone_number, service_name, property_id')
      .eq('id', id)
      .maybeSingle();

    if (!existingSvc) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    // Collect affected properties for pricing recalculation
    const affectedPropIds = new Set<string>();
    if (existingSvc.property_id) {
      affectedPropIds.add(existingSvc.property_id);
    }

    const { data: opsLinks } = await supabase
      .from('organization_property_services')
      .select('organization_property:organization_properties(property_id)')
      .eq('service_id', id);

    (opsLinks || []).forEach((link: any) => {
      const pId = link.organization_property?.property_id;
      if (pId) affectedPropIds.add(pId);
    });

    // 1. Unlink from fire_lines and elevator_lines
    if (existingSvc.phone_number) {
      await supabase
        .from('fire_lines')
        .delete()
        .or(`service_id.eq.${id},phone_number.eq.${existingSvc.phone_number.trim()}`);

      await supabase
        .from('elevator_lines')
        .delete()
        .or(`service_id.eq.${id},phone_number.eq.${existingSvc.phone_number.trim()}`);
    } else {
      await supabase.from('fire_lines').delete().eq('service_id', id);
      await supabase.from('elevator_lines').delete().eq('service_id', id);
    }

    // 2. Unlink any property assignments
    await supabase.from('organization_property_services').delete().eq('service_id', id);

    // 3. Delete service
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

    // Sync monthly price for affected properties
    for (const pId of affectedPropIds) {
      await syncPropertyMonthlyPrice(supabase, pId);
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
