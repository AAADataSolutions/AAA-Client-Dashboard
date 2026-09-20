import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/audit/logger';
import { sendInviteEmail } from '@/lib/email/mailer';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const { data: invites, error } = await dbClient
      .from('invitations')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const formattedInvites = (invites || []).map((inv: any) => {
      const isExpired = new Date(inv.expires_at) < new Date();
      return {
        id: inv.id,
        email: inv.email,
        token_hash: inv.token_hash,
        status: isExpired && inv.status === 'PENDING' ? 'EXPIRED' : inv.status,
        invite_type: inv.invite_type,
        target_org_role: inv.target_org_role,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        invite_url: `${baseUrl}/invite/${inv.token_hash}`,
      };
    });

    const activeInvite = formattedInvites.find((i: any) => i.status === 'PENDING') || formattedInvites[0] || null;

    return NextResponse.json({
      success: true,
      data: formattedInvites,
      activeInvite,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { email, role = 'ADMIN', revokePrevious = true } = body;

    // Get organization details
    const { data: org, error: orgErr } = await dbClient
      .from('organizations')
      .select('id, name, email')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const inviteEmail = (email || org.email || '').trim().toLowerCase();

    if (!inviteEmail) {
      return NextResponse.json(
        { success: false, error: 'Please provide an email address for the invitation.' },
        { status: 400 }
      );
    }

    // Revoke previous pending invites for this org if requested
    if (revokePrevious) {
      await dbClient
        .from('invitations')
        .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
        .eq('organization_id', orgId)
        .eq('status', 'PENDING');
    }

    // Generate secure random token
    const rawToken = crypto.randomBytes(24).toString('hex');

    // Create invitation record with 7-day validity
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error: inviteErr } = await dbClient
      .from('invitations')
      .insert({
        email: inviteEmail,
        token_hash: rawToken,
        invite_type: 'CLIENT_MEMBER',
        organization_id: orgId,
        target_org_role: role,
        invited_by: user.id,
        status: 'PENDING',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (inviteErr || !invite) {
      throw inviteErr || new Error('Failed to create invitation record');
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/invite/${rawToken}`;

    // Dispatch automated invitation email
    const emailResult = await sendInviteEmail({
      recipientEmail: inviteEmail,
      inviteUrl,
      roleName: role === 'ADMIN' ? 'Organization Administrator' : 'Organization Member',
      organizationName: org.name,
      invitedByName: user.email || 'An administrator',
    });

    // Audit Log
    await logAdminAction({
      action: 'INVITATION_SENT',
      entity_type: 'INVITATION',
      entity_id: invite.id,
      entity_name: inviteEmail,
      organization_id: orgId,
      description: `Sent ${role} invitation to '${inviteEmail}' for organization '${org.name}'`,
      changes: {
        invitation_id: invite.id,
        email: inviteEmail,
        role: role,
        organization_name: org.name,
        email_sent: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        token: rawToken,
        inviteUrl,
        status: 'PENDING',
        expires_at: expiresAt,
        role: invite.target_org_role,
        organization_name: org.name,
        emailSent: emailResult.success,
        emailSkipped: emailResult.skipped,
      },
      message: emailResult.success
        ? 'Invitation email sent and link generated successfully.'
        : 'Invitation generated successfully.',
    });
  } catch (err: any) {
    console.error('Generate invite error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
