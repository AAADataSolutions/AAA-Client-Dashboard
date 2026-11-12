'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShieldCheck, Copy } from 'lucide-react';
import {
  getCircuitStageBadge,
  formatCurrency,
  type WholesalerItem,
  type CircuitStatus,
} from './types';
import ManagePricingTab from './ManagePricingTab';
import ManageStagesTab from './ManageStagesTab';

interface ManageDataCircuitModalProps {
  showManageModal: boolean;
  onClose: () => void;
  selectedCircuit: any;
  modalTab: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW';
  setModalTab: (tab: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW') => void;
  wholesalers: WholesalerItem[];
  onReload: () => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ManageDataCircuitModal({
  showManageModal,
  onClose,
  selectedCircuit,
  modalTab,
  setModalTab,
  wholesalers,
  onReload,
  onToast,
}: ManageDataCircuitModalProps) {
  const [newQuoteForm, setNewQuoteForm] = useState({
    wholesaler_name: '',
    carrier_name: '',
    bandwidth: '1 Gig',
    quoted_monthly_price: '',
    proposed_rev_share_percentage: '10',
    is_selected: false,
    notes: '',
  });
  const [addingQuote, setAddingQuote] = useState(false);

  const [stageForm, setStageForm] = useState({
    status: 'STARTED' as CircuitStatus,
    wholesaler_name: '',
    carrier_name: '',
    bandwidth: '1 Gig',
    circuit_monthly_price: '' as string | number,
    revenue_share_percentage: '' as string | number,
    connectivity_type: 'BOTH' as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
    site_survey_status: 'PENDING',
    site_survey_notes: '',
    foc_status: 'PENDING_ACTIONS',
    foc_date: '',
    foc_pending_actions_notes: '',
    technical_details: '',
    internal_admin_notes: '',
  });
  const [savingStage, setSavingStage] = useState(false);

  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (selectedCircuit) {
      setStageForm({
        status: selectedCircuit.status || 'STARTED',
        wholesaler_name: selectedCircuit.wholesaler_name || '',
        carrier_name: selectedCircuit.carrier_name || '',
        bandwidth: selectedCircuit.bandwidth || '1 Gig',
        circuit_monthly_price: selectedCircuit.circuit_monthly_price || '',
        revenue_share_percentage: selectedCircuit.revenue_share_percentage || '',
        connectivity_type: selectedCircuit.connectivity_type || 'BOTH',
        site_survey_status: selectedCircuit.site_survey_status || 'PENDING',
        site_survey_notes: selectedCircuit.site_survey_notes || '',
        foc_status: selectedCircuit.foc_status || 'PENDING_ACTIONS',
        foc_date: selectedCircuit.foc_date || '',
        foc_pending_actions_notes: selectedCircuit.foc_pending_actions_notes || '',
        technical_details: selectedCircuit.technical_details || '',
        internal_admin_notes: selectedCircuit.internal_admin_notes || '',
      });
    }
  }, [selectedCircuit]);

  const computedRevSharePreview = useMemo(() => {
    const price = parseFloat(newQuoteForm.quoted_monthly_price) || 0;
    const pct = parseFloat(newQuoteForm.proposed_rev_share_percentage) || 0;
    return (price * pct) / 100;
  }, [newQuoteForm.quoted_monthly_price, newQuoteForm.proposed_rev_share_percentage]);

  const handleAddWholesalerQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircuit) return;
    try {
      setAddingQuote(true);
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuoteForm),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Quote Added', 'Wholesaler quote recorded successfully.');
        setNewQuoteForm({
          wholesaler_name: '',
          carrier_name: '',
          bandwidth: '1 Gig',
          quoted_monthly_price: '',
          proposed_rev_share_percentage: '10',
          is_selected: false,
          notes: '',
        });
        onReload();
      } else {
        onToast('Failed to add quote', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    } finally {
      setAddingQuote(false);
    }
  };

  const handleFinalizePrice = async (quote: any) => {
    if (!selectedCircuit) return;
    try {
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circuit_monthly_price: quote.quoted_monthly_price,
          revenue_share_percentage: quote.proposed_rev_share_percentage,
          wholesaler_name: quote.wholesaler_name,
          carrier_name: quote.carrier_name,
          bandwidth: quote.bandwidth,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Price Finalized', `Locked at ${formatCurrency(quote.quoted_monthly_price)}.`);
        onReload();
      } else {
        onToast('Error', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleSelectWinningQuote = async (quote: any, sendQuotation = false) => {
    if (!selectedCircuit) return;
    try {
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}/quotes/${quote.id}/select`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        onToast('Quote Selected', `Selected winning quote from ${quote.wholesaler_name}.`);
        if (sendQuotation) {
          setModalTab('QUOTATION_PREVIEW');
        }
        onReload();
      } else {
        onToast('Error selecting quote', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!selectedCircuit) return;
    if (!confirm('Are you sure you want to delete this quote?')) return;
    try {
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}/quotes?quote_id=${quoteId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        onToast('Quote Deleted', 'Wholesaler quote removed.');
        onReload();
      } else {
        onToast('Error deleting quote', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    }
  };

  const handleUploadAgreementPdf = async (advanceStage = false) => {
    if (!selectedCircuit || !agreementFile) {
      onToast('Please select a PDF file first', undefined, 'error');
      return;
    }
    try {
      setUploadingPdf(true);
      const fd = new FormData();
      fd.append('file', agreementFile);
      if (advanceStage) {
        fd.append('advance_stage', 'true');
      }
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}/agreement-pdf`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        onToast('Agreement Uploaded', 'PDF attached and stage unlocked.');
        setAgreementFile(null);
        onReload();
      } else {
        onToast('Upload failed', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error uploading agreement', err.message, 'error');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveCircuitChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCircuit) return;
    try {
      setSavingStage(true);
      const res = await fetch(`/api/admin/data-circuits/${selectedCircuit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stageForm),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Circuit Updated', 'Details saved successfully.');
        onReload();
      } else {
        onToast('Error saving circuit', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error saving circuit', err.message, 'error');
    } finally {
      setSavingStage(false);
    }
  };

  return (
    <AnimatePresence>
      {showManageModal && selectedCircuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/60 dark:bg-[#111217]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {selectedCircuit.property_name} — Data Circuit
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                    {getCircuitStageBadge(selectedCircuit.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCircuit.property_address}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-[#222430] px-5 bg-white dark:bg-[#15161c] text-xs font-bold overflow-x-auto">
              {[
                { key: 'PRICING', label: `1. Wholesaler Pricing Management (${selectedCircuit.quotes?.length || 0})` },
                { key: 'STAGES', label: '2. Lifecycle Stages & Agreement PDF' },
                { key: 'TECHNICAL', label: '3. Technical Details (Client Textbox)' },
                { key: 'QUOTATION_PREVIEW', label: '4. Client Quotation Preview (No Wholesaler)' },
              ].map((tb) => (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setModalTab(tb.key as any)}
                  className={`py-3 px-4 border-b-2 transition cursor-pointer shrink-0 ${
                    modalTab === tb.key
                      ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6 text-xs">
              {/* TAB 1: WHOLESALER PRICING MANAGEMENT */}
              {modalTab === 'PRICING' && (
                <ManagePricingTab
                  selectedCircuit={selectedCircuit}
                  wholesalers={wholesalers}
                  newQuoteForm={newQuoteForm}
                  setNewQuoteForm={setNewQuoteForm}
                  computedRevSharePreview={computedRevSharePreview}
                  addingQuote={addingQuote}
                  handleAddWholesalerQuote={handleAddWholesalerQuote}
                  handleFinalizePrice={handleFinalizePrice}
                  handleSelectWinningQuote={handleSelectWinningQuote}
                  handleDeleteQuote={handleDeleteQuote}
                />
              )}

              {/* TAB 2: LIFECYCLE STAGES & AGREEMENT PDF */}
              {modalTab === 'STAGES' && (
                <ManageStagesTab
                  selectedCircuit={selectedCircuit}
                  stageForm={stageForm}
                  setStageForm={setStageForm}
                  agreementFile={agreementFile}
                  setAgreementFile={setAgreementFile}
                  uploadingPdf={uploadingPdf}
                  savingStage={savingStage}
                  handleUploadAgreementPdf={handleUploadAgreementPdf}
                  handleSaveCircuitChanges={handleSaveCircuitChanges}
                  onToast={onToast}
                />
              )}

              {/* TAB 3: DESCRIPTIVE TECHNICAL DETAILS TEXTAREA */}
              {modalTab === 'TECHNICAL' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Descriptive Technical Details Box (Shown on Client Property Page)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter IP address, WAN IP, Gateway, Subnet Mask, DNS, Circuit ID, and handoff details in this single descriptive text box. The client can read these details on their Property page (without any wholesaler info).
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={stageForm.technical_details}
                    onChange={(e) => setStageForm((p: any) => ({ ...p, technical_details: e.target.value }))}
                    placeholder={`Example:\nCircuit ID: VOD-1G-99281\nWAN IP: 198.51.100.14/30\nGateway IP: 198.51.100.13\nUsable Static IP Block: 203.0.113.80/29\nPrimary DNS: 8.8.8.8 | Secondary DNS: 1.1.1.1\nDemarcation Location: Main MDF Room Rack 2`}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] font-mono text-xs text-slate-900 dark:text-white leading-relaxed"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveCircuitChanges()}
                      disabled={savingStage}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {savingStage && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Technical Details
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: CLIENT QUOTATION PREVIEW */}
              {modalTab === 'QUOTATION_PREVIEW' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span className="font-bold">
                        Privacy Verified: Wholesaler Name &amp; AAA Revenue Share % are 100% excluded from this client quotation.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const text = `AAA DATA SOLUTIONS — DATA CIRCUIT QUOTATION\nProperty: ${selectedCircuit.property_name}\nAddress: ${selectedCircuit.property_address}\nCarrier: ${stageForm.carrier_name || 'N/A'}\nBandwidth: ${stageForm.bandwidth || '1 Gig'}\nMonthly Recurring Charge (MRC): ${formatCurrency(Number(stageForm.circuit_monthly_price || 0))}/month`;
                        navigator.clipboard.writeText(text);
                        onToast('Client Quotation Copied', 'Copied client-safe quotation to clipboard.');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Quotation Text
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] space-y-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                          AAA Data Solutions — Official Client Quotation
                        </p>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          Dedicated Enterprise Data Circuit Proposal
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Location</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedCircuit.property_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Network</span>
                        <span className="font-bold text-slate-900 dark:text-white">{stageForm.carrier_name || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Committed Bandwidth</span>
                        <span className="font-bold text-slate-900 dark:text-white">{stageForm.bandwidth || '1 Gig'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Pricing</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {formatCurrency(Number(stageForm.circuit_monthly_price || 0))}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
