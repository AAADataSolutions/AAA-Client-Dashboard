'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wifi,
  FileText,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  CIRCUIT_STAGES,
  getCircuitStageBadge,
  formatCurrency,
} from '../types';

interface ClientDataCircuitDetailModalProps {
  isOpen?: boolean;
  onClose: () => void;
  circuit: any | null;
}

export default function ClientDataCircuitDetailModal({
  isOpen = true,
  onClose,
  circuit,
}: ClientDataCircuitDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TECHNICAL' | 'QUOTATION'>('OVERVIEW');
  const [copiedTech, setCopiedTech] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveTab('OVERVIEW');
  }, [circuit?.id]);

  if (!mounted || typeof document === 'undefined') return null;
  if (!isOpen || !circuit) return null;

  const badge = getCircuitStageBadge(circuit.status, circuit);
  const currentStep = CIRCUIT_STAGES.find((s) => s.key === circuit.status)?.step || 1;
  const quotes: any[] = Array.isArray(circuit.quotes) ? circuit.quotes : [];

  const handleCopyTech = () => {
    if (!circuit.technical_details) return;
    navigator.clipboard.writeText(circuit.technical_details);
    setCopiedTech(true);
    setTimeout(() => setCopiedTech(false), 2000);
  };

  const handleCopyQuotation = () => {
    const text = `AAA DATA SOLUTIONS — DATA CIRCUIT QUOTATION\nProperty: ${circuit.property_name}\nAddress: ${circuit.property_address}\nCarrier: ${circuit.carrier_name || 'Pending'}\nBandwidth: ${circuit.bandwidth || '1 Gig'}\nMonthly Recurring Charge (MRC): ${formatCurrency(circuit.circuit_monthly_price)}/month`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const formatDate = (val?: string | null) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
  };

  const drawerContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs font-sans">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-start justify-between bg-slate-50/80 dark:bg-[#111217] shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
                    {circuit.property_name} — Data Circuit
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {circuit.property_address && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{circuit.property_address}</span>
                    </span>
                  )}
                  {circuit.property_phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>{circuit.property_phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 dark:border-[#222430] bg-white dark:bg-[#15161c] px-5 shrink-0 overflow-x-auto">
            {[
              { key: 'OVERVIEW', label: '1. Lifecycle & Details' },
              { key: 'TECHNICAL', label: '2. Technical Specs' },
              { key: 'QUOTATION', label: '3. Official Proposal' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Tab 1: Overview, Lifecycle, FOC, Site Survey, Agreement PDF */}
            {activeTab === 'OVERVIEW' && (
              <>
                {/* 7-Stage Pipeline Stepper */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Provisioning Lifecycle Pipeline
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                        Stage {currentStep} of 7: {badge.label}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                      {Math.round((currentStep / 7) * 100)}% Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 pt-2 text-center">
                    {CIRCUIT_STAGES.map((st) => {
                      const isPassed = st.step < currentStep;
                      const isCurrent = st.step === currentStep;
                      return (
                        <div key={st.key} className="flex flex-col items-center gap-1">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                              isCurrent
                                ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-500/20'
                                : isPassed
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isPassed ? <Check className="w-3.5 h-3.5" /> : st.step}
                          </div>
                          <span
                            className={`text-[9.5px] font-semibold leading-tight line-clamp-1 ${
                              isCurrent
                                ? 'text-blue-600 dark:text-blue-400 font-bold'
                                : isPassed
                                ? 'text-slate-700 dark:text-slate-300'
                                : 'text-slate-400'
                            }`}
                            title={st.label}
                          >
                            {st.label.replace(/^\d+\.\s*/, '')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Carrier & Client Pricing Specs (No Wholesaler or Revenue Share) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Carrier Service</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block truncate">
                      {circuit.carrier_name || 'Carrier Pending'}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Committed Bandwidth</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                      {circuit.bandwidth || '1 Gig'}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Monthly Price (MRC)</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                      {formatCurrency(circuit.circuit_monthly_price)}/mo
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block font-medium">Connectivity Type</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                      {String(circuit.connectivity_type || 'DATA_CIRCUITED').replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Carrier Quote Options (Strict Client Privacy: Carrier, Bandwidth & MRC only) */}
                {quotes.length > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                      Carrier Quote Options ({quotes.length})
                    </span>
                    <div className="space-y-2">
                      {quotes.map((q) => (
                        <div
                          key={q.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${
                            q.is_selected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                              : 'bg-white dark:bg-[#111217] border-slate-200 dark:border-[#222430]'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {q.carrier_name || 'Carrier'}
                            </span>
                            <span className="text-slate-500">({q.bandwidth || '1 Gig'})</span>
                            {q.is_selected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                                Selected Plan
                              </span>
                            )}
                          </div>
                          <span className="font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(q.quoted_monthly_price)}/mo
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOC & Cutover Details */}
                <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      FOC &amp; Cutover Schedule
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                      {String(circuit.foc_status || 'PENDING_ACTIONS').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">FOC Cutover Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {circuit.foc_date ? formatDate(circuit.foc_date) : 'Awaiting FOC'}
                    </span>
                  </div>
                  {circuit.foc_pending_actions_notes && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                        FOC / Pending Action Notes
                      </span>
                      {circuit.foc_pending_actions_notes}
                    </div>
                  )}
                </div>

                {/* Site Survey Status Card */}
                <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                      Site Survey Verification
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white text-xs mt-1 block">
                      {circuit.site_survey_notes || 'Site survey inspection scheduled with carrier technician.'}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold shrink-0 ${
                      circuit.site_survey_status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {circuit.site_survey_status || 'PENDING'}
                  </span>
                </div>

                {/* Signed Agreement Document Box */}
                <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Official Signed Agreement Document
                    </span>
                    {circuit.agreement_file_url && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Countersigned &amp; Active
                      </span>
                    )}
                  </div>

                  {circuit.agreement_file_url ? (
                    <div className="p-3.5 bg-white dark:bg-[#111217] rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {circuit.agreement_file_name || 'Data_Circuit_Service_Agreement.pdf'}
                          </p>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            {circuit.paperwork_signed_at
                              ? `Executed on ${formatDate(circuit.paperwork_signed_at)}`
                              : 'Executed Countersigned Contract'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={circuit.agreement_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400">
                      <FileText className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                      <p className="font-semibold">Agreement PDF Pending Signature</p>
                      <p className="text-[11px] mt-0.5">Once paperwork is signed, the executed PDF will appear here.</p>
                    </div>
                  )}
                </div>

                {/* Key Milestone Timestamps */}
                <div className="p-4 bg-white dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Circuit Timeline Milestones
                  </span>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#111217]">
                      <span className="text-slate-500">Request Created:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatDate(circuit.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#111217]">
                      <span className="text-slate-500">Quotation Sent:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatDate(circuit.quotation_sent_at)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#111217]">
                      <span className="text-slate-500">Paperwork Signed:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatDate(circuit.paperwork_signed_at)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#111217]">
                      <span className="text-slate-500">Installed Date:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatDate(circuit.installed_at)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeTab === 'TECHNICAL' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider block">
                      Technical Configuration
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      Static IP allocation, Gateway, WAN IP, Subnet Mask, and DNS servers.
                    </p>
                  </div>
                  {circuit.technical_details && (
                    <button
                      type="button"
                      onClick={handleCopyTech}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    >
                      {copiedTech ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTech ? 'Copied' : 'Copy Technical Details'}</span>
                    </button>
                  )}
                </div>

                {circuit.technical_details ? (
                  <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                    {circuit.technical_details}
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400">
                    <Wifi className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold">Technical Details Pending Carrier Provisioning</p>
                    <p className="text-[11px] mt-1">IP assignment and WAN gateway specs will appear once FOC cutover is initiated.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Official Proposal Preview */}
            {activeTab === 'QUOTATION' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-bold">
                      Official Proposal &bull; Dedicated Enterprise Bandwidth
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyQuotation}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0 transition"
                  >
                    {copiedQuote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedQuote ? 'Copied' : 'Copy Quotation Text'}</span>
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                        AAA Data Solutions — Client Quotation
                      </p>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                        Dedicated Enterprise Data Circuit Proposal
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Location</span>
                      <span className="font-bold text-slate-900 dark:text-white">{circuit.property_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Network</span>
                      <span className="font-bold text-slate-900 dark:text-white">{circuit.carrier_name || 'Pending'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Committed Bandwidth</span>
                      <span className="font-bold text-slate-900 dark:text-white">{circuit.bandwidth || '1 Gig'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Pricing</span>
                      <span className="text-base font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(circuit.circuit_monthly_price)}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-400">
              Read-only view &bull; Managed by AAA Data Solutions
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-[#222430] hover:bg-slate-300 dark:hover:bg-[#2c2f3e] text-slate-800 dark:text-white font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(drawerContent, document.body);
}
