'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useToast } from './ClientToast';

interface E911EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: any | null;
}

export const E911EditModal: React.FC<E911EditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const toast = useToast();
  const [emergencyAddress, setEmergencyAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setEmergencyAddress(record.emergency_address || record.property_address || '');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyAddress.trim()) {
      setError('Please provide a valid emergency dispatch address.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/client/e911', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_property_id: record.org_property_id,
          e911_id: record.id,
          emergency_address: emergencyAddress.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update emergency address.');
      }

      toast.success('Emergency address submitted for PSAP re-verification.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Update Emergency Dispatch Address
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Submit updated civic location to Public Safety Answering Point (PSAP).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430]"
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
          {/* Property Name */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Target Property Location
            </span>
            <p className="font-semibold text-slate-900 dark:text-white text-xs">
              {record.property_name}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              {record.property_address}
            </p>
          </div>

          {/* Emergency Civic Address Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Emergency Dispatch Civic Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={emergencyAddress}
              onChange={(e) => setEmergencyAddress(e.target.value)}
              placeholder="e.g., 100 Main Street, Suite 400, Floor 4, Springfield, IL 62701"
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none text-xs"
            />
            <p className="text-[10.5px] text-slate-400">
              Must match USPS / MSAG validated physical street address for 911 emergency vehicle dispatch.
            </p>
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Verification</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
