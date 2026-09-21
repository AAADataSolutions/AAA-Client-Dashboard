import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const propertyId = searchParams.get('propertyId');

    let query = supabase
      .from('fire_lines')
      .select(`
        *,
        property:properties(id, name, address, city, state),
        service:services(id, service_name, phone_number)
      `)
      .order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'ALL') {
      query = query.eq('property_id', propertyId);
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,device_type.ilike.%${search}%,serial_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { device_type, phone_number, serial_number, description, property_id, service_id } = body;

    if (!device_type || !phone_number) {
      return NextResponse.json(
        { success: false, error: 'Device type and Phone number are required.' },
        { status: 400 }
      );
    }

    const propId = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    let linkedServiceId = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

    // If no service_id was provided, automatically mirror/create this as a service in services table
    if (!linkedServiceId) {
      // 1. Resolve or create 'Fire Lines' service type
      let typeId: string | null = null;
      const { data: stData } = await supabase
        .from('service_types')
        .select('id')
        .or('name.ilike.Fire Lines,name.ilike.Fire Line')
        .limit(1)
        .maybeSingle();

      if (stData) {
        typeId = stData.id;
      } else {
        const { data: newType } = await supabase
          .from('service_types')
          .insert({ name: 'Fire Lines', description: 'Life Safety & Fire Alarm Dedicated Lines' })
          .select('id')
          .single();
        if (newType) typeId = newType.id;
      }

      // 2. Insert into services
      const customServiceId = `FL-${Date.now().toString().slice(-6)}`;
      const serviceName = `Fire Line - ${device_type.trim()}`;
      const serviceDesc = description
        ? description.trim()
        : `Fire Line device: ${device_type.trim()}${serial_number ? ` (S/N: ${serial_number.trim()})` : ''}`;

      const { data: createdSvc } = await supabase
        .from('services')
        .insert({
          custom_service_id: customServiceId,
          service_name: serviceName,
          phone_number: phone_number.trim(),
          service_type_id: typeId,
          description: serviceDesc,
          status: 'ACTIVE',
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

    const { data: newFireLine, error } = await supabase
      .from('fire_lines')
      .insert({
        device_type: device_type.trim(),
        phone_number: phone_number.trim(),
        serial_number: serial_number ? serial_number.trim() : null,
        description: description ? description.trim() : null,
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
      action: 'FIRE_LINE_CREATED',
      entity_type: 'FIRE_LINE',
      entity_id: newFireLine.id,
      entity_name: `${newFireLine.device_type} - ${newFireLine.phone_number}`,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newFireLine });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, device_type, phone_number, serial_number, description, property_id, service_id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Fire Line ID is required.' }, { status: 400 });
    }

    // Fetch existing fireline
    const { data: existingLine } = await supabase
      .from('fire_lines')
      .select('id, service_id, property_id, phone_number, device_type')
      .eq('id', id)
      .maybeSingle();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (device_type !== undefined) updatePayload.device_type = device_type.trim();
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim();
    if (serial_number !== undefined) updatePayload.serial_number = serial_number ? serial_number.trim() : null;
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (property_id !== undefined) updatePayload.property_id = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    if (service_id !== undefined) updatePayload.service_id = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

    const currentServiceId = existingLine?.service_id || updatePayload.service_id;
    const targetPropId = updatePayload.property_id !== undefined ? updatePayload.property_id : existingLine?.property_id;

    // If linked to a service, update service info as well
    if (currentServiceId) {
      const srvUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (phone_number !== undefined) srvUpdate.phone_number = phone_number.trim();
      if (device_type !== undefined) srvUpdate.service_name = `Fire Line - ${device_type.trim()}`;
      if (description !== undefined) srvUpdate.description = description ? description.trim() : null;

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

    const { data: updatedFireLine, error } = await supabase
      .from('fire_lines')
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
      action: 'FIRE_LINE_UPDATED',
      entity_type: 'FIRE_LINE',
      entity_id: id,
      entity_name: `${updatedFireLine.device_type} - ${updatedFireLine.phone_number}`,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedFireLine });
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
      return NextResponse.json({ success: false, error: 'Fire Line ID is required.' }, { status: 400 });
    }

    // Fetch fireline to check linked service
    const { data: existingLine } = await supabase
      .from('fire_lines')
      .select('id, service_id, device_type, phone_number')
      .eq('id', id)
      .maybeSingle();

    if (existingLine?.service_id) {
      // Remove service property link & service
      await supabase.from('organization_property_services').delete().eq('service_id', existingLine.service_id);
      await supabase.from('services').delete().eq('id', existingLine.service_id);
    }

    const { error } = await supabase.from('fire_lines').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'FIRE_LINE_DELETED',
      entity_type: 'FIRE_LINE',
      entity_id: id,
      entity_name: `Fire Line ${existingLine?.device_type || ''} - ${existingLine?.phone_number || id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Fire line deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
