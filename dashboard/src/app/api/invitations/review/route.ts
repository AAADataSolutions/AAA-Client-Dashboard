import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify caller is SUPER_ADMIN
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (callerProfile?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admin can approve internal team invitations.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { invitationId, action } = body; // action: 'APPROVE' | 'REJECT' | 'REVOKE'

    if (!invitationId || !action) {
      return NextResponse.json({ error: 'invitationId and action are required.' }, { status: 400 });
    }

    const { data: invite, error: findErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (findErr || !invite) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Find user profile by email and upgrade to SUB_SUPER_ADMIN
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', invite.email)
        .maybeSingle();

      if (targetProfile) {
        await supabase
          .from('profiles')
          .update({ role: 'SUB_SUPER_ADMIN', status: 'ACTIVE' })
          .eq('id', targetProfile.id);
      }

      await supabase
        .from('invitations')
        .update({
          status: 'APPROVED',
          approved_by: user.id,
        })
        .eq('id', invitationId);

      await logAdminAction({
        action: 'ADMIN_INVITATION_APPROVED',
        entity_type: 'INVITATION',
        entity_id: invitationId,
        entity_name: invite.email,
        description: `Approved internal Sub-super Admin access for '${invite.email}'`,
        changes: { invitationId, email: invite.email, new_role: 'SUB_SUPER_ADMIN' },
      });

      return NextResponse.json({
        success: true,
        message: 'Internal team member approved and activated successfully.',
      });
    } else if (action === 'REJECT') {
      await supabase
        .from('invitations')
        .update({ status: 'REJECTED' })
        .eq('id', invitationId);

      await logAdminAction({
        action: 'ADMIN_INVITATION_REJECTED',
        entity_type: 'INVITATION',
        entity_id: invitationId,
        entity_name: invite.email,
        description: `Rejected internal team invitation for '${invite.email}'`,
        changes: { invitationId, email: invite.email },
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation rejected.',
      });
    } else if (action === 'REVOKE') {
      await supabase
        .from('invitations')
        .update({ status: 'REVOKED' })
        .eq('id', invitationId);

      await logAdminAction({
        action: 'ADMIN_INVITATION_REVOKED',
        entity_type: 'INVITATION',
        entity_id: invitationId,
        entity_name: invite.email,
        description: `Revoked invitation for '${invite.email}'`,
        changes: { invitationId, email: invite.email },
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation revoked.',
      });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
