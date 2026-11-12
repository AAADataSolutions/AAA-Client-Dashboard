import { Partner, PartnerInvoiceItem } from './types';

export const PRINT_INVOICE_GLOBAL_CSS = `
  @media print {
    @page {
      size: letter portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    html, body {
      background: #ffffff !important;
      color: #0f172a !important;
      height: auto !important;
      min-height: 100% !important;
      overflow: visible !important;
      font-size: 11px !important;
    }
    body * {
      visibility: hidden;
    }
    /* Make modal container chain visible and unconstrained */
    .fixed.inset-0.z-50,
    .fixed.inset-0.z-50 > div,
    #printable-admin-invoice,
    #printable-admin-invoice * {
      visibility: visible !important;
    }
    .fixed.inset-0.z-50 {
      position: static !important;
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      backdrop-filter: none !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
    .fixed.inset-0.z-50 > div {
      position: static !important;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      overflow: visible !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    #printable-admin-invoice {
      position: static !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
      display: block !important;
    }
    .no-print {
      display: none !important;
      height: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    /* Prevent awkward page splits inside invoice blocks */
    #printable-admin-invoice .invoice-header,
    #printable-admin-invoice .invoice-summary-box,
    #printable-admin-invoice .invoice-footer-box {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    /* Ensure table rows do not split in half across pages */
    #printable-admin-invoice table {
      page-break-inside: auto;
      border-collapse: collapse !important;
    }
    #printable-admin-invoice tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    #printable-admin-invoice thead {
      display: table-header-group !important;
    }
    #printable-admin-invoice tfoot {
      display: table-footer-group !important;
    }
  }
`;

export function printAdminPartnerInvoice(
  selectedInvoiceForView: PartnerInvoiceItem | null,
  selectedPartner: Partner | null
) {
  const el = document.getElementById('printable-admin-invoice');
  if (!el) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${selectedInvoiceForView?.invoice_number || 'Partner Invoice'}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: letter portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 18px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .invoice-header img {
            height: 38px;
            margin-bottom: 6px;
          }
          .invoice-header h2 {
            margin: 0 0 2px 0;
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
          }
          .invoice-header p {
            margin: 1px 0;
            color: #64748b;
            font-size: 10.5px;
          }
          .header-right {
            text-align: right;
          }
          .header-right h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 0.05em;
            color: #0f172a;
          }
          .header-right .inv-num {
            font-family: monospace;
            font-weight: 700;
            color: #2563eb;
            margin: 4px 0 2px 0;
            font-size: 12px;
          }
          .invoice-summary-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 14px 16px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .box-label {
            font-size: 9.5px;
            font-weight: 800;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .box-val-strong {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 2px 0;
          }
          .box-text {
            margin: 1px 0;
            color: #475569;
            font-size: 11px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          thead {
            display: table-header-group;
          }
          thead th {
            background-color: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            padding: 8px 10px;
            font-weight: 800;
            font-size: 10px;
            letter-spacing: 0.04em;
            color: #334155;
            text-transform: uppercase;
          }
          tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          tbody td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .text-right {
            text-align: right;
          }
          .font-bold {
            font-weight: 700;
          }
          .prop-name {
            font-weight: 700;
            color: #0f172a;
            display: block;
          }
          .prop-loc {
            font-size: 9.5px;
            color: #64748b;
          }
          .text-blue {
            color: #2563eb;
            font-weight: 700;
          }
          .text-green {
            color: #059669;
            font-weight: 700;
          }
          .invoice-footer-box {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 16px;
            margin-bottom: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .remittance-card {
            padding: 12px 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .totals-card {
            padding: 12px 14px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            color: #475569;
            font-size: 11px;
          }
          .total-row.final {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1.5px solid #cbd5e1;
            color: #0f172a;
            font-size: 12.5px;
            font-weight: 900;
          }
          .total-row.final span.amount {
            color: #059669;
            font-size: 14px;
          }
          .doc-footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <img src="/logo.png" alt="AAA Data Solutions" />
            <h2>AAA Data Solutions</h2>
            <p>Telecommunications &amp; Voice Line Services</p>
            <p>billing@aaadatasolutions.com</p>
          </div>
          <div class="header-right">
            <h3>PARTNER INVOICE</h3>
            <div class="inv-num">${selectedInvoiceForView?.invoice_number || ''}</div>
            <p>Date: ${new Date(selectedInvoiceForView?.created_at || Date.now()).toLocaleDateString()}</p>
            <p>Period: ${selectedInvoiceForView?.period_start || ''} to ${selectedInvoiceForView?.period_end || ''}</p>
          </div>
        </div>

        <div class="invoice-summary-box">
          <div>
            <div class="box-label">PAYABLE TO (PARTNER):</div>
            <div class="box-val-strong">${selectedInvoiceForView?.partner?.name || selectedPartner?.name || 'Channel Partner'}</div>
            ${(selectedInvoiceForView?.partner?.company_name || selectedPartner?.company_name) ? `<div class="box-text font-bold">${selectedInvoiceForView?.partner?.company_name || selectedPartner?.company_name}</div>` : ''}
            <div class="box-text">${selectedInvoiceForView?.partner?.email || selectedPartner?.email || 'partner@aaadatasolutions.com'}</div>
            ${(selectedInvoiceForView?.partner?.phone || selectedPartner?.phone) ? `<div class="box-text">${selectedInvoiceForView?.partner?.phone || selectedPartner?.phone}</div>` : ''}
          </div>
          <div class="header-right">
            <div class="box-label">INVOICE SUMMARY:</div>
            <div class="box-text">Properties Included: <strong style="color: #0f172a;">${selectedInvoiceForView?.total_properties || 0}</strong></div>
            <div class="box-text">Total Gross Revenue: <strong style="color: #0f172a;">$${Number(selectedInvoiceForView?.gross_revenue || 0).toFixed(2)}</strong></div>
            <div class="box-text">Payment Terms: <strong style="color: #0f172a;">Net 30 Days</strong></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">PROPERTY / LOCATION</th>
              <th style="text-align: right;">MONTHLY SUBSCRIPTION</th>
              <th style="text-align: right;">REVENUE SHARE</th>
              <th style="text-align: right;">REVENUE SHARE AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${(selectedInvoiceForView?.line_items || []).map((item: any) => `
              <tr>
                <td>
                  <span class="prop-name">${item.property_name || ''}</span>
                  <span class="prop-loc">${item.property_location || ''}</span>
                </td>
                <td class="text-right font-bold">$${Number(item.monthly_price || 0).toFixed(2)}</td>
                <td class="text-right text-blue">${item.commission_rate}%</td>
                <td class="text-right text-green">$${Number(item.commission_amount || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="invoice-footer-box">
          <div class="remittance-card">
            <div class="box-label">REMITTANCE NOTES:</div>
            <div class="box-text" style="line-height: 1.5;">${selectedInvoiceForView?.notes || 'Standard electronic payout remittance.'}</div>
          </div>
          <div class="totals-card">
            <div class="total-row">
              <span>Gross Volume:</span>
              <span class="font-bold" style="color: #0f172a;">$${Number(selectedInvoiceForView?.gross_revenue || 0).toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>TOTAL AMOUNT PAYABLE:</span>
              <span class="amount">$${Number(selectedInvoiceForView?.commission_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="doc-footer">
          <div>AAA Data Solutions Partner Network • All Rights Reserved</div>
          <div style="margin-top: 3px;">Disbursements are processed upon review and approval by AAA Accounts.</div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 250);
}
