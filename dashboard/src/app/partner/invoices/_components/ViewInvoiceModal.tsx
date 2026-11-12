'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import type { PartnerInvoice } from './CreateInvoiceModal';

export function printPartnerInvoice(selectedInvoiceForView: PartnerInvoice | null, partnerInfo: any) {
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
            <div class="box-val-strong">${partnerInfo?.name || 'Channel Partner'}</div>
            ${partnerInfo?.company_name ? `<div class="box-text font-bold">${partnerInfo.company_name}</div>` : ''}
            <div class="box-text">${partnerInfo?.email || 'partner@aaadatasolutions.com'}</div>
            ${partnerInfo?.phone ? `<div class="box-text">${partnerInfo.phone}</div>` : ''}
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

interface ViewInvoiceModalProps {
  selectedInvoiceForView: PartnerInvoice | null;
  setSelectedInvoiceForView: (inv: PartnerInvoice | null) => void;
  handlePrint: () => void;
  printRef: React.RefObject<HTMLDivElement | null>;
  partnerInfo: any;
}

export function ViewInvoiceModal({
  selectedInvoiceForView,
  setSelectedInvoiceForView,
  handlePrint,
  printRef,
  partnerInfo,
}: ViewInvoiceModalProps) {
  if (!selectedInvoiceForView) return null;

  return (
    <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Actions */}
        <div className="no-print p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">Partner Statement Preview</span>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {selectedInvoiceForView.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Download / Print PDF
            </button>
            <button
              onClick={() => setSelectedInvoiceForView(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div id="printable-invoice" ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 text-xs flex-1 min-h-0">
          {/* Document Header */}
          <div className="invoice-header flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <img src="/logo.png" alt="AAA Data Solutions" className="h-10 mb-2 object-contain" />
              <h2 className="font-black text-base text-slate-900 dark:text-white">AAA Data Solutions</h2>
              <p className="text-slate-500 text-[11px]">Telecommunications &amp; Voice Line Services</p>
              <p className="text-slate-500 text-[11px]">billing@aaadatasolutions.com</p>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                PARTNER INVOICE
              </h3>
              <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                {selectedInvoiceForView.invoice_number}
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Date: {new Date(selectedInvoiceForView.created_at).toLocaleDateString()}
              </p>
              <p className="text-slate-500 text-[11px]">
                Period: {selectedInvoiceForView.period_start} to {selectedInvoiceForView.period_end}
              </p>
            </div>
          </div>

          {/* Partner & Summary Box */}
          <div className="invoice-summary-box grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#222430]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                PAYABLE TO (PARTNER):
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {partnerInfo?.name || 'Channel Partner'}
              </p>
              {partnerInfo?.company_name && (
                <p className="text-slate-600 dark:text-slate-300 font-medium">{partnerInfo.company_name}</p>
              )}
              <p className="text-slate-500">{partnerInfo?.email || 'partner@aaadatasolutions.com'}</p>
              {partnerInfo?.phone && <p className="text-slate-500">{partnerInfo.phone}</p>}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                INVOICE SUMMARY:
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Properties Included: <strong className="text-slate-900 dark:text-white">{selectedInvoiceForView.total_properties}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Total Gross Revenue: <strong className="text-slate-900 dark:text-white">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Payment Terms: <strong className="text-slate-900 dark:text-white">Net 30 Days</strong>
              </p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
                <tr>
                  <th className="py-2.5 px-3">PROPERTY / LOCATION</th>
                  <th className="py-2.5 px-3 text-right">MONTHLY SUBSCRIPTION</th>
                  <th className="py-2.5 px-3 text-right">REVENUE SHARE</th>
                  <th className="py-2.5 px-3 text-right">REVENUE SHARE AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                {selectedInvoiceForView.line_items && selectedInvoiceForView.line_items.length > 0 ? (
                  selectedInvoiceForView.line_items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{item.property_name}</span>
                        <span className="text-[10px] text-slate-400">{item.property_location}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold">
                        ${Number(item.monthly_price).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                        {item.commission_rate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        ${Number(item.commission_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      {selectedInvoiceForView.total_properties} Properties itemized in billing cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes & Totals */}
          <div className="invoice-footer-box grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                REMITTANCE NOTES:
              </span>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedInvoiceForView.notes || 'Standard electronic payout remittance.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex flex-col justify-center space-y-2">
              <div className="flex items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="whitespace-nowrap font-medium">Gross Volume:</span>
                <span className="font-bold text-slate-900 dark:text-white whitespace-nowrap">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-[#222430] pt-2 flex items-center justify-between gap-4 text-xs font-black text-slate-900 dark:text-white">
                <span className="whitespace-nowrap uppercase tracking-wide">Total Amount Payable:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm whitespace-nowrap">
                  ${Number(selectedInvoiceForView.commission_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 text-center">
            <p>AAA Data Solutions Partner Network • All Rights Reserved</p>
            <p className="mt-0.5">Disbursements are processed upon review and approval by AAA Accounts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
