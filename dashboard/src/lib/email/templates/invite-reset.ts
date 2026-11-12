import { getTransporter, getNoReplyFromAddress } from './config';

export interface InviteEmailData {
  recipientEmail: string;
  inviteUrl: string;
  inviteType?: 'INTERNAL_TEAM' | 'PARTNER' | 'MANAGEMENT_GROUP' | 'CLIENT_MEMBER';
  roleName?: string;
  organizationName?: string;
  invitedByName?: string;
  partnerName?: string;
}

export async function sendInviteEmail(data: InviteEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured. Skipping email dispatch for Invite:', data.recipientEmail);
    return { success: false, skipped: true };
  }

  const fromAddress = getNoReplyFromAddress();

  const inviteType = data.inviteType || (data.roleName?.includes('Partner') ? 'PARTNER' : data.roleName?.includes('Sub-Super') || data.roleName?.includes('Administrator') ? 'INTERNAL_TEAM' : 'CLIENT_MEMBER');
  const roleDisplay = data.roleName || (inviteType === 'PARTNER' ? 'Channel Partner' : inviteType === 'INTERNAL_TEAM' ? 'Sub-Super Administrator' : 'Organization Member');
  const inviterDisplay = data.invitedByName || 'The AAA Solutions Administrative Team';

  let headerBadge = 'Team Invitation';
  let headerTitle = 'You\'ve been invited to join AAA Data Solutions';
  let headerSubtitle = 'Access the client and operations portal securely.';
  let mainBody = `<p style="font-size: 14px; color: #334155; margin: 0 0 24px; line-height: 1.6;"><strong>${inviterDisplay}</strong> has invited you to join${data.organizationName ? ` <strong>${data.organizationName}</strong>` : ''} on the AAA Data Solutions Portal as <strong>${roleDisplay}</strong>.</p>`;
  let ctaText = 'Accept Invitation &amp; Get Started &rarr;';
  let subject = `Invitation to join AAA Data Solutions${data.organizationName ? ` - ${data.organizationName}` : ''}`;
  let headerBgColor = '#1e40af';
  let gradient = 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)';

  if (inviteType === 'PARTNER') {
    headerBadge = 'Channel Partner Invitation';
    headerTitle = 'Partner Portal Access — AAA Data Solutions';
    headerSubtitle = 'Access your assigned properties portfolio and revenue share reports.';
    headerBgColor = '#0369a1';
    gradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
    subject = `Partner Invitation: Access AAA Data Solutions Partner Portal`;
    ctaText = 'Accept Partner Invitation &amp; Access Portal &rarr;';
    mainBody = `
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        <strong>${inviterDisplay}</strong> has registered you as an official <strong>Channel Partner</strong> on the AAA Data Solutions Platform.
      </p>
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #0369a1; font-weight: 700;">Partner Portal Features:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #0c4a6e; line-height: 1.6;">
          <li>Real-time view of your assigned properties portfolio</li>
          <li>Dynamic monthly run rate and partner revenue share metrics</li>
          <li>Automated monthly gross revenue statements and payout tracking</li>
        </ul>
      </div>
    `;
  } else if (inviteType === 'INTERNAL_TEAM') {
    headerBadge = 'Admin Team Invitation';
    headerTitle = 'You\'ve been invited to join the Admin Operations Team';
    headerSubtitle = 'Manage hospitality properties, porting workflows, and client services.';
    headerBgColor = '#4338ca';
    gradient = 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)';
    subject = `Admin Team Invitation: Join AAA Data Solutions Operations`;
    ctaText = 'Accept Admin Invitation &amp; Set Up Account &rarr;';
    mainBody = `
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        <strong>${inviterDisplay}</strong> has invited you to join the AAA Data Solutions Administration Team as a <strong>${roleDisplay}</strong>.
      </p>
      <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #3730a3; font-weight: 700;">Admin Console Access:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #312e81; line-height: 1.6;">
          <li>Management Groups &amp; Property Portfolio Operations</li>
          <li>LSR Porting Order Management &amp; Cutover Milestones</li>
          <li>Client Support Ticket Dispatch &amp; Live SLA Telemetry</li>
          <li>E911 &amp; Ray Baum's Act Compliance Verification</li>
        </ul>
      </div>
    `;
  } else if (inviteType === 'MANAGEMENT_GROUP') {
    headerBadge = 'Management Group Activation';
    headerTitle = `Welcome to AAA Data Solutions — ${data.organizationName || 'Client Portal'}`;
    headerSubtitle = 'Your enterprise hospitality management portal is ready.';
    headerBgColor = '#1d4ed8';
    gradient = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
    subject = `Welcome to AAA Data Solutions — Set up ${data.organizationName || 'Management Group'}`;
    ctaText = 'Activate Management Group Account &rarr;';
    mainBody = `
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        Hello,
      </p>
      <p style="font-size: 14px; color: #334155; margin: 0 0 16px; line-height: 1.6;">
        A new enterprise account has been created for <strong>${data.organizationName || 'your management group'}</strong> on the AAA Data Solutions Client Portal. You have been designated as the <strong>Primary Organization Administrator</strong>.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <p style="margin: 0 0 6px; font-size: 12px; color: #334155; font-weight: 700;">What you can do in the portal:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
          <li>Manage all hotel and resort properties under your group</li>
          <li>Track active Cloud PBX, voice lines, fire alarm, and elevator emergency lines</li>
          <li>Submit phone number porting requests and monitor cutover milestones</li>
          <li>Create support tickets and collaborate with dedicated telecom engineers</li>
        </ul>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    .email-header-title { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
    .email-header-sub { color: #e0e7ff !important; -webkit-text-fill-color: #e0e7ff !important; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: ${headerBgColor}; background: ${gradient}; padding: 32px 32px 28px;">
      <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 4px 10px; margin-bottom: 12px;">
        <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${headerBadge}</span>
      </div>
      <h1 class="email-header-title" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
        <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${headerTitle}</span>
      </h1>
      <p class="email-header-sub" style="color: #dbeafe !important; -webkit-text-fill-color: #dbeafe !important; margin: 8px 0 0; font-size: 13px;">
        <span style="color: #dbeafe !important; -webkit-text-fill-color: #dbeafe !important;">${headerSubtitle}</span>
      </p>
    </div>
    
    <div style="padding: 32px; background-color: #ffffff;">
      ${mainBody}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.inviteUrl}" 
           target="_blank" 
           style="display: inline-block; background-color: #2563eb; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
          <span style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${ctaText}</span>
        </a>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; font-weight: 600;">
          Or copy and paste this link into your browser:
        </p>
        <p style="margin: 0; font-size: 12px; color: #2563eb; word-break: break-all; font-family: monospace;">
          ${data.inviteUrl}
        </p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0; line-height: 1.5;">
        * Note: This invitation link is unique to you and will expire in <strong>7 days</strong>. If you did not expect this invitation, you can safely ignore this email.
      </p>
    </div>
    
    <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} AAA Data Solutions. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: data.recipientEmail,
      subject,
      html,
    });
    console.log('[SMTP Mailer] Invite email sent successfully to:', data.recipientEmail, 'ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Mailer] Error sending invite email:', error?.message || error);
    return { success: false, error: error?.message || error };
  }
}

export interface ResetPasswordEmailData {
  recipientEmail: string;
  resetUrl: string;
  recipientName?: string;
}

export async function sendResetPasswordEmail(data: ResetPasswordEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured. Skipping password reset email dispatch to:', data.recipientEmail);
    return { success: false, skipped: true };
  }

  const fromAddress = getNoReplyFromAddress();
  const nameDisplay = data.recipientName ? `Hello ${data.recipientName},` : 'Hello,';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%); padding: 32px 32px 28px;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 6px; padding: 4px 10px; margin-bottom: 12px;">
          <span style="color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Security &bull; Password Reset</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
          Reset Your Account Password
        </h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">
          AAA Data Solutions — Client & Management Portal
        </p>
      </div>
      
      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px; line-height: 1.6;">
          ${nameDisplay}
        </p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.6;">
          We received a request to reset the password for your AAA Data Solutions account (<strong>${data.recipientEmail}</strong>). Click the button below to choose a new password:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.resetUrl}" 
             target="_blank" 
             style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
            Reset My Password &rarr;
          </a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; font-weight: 600;">
            Or copy and paste this link into your browser:
          </p>
          <p style="margin: 0; font-size: 12px; color: #2563eb; word-break: break-all; font-family: monospace;">
            ${data.resetUrl}
          </p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0; line-height: 1.5;">
          * Note: If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} AAA Data Solutions. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: data.recipientEmail,
      subject: `Reset Your AAA Data Solutions Password`,
      html,
    });
    console.log('[SMTP Mailer] Password reset email sent successfully to:', data.recipientEmail, 'ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Mailer] Error sending reset password email:', error?.message || error);
    return { success: false, error: error?.message || error };
  }
}
