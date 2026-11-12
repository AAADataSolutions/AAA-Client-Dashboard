'use client';

import React from 'react';
import {
  Trash2,
  X,
  Loader2,
  Printer,
} from 'lucide-react';
import { Partner, PartnerInvoiceItem, EmailQueueState } from './types';
import InvoiceEmailButton from './InvoiceEmailButton';

interface PartnerStatementModalProps {
  selectedInvoiceForView: PartnerInvoiceItem | null;
  setSelectedInvoiceForView: (inv: PartnerInvoiceItem | null) => void;
  selectedPartner: Partner | null;
  isSuperAdmin: boolean;
  deletingInvoiceId: string | null;
  handleDeleteInvoice: (invoiceId: string, invoiceNumber?: string) => void;
  emailQueueStates: Record<string, EmailQueueState>;
  dispatchingEmailIds: Record<string, boolean>;
  handleSendInvoiceEmail: (invoiceIds: string[], contextLabel?: string) => void;
  handlePrint: () => void;
  printRef: React.RefObject<HTMLDivElement | null>;
}

export default function PartnerStatementModal({
  selectedInvoiceForView,
  setSelectedInvoiceForView,
  selectedPartner,
  isSuperAdmin,
  deletingInvoiceId,
  handleDeleteInvoice,
  emailQueueStates,
  dispatchingEmailIds,
  handleSendInvoiceEmail,
  handlePrint,
  printRef,
}: PartnerStatementModalProps) {
  if (!selectedInvoiceForView) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Actions - Sticky Header */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 dark:border-[#222430] p-5 sm:p-6 pb-4 shrink-0 bg-white dark:bg-[#15161c]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">Partner Statement Document</span>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
              selectedInvoiceForView.status === 'PAID'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : selectedInvoiceForView.status === 'APPROVED'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {selectedInvoiceForView.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={() => handleDeleteInvoice(selectedInvoiceForView.id, selectedInvoiceForView.invoice_number)}
                disabled={deletingInvoiceId === selectedInvoiceForView.id}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Delete Invoice"
              >
                {deletingInvoiceId === selectedInvoiceForView.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
              </button>
            )}
            <InvoiceEmailButton
              inv={selectedInvoiceForView}
              compact={false}
              emailQueueStates={emailQueueStates}
              dispatchingEmailIds={dispatchingEmailIds}
              onSendInvoiceEmail={handleSendInvoiceEmail}
            />
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

        {/* Printable Statement Document - Scrollable Body */}
        <div id="printable-admin-invoice" ref={printRef} className="flex-1 overflow-y-auto min-h-0 p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 text-xs bg-white dark:bg-[#15161c]">
          {/* Header */}
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
                {selectedInvoiceForView.partner?.name || selectedPartner?.name || 'Channel Partner'}
              </p>
              {(selectedInvoiceForView.partner?.company_name || selectedPartner?.company_name) && (
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  {selectedInvoiceForView.partner?.company_name || selectedPartner?.company_name}
                </p>
              )}
              <p className="text-slate-500">{selectedInvoiceForView.partner?.email || selectedPartner?.email || 'partner@aaadatasolutions.com'}</p>
              {(selectedInvoiceForView.partner?.phone || selectedPartner?.phone) && (
                <p className="text-slate-500">{selectedInvoiceForView.partner?.phone || selectedPartner?.phone}</p>
              )}
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

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
                <tr>
                  <th className="py-2.5 px-3">PROPERTY / LOCATION</th>
                  <th className="py-2.5 px-3 text-right">MONTHLY SUBSCRIPTION</th>
                  <th className="py-2.5 px-3 text-right">Revenue Share</th>
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
