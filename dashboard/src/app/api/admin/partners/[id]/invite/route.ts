import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendInviteEmail } from '@/lib/email/mailer';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient() || (await createClient());

    const { data: partner, error: partnerErr } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (partnerErr || !partner) {
      return NextResponse.json({ success: false, error: 'Partner not found.' }, { status: 404 });
    }

    const cleanEmail = partner.email.trim().toLowerCase();

    // Invalidate old pending invites
    await supabase
      .from('invitations')
      .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
      .eq('email', cleanEmail)
      .eq('status', 'PENDING');

    // Generate fresh token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { error: inviteErr } = await supabase
      .from('invitations')
      .insert({
        email: cleanEmail,
        token_hash: tokenHash,
        invite_type: 'PARTNER',
        target_app_role: 'PARTNER',
        organization_id: null,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (inviteErr) {
      return NextResponse.json({ success: false, error: inviteErr.message }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const inviteUrl = `${origin}/invite/partner/${rawToken}`;

    // Dispatch automated invitation email
    const emailResult = await sendInviteEmail({
      recipientEmail: cleanEmail,
      inviteUrl,
      inviteType: 'PARTNER',
      roleName: 'Channel Partner',
      partnerName: partner.name,
      invitedByName: 'AAA Data Solutions Management',
    });

    return NextResponse.json({
      success: true,
      inviteUrl,
      rawToken,
      emailSent: emailResult.success,
      emailSkipped: emailResult.skipped,
      message: emailResult.success
        ? `Invitation email dispatched to ${cleanEmail}.`
        : `Invitation link generated successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

