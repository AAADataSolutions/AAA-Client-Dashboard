import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import { sendInviteEmail } from '@/lib/email/mailer';
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const body = await request.json();
    let {
      email,
      role, // optional generic role passed from forms
      invite_type, // 'INTERNAL_TEAM' | 'CLIENT_MEMBER'
      target_app_role, // 'SUB_SUPER_ADMIN'
      target_org_role, // 'ADMIN' | 'USER'
      organization_id,
    } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const isInternal =
      callerProfile?.role === 'SUPER_ADMIN' || callerProfile?.role === 'SUB_SUPER_ADMIN';

    // If invite_type is not provided, deduce from caller role
    if (!invite_type) {
      invite_type = isInternal ? 'INTERNAL_TEAM' : 'CLIENT_MEMBER';
    }

    // Role mapping fallback
    if (role) {
      if (invite_type === 'INTERNAL_TEAM' && !target_app_role) {
        target_app_role = 'SUB_SUPER_ADMIN';
      } else if (invite_type === 'CLIENT_MEMBER' && !target_org_role) {
        target_org_role = role === 'ADMIN' ? 'ADMIN' : 'USER';
      }
    }

    // Permission validations
    if (invite_type === 'INTERNAL_TEAM') {
      if (!isInternal) {
        return NextResponse.json(
          { error: 'Only internal administrators can create team invitations.' },
          { status: 403 }
        );
      }
    } else if (invite_type === 'CLIENT_MEMBER') {
      // Find caller's active organization membership if not explicitly provided
      if (!organization_id || organization_id === 'pending-org') {
        const { data: userMembership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (userMembership?.organization_id) {
          organization_id = userMembership.organization_id;
        }
      }

      if (!organization_id || organization_id === 'pending-org') {
        return NextResponse.json(
          { error: 'Please complete your organization setup before inviting members.' },
          { status: 400 }
        );
      }

      // If not internal admin, verify caller is org ADMIN
      if (!isInternal) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', organization_id)
          .eq('profile_id', user.id)
          .maybeSingle();

        // Check if caller is ADMIN in DB or in auth metadata
        const hasAdminRole = member?.role === 'ADMIN' || user.user_metadata?.initial_org_role === 'ADMIN';

        if (!hasAdminRole) {
          return NextResponse.json(
            { error: 'Only organization administrators can invite members.' },
            { status: 403 }
          );
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid invite type.' }, { status: 400 });
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Create invitation record in DB
    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email: email.trim().toLowerCase(),
        token_hash: tokenHash,
        invite_type,
        target_app_role: invite_type === 'INTERNAL_TEAM' ? target_app_role || 'SUB_SUPER_ADMIN' : null,
        organization_id: invite_type === 'CLIENT_MEMBER' ? organization_id : null,
        target_org_role: invite_type === 'CLIENT_MEMBER' ? target_org_role || 'USER' : null,
        invited_by: user.id,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: inviteError?.message || 'Failed to create invitation.' },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const inviteUrl = `${baseUrl}/invite/${rawToken}`;

    // Look up organization name if this is a client member invite
    let orgName: string | undefined;
    if (organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organization_id)
        .maybeSingle();
      if (orgData?.name) {
        orgName = orgData.name;
      }
    }

    // Dispatch automated invitation email
    const emailResult = await sendInviteEmail({
      recipientEmail: email.trim().toLowerCase(),
      inviteUrl,
      roleName:
        invite_type === 'INTERNAL_TEAM'
          ? (target_app_role === 'SUB_SUPER_ADMIN' ? 'Sub-Super Administrator' : 'Administrator')
          : (target_org_role === 'ADMIN' ? 'Organization Administrator' : 'Organization Member'),
      organizationName: orgName,
      invitedByName: callerProfile?.full_name || user.email || 'An administrator',
    });

    await logAdminAction({
      action: invite_type === 'INTERNAL_TEAM' ? 'ADMIN_INVITATION_SENT' : 'INVITATION_SENT',
      entity_type: 'INVITATION',
      entity_id: invite.id,
      entity_name: email.trim().toLowerCase(),
      organization_id: organization_id || null,
      description: `Generated ${invite_type === 'INTERNAL_TEAM' ? 'Sub-super Admin' : 'Client Member'} invitation for '${email.trim()}'`,
      changes: {
        invite_type,
        target_app_role,
        target_org_role,
        organization_id,
        email: email.trim().toLowerCase(),
        email_sent: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      invitation: invite,
      inviteUrl,
      emailSent: emailResult.success,
      emailSkipped: emailResult.skipped,
      message: emailResult.success
        ? 'Invitation email dispatched and link generated successfully.'
        : 'Invitation link generated successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
