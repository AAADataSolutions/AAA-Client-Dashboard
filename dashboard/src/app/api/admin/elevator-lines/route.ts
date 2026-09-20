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
      .from('elevator_lines')
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
      query = query.or(`phone_number.ilike.%${search}%,extension.ilike.%${search}%,description.ilike.%${search}%,status.ilike.%${search}%`);
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

    const { phone_number, extension, description, status, property_id, service_id } = body;

    if (!phone_number) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const { data: newElevatorLine, error } = await supabase
      .from('elevator_lines')
      .insert({
        phone_number: phone_number.trim(),
        extension: extension ? extension.trim() : null,
        description: description ? description.trim() : null,
        status: status || 'ACTIVE',
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim();
    if (extension !== undefined) updatePayload.extension = extension ? extension.trim() : null;
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (status !== undefined) updatePayload.status = status;
    if (property_id !== undefined) updatePayload.property_id = property_id && property_id !== 'UNASSIGNED' ? property_id : null;
    if (service_id !== undefined) updatePayload.service_id = service_id && service_id !== 'UNASSIGNED' ? service_id : null;

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

    const { error } = await supabase.from('elevator_lines').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'ELEVATOR_LINE_DELETED',
      entity_type: 'ELEVATOR_LINE',
      entity_id: id,
      entity_name: `Elevator Line ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Elevator line deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
