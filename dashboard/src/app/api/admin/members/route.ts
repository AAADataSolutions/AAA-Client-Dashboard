import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    // Fetch all profiles that are system admins or staff
    const { data: members, error: memErr } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (memErr) throw memErr;

    return NextResponse.json({
      success: true,
      members: members || [],
    });
  } catch (err: any) {
    console.error('Admin Members GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch admin team' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { member_id, role, full_name, phone_number } = body;

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'Missing member_id' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const updates: any = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (phone_number !== undefined) updates.phone_number = phone_number ? phone_number.trim() : null;

    const { data: updated, error: updateErr } = await db
      .from('profiles')
      .update(updates)
      .eq('id', member_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await logAuditEvent({
      action: 'ADMIN_ROLE_UPDATED',
      details: `Updated role and permissions for admin user '${updated.full_name || updated.email}' to role '${updated.role}'`,
      userId: user.id,
      entityType: 'USER',
      entityId: member_id,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    console.error('Admin Members PATCH error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update member' },
      { status: 500 }
    );
  }
}
