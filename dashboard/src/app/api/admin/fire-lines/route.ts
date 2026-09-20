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

    const { data: newFireLine, error } = await supabase
      .from('fire_lines')
      .insert({
        device_type: device_type.trim(),
        phone_number: phone_number.trim(),
        serial_number: serial_number ? serial_number.trim() : null,
        description: description ? description.trim() : null,
        property_id: property_id && property_id !== 'UNASSIGNED' ? property_id : null,
        service_id: service_id && service_id !== 'UNASSIGNED' ? service_id : null,
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (device_type !== undefined) updatePayload.device_type = device_type.trim();
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim();
    if (serial_number !== undefined) updatePayload.serial_number = serial_number ? serial_number.trim() : null;
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (property_id !== undefined) updatePayload.property_id = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    if (service_id !== undefined) updatePayload.service_id = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

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

    const { error } = await supabase.from('fire_lines').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'FIRE_LINE_DELETED',
      entity_type: 'FIRE_LINE',
      entity_id: id,
      entity_name: `Fire Line ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Fire line deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
