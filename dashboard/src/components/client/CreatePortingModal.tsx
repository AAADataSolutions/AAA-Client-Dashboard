'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Loader2, AlertCircle, Phone, Check, CheckSquare, Square } from 'lucide-react';
import { useToast } from './ClientToast';

interface CreatePortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePortingModal: React.FC<CreatePortingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedOrgPropId, setSelectedOrgPropId] = useState<string>('');
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoadingData(true);
    setError(null);
    setSelectedServiceIds([]);
    setTargetDate('');
    setNotes('');

    Promise.all([
      fetch('/api/client/properties?limit=100').then((r) => r.json()),
      fetch('/api/client/services?limit=200').then((r) => r.json()),
    ])
      .then(([propsRes, servicesRes]) => {
        if (propsRes.success && propsRes.data) {
          setProperties(propsRes.data);
          if (propsRes.data.length > 0) {
            setSelectedOrgPropId(propsRes.data[0].org_property_id);
          }
        }
        if (servicesRes.success && servicesRes.data) {
          setAllServices(servicesRes.data);
        }
      })
      .catch((err) => {
        console.error('Error loading porting form data:', err);
        setError('Failed to load properties or voice lines for porting.');
      })
      .finally(() => setLoadingData(false));
  }, [isOpen]);

  if (!isOpen) return null;

  // Selected property object
  const selectedProperty = properties.find((p) => p.org_property_id === selectedOrgPropId);

  // Filter services that belong to the selected property
  const eligibleServices = allServices.filter(
    (s) => s.property_id === selectedProperty?.id || s.property_name === selectedProperty?.name
  );

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAllServices = () => {
    if (selectedServiceIds.length === eligibleServices.length) {
      setSelectedServiceIds([]);
    } else {
      setSelectedServiceIds(eligibleServices.map((s) => s.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgPropId) {
      setError('Please select a destination property location.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/client/porting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_property_id: selectedOrgPropId,
          target_date: targetDate || null,
          notes: notes.trim() || null,
          service_ids: selectedServiceIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit porting request.');
      }

      toast.success('Porting order submitted successfully to AAA Carrier Operations.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Start New Porting Request
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Initiate carrier DID or toll-free transfer for your property numbers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Property Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Target Property Location <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedOrgPropId}
              onChange={(e) => {
                setSelectedOrgPropId(e.target.value);
                setSelectedServiceIds([]);
              }}
              disabled={loadingData || submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.org_property_id} value={p.org_property_id}>
                  {p.name} ({p.city}, {p.state})
                </option>
              ))}
            </select>
          </div>

          {/* Desired Target FOC Date */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Desired Cutover / Target FOC Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs"
            />
            <p className="text-[10.5px] text-slate-400">
              Standard carrier cutovers require 5 to 10 business days for FOC confirmation.
            </p>
          </div>

          {/* Eligible Lines Checklist */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Select Numbers to Port ({selectedServiceIds.length} Selected)
              </label>
              {eligibleServices.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllServices}
                  className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] font-semibold cursor-pointer"
                >
                  {selectedServiceIds.length === eligibleServices.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {loadingData ? (
              <div className="p-4 bg-slate-50 dark:bg-[#111217] rounded-lg text-center text-slate-400 text-xs">
                Loading property lines...
              </div>
            ) : eligibleServices.length === 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-[#111217] rounded-lg border border-slate-200 dark:border-[#222430] text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                No existing voice services found for this property. You can still submit manual phone numbers in the carrier notes below.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto p-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg space-y-1.5 [scrollbar-width:thin]">
                {eligibleServices.map((s) => {
                  const isChecked = selectedServiceIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
                          : 'hover:bg-white dark:hover:bg-[#181920] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-mono font-bold text-xs">{s.phone_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {s.service_type || 'Voice Line'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carrier Notes & LOA Details */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Carrier Details, Account # &amp; PIN <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter losing carrier name (e.g., AT&T, Verizon), Account #, BTN (Billing Telephone Number), Authorization PIN, or manual numbers to port..."
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500 resize-none text-xs"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <span>Submit Porting Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
