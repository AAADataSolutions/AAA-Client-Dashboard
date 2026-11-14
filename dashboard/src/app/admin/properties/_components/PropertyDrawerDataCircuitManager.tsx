'use client';

import React, { useState } from 'react';
import {
  Wifi,
  Plus,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Building2,
} from 'lucide-react';

interface PropertyDrawerDataCircuitManagerProps {
  propertyId: string;
  propertyName?: string;
  circuit: any;
  connectivityType?: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH';
  onDataChanged?: () => void;
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

export function PropertyDrawerDataCircuitManager({
  propertyId,
  propertyName,
  circuit,
  connectivityType = 'BOTH',
  onDataChanged,
}: PropertyDrawerDataCircuitManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (used for both Create and Edit)
  const [carrierName, setCarrierName] = useState(circuit?.carrier_name || 'Airtel');
  const [wholesalerName, setWholesalerName] = useState(circuit?.wholesaler_name || 'Wholesaler A');
  const [bandwidth, setBandwidth] = useState(circuit?.bandwidth || '1 Gig');
  const [clientPrice, setClientPrice] = useState(String(circuit?.circuit_monthly_price || '300.00'));
  const [revSharePct, setRevSharePct] = useState(String(circuit?.revenue_share_percentage || '10'));
  const [stage, setStage] = useState(circuit?.status || 'STARTED');
  const [siteSurveyStatus, setSiteSurveyStatus] = useState(circuit?.site_survey_status || 'PENDING');
  const [siteSurveyNotes, setSiteSurveyNotes] = useState(circuit?.site_survey_notes || '');
  const [focStatus, setFocStatus] = useState(circuit?.foc_status || 'PENDING_ACTIONS');
  const [focDate, setFocDate] = useState(circuit?.foc_date || '');
  const [internalNotes, setInternalNotes] = useState(circuit?.internal_admin_notes || '');

  const resetFormFromCircuit = (c: any) => {
    setCarrierName(c?.carrier_name || '');
    setWholesalerName(c?.wholesaler_name || '');
    setBandwidth(c?.bandwidth || '1 Gig');
    setClientPrice(String(c?.circuit_monthly_price || '0.00'));
    setRevSharePct(String(c?.revenue_share_percentage || '0'));
    setStage(c?.status || 'STARTED');
    setSiteSurveyStatus(c?.site_survey_status || 'PENDING');
    setSiteSurveyNotes(c?.site_survey_notes || '');
    setFocStatus(c?.foc_status || 'PENDING_ACTIONS');
    setFocDate(c?.foc_date || '');
    setInternalNotes(c?.internal_admin_notes || '');
  };

  // 1. Handle Create Circuit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) {
      setError('Carrier name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
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
          site_survey_status: siteSurveyStatus,
          site_survey_notes: siteSurveyNotes.trim() || null,
          foc_status: focStatus,
          foc_date: focDate || null,
          internal_admin_notes: internalNotes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create Data Circuit.');
      }

      setIsCreating(false);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setError(err.message || 'Error creating Data Circuit.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Update Existing Circuit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!circuit?.id) return;

    try {
      setLoading(true);
      setError(null);
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
          site_survey_status: siteSurveyStatus,
          site_survey_notes: siteSurveyNotes.trim() || null,
          foc_status: focStatus,
          foc_date: focDate || null,
          internal_admin_notes: internalNotes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update Data Circuit.');
      }

      setIsEditing(false);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setError(err.message || 'Error updating Data Circuit.');
    } finally {
      setLoading(false);
    }
  };

  // If circuit exists and not in editing mode, show the "Edit Circuit" trigger button
  if (circuit && !isEditing) {
    return (
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => {
            resetFormFromCircuit(circuit);
            setIsEditing(true);
          }}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Circuit Details</span>
        </button>
      </div>
    );
  }

  // If no circuit exists and not creating yet, show the "Start Data Circuit" button
  if (!circuit && !isCreating) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-3">
        <Wifi className="w-8 h-8 mx-auto text-slate-400" />
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            Ported Only — No Data Circuit Attached
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            This property currently has Voice/DID services without an active dedicated Data Circuit pipeline.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              resetFormFromCircuit(null);
              setIsCreating(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Data Circuit for this Property</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Form (Create or Edit)
  return (
    <div className="p-4 bg-white dark:bg-[#181a24] rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">
            {isCreating ? `Create Data Circuit for ${propertyName}` : `Edit Data Circuit Details`}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
          className="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={isCreating ? handleCreateSubmit : handleUpdateSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Carrier Name (Client Facing) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="e.g. Airtel, AT&T, Spectrum, Jio"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Wholesaler (AAA Internal)
            </label>
            <input
              type="text"
              value={wholesalerName}
              onChange={(e) => setWholesalerName(e.target.value)}
              placeholder="e.g. Wholesaler A, Telco Wholesale"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Bandwidth Speed
            </label>
            <select
              value={bandwidth}
              onChange={(e) => setBandwidth(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {BANDWIDTH_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Pipeline Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {STAGE_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client Monthly Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={clientPrice}
              onChange={(e) => setClientPrice(e.target.value)}
              placeholder="300.00"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Wholesaler Rev Share (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={revSharePct}
              onChange={(e) => setRevSharePct(e.target.value)}
              placeholder="10"
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Site Survey Status
            </label>
            <select
              value={siteSurveyStatus}
              onChange={(e) => setSiteSurveyStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="PENDING">Pending Survey</option>
              <option value="COMPLETED">Completed / Passed</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              FOC Status &amp; Cutover Date
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={focStatus}
                onChange={(e) => setFocStatus(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="PENDING_ACTIONS">Pending Actions</option>
                <option value="CONFIRMED">Confirmed</option>
              </select>
              <input
                type="date"
                value={focDate}
                onChange={(e) => setFocDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Site Survey Notes
          </label>
          <input
            type="text"
            value={siteSurveyNotes}
            onChange={(e) => setSiteSurveyNotes(e.target.value)}
            placeholder="MPOE location, demarcation details, conduit readiness..."
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Internal Admin Notes
          </label>
          <textarea
            rows={2}
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Account numbers, circuit ID, contact technician notes..."
            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
          <button
            type="button"
            onClick={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-[#222430] rounded-xl text-slate-600 dark:text-slate-400 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222430]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isCreating ? 'Create Circuit' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

