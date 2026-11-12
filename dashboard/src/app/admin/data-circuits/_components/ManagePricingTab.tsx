'use client';

import React from 'react';
import { Plus, Check, Trash2, Loader2, DollarSign } from 'lucide-react';
import { formatCurrency, type WholesalerItem } from './types';

interface ManagePricingTabProps {
  selectedCircuit: any;
  wholesalers: WholesalerItem[];
  newQuoteForm: {
    wholesaler_name: string;
    carrier_name: string;
    bandwidth: string;
    quoted_monthly_price: string;
    proposed_rev_share_percentage: string;
    is_selected: boolean;
    notes: string;
  };
  setNewQuoteForm: React.Dispatch<
    React.SetStateAction<{
      wholesaler_name: string;
      carrier_name: string;
      bandwidth: string;
      quoted_monthly_price: string;
      proposed_rev_share_percentage: string;
      is_selected: boolean;
      notes: string;
    }>
  >;
  computedRevSharePreview: number;
  addingQuote: boolean;
  handleAddWholesalerQuote: (e: React.FormEvent) => Promise<void>;
  handleFinalizePrice: (quote: any) => Promise<void>;
  handleSelectWinningQuote: (quote: any, sendQuotation?: boolean) => Promise<void>;
  handleDeleteQuote: (quoteId: string) => Promise<void>;
}

export default function ManagePricingTab({
  selectedCircuit,
  wholesalers,
  newQuoteForm,
  setNewQuoteForm,
  computedRevSharePreview,
  addingQuote,
  handleAddWholesalerQuote,
  handleFinalizePrice,
  handleSelectWinningQuote,
  handleDeleteQuote,
}: ManagePricingTabProps) {
  return (
    <div className="space-y-6">
      {/* Add Pricing Form */}
      <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#1a1c24]/80 border border-slate-200/80 dark:border-[#282a36] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Add Wholesaler Pricing
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter the carrier pricing offer received from a wholesaler. You can add multiple options and click &quot;Finalize Price&quot; on the best offer.
            </p>
          </div>
          {computedRevSharePreview > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              Est. AAA Share: {formatCurrency(computedRevSharePreview)}/mo
            </div>
          )}
        </div>

        <form onSubmit={handleAddWholesalerQuote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* 1. Wholesaler Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Wholesaler *
              </label>
              {wholesalers.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={wholesalers.some((w) => w.name === newQuoteForm.wholesaler_name) ? newQuoteForm.wholesaler_name : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Wholesaler --</option>
                    {wholesalers.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name} {w.phone ? `(${w.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom wholesaler"
                    value={newQuoteForm.wholesaler_name}
                    onChange={(e) => setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }))}
                    className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-[11px]"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Airtel Wholesale / Wholesaler A"
                  value={newQuoteForm.wholesaler_name}
                  onChange={(e) => setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                />
              )}
            </div>

            {/* 2. Carrier Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Carrier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Vodafone, Jio, Airtel"
                value={newQuoteForm.carrier_name}
                onChange={(e) => setNewQuoteForm((p) => ({ ...p, carrier_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* 3. Bandwidth */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Bandwidth *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1 Gig, 500 Mbps"
                value={newQuoteForm.bandwidth}
                onChange={(e) => setNewQuoteForm((p) => ({ ...p, bandwidth: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* 4. Price */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Price ($/mo) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 600.00"
                value={newQuoteForm.quoted_monthly_price}
                onChange={(e) => setNewQuoteForm((p) => ({ ...p, quoted_monthly_price: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* 5. Revenue Share % */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Revenue Share (%) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="e.g. 10"
                value={newQuoteForm.proposed_rev_share_percentage}
                onChange={(e) =>
                  setNewQuoteForm((p) => ({ ...p, proposed_rev_share_percentage: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={addingQuote}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              {addingQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add Pricing
            </button>
          </div>
        </form>
      </div>

      {/* Wholesaler Pricing Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            Wholesaler Pricing Comparison ({selectedCircuit.quotes?.length || 0})
          </h4>
          <p className="text-[11px] text-slate-400">
            Click &quot;Finalize Price&quot; on any quote to advance the circuit to &quot;2. Wholesaler Pricing Finalized&quot;.
          </p>
        </div>

        {(selectedCircuit.quotes || []).length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-[#282a36] rounded-2xl">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No Wholesaler Pricing Added Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Fill out the form above to record carrier offers from wholesalers.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(selectedCircuit.quotes || []).map((q: any) => {
              const isSelected = Boolean(q.is_selected);
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-[#282a36] bg-white dark:bg-[#181920]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        Carrier: {q.carrier_name} ({q.bandwidth})
                      </span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(q.quoted_monthly_price)}/mo
                      </span>
                      {isSelected && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Finalized Price
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>
                        Wholesaler (Hidden): <strong className="text-slate-800 dark:text-slate-200">{q.wholesaler_name}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        AAA Revenue Share:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {q.proposed_rev_share_percentage}% ({formatCurrency(q.proposed_rev_share_amount)}/mo)
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleFinalizePrice(q)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isSelected ? 'Price Finalized' : 'Finalize Price'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectWinningQuote(q, true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-[#252836] dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                      title="Choose this price and advance stage directly to Quotation Sent"
                    >
                      Finalize &amp; Send Quotation
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                      title="Delete pricing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
