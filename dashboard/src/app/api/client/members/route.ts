import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { data: callerMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!callerMember?.organization_id) {
      return NextResponse.json({ success: true, members: [], invitations: [] });
    }

    const orgId = callerMember.organization_id;

    // 1. Fetch active organization members
    const { data: members, error: memErr } = await supabase
      .from('organization_members')
      .select(`
        id,
        role,
        status,
        created_at,
        updated_at,
        profile:profiles(id, full_name, email, phone_number, avatar_url, role)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (memErr) throw memErr;

    // 2. Fetch pending invitations for this organization
    const { data: invitations, error: invErr } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        target_org_role,
        status,
        expires_at,
        created_at,
        inviter:profiles!invitations_invited_by_fkey(full_name, email)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (invErr) throw invErr;

    return NextResponse.json({
      success: true,
      callerRole: callerMember.role,
      members: members || [],
      invitations: invitations || [],
    });
  } catch (err: any) {
    console.error('Client Members API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch members' },
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

    // Role check: Only Client Admin can modify members
    const { data: callerMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!callerMember || callerMember.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Organization Admins can manage team members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { member_id, role, status } = body;

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'Member ID is required.' }, { status: 400 });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (role && ['ADMIN', 'USER'].includes(role)) {
      updates.role = role;
    }
    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) {
      updates.status = status;
    }

    const { data: updated, error } = await supabase
      .from('organization_members')
      .update(updates)
      .eq('id', member_id)
      .eq('organization_id', callerMember.organization_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Member permissions updated successfully.',
    });
  } catch (err: any) {
    console.error('Client Member update error:', err);
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

    // Role check: Only Client Admin
    const { data: callerMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!callerMember || callerMember.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Organization Admins can remove members.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');
    const invitationId = searchParams.get('invitation_id');

    if (memberId) {
      // Prevent deleting self
      const { data: targetMember } = await supabase
        .from('organization_members')
        .select('profile_id')
        .eq('id', memberId)
        .single();

      if (targetMember?.profile_id === user.id) {
        return NextResponse.json(
          { success: false, error: 'You cannot remove yourself from the organization.' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', callerMember.organization_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Member removed from organization.' });
    }

    if (invitationId) {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'REVOKED' })
        .eq('id', invitationId)
        .eq('organization_id', callerMember.organization_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Invitation revoked.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  } catch (err: any) {
    console.error('Client Member delete error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove member' },
      { status: 500 }
    );
  }
}
