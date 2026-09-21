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

    // Fetch all profiles
    const { data: allProfiles, error: memErr } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (memErr) throw memErr;

    // Filter strictly to only those whose role is either "super_admin" or "sub-super_admin"
    const members = (allProfiles || []).filter((m: any) => {
      const normalizedRole = (m.role || '').toLowerCase().replace(/[-_]/g, '');
      return normalizedRole === 'superadmin' || normalizedRole === 'subsuperadmin';
    });

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

    // Verify caller role
    const { data: callerProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    const callerNormRole = (callerProfile?.role || '').toLowerCase().replace(/[-_]/g, '');
    const isCallerSuperAdmin = callerNormRole === 'superadmin';

    // Verify target profile
    const { data: targetProfile, error: targetErr } = await db
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', member_id)
      .maybeSingle();

    if (targetErr || !targetProfile) {
      return NextResponse.json({ success: false, error: 'Target user profile not found.' }, { status: 404 });
    }

    const targetNormRole = (targetProfile.role || '').toLowerCase().replace(/[-_]/g, '');
    const isTargetSuperAdmin = targetNormRole === 'superadmin';

    // Guard: Sub-Super Admin cannot modify a Super Admin's role or promote anyone to Super Admin
    if (!isCallerSuperAdmin) {
      if (isTargetSuperAdmin) {
        return NextResponse.json(
          { success: false, error: 'Sub-Super Admins do not have permission to modify a Super Admin\'s role.' },
          { status: 403 }
        );
      }
      if (role && role.toUpperCase().replace(/[-_]/g, '') === 'SUPERADMIN') {
        return NextResponse.json(
          { success: false, error: 'Only Super Admins can grant Super Admin privileges.' },
          { status: 403 }
        );
      }
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (role) {
      const r = role.toUpperCase().replace(/-/g, '_');
      updates.role = r;
    }
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let memberId = searchParams.get('id') || searchParams.get('member_id');

    if (!memberId) {
      try {
        const body = await request.json();
        memberId = body.member_id || body.id;
      } catch {}
    }

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required.' }, { status: 400 });
    }

    // Guard: Admin cannot delete their own profile
    if (memberId === user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot remove your own administrator account.' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    // Verify caller role
    const { data: callerProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    const callerNormRole = (callerProfile?.role || '').toLowerCase().replace(/[-_]/g, '');
    const isCallerSuperAdmin = callerNormRole === 'superadmin';

    // Verify target profile exists
    const { data: targetProfile, error: getErr } = await db
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', memberId)
      .maybeSingle();

    if (getErr || !targetProfile) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 404 });
    }

    const targetNormRole = (targetProfile.role || '').toLowerCase().replace(/[-_]/g, '');
    const isTargetSuperAdmin = targetNormRole === 'superadmin';

    // Guard: Sub-Super Admin cannot remove a Super Admin
    if (!isCallerSuperAdmin && isTargetSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Sub-Super Admins do not have permission to remove a Super Admin.' },
        { status: 403 }
      );
    }

    // 1. Remove from organization memberships if any exist
    try {
      await db.from('organization_members').delete().eq('profile_id', memberId);
    } catch (omErr) {
      console.warn('Non-fatal: Error clearing organization membership:', omErr);
    }

    // 2. Delete user from profiles table (requested by user)
    const { error: delErr } = await db
      .from('profiles')
      .delete()
      .eq('id', memberId);

    if (delErr) {
      throw delErr;
    }

    // 3. If service role admin client is available, also delete from auth.users
    if (adminClient?.auth?.admin) {
      try {
        await adminClient.auth.admin.deleteUser(memberId);
      } catch (authDelErr) {
        console.warn('Could not delete auth.users record (service key may be restricted):', authDelErr);
      }
    }

    await logAuditEvent({
      action: 'ADMIN_USER_DELETED',
      details: `Deleted user '${targetProfile.full_name || targetProfile.email}' (${targetProfile.role}) from the profiles table`,
      userId: user.id,
      entityType: 'USER',
      entityId: memberId,
    });

    return NextResponse.json({
      success: true,
      message: `User '${targetProfile.full_name || targetProfile.email}' was successfully removed.`,
    });
  } catch (err: any) {
    console.error('Admin Members DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete member from profiles table' },
      { status: 500 }
    );
  }
}
