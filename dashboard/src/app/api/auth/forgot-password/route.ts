import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendResetPasswordEmail } from '@/lib/email/mailer';
import { getAppBaseUrl } from '@/lib/utils/url';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminClient = createAdminClient();
    const baseUrl = getAppBaseUrl(request);
    const redirectTo = `${baseUrl}/auth/reset-password`;

    let resetUrl = '';
    let emailSent = false;

    if (adminClient) {
      try {
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: 'recovery',
          email: cleanEmail,
          options: {
            redirectTo,
          },
        });

        if (!linkErr && linkData?.properties?.hashed_token) {
          // Direct app link; the reset page verifies the token itself via verifyOtp
          resetUrl = `${redirectTo}?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=recovery`;
        } else if (!linkErr && linkData?.properties?.action_link) {
          resetUrl = linkData.properties.action_link;
        }
      } catch (adminErr) {
        console.warn('[ForgotPassword API] Admin generateLink error, falling back:', adminErr);
      }
    }

    // If admin generateLink was successful, send via our custom nodemailer SMTP
    if (resetUrl) {
      const emailRes = await sendResetPasswordEmail({
        recipientEmail: cleanEmail,
        resetUrl,
      });
      emailSent = emailRes.success;
    } else {
      // Fallback: Use standard Supabase resetPasswordForEmail
      const supabase = await createClient();
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 });
      }
      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      emailSent,
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process password reset request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
