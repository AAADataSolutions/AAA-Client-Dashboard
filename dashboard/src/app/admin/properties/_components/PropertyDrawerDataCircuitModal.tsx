'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, X, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface PropertyDrawerDataCircuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  circuit: any | null;
  connectivityType?: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH';
  onSuccess: () => void;
}

const BANDWIDTH_OPTIONS = ['100 Mbps', '300 Mbps', '500 Mbps', '1 Gig', '2 Gig', '5 Gig', '10 Gig'];
const STAGE_OPTIONS = [
  { value: 'STARTED', label: '1. Started / Requirements' },
  { value: 'PRICING_FINALIZED', label: '2. Wholesaler Pricing Finalized' },
  { value: 'QUOTATION_SENT', label: '3. Quotation Sent to Client' },
  { value: 'PAPERWORK_SIGNED', label: '4. Paperwork / Agreement Signed' },
  { value: 'SITE_SURVEY', label: '5. Site Survey Scheduled / Done' },
  { value: 'FOC_STAGE', label: '6. FOC Confirmed / Cutover' },
  { value: 'INSTALLED', label: '7. Installed & Live' },
];

export function PropertyDrawerDataCircuitModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  circuit,
  connectivityType = 'BOTH',
  onSuccess,
}: PropertyDrawerDataCircuitModalProps) {
  const [mounted, setMounted] = useState(false);
  const [carrierName, setCarrierName] = useState('');
  const [wholesalerName, setWholesalerName] = useState('');
  const [bandwidth, setBandwidth] = useState('1 Gig');
  const [clientPrice, setClientPrice] = useState('300.00');
  const [revSharePct, setRevSharePct] = useState('10');
  const [stage, setStage] = useState('STARTED');
  const [connType, setConnType] = useState<'PORTED' | 'DATA_CIRCUITED' | 'BOTH'>(connectivityType);
  const [siteSurveyStatus, setSiteSurveyStatus] = useState('PENDING');
  const [siteSurveyNotes, setSiteSurveyNotes] = useState('');
  const [focStatus, setFocStatus] = useState('PENDING_ACTIONS');
  const [focDate, setFocDate] = useState('');
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const normalizeStatus = (s: string) => {
    if (s === 'AGREEMENT_SIGNED') return 'PAPERWORK_SIGNED';
    if (s === 'FOC') return 'FOC_STAGE';
    return s || 'STARTED';
  };

  useEffect(() => {
    if (circuit) {
      setCarrierName(circuit.carrier_name || '');
      setWholesalerName(circuit.wholesaler_name || '');
      setBandwidth(circuit.bandwidth || '1 Gig');
      setClientPrice(String(circuit.circuit_monthly_price ?? '0.00'));
      setRevSharePct(String(circuit.revenue_share_percentage ?? '10'));
      setStage(normalizeStatus(circuit.status));
      setConnType(circuit.connectivity_type || connectivityType || 'BOTH');
      setSiteSurveyStatus(circuit.site_survey_status || 'PENDING');
      setSiteSurveyNotes(circuit.site_survey_notes || '');
      setFocStatus(circuit.foc_status || 'PENDING_ACTIONS');
      setFocDate(circuit.foc_date || '');
      setTechnicalDetails(circuit.technical_details || '');
      setInternalNotes(circuit.internal_admin_notes || '');
    } else {
      setCarrierName('');
      setWholesalerName('');
      setBandwidth('1 Gig');
      setClientPrice('300.00');
      setRevSharePct('10');
      setStage('STARTED');
      setConnType(connectivityType || 'BOTH');
      setSiteSurveyStatus('PENDING');
      setSiteSurveyNotes('');
      setFocStatus('PENDING_ACTIONS');
      setFocDate('');
      setTechnicalDetails('');
      setInternalNotes('');
    }
    setAgreementFile(null);
    setError(null);
  }, [circuit, connectivityType, isOpen]);

  const computedMonthlyRevShare = (
    (parseFloat(clientPrice || '0') * parseFloat(revSharePct || '0')) /
    100
  ).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) {
      setError('Carrier Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      let targetCircuitId = circuit?.id;

      if (circuit?.id) {
        const res = await fetch(`/api/admin/data-circuits/${circuit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'STANDARD_UPDATE',
            carrier_name: carrierName.trim(),
            wholesaler_name: wholesalerName.trim() || null,
            bandwidth,
            circuit_monthly_price: Number(clientPrice) || 0,
            revenue_share_percentage: Number(revSharePct) || 0,
            status: stage,
            connectivity_type: connType,
            site_survey_status: siteSurveyStatus,
            site_survey_notes: siteSurveyNotes.trim() || null,
            foc_status: focStatus,
            foc_date: focDate || null,
            technical_details: technicalDetails.trim() || null,
            internal_admin_notes: internalNotes.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to update Data Circuit.');
        }
      } else {
        const res = await fetch('/api/admin/data-circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: propertyId,
            carrier_name: carrierName.trim(),
            wholesaler_name: wholesalerName.trim() || null,
            bandwidth,
            circuit_monthly_price: Number(clientPrice) || 0,
            revenue_share_percentage: Number(revSharePct) || 0,
            status: stage,
            connectivity_type: connType,
            site_survey_status: siteSurveyStatus,
            site_survey_notes: siteSurveyNotes.trim() || null,
            foc_status: focStatus,
            foc_date: focDate || null,
            technical_details: technicalDetails.trim() || null,
            internal_admin_notes: internalNotes.trim() || null,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to create Data Circuit.');
        }
        targetCircuitId = json.data?.id;
      }

      if (agreementFile && targetCircuitId) {
        const fd = new FormData();
        fd.append('file', agreementFile);
        fd.append('circuit_id', targetCircuitId);
        await fetch('/api/admin/data-circuits/attachment', { method: 'POST', body: fd }).catch(() => {});
      }

      await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectivity_type: connType }),
      }).catch(() => {});

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the circuit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/80 dark:bg-[#111217]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {circuit ? `Manage Data Circuit — ${propertyName}` : `New Data Circuit for ${propertyName}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Configure carrier, bandwidth, wholesale pricing &amp; cutover milestones for this property.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Carrier Name (Client Facing) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. AT&T, Spectrum, Lumen, Comcast"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Wholesaler (AAA Internal)
                  </label>
                  <input
                    type="text"
                    value={wholesalerName}
                    onChange={(e) => setWholesalerName(e.target.value)}
                    placeholder="e.g. Wholesaler A, Telco Wholesale"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Bandwidth Speed
                  </label>
                  <select
                    value={bandwidth}
                    onChange={(e) => setBandwidth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {BANDWIDTH_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Connectivity Mode
                  </label>
                  <select
                    value={connType}
                    onChange={(e) => setConnType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="BOTH">Both (Ported &amp; Data Circuited)</option>
                    <option value="DATA_CIRCUITED">Data Circuited Only</option>
                    <option value="PORTED">Ported Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Client Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={clientPrice}
                    onChange={(e) => setClientPrice(e.target.value)}
                    placeholder="300.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Wholesaler Rev Share (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={revSharePct}
                      onChange={(e) => setRevSharePct(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ≈ ${computedMonthlyRevShare}/mo
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {STAGE_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Site Survey Status
                  </label>
                  <select
                    value={siteSurveyStatus}
                    onChange={(e) => setSiteSurveyStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="PENDING">Pending Survey</option>
                    <option value="COMPLETED">Completed / Passed</option>
                    <option value="NOT_REQUIRED">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    FOC Status &amp; Cutover Date
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={focStatus}
                      onChange={(e) => setFocStatus(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="PENDING_ACTIONS">Pending Actions</option>
                      <option value="CONFIRMED">Confirmed</option>
                    </select>
                    <input
                      type="date"
                      value={focDate}
                      onChange={(e) => setFocDate(e.target.value)}
                      className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Site Survey Notes
                  </label>
                  <input
                    type="text"
                    value={siteSurveyNotes}
                    onChange={(e) => setSiteSurveyNotes(e.target.value)}
                    placeholder="MPOE location, conduit readiness..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Agreement Document Section */}
              <div className="p-3 bg-slate-50 dark:bg-[#181a24] rounded-xl border border-slate-200 dark:border-[#222430]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    Signed Agreement PDF
                  </label>
                  {circuit?.agreement_file_url && (
                    <a
                      href={circuit.agreement_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <span>View Current PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Descriptive Technical Details (WAN IP, Subnet, Gateway, DNS, Equipment)
                </label>
                <textarea
                  rows={2}
                  value={technicalDetails}
                  onChange={(e) => setTechnicalDetails(e.target.value)}
                  placeholder="WAN IP: 198.51.100.10/29&#10;Gateway: 198.51.100.9&#10;DNS: 8.8.8.8, 1.1.1.1&#10;Handoff: RJ45 Copper"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Internal Admin Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Circuit ID, billing reference, technician contact notes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{circuit ? 'Save Circuit Changes' : 'Create Data Circuit'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
