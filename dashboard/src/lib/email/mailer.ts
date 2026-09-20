import nodemailer from 'nodemailer';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@aaadatasolutions.com';
const FROM_EMAIL = process.env.SMTP_FROM || `"AAA Data Solutions" <${process.env.SMTP_USER || 'support@aaadatasolutions.com'}>`;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || pass === 'your-outlook-password') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

export interface InviteEmailData {
  recipientEmail: string;
  inviteUrl: string;
  roleName?: string;
  organizationName?: string;
  invitedByName?: string;
}

export interface TicketEmailData {
  ticketId: string;
  subject: string;
  description: string;
  priority: string;
  category?: string;
  organizationName: string;
  propertyName: string;
  raisedByName: string;
  raisedByEmail: string;
  attachmentUrls?: string[];
}

export interface PortingEmailData {
  portingRequestId: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhone: string;
  fax?: string;
  carrierDetails?: string;
  organizationName: string;
  submittedByName: string;
  submittedByEmail: string;
  attachmentCount: number;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured in .env.local. Skipping email dispatch for Ticket:', data.ticketId);
    return { success: false, skipped: true };
  }

  const priorityColor =
    data.priority === 'URGENT'
      ? '#dc2626'
      : data.priority === 'HIGH'
      ? '#ea580c'
      : data.priority === 'MEDIUM'
      ? '#2563eb'
      : '#16a34a';

  const priorityBg =
    data.priority === 'URGENT'
      ? '#fef2f2'
      : data.priority === 'HIGH'
      ? '#fff7ed'
      : data.priority === 'MEDIUM'
      ? '#eff6ff'
      : '#f0fdf4';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1275e2 0%, #0d5bb5 100%); padding: 24px 32px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
          🎫 New Support Ticket Raised
        </h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
          AAA Data Solutions — Support Management System
        </p>
      </div>
      
      <div style="padding: 24px 32px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Ticket ID:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #1e293b;">${data.ticketId.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Subject:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Priority:</td>
            <td style="padding: 8px 0;">
              <span style="background: ${priorityBg}; color: ${priorityColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 700;">
                ${data.priority}
              </span>
            </td>
          </tr>
          ${data.category ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Category:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.category}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Organization:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Property:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Submitted By:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.raisedByName} (${data.raisedByEmail})</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Description</p>
          <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${data.description}</p>
        </div>

        ${data.attachmentUrls && data.attachmentUrls.length > 0 ? `
        <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 6px;">
          <p style="margin: 0; font-size: 13px; color: #475569; font-weight: 600;">
            📎 ${data.attachmentUrls.length} file attachment(s) uploaded. View in Admin Ticket View.
          </p>
        </div>
        ` : ''}
      </div>
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Sent via AAA Data Solutions SMTP Mailer &bull; Please respond via the dashboard.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `[Support Ticket] ${data.subject} — ${data.organizationName}`,
      html,
    });
    console.log('[SMTP Mailer] Ticket email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Mailer] Error sending ticket email:', error);
    return { success: false, error };
  }
}

export async function sendPortingEmail(data: PortingEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured in .env.local. Skipping email dispatch for Porting:', data.portingRequestId);
    return { success: false, skipped: true };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 24px 32px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
          🔄 New Porting Request Submitted
        </h1>
        <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
          AAA Data Solutions — Porting Desk
        </p>
      </div>
      
      <div style="padding: 24px 32px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 140px; font-weight: 500;">Request ID:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #1e293b;">${data.portingRequestId.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Organization:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.organizationName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Property Name:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.propertyName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Property Address:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Phone to Port:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${data.propertyPhone}</td>
          </tr>
          ${data.fax ? `
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Fax:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.fax}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Submitted By:</td>
            <td style="padding: 8px 0; color: #1e293b;">${data.submittedByName} (${data.submittedByEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Attachments:</td>
            <td style="padding: 8px 0; color: #1e293b; font-weight: 600;">📁 ${data.attachmentCount} file(s) attached</td>
          </tr>
        </table>

        ${data.carrierDetails ? `
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Carrier Information</p>
          <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">${data.carrierDetails}</p>
        </div>` : ''}
      </div>
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Sent via AAA Data Solutions SMTP Mailer &bull; Please review in the Admin Porting Requests tab.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: SUPPORT_EMAIL,
      subject: `[Porting Request] New Request: ${data.propertyName} — ${data.organizationName}`,
      html,
    });
    console.log('[SMTP Mailer] Porting email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Mailer] Error sending porting email:', error);
    return { success: false, error };
  }
}

export async function sendInviteEmail(data: InviteEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured or placeholder password in .env.local. Skipping email dispatch for Invite:', data.recipientEmail);
    return { success: false, skipped: true };
  }

  const roleDisplay = data.roleName || 'Team Member';
  const orgDisplay = data.organizationName ? ` to ${data.organizationName}` : '';
  const inviterDisplay = data.invitedByName || 'The AAA Solutions Administrative Team';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%); padding: 32px 32px 28px;">
        <div style="display: inline-block; background: rgba(255,255,255,0.15); border-radius: 6px; padding: 4px 10px; margin-bottom: 12px;">
          <span style="color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Team Invitation</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
          You've been invited to join AAA Data Solutions
        </h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">
          Access the client and operations portal securely.
        </p>
      </div>
      
      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px; line-height: 1.6;">
          Hello,
        </p>
        <p style="font-size: 14px; color: #475569; margin: 0 0 24px; line-height: 1.6;">
          <strong>${inviterDisplay}</strong> has invited you to join${orgDisplay} on the AAA Data Solutions Portal as <strong>${roleDisplay}</strong>.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.inviteUrl}" 
             target="_blank" 
             style="display: inline-block; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
            Accept Invitation &amp; Get Started &rarr;
          </a>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 24px;">
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
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} AAA Data Solutions. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `Invitation to join AAA Data Solutions${data.organizationName ? ` - ${data.organizationName}` : ''}`,
      html,
    });
    console.log('[SMTP Mailer] Invite email sent successfully to:', data.recipientEmail, 'ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Mailer] Error sending invite email:', error?.message || error);
    return { success: false, error: error?.message || error };
  }
}

