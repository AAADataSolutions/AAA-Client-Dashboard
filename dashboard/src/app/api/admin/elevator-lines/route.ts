import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const propertyId = searchParams.get('propertyId');

    // 1. Query elevator_lines table
    let query = supabase
      .from('elevator_lines')
      .select(`
        *,
        property:properties(id, name, address, city, state),
        service:services(id, service_name, phone_number, status, description)
      `)
      .order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'ALL') {
      query = query.eq('property_id', propertyId);
    }

    const { data: eleData, error } = await query;
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const existingKeys = new Set<string>();
    const existingServiceIds = new Set<string>();
    const combinedList: any[] = [];

    (eleData || []).forEach((item: any) => {
      if (item.service_id) existingServiceIds.add(item.service_id);
      if (item.phone_number && item.property_id) {
        existingKeys.add(`${item.phone_number.trim()}_${item.property_id}`);
      }
      combinedList.push(item);
    });

    // 2. Also query organization_property_services for elevator services
    const { data: opsRecords } = await supabase
      .from('organization_property_services')
      .select(`
        id,
        organization_property:organization_properties(
          property_id,
          property:properties(id, name, address, city, state)
        ),
        service:services(
          id,
          phone_number,
          service_name,
          custom_service_id,
          status,
          description,
          created_at,
          service_type:service_types(id, name)
        )
      `);

    for (const link of opsRecords || []) {
      const svc: any = link.service;
      const op: any = link.organization_property;
      if (!svc) continue;

      const typeName = (svc.service_type?.name || '').toLowerCase();
      const svcName = (svc.service_name || '').toLowerCase();
      const desc = (svc.description || '').toLowerCase();

      const isElevator =
        typeName.includes('elevator') ||
        svcName.includes('elevator') ||
        desc.includes('elevator');

      if (!isElevator) continue;

      const propId = op?.property_id;
      const phone = svc.phone_number?.trim();
      const dedupeKey = `${phone}_${propId}`;

      if (existingServiceIds.has(svc.id) || (phone && propId && existingKeys.has(dedupeKey))) {
        continue;
      }

      if (propertyId && propertyId !== 'ALL' && propId !== propertyId) {
        continue;
      }

      existingServiceIds.add(svc.id);
      if (phone && propId) existingKeys.add(dedupeKey);

      const propObj = Array.isArray(op?.property) ? op?.property[0] : op?.property;
      const newItem = {
        id: svc.id,
        service_id: svc.id,
        property_id: propId || null,
        phone_number: svc.phone_number || '',
        extension: null,
        description: svc.description || svc.service_name || 'Elevator Emergency Voice Circuit',
        status: svc.status || 'ACTIVE',
        created_at: svc.created_at || new Date().toISOString(),
        property: propObj || null,
        service: svc,
      };

      combinedList.push(newItem);

      // Auto-backfill to elevator_lines table
      if (propId && phone) {
        supabase.from('elevator_lines')
          .insert({
            property_id: propId,
            service_id: svc.id,
            phone_number: phone,
            status: svc.status || 'ACTIVE',
            description: svc.description || svc.service_name || null,
          })
          .then(({ error: insertErr }) => {
            if (insertErr) console.warn('Could not backfill elevator_lines in admin:', insertErr.message);
          });
      }
    }

    let result = combinedList;
    if (search) {
      result = result.filter((item) => {
        const pName = item.property?.name?.toLowerCase() || '';
        const phone = (item.phone_number || '').toLowerCase();
        const ext = (item.extension || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const statusStr = (item.status || '').toLowerCase();
        return (
          pName.includes(search) ||
          phone.includes(search) ||
          ext.includes(search) ||
          desc.includes(search) ||
          statusStr.includes(search)
        );
      });
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { phone_number, extension, description, status, property_id, service_id } = body;

    if (!phone_number) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const propId = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    let linkedServiceId = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

    // If no service_id was provided, automatically mirror/create this as a service in services table
    if (!linkedServiceId) {
      // 1. Resolve or create 'Elevator Lines' service type
      let typeId: string | null = null;
      const { data: stData } = await supabase
        .from('service_types')
        .select('id')
        .or('name.ilike.Elevator Lines,name.ilike.Elevator Line')
        .limit(1)
        .maybeSingle();

      if (stData) {
        typeId = stData.id;
      } else {
        const { data: newType } = await supabase
          .from('service_types')
          .insert({ name: 'Elevator Lines', description: 'Life Safety & Elevator Cab Dedicated Emergency Lines' })
          .select('id')
          .single();
        if (newType) typeId = newType.id;
      }

      // 2. Insert into services
      const customServiceId = `EL-${Date.now().toString().slice(-6)}`;
      const serviceName = `Elevator Line${extension ? ` - Ext ${extension.trim()}` : ''}`;
      const serviceDesc = description
        ? description.trim()
        : (extension ? `Elevator Line (Ext: ${extension.trim()})` : 'Emergency Elevator Line');

      const { data: createdSvc } = await supabase
        .from('services')
        .insert({
          custom_service_id: customServiceId,
          service_name: serviceName,
          phone_number: phone_number.trim(),
          service_type_id: typeId,
          description: serviceDesc,
          status: status || 'ACTIVE',
        })
        .select('id')
        .single();

      if (createdSvc) {
        linkedServiceId = createdSvc.id;

        // 3. Link to property if property_id was provided and property has an organization link
        if (propId) {
          const { data: orgProp } = await supabase
            .from('organization_properties')
            .select('id')
            .eq('property_id', propId)
            .maybeSingle();

          if (orgProp) {
            await supabase.from('organization_property_services').insert({
              organization_property_id: orgProp.id,
              service_id: linkedServiceId,
            });
          }
        }
      }
    }

    const { data: newElevatorLine, error } = await supabase
      .from('elevator_lines')
      .insert({
        phone_number: phone_number.trim(),
        extension: extension ? extension.trim() : null,
        description: description ? description.trim() : null,
        status: status || 'ACTIVE',
        property_id: propId,
        service_id: linkedServiceId,
      })
      .select(`
        *,
        property:properties(id, name),
        service:services(id, service_name, phone_number)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'ELEVATOR_LINE_CREATED',
      entity_type: 'ELEVATOR_LINE',
      entity_id: newElevatorLine.id,
      entity_name: `Elevator Line - ${newElevatorLine.phone_number}`,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newElevatorLine });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, phone_number, extension, description, status, property_id, service_id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Elevator Line ID is required.' }, { status: 400 });
    }

    // Fetch existing elevator line
    const { data: existingLine } = await supabase
      .from('elevator_lines')
      .select('id, service_id, property_id, phone_number, extension')
      .eq('id', id)
      .maybeSingle();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim();
    if (extension !== undefined) updatePayload.extension = extension ? extension.trim() : null;
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (status !== undefined) updatePayload.status = status;
    if (property_id !== undefined) updatePayload.property_id = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    if (service_id !== undefined) updatePayload.service_id = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

    const currentServiceId = existingLine?.service_id || updatePayload.service_id;
    const targetPropId = updatePayload.property_id !== undefined ? updatePayload.property_id : existingLine?.property_id;

    // If linked to a service, update service info as well
    if (currentServiceId) {
      const srvUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (phone_number !== undefined) srvUpdate.phone_number = phone_number.trim();
      const extVal = extension !== undefined ? extension : existingLine?.extension;
      if (phone_number !== undefined || extension !== undefined) {
        srvUpdate.service_name = `Elevator Line${extVal ? ` - Ext ${extVal.trim()}` : ''}`;
      }
      if (description !== undefined) srvUpdate.description = description ? description.trim() : null;
      if (status !== undefined) srvUpdate.status = status;

      await supabase.from('services').update(srvUpdate).eq('id', currentServiceId);

      // If property was updated, re-link in organization_property_services
      if (property_id !== undefined) {
        await supabase.from('organization_property_services').delete().eq('service_id', currentServiceId);

        if (targetPropId) {
          const { data: op } = await supabase.from('organization_properties').select('id').eq('property_id', targetPropId).maybeSingle();
          if (op) {
            await supabase.from('organization_property_services').insert({
              organization_property_id: op.id,
              service_id: currentServiceId,
            });
          }
        }
      }
    }

    const { data: updatedElevatorLine, error } = await supabase
      .from('elevator_lines')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        property:properties(id, name),
        service:services(id, service_name, phone_number)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'ELEVATOR_LINE_UPDATED',
      entity_type: 'ELEVATOR_LINE',
      entity_id: id,
      entity_name: `Elevator Line - ${updatedElevatorLine.phone_number}`,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedElevatorLine });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Elevator Line ID is required.' }, { status: 400 });
    }

    // Fetch elevator line to check linked service
    const { data: existingLine } = await supabase
      .from('elevator_lines')
      .select('id, service_id, phone_number')
      .eq('id', id)
      .maybeSingle();

    if (existingLine?.service_id) {
      // Remove service property link & service
      await supabase.from('organization_property_services').delete().eq('service_id', existingLine.service_id);
      await supabase.from('services').delete().eq('id', existingLine.service_id);
    }

    const { error } = await supabase.from('elevator_lines').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'ELEVATOR_LINE_DELETED',
      entity_type: 'ELEVATOR_LINE',
      entity_id: id,
      entity_name: `Elevator Line ${existingLine?.phone_number || id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Elevator line deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
