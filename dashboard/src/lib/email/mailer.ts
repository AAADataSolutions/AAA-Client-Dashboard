import nodemailer from 'nodemailer';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@aaadatasolutions.com';
const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@aaadatasolutions.com';

export function getNoReplyFromAddress(): string {
  return `"AAA Data Solutions" <${NOREPLY_EMAIL}>`;
}

export function getSupportFromAddress(): string {
  const user = process.env.SMTP_USER || 'support@aaadatasolutions.com';
  return `"AAA Data Solutions Support" <${user}>`;
}

function getFromAddress(): string {
  return getNoReplyFromAddress();
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const user = process.env.SMTP_USER || 'support@aaadatasolutions.com';
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
      rejectUnauthorized: false,
    },
  });
}

export interface InviteEmailData {
  recipientEmail: string;
  inviteUrl: string;
  inviteType?: 'INTERNAL_TEAM' | 'PARTNER' | 'MANAGEMENT_GROUP' | 'CLIENT_MEMBER';
  roleName?: string;
  organizationName?: string;
  invitedByName?: string;
  partnerName?: string;
}

export interface TicketEmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
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
  raisedByPhone?: string;
  attachmentUrls?: string[];
  attachments?: TicketEmailAttachment[];
}

export interface PortingEmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

export interface PortingEmailData {
  portingRequestId: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhone: string;
  city?: string;
  state?: string;
  zipCode?: string;
  fax?: string;
  carrierDetails?: string;
  organizationName: string;
  submittedByName: string;
  submittedByEmail: string;
  attachmentCount: number;
  attachments?: PortingEmailAttachment[];
  notes?: string;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured. Skipping email dispatch for Ticket:', data.ticketId);
    return { success: false, skipped: true };
  }

  const fromAddress = getSupportFromAddress();

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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #1275e2 0%, #0d5bb5 100%); padding: 28px 32px;">
        <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 10px; margin-bottom: 10px;">
          <span style="color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Support Dispatch Console</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">
          🎫 New Support Ticket Raised
        </h1>
        <p style="color: rgba(255,255,255,0.88); margin: 6px 0 0; font-size: 13.5px;">
          A client has raised an operational or technical inquiry requiring assistance.
        </p>
      </div>
      
      <div style="padding: 26px 32px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; width: 150px; font-weight: 600;">Ticket ID:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #1e293b; font-family: monospace;">#${data.ticketId.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Subject:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0f172a;">${data.subject}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Priority:</td>
            <td style="padding: 9px 0;">
              <span style="background: ${priorityBg}; color: ${priorityColor}; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 700; display: inline-block;">
                ${data.priority}
              </span>
            </td>
          </tr>
          ${data.category ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Category:</td>
            <td style="padding: 9px 0; color: #1e293b; font-weight: 600;">${data.category}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Management Group:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #1e293b;">${data.organizationName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Property Location:</td>
            <td style="padding: 9px 0; color: #1e293b; font-weight: 600;">${data.propertyName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Raised By (Name):</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0f172a;">${data.raisedByName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Contact Email:</td>
            <td style="padding: 9px 0; color: #2563eb; font-weight: 600;"><a href="mailto:${data.raisedByEmail}" style="color: #2563eb; text-decoration: none;">${data.raisedByEmail}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 9px 0; color: #64748b; font-weight: 600;">Contact Phone:</td>
            <td style="padding: 9px 0; font-weight: 700; color: #0f172a;">
              ${data.raisedByPhone ? `<a href="tel:${data.raisedByPhone}" style="color: #0f172a; text-decoration: none;">📞 ${data.raisedByPhone}</a>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Ticket Description</p>
          <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${data.description}</p>
        </div>

        ${data.attachments && data.attachments.length > 0 ? `
        <div style="margin-top: 18px; padding: 14px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #1d4ed8; font-weight: 700;">
            📎 ${data.attachments.length} File Attachment(s) Attached to This Email:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #1e40af;">
            ${data.attachments.map((a) => `<li><strong>${a.filename}</strong></li>`).join('')}
          </ul>
        </div>
        ` : (data.attachmentUrls && data.attachmentUrls.length > 0 ? `
        <div style="margin-top: 18px; padding: 14px 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12.5px; color: #475569; font-weight: 600;">
            📎 ${data.attachmentUrls.length} file attachment(s) uploaded. View in Ticket Console.
          </p>
        </div>
        ` : '')}
      </div>
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Sent to dedicated support desk &bull; AAA Data Solutions Ticketing System
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: SUPPORT_EMAIL,
      subject: `[Support Ticket] #${data.ticketId.substring(0, 8).toUpperCase()}: ${data.subject} — ${data.raisedByName} (${data.organizationName})`,
      html,
      attachments: data.attachments && data.attachments.length > 0 ? data.attachments : undefined,
    });
    console.log('[SMTP Mailer] Ticket email sent successfully to support desk:', SUPPORT_EMAIL, 'Message ID:', info.messageId);

    // Also send an automated confirmation receipt to the user who raised it
    if (data.raisedByEmail && data.raisedByEmail.includes('@') && data.raisedByEmail.toLowerCase() !== SUPPORT_EMAIL.toLowerCase()) {
      try {
        const clientReceiptHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #1275e2 0%, #0d5bb5 100%); padding: 24px 28px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
                Support Request Received: #${data.ticketId.substring(0, 8).toUpperCase()}
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
                AAA Data Solutions Technical Support Desk
              </p>
            </div>
            <div style="padding: 24px 28px;">
              <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
                Hello <strong>${data.raisedByName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px; line-height: 1.6;">
                Thank you for contacting AAA Data Solutions. We have received your support request regarding <strong>"${data.subject}"</strong> for property <strong>${data.propertyName}</strong>.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 700;">Ticket Reference:</p>
                <p style="margin: 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a;">#${data.ticketId.substring(0, 8).toUpperCase()}</p>
                <p style="margin: 8px 0 0; font-size: 12.5px; color: #475569;">Priority: <strong>${data.priority}</strong> &bull; Status: <strong>OPEN</strong></p>
              </div>
              <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
                Our telecom support engineering team has been notified and will review your ticket promptly. You can track real-time progress and replies inside your client dashboard.
              </p>
            </div>
            <div style="padding: 14px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                AAA Data Solutions &bull; Dedicated 24/7 Hospitality Support
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: fromAddress,
          to: data.raisedByEmail,
          subject: `Ticket Received [#${data.ticketId.substring(0, 8).toUpperCase()}]: ${data.subject}`,
          html: clientReceiptHtml,
        });
        console.log('[SMTP Mailer] Client ticket receipt sent to:', data.raisedByEmail);
      } catch (clientMailErr) {
        console.warn('[SMTP Mailer] Warning: Could not send client confirmation email:', clientMailErr);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Mailer] Error sending ticket email:', error);
    return { success: false, error };
  }
}

export async function sendPortingEmail(data: PortingEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured. Skipping email dispatch for Porting:', data.portingRequestId);
    return { success: false, skipped: true };
  }

  const fromAddress = getSupportFromAddress();
  const locationStr = data.propertyAddress || [data.city, data.state, data.zipCode].filter(Boolean).join(', ') || 'Address pending';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); padding: 32px 32px 28px;">
        <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 6px; padding: 4px 10px; margin-bottom: 12px;">
          <span style="color: #ffffff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">LSR Porting Desk</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3;">
          🔄 New Porting Request Submitted
        </h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">
          A client has submitted a telephone number porting request with carrier authorization documents.
        </p>
      </div>
      
      <div style="padding: 28px 32px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 150px; font-weight: 600;">Porting Request ID:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b; font-family: monospace;">#${data.portingRequestId.substring(0, 8).toUpperCase()}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Management Group:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${data.organizationName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Property Name:</td>
            <td style="padding: 10px 0; font-weight: 700; color: #1e293b;">${data.propertyName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Property Address:</td>
            <td style="padding: 10px 0; color: #334155;">${locationStr}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Main Phone to Port:</td>
            <td style="padding: 10px 0; font-weight: 800; color: #2563eb; font-size: 15px;">${data.propertyPhone}</td>
          </tr>
          ${data.fax ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Fax Number:</td>
            <td style="padding: 10px 0; color: #334155;">${data.fax}</td>
          </tr>` : ''}
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Submitted By:</td>
            <td style="padding: 10px 0; color: #1e293b; font-weight: 500;">${data.submittedByName} &lt;${data.submittedByEmail}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Attached Files:</td>
            <td style="padding: 10px 0; color: #047857; font-weight: 700;">
              📎 ${data.attachmentCount} file(s) attached directly to this email
            </td>
          </tr>
        </table>

        ${data.carrierDetails ? `
        <div style="margin-top: 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Losing Carrier / Account Details</p>
          <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${data.carrierDetails}</p>
        </div>` : ''}

        ${data.notes ? `
        <div style="margin-top: 14px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Submitter Notes</p>
          <p style="margin: 0; font-size: 13.5px; color: #334155; line-height: 1.5; white-space: pre-wrap;">${data.notes}</p>
        </div>` : ''}

        ${data.attachments && data.attachments.length > 0 ? `
        <div style="margin-top: 20px; padding: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #7e22ce; font-weight: 700;">
            📎 Document Attachments Included:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #581c87;">
            ${data.attachments.map((a) => `<li><strong>${a.filename}</strong></li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      
      <div style="padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Sent to dedicated support desk &bull; AAA Data Solutions Porting Order System
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: SUPPORT_EMAIL,
      subject: `[Porting Request] New Order: ${data.propertyName} (${data.propertyPhone}) — ${data.organizationName}`,
      html,
      attachments: data.attachments && data.attachments.length > 0 ? data.attachments : undefined,
    });
    console.log('[SMTP Mailer] Porting email sent successfully to support desk:', SUPPORT_EMAIL, 'Message ID:', info.messageId);

    // Also send an automated confirmation receipt to the submitter
    if (data.submittedByEmail && data.submittedByEmail.includes('@') && data.submittedByEmail.toLowerCase() !== SUPPORT_EMAIL.toLowerCase()) {
      try {
        const clientPortingReceiptHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4338ca 100%); padding: 24px 28px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
                Porting Request Received: ${data.propertyName}
              </h1>
              <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
                AAA Data Solutions Carrier Operations
              </p>
            </div>
            <div style="padding: 24px 28px;">
              <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
                Hello <strong>${data.submittedByName}</strong>,
              </p>
              <p style="font-size: 14px; color: #475569; margin: 0 0 16px; line-height: 1.6;">
                We have received your telephone number porting request for <strong>${data.propertyName}</strong> (${data.propertyPhone}).
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 700;">Porting Order Reference:</p>
                <p style="margin: 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #0f172a;">#${data.portingRequestId.substring(0, 8).toUpperCase()}</p>
                <p style="margin: 8px 0 0; font-size: 12.5px; color: #475569;">Management Group: <strong>${data.organizationName}</strong></p>
              </div>
              <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
                Our telecom provisioning desk will review the submitted carrier documents and submit the LSR (Local Service Request) to the losing carrier. You will receive milestone updates (FOC date and cutover schedule) directly through your client dashboard.
              </p>
            </div>
            <div style="padding: 14px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                AAA Data Solutions &bull; Carrier Provisioning &amp; Porting Department
              </p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: fromAddress,
          to: data.submittedByEmail,
          subject: `Porting Request Received: ${data.propertyName} (${data.propertyPhone})`,
          html: clientPortingReceiptHtml,
        });
        console.log('[SMTP Mailer] Client porting confirmation receipt sent to:', data.submittedByEmail);
      } catch (clientMailErr) {
        console.warn('[SMTP Mailer] Warning: Could not send client porting confirmation email:', clientMailErr);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[SMTP Mailer] Error sending porting email:', error);
    return { success: false, error };
  }
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


export interface PartnerInvoiceLineItem {
  property_id?: string;
  property_name: string;
  address?: string;
  property_location?: string;
  monthly_price: number;
  commission_rate: number;
  commission_amount: number;
}

export interface PartnerInvoiceEmailData {
  invoiceId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalProperties: number;
  grossRevenue: number;
  commissionAmount: number;
  notes?: string;
  createdAt?: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string | null;
  partnerCompanyName?: string | null;
  lineItems: PartnerInvoiceLineItem[];
  pdfBuffer?: Buffer;
  portalUrl?: string;
}

export async function sendPartnerInvoiceEmail(data: PartnerInvoiceEmailData) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP Mailer] SMTP credentials not configured. Skipping partner invoice email dispatch for:', data.invoiceNumber);
    return { success: false, skipped: true, error: 'SMTP credentials not configured' };
  }

  const fromAddress = getSupportFromAddress();
  const statusUpper = String(data.status || 'SUBMITTED').toUpperCase();

  const statusColors =
    statusUpper === 'PAID'
      ? {
          bgLight: '#ecfdf5',
          textLight: '#047857',
          borderLight: '#a7f3d0',
          bgDark: '#064e3b',
          textDark: '#6ee7b7',
          borderDark: '#047857',
        }
      : statusUpper === 'APPROVED'
      ? {
          bgLight: '#eff6ff',
          textLight: '#1d4ed8',
          borderLight: '#bfdbfe',
          bgDark: '#1e3a8a',
          textDark: '#93c5fd',
          borderDark: '#1d4ed8',
        }
      : statusUpper === 'REJECTED'
      ? {
          bgLight: '#fef2f2',
          textLight: '#b91c1c',
          borderLight: '#fecaca',
          bgDark: '#7f1d1d',
          textDark: '#fca5a5',
          borderDark: '#b91c1c',
        }
      : {
          bgLight: '#fffbeb',
          textLight: '#b45309',
          borderLight: '#fde68a',
          bgDark: '#78350f',
          textDark: '#fcd34d',
          borderDark: '#b45309',
        };

  const formattedPeriod = `${data.periodStart} to ${data.periodEnd}`;
  const formattedGross = `$${Number(data.grossRevenue || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedCommission = `$${Number(data.commissionAmount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const lineItemsHtml =
    data.lineItems && data.lineItems.length > 0
      ? data.lineItems
          .map((item) => {
            const loc = item.address || item.property_location || '';
            return `
              <tr class="inv-row" style="border-bottom: 1px solid #e2e8f0;">
                <td class="inv-cell-main" style="padding: 11px 12px; color: #0f172a; font-size: 13px; font-weight: 700;">
                  <div class="inv-text-primary" style="color: #0f172a; font-weight: 700;">${item.property_name || 'Assigned Property'}</div>
                  ${loc ? `<div class="inv-text-muted" style="color: #64748b; font-size: 11px; font-weight: 400; margin-top: 2px;">${loc}</div>` : ''}
                </td>
                <td class="inv-cell-num inv-text-primary" style="padding: 11px 12px; text-align: right; color: #0f172a; font-size: 13px; font-weight: 600; font-family: monospace;">
                  $${Number(item.monthly_price || 0).toFixed(2)}
                </td>
                <td class="inv-cell-rate" style="padding: 11px 12px; text-align: right; color: #2563eb; font-size: 13px; font-weight: 700;">
                  ${Number(item.commission_rate || 0)}%
                </td>
                <td class="inv-cell-comm" style="padding: 11px 12px; text-align: right; color: #059669; font-size: 13px; font-weight: 800; font-family: monospace;">
                  $${Number(item.commission_amount || 0).toFixed(2)}
                </td>
              </tr>
            `;
          })
          .join('')
      : `
        <tr class="inv-row">
          <td colspan="4" class="inv-text-muted" style="padding: 16px; text-align: center; color: #64748b; font-size: 13px;">
            Consolidated Partner Portfolio Statement (${data.totalProperties} ${data.totalProperties === 1 ? 'Property' : 'Properties'})
          </td>
        </tr>
      `;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Partner Statement ${data.invoiceNumber}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    .email-header-force-white {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
    .email-header-force-sub {
      color: #dbeafe !important;
      -webkit-text-fill-color: #dbeafe !important;
    }
    /* Dark Mode Overrides for Apple Mail, iOS, Gmail, and Modern Clients */
    @media (prefers-color-scheme: dark) {
      .inv-body-bg {
        background-color: #0b0d13 !important;
      }
      .inv-card-bg {
        background-color: #151722 !important;
        border-color: #262938 !important;
      }
      .inv-subcard-bg {
        background-color: #1c1f2e !important;
        border-color: #2d3145 !important;
      }
      .inv-table-wrap {
        border-color: #2d3145 !important;
      }
      .inv-table-head {
        background-color: #1e2233 !important;
        border-bottom-color: #2d3145 !important;
      }
      .inv-table-head th {
        color: #cbd5e1 !important;
      }
      .inv-row {
        border-bottom-color: #252838 !important;
      }
      .inv-text-primary {
        color: #f8fafc !important;
      }
      .inv-text-secondary {
        color: #cbd5e1 !important;
      }
      .inv-text-muted {
        color: #94a3b8 !important;
      }
      .inv-cell-rate {
        color: #60a5fa !important;
      }
      .inv-cell-comm {
        color: #34d399 !important;
      }
      .inv-status-badge {
        background-color: ${statusColors.bgDark} !important;
        color: ${statusColors.textDark} !important;
        border-color: ${statusColors.borderDark} !important;
      }
      .inv-attach-banner {
        background-color: #172554 !important;
        border-color: #1e40af !important;
      }
      .inv-attach-text {
        color: #93c5fd !important;
      }
      .inv-footer-bg {
        background-color: #11131c !important;
        border-top-color: #262938 !important;
      }
    }
    /* Outlook Dark Mode Specific Selectors */
    [data-ogsc] .inv-body-bg { background-color: #0b0d13 !important; }
    [data-ogsc] .inv-card-bg { background-color: #151722 !important; border-color: #262938 !important; }
    [data-ogsc] .inv-subcard-bg { background-color: #1c1f2e !important; border-color: #2d3145 !important; }
    [data-ogsc] .inv-text-primary { color: #f8fafc !important; }
    [data-ogsc] .inv-text-secondary { color: #cbd5e1 !important; }
    [data-ogsc] .inv-text-muted { color: #94a3b8 !important; }
    [data-ogsc] .inv-cell-rate { color: #60a5fa !important; }
    [data-ogsc] .inv-cell-comm { color: #34d399 !important; }
  </style>
</head>
<body class="inv-body-bg" style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div class="inv-card-bg" style="max-width: 660px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);">
    
    <!-- Gradient Header Banner -->
    <div style="background-color: #0f172a; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 30px 32px 26px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top;">
            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 6px; padding: 4px 10px; margin-bottom: 10px;">
              <span class="email-header-force-white" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                Partner Revenue Share Statement
              </span>
            </div>
            <h1 class="email-header-force-white" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
              Invoice ${data.invoiceNumber}
            </h1>
            <p class="email-header-force-sub" style="color: #dbeafe !important; -webkit-text-fill-color: #dbeafe !important; margin: 6px 0 0; font-size: 13px;">
              Billing Period: <strong>${formattedPeriod}</strong>
            </p>
          </td>
          <td style="vertical-align: top; text-align: right;">
            <span class="inv-status-badge" style="display: inline-block; background-color: ${statusColors.bgLight}; color: ${statusColors.textLight}; border: 1px solid ${statusColors.borderLight}; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">
              ${statusUpper}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 28px 32px;">
      <p class="inv-text-primary" style="font-size: 15px; color: #0f172a; margin: 0 0 10px; font-weight: 600;">
        Hello ${data.partnerName || 'Partner'},
      </p>
      <p class="inv-text-secondary" style="font-size: 13.5px; color: #475569; margin: 0 0 22px; line-height: 1.6;">
        Please find your itemized partner revenue share statement for the billing period <strong>${formattedPeriod}</strong> below. An official printable PDF copy (<strong>${data.invoiceNumber}.pdf</strong>) is also attached directly to this email for your accounting records.
      </p>

      <!-- Summary KPI Box -->
      <div class="inv-subcard-bg" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 22px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <div class="inv-text-muted" style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">
                PAYABLE TO (PARTNER)
              </div>
              <div class="inv-text-primary" style="font-size: 14px; font-weight: 800; color: #0f172a;">
                ${data.partnerName}
              </div>
              ${data.partnerCompanyName ? `<div class="inv-text-secondary" style="font-size: 12.5px; font-weight: 600; color: #334155; margin-top: 2px;">${data.partnerCompanyName}</div>` : ''}
              <div class="inv-text-muted" style="font-size: 12px; color: #64748b; margin-top: 2px;">
                ${data.partnerEmail}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right; padding-left: 12px;">
              <div class="inv-text-muted" style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">
                STATEMENT SUMMARY
              </div>
              <div class="inv-text-secondary" style="font-size: 12.5px; color: #475569;">
                Properties Included: <strong class="inv-text-primary" style="color: #0f172a;">${data.totalProperties}</strong>
              </div>
              <div class="inv-text-secondary" style="font-size: 12.5px; color: #475569; margin-top: 3px;">
                Gross Portfolio Revenue: <strong class="inv-text-primary" style="color: #0f172a;">${formattedGross}</strong>
              </div>
              <div class="inv-text-secondary" style="font-size: 13px; color: #475569; margin-top: 5px;">
                Total Payout Due: <strong class="inv-cell-comm" style="color: #059669; font-size: 15px; font-weight: 800;">${formattedCommission}</strong>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Itemized Properties Table -->
      <div class="inv-table-wrap" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 22px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr class="inv-table-head" style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
              <th style="padding: 10px 12px; text-align: left; font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                Property / Location
              </th>
              <th style="padding: 10px 12px; text-align: right; font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                Monthly Sub
              </th>
              <th style="padding: 10px 12px; text-align: right; font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                Rev Share
              </th>
              <th style="padding: 10px 12px; text-align: right; font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.04em;">
                Payout Amount
              </th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Totals & Remittance Notes -->
      <div class="inv-subcard-bg" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <div class="inv-text-muted" style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #64748b;">
                Remittance Notes
              </div>
              <div class="inv-text-secondary" style="font-size: 12.5px; color: #475569; margin-top: 3px;">
                ${data.notes || 'Standard monthly partner revenue share statement. Net 30 Days.'}
              </div>
            </td>
            <td style="vertical-align: middle; text-align: right; white-space: nowrap; padding-left: 16px;">
              <div class="inv-text-muted" style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">
                Total Amount Payable
              </div>
              <div class="inv-cell-comm" style="font-size: 20px; font-weight: 900; color: #059669; font-family: monospace; margin-top: 2px;">
                ${formattedCommission}
              </div>
            </td>
          </tr>
        </table>
      </div>

      ${
        data.pdfBuffer
          ? `
      <div class="inv-attach-banner" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
        <p class="inv-attach-text" style="margin: 0; font-size: 12.5px; color: #1d4ed8; font-weight: 700;">
          📎 Official PDF Invoice Attached: <strong>${data.invoiceNumber}.pdf</strong>
        </p>
      </div>
      `
          : ''
      }
    </div>

    <!-- Footer -->
    <div class="inv-footer-bg" style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <p class="inv-text-muted" style="margin: 0; font-size: 12px; color: #64748b;">
        AAA Data Solutions Partner Network &bull; billing@aaadatasolutions.com
      </p>
      <p class="inv-text-muted" style="margin: 4px 0 0; font-size: 11px; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} AAA Data Solutions. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: data.partnerEmail,
      subject: `[Partner Invoice] ${data.invoiceNumber} (${formattedPeriod}) — ${data.partnerName}`,
      html,
      attachments: data.pdfBuffer
        ? [
            {
              filename: `${data.invoiceNumber}.pdf`,
              content: data.pdfBuffer,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });
    console.log(
      '[SMTP Mailer] Partner invoice email sent successfully to:',
      data.partnerEmail,
      'Invoice:',
      data.invoiceNumber,
      'Message ID:',
      info.messageId
    );
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('[SMTP Mailer] Error sending partner invoice email:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
