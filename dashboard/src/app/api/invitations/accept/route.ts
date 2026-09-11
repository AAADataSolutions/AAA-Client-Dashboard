import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in or sign up first to accept this invitation.' }, { status: 401 });
    }

    const body = await request.json();
    const { rawToken } = body;

    if (!rawToken) {
      return NextResponse.json({ error: 'Invitation token is missing.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Find invitation
    const { data: invite, error: findErr } = await supabase
      .from('invitations')
      .select('*, organization:organizations(*)')
      .eq('token_hash', tokenHash)
      .single();

    if (findErr || !invite) {
      return NextResponse.json({ error: 'Invalid or expired invitation link.' }, { status: 404 });
    }

    if (invite.status === 'REVOKED' || invite.status === 'REJECTED') {
      return NextResponse.json({ error: 'This invitation has been revoked or rejected.' }, { status: 400 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation link has expired.' }, { status: 400 });
    }

    // INTERNAL TEAM INVITATION FLOW
    if (invite.invite_type === 'INTERNAL_TEAM') {
      // Internal invites go into ACCEPTED status and await Super Admin approval
      const { error: updateErr } = await supabase
        .from('invitations')
        .update({ status: 'ACCEPTED' })
        .eq('id', invite.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        type: 'INTERNAL_TEAM',
        requiresApproval: true,
        message: 'Invitation accepted! Your access is now pending Super Admin approval.',
      });
    }

    // CLIENT MEMBER INVITATION FLOW (No Super Admin approval needed)
    if (invite.invite_type === 'CLIENT_MEMBER') {
      // Add or update organization membership
      const { error: memberErr } = await supabase
        .from('organization_members')
        .upsert(
          {
            organization_id: invite.organization_id,
            profile_id: user.id,
            role: invite.target_org_role || 'USER',
            status: 'ACTIVE',
          },
          { onConflict: 'organization_id,profile_id' }
        );

      if (memberErr) {
        return NextResponse.json({ error: memberErr.message }, { status: 500 });
      }

      // Mark invite as APPROVED / COMPLETED
      await supabase
        .from('invitations')
        .update({ status: 'APPROVED' })
        .eq('id', invite.id);

      return NextResponse.json({
        success: true,
        type: 'CLIENT_MEMBER',
        requiresApproval: false,
        organization: invite.organization,
        message: 'You have joined the organization successfully!',
      });
    }

    return NextResponse.json({ error: 'Unhandled invitation flow.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
