import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

const DEFAULT_TYPES = [
  { id: 'def-1', name: 'Voice Trunk / DID', description: 'Standard SIP voice trunks and DID numbers', status: 'ACTIVE' },
  { id: 'def-2', name: 'Fire Lines', description: 'Dedicated fire alarm communicator circuits and life-safety lines', status: 'ACTIVE' },
  { id: 'def-3', name: 'Elevator Lines', description: 'Elevator emergency phone lines', status: 'ACTIVE' },
  { id: 'def-4', name: 'Direct Inward Dialing (DID)', description: 'Direct extension inbound phone numbers', status: 'ACTIVE' },
  { id: 'def-5', name: 'Toll-Free Trunk', description: '800/888 inbound toll-free routing', status: 'ACTIVE' },
  { id: 'def-6', name: 'Paging & Intercom', description: 'Overhead paging and emergency mass notification lines', status: 'ACTIVE' },
  { id: 'def-7', name: 'General', description: 'General telecom and data services', status: 'ACTIVE' },
];

export async function GET() {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const { data, error } = await dbClient
      .from('service_types')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_TYPES });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { name, description } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Service type name is required.' }, { status: 400 });
    }

    const { data: newType, error } = await dbClient
      .from('service_types')
      .insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        status: 'ACTIVE',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVICE_TYPE_CREATED',
      entity_type: 'SERVICE_TYPE',
      entity_id: newType.id,
      entity_name: newType.name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newType });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { id, name, description } = body;
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'ID and name are required.' }, { status: 400 });
    }

    const { data: updatedType, error } = await dbClient
      .from('service_types')
      .update({
        name: name.trim(),
        description: description ? description.trim() : null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVICE_TYPE_UPDATED',
      entity_type: 'SERVICE_TYPE',
      entity_id: updatedType.id,
      entity_name: updatedType.name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedType });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service type ID is required.' }, { status: 400 });
    }

    // Check if any services use this type
    const { count, error: countErr } = await dbClient
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('service_type_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete service type: ${count} service(s) currently use it.` },
        { status: 400 }
      );
    }

    const { error: delErr } = await dbClient
      .from('service_types')
      .delete()
      .eq('id', id);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'SERVICE_TYPE_DELETED',
      entity_type: 'SERVICE_TYPE',
      entity_id: id,
      entity_name: `Service Type ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Service type deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
