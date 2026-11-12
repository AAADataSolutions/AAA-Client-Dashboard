import { getTransporter, getSupportFromAddress } from './config';

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
