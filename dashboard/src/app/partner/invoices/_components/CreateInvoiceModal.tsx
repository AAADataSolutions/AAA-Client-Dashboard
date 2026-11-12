'use client';

import React from 'react';
import { Hotel, X, Loader2, AlertCircle } from 'lucide-react';

export interface PartnerInvoice {
  id: string;
  partner_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_properties: number;
  gross_revenue: number;
  commission_amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  paid_at?: string | null;
  payment_reference?: string | null;
  line_items?: any[];
  notes?: string | null;
  created_at: string;
}

export interface PartnerPropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  main_phone?: string | null;
  monthly_price: number | null;
  status: string;
  effective_commission_rate: number;
  monthly_commission: number;
}

interface CreateInvoiceModalProps {
  showGenerateModal: boolean;
  setShowGenerateModal: (val: boolean) => void;
  generateError: string | null;
  handleSendInvoice: (e: React.FormEvent) => void;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
  selectedPropIds: string[];
  properties: PartnerPropertyOption[];
  handleToggleAllProperties: () => void;
  handleToggleProperty: (propId: string) => void;
  customTotalAmount: string;
  setCustomTotalAmount: (val: string) => void;
  autoCalculatedGross: number;
  autoCalculatedCommission: number;
  notes: string;
  setNotes: (val: string) => void;
  generating: boolean;
}

export function CreateInvoiceModal({
  showGenerateModal,
  setShowGenerateModal,
  generateError,
  handleSendInvoice,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
  selectedPropIds,
  properties,
  handleToggleAllProperties,
  handleToggleProperty,
  customTotalAmount,
  setCustomTotalAmount,
  autoCalculatedGross,
  autoCalculatedCommission,
  notes,
  setNotes,
  generating,
}: CreateInvoiceModalProps) {
  if (!showGenerateModal) return null;

  return (
    <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Create &amp; Send Partner Invoice
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select properties to include, review calculated shares, or enter a custom invoice total amount.
            </p>
          </div>
          <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {generateError && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        <form onSubmit={handleSendInvoice} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
            {/* Billing Period Start & End */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Period Start
                </label>
                <input
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Period End
                </label>
                <input
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Property Selection List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Hotel className="w-4 h-4 text-blue-600" />
                  Select Properties for Invoice ({selectedPropIds.length} of {properties.length} selected)
                </label>
                <button
                  type="button"
                  onClick={handleToggleAllProperties}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer text-[11px]"
                >
                  {selectedPropIds.length === properties.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217] divide-y divide-slate-100 dark:divide-[#20222c]">
                {properties.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No assigned properties found.
                  </div>
                ) : (
                  properties.map((prop) => {
                    const isChecked = selectedPropIds.includes(prop.id);
                    return (
                      <label
                        key={prop.id}
                        className={`flex items-center justify-between p-3 cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50/50 dark:bg-blue-950/20'
                            : 'hover:bg-slate-100/60 dark:hover:bg-[#181a24]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleProperty(prop.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {prop.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                            ${prop.monthly_commission.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (${Number(prop.monthly_price || 0).toFixed(2)} @ {prop.effective_commission_rate}%)
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Enter Custom / Total Amount */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block font-black text-slate-900 dark:text-white text-xs">
                    Total Invoice Amount ($ USD)
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Auto-calculated from selected properties, or enter a custom amount.
                  </p>
                </div>
                <div className="relative w-full sm:w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customTotalAmount}
                    onChange={(e) => setCustomTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#111217] border border-slate-300 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white font-extrabold text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/50 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                <span>Selected Properties Gross: <strong>${autoCalculatedGross.toFixed(2)}</strong></span>
                <span>Calculated Share: <strong>${autoCalculatedCommission.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Notes & Payment Details */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Notes &amp; Payment Remittance Instructions
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes, Bank Name, Wire/ACH Routing #, Account #, or PayPal..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-xl text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1f212c]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating || selectedPropIds.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Send Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
