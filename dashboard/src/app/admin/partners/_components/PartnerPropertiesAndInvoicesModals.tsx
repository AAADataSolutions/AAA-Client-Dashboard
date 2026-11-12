'use client';

import React from 'react';
import {
  Plus,
  Hotel,
  Trash2,
  X,
  Loader2,
  FileText,
  Eye,
  Unlink,
} from 'lucide-react';
import { Partner, PropertyOption, PartnerInvoiceItem, EmailQueueState } from './types';
import InvoiceEmailButton from './InvoiceEmailButton';

interface PartnerPropertiesAndInvoicesModalsProps {
  showViewPropertiesModal: boolean;
  setShowViewPropertiesModal: (show: boolean) => void;
  showViewInvoicesModal: boolean;
  setShowViewInvoicesModal: (show: boolean) => void;
  selectedPartner: Partner | null;
  loadingModalData: boolean;
  partnerAssignedProps: PropertyOption[];
  partnerInvoicesList: PartnerInvoiceItem[];
  setAssignForm: (f: { property_id: string; commission_override: string }) => void;
  setShowAssignModal: (show: boolean) => void;
  isSuperAdmin: boolean;
  handleUnassignProperty: (propertyId: string) => void;
  updatingInvoiceId: string | null;
  handleUpdateInvoiceStatus: (invoiceId: string, newStatus: string) => void;
  emailQueueStates: Record<string, EmailQueueState>;
  dispatchingEmailIds: Record<string, boolean>;
  handleSendInvoiceEmail: (invoiceIds: string[], contextLabel?: string) => void;
  setSelectedInvoiceForView: (inv: PartnerInvoiceItem | null) => void;
  deletingInvoiceId: string | null;
  handleDeleteInvoice: (invoiceId: string, invoiceNumber?: string) => void;
}

export default function PartnerPropertiesAndInvoicesModals({
  showViewPropertiesModal,
  setShowViewPropertiesModal,
  showViewInvoicesModal,
  setShowViewInvoicesModal,
  selectedPartner,
  loadingModalData,
  partnerAssignedProps,
  partnerInvoicesList,
  setAssignForm,
  setShowAssignModal,
  isSuperAdmin,
  handleUnassignProperty,
  updatingInvoiceId,
  handleUpdateInvoiceStatus,
  emailQueueStates,
  dispatchingEmailIds,
  handleSendInvoiceEmail,
  setSelectedInvoiceForView,
  deletingInvoiceId,
  handleDeleteInvoice,
}: PartnerPropertiesAndInvoicesModalsProps) {
  return (
    <>
      {/* VIEW ASSIGNED PROPERTIES MODAL / DRAWER */}
      {showViewPropertiesModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] p-5 sm:p-6 pb-4 shrink-0 bg-white dark:bg-[#15161c]">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-blue-600" /> Properties Assigned to {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default Partner Share: <strong className="text-blue-600">{selectedPartner.default_commission_rate}%</strong>
                </p>
              </div>
              <button
                onClick={() => setShowViewPropertiesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20222c] transition"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {loadingModalData ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading assigned properties...
                </div>
              ) : partnerAssignedProps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Hotel className="w-8 h-8 mx-auto opacity-30" />
                  <p>No properties currently assigned to this partner.</p>
                  <button
                    onClick={() => {
                      setShowViewPropertiesModal(false);
                      setAssignForm({ property_id: '', commission_override: '' });
                      setShowAssignModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign a Property Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px] sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">PROPERTY</th>
                          {isSuperAdmin && <th className="py-2.5 px-3">MONTHLY PRICE</th>}
                          <th className="py-2.5 px-3">PARTNER SHARE</th>
                          {isSuperAdmin && <th className="py-2.5 px-3">MONTHLY REVENUE SHARE</th>}
                          <th className="py-2.5 px-3 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                        {partnerAssignedProps.map((prop) => {
                          const effectiveRate = prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
                            ? Number(prop.partner_commission_override)
                            : Number(selectedPartner.default_commission_rate || 10);
                          const price = Number(prop.monthly_price || 0);
                          const commAmount = price * (effectiveRate / 100);

                          return (
                            <tr key={prop.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-900 dark:text-white block">{prop.name}</span>
                                <span className="text-[11px] text-slate-400">
                                  {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address || '—'}
                                </span>
                              </td>
                              {isSuperAdmin && (
                                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  ${price.toFixed(2)}
                                </td>
                              )}
                              <td className="py-3 px-3 font-bold text-blue-600">
                                {effectiveRate}%
                                {prop.partner_commission_override !== null && prop.partner_commission_override !== undefined && (
                                  <span className="ml-1 text-[10px] text-amber-500 font-normal">(Override)</span>
                                )}
                              </td>
                              {isSuperAdmin && (
                                <td className="py-3 px-3 font-extrabold text-emerald-600">
                                  ${commAmount.toFixed(2)}
                                </td>
                              )}
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => handleUnassignProperty(prop.id)}
                                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition border border-rose-200/50"
                                  title="Unassign from Partner"
                                >
                                  <Unlink className="w-3.5 h-3.5" /> Unassign
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex justify-between items-center p-4 sm:px-6 border-t border-slate-100 dark:border-[#222430] shrink-0 bg-slate-50/50 dark:bg-[#121318]">
              <span className="text-xs text-slate-400">
                Total Properties: <strong className="text-slate-700 dark:text-slate-200">{partnerAssignedProps.length}</strong>
              </span>
              <button
                onClick={() => {
                  setShowViewPropertiesModal(false);
                  setAssignForm({ property_id: '', commission_override: '' });
                  setShowAssignModal(true);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Another Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW INVOICES MODAL / DRAWER */}
      {showViewInvoicesModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] p-5 sm:p-6 pb-4 shrink-0 bg-white dark:bg-[#15161c]">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Invoices Submitted by {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review submitted statements, verify line items, and download PDF receipts.
                </p>
              </div>
              <button
                onClick={() => setShowViewInvoicesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20222c] transition"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {loadingModalData ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading partner invoices...
                </div>
              ) : partnerInvoicesList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto opacity-30" />
                  <p>No invoices submitted by this partner yet.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px] sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">INVOICE #</th>
                        <th className="py-2.5 px-3">PERIOD</th>
                        <th className="py-2.5 px-3">PROPERTIES</th>
                        <th className="py-2.5 px-3">GROSS AMOUNT</th>
                        <th className="py-2.5 px-3">REVENUE SHARE DUE</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                      {partnerInvoicesList.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {inv.invoice_number}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {inv.period_start} to {inv.period_end}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                            {inv.total_properties} Props
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            ${Number(inv.gross_revenue).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-black text-emerald-600 text-sm">
                            ${Number(inv.commission_amount).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={inv.status}
                              disabled={updatingInvoiceId === inv.id}
                              onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                              className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border border-slate-300 dark:border-[#2a2c3a] bg-white dark:bg-[#111217] cursor-pointer"
                            >
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="PAID">PAID</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <InvoiceEmailButton
                                inv={{ ...inv, partner: selectedPartner }}
                                compact={true}
                                emailQueueStates={emailQueueStates}
                                dispatchingEmailIds={dispatchingEmailIds}
                                onSendInvoiceEmail={handleSendInvoiceEmail}
                              />
                              <button
                                onClick={() => {
                                  setSelectedInvoiceForView({
                                    ...inv,
                                    partner: selectedPartner,
                                  });
                                }}
                                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition border border-blue-200/50"
                              >
                                <Eye className="w-3.5 h-3.5" /> PDF
                              </button>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                                  disabled={deletingInvoiceId === inv.id}
                                  className="p-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 rounded-lg transition cursor-pointer disabled:opacity-50"
                                  title="Delete Invoice"
                                >
                                  {deletingInvoiceId === inv.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex justify-end items-center p-4 sm:px-6 border-t border-slate-100 dark:border-[#222430] shrink-0 bg-slate-50/50 dark:bg-[#121318]">
              <button
                onClick={() => setShowViewInvoicesModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
