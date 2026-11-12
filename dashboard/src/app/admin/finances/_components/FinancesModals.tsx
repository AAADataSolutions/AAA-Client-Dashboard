'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { formatCurrency, type BackorderFormData } from './types';

interface FinancesModalsProps {
  showBackorderModal: boolean;
  setShowBackorderModal: (val: boolean) => void;
  partnersList: any[];
  defaultMonthKey: string;
  onSuccess: (emailQueued: boolean) => void;
}

export default function FinancesModals({
  showBackorderModal,
  setShowBackorderModal,
  partnersList,
  defaultMonthKey,
  onSuccess,
}: FinancesModalsProps) {
  const [backorderForm, setBackorderForm] = useState<BackorderFormData>({
    partner_id: '',
    period_month: defaultMonthKey,
    custom_commission_rate: '',
    status: 'SUBMITTED',
    notes: '',
    send_email: false,
  });

  const [candidateProperties, setCandidateProperties] = useState<any[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [backorderSubmitting, setBackorderSubmitting] = useState(false);

  // Fetch candidate properties for the selected partner and month
  useEffect(() => {
    if (!showBackorderModal || !backorderForm.partner_id) {
      setCandidateProperties([]);
      setSelectedPropertyIds([]);
      return;
    }

    const fetchCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const res = await fetch(
          `/api/admin/finances/backorder-invoice?partner_id=${backorderForm.partner_id}&period_month=${backorderForm.period_month}`
        );
        const json = await res.json();
        if (json.success) {
          const props = json.properties || [];
          setCandidateProperties(props);
          setSelectedPropertyIds(props.map((p: any) => p.id));
        }
      } catch (err) {
        console.error('Failed to load candidate properties:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [showBackorderModal, backorderForm.partner_id, backorderForm.period_month]);

  const handleCreateBackorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPropertyIds.length === 0) {
      alert('Please select at least one property to generate the commission invoice.');
      return;
    }
    try {
      setBackorderSubmitting(true);
      const res = await fetch('/api/admin/finances/backorder-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backorderForm,
          property_ids: selectedPropertyIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowBackorderModal(false);
        setBackorderForm({
          partner_id: '',
          period_month: defaultMonthKey,
          custom_commission_rate: '',
          status: 'SUBMITTED',
          notes: '',
          send_email: false,
        });
        setSelectedPropertyIds([]);
        setCandidateProperties([]);
        onSuccess(Boolean(json.emailQueued));
      } else {
        alert(json.error || 'Failed to generate back-order invoice');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setBackorderSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {showBackorderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Generate Back-Order Revenue Share Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowBackorderModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBackorder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner *</label>
                <select
                  required
                  value={backorderForm.partner_id}
                  onChange={(e) => setBackorderForm({ ...backorderForm, partner_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Partner</option>
                  {partnersList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.company_name || 'Individual'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Period Month *</label>
                  <input
                    type="month"
                    required
                    value={backorderForm.period_month}
                    onChange={(e) => setBackorderForm({ ...backorderForm, period_month: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Status *</label>
                  <select
                    value={backorderForm.status}
                    onChange={(e) => setBackorderForm({ ...backorderForm, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              {/* Candidate properties checklist with live preview */}
              {backorderForm.partner_id && (
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Assigned Partner Properties ({selectedPropertyIds.length}/{candidateProperties.length})
                    </label>
                    {candidateProperties.length > 0 && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyIds(candidateProperties.map((p) => p.id))}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedPropertyIds([])}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingCandidates ? (
                    <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-[#1a1b24] rounded-xl flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      <span>Finding eligible properties...</span>
                    </div>
                  ) : candidateProperties.length === 0 ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-[11px]">
                      No properties currently assigned to this partner.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-[#1a1b24] rounded-xl border border-slate-200 dark:border-[#282a36]">
                      {candidateProperties.map((prop) => {
                        const isChecked = selectedPropertyIds.includes(prop.id);
                        const propRate =
                          backorderForm.custom_commission_rate !== ''
                            ? Number(backorderForm.custom_commission_rate)
                            : prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
                            ? Number(prop.partner_commission_override)
                            : Number(
                                partnersList.find((p) => p.id === backorderForm.partner_id)?.default_commission_rate || 10
                              );
                        const propComm = Number(prop.monthly_price || 0) * (propRate / 100);

                        return (
                          <label
                            key={prop.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isChecked
                                ? 'bg-blue-500/10 border border-blue-500/20 text-slate-900 dark:text-white'
                                : 'hover:bg-slate-100 dark:hover:bg-[#20222e] text-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPropertyIds([...selectedPropertyIds, prop.id]);
                                  } else {
                                    setSelectedPropertyIds(selectedPropertyIds.filter((id) => id !== prop.id));
                                  }
                                }}
                                className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="font-semibold text-xs">{prop.name}</span>
                            </div>
                            <div className="text-right font-mono text-[11px]">
                              <span>{formatCurrency(Number(prop.monthly_price || 0))}</span>
                              <span className="text-slate-400 text-[10px] ml-1.5">({propRate}% = {formatCurrency(propComm)})</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary preview */}
                  {candidateProperties.length > 0 && selectedPropertyIds.length > 0 && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-between font-mono text-xs text-blue-900 dark:text-blue-300">
                      <span>
                        Total Invoice ({selectedPropertyIds.length} propert{selectedPropertyIds.length > 1 ? 'ies' : 'y'}):
                      </span>
                      <span className="font-bold">
                        {formatCurrency(
                          candidateProperties
                            .filter((p) => selectedPropertyIds.includes(p.id))
                            .reduce((sum, p) => {
                              const rate =
                                backorderForm.custom_commission_rate !== ''
                                  ? Number(backorderForm.custom_commission_rate)
                                  : p.partner_commission_override !== null && p.partner_commission_override !== undefined
                                  ? Number(p.partner_commission_override)
                                  : Number(
                                      partnersList.find((ptr) => ptr.id === backorderForm.partner_id)?.default_commission_rate || 10
                                    );
                              return sum + Number(p.monthly_price || 0) * (rate / 100);
                            }, 0)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Historical October commission adjustment for properties A, B, C."
                  value={backorderForm.notes}
                  onChange={(e) => setBackorderForm({ ...backorderForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(backorderForm.send_email)}
                  onChange={(e) => setBackorderForm({ ...backorderForm, send_email: e.target.checked })}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Automatically queue &amp; send Partner Invoice Email with PDF Attachment
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Leave unchecked if you prefer to manually click &quot;Send Email&quot; from the invoice table later.
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowBackorderModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={backorderSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {backorderSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate Invoice
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
