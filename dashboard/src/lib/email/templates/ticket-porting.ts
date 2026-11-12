import { getTransporter, getSupportFromAddress, SUPPORT_EMAIL } from './config';

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
