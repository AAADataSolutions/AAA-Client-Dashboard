import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search')?.trim();

    let query = supabase
      .from('ray_baum_records')
      .select(`
        *,
        property:properties(id, name, address, city, state, zip_code, main_phone)
      `)
      .order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'ALL') {
      query = query.eq('property_id', propertyId);
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,assigned_to_room.ilike.%${search}%,location.ilike.%${search}%`);
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

    const { property_id, phone_number, assigned_to_room, location } = body;

    if (!property_id || !phone_number) {
      return NextResponse.json(
        { success: false, error: 'Property ID and Phone Number are required.' },
        { status: 400 }
      );
    }

    const { data: newRecord, error } = await supabase
      .from('ray_baum_records')
      .insert({
        property_id,
        phone_number: phone_number.trim(),
        assigned_to_room: assigned_to_room?.trim() || null,
        location: location?.trim() || null,
      })
      .select(`
        *,
        property:properties(id, name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'RAY_BAUM_RECORD_CREATED',
      entity_type: 'RAY_BAUM',
      entity_id: newRecord.id,
      entity_name: `${newRecord.phone_number} (${newRecord.assigned_to_room || 'No Room'})`,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, property_id, phone_number, assigned_to_room, location } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (property_id !== undefined) updatePayload.property_id = property_id;
    if (phone_number !== undefined) updatePayload.phone_number = phone_number.trim();
    if (assigned_to_room !== undefined) updatePayload.assigned_to_room = assigned_to_room ? assigned_to_room.trim() : null;
    if (location !== undefined) updatePayload.location = location ? location.trim() : null;

    const { data: updatedRecord, error } = await supabase
      .from('ray_baum_records')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updatedRecord });
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
      return NextResponse.json({ success: false, error: 'Record ID is required.' }, { status: 400 });
    }

    const { error } = await supabase.from('ray_baum_records').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
