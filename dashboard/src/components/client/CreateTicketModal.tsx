'use client';

import React, { useState, useEffect } from 'react';
import { X, LifeBuoy, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from './ClientToast';

interface PropertyOption {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPropertyId?: string | null;
  propertiesList?: PropertyOption[];
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPropertyId,
  propertiesList = [],
}) => {
  const toast = useToast();
  const [properties, setProperties] = useState<PropertyOption[]>(propertiesList);
  const [selectedPropId, setSelectedPropId] = useState<string>(preselectedPropertyId || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [loadingProps, setLoadingProps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedPropertyId) {
      setSelectedPropId(preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  useEffect(() => {
    if (!isOpen) return;

    if (propertiesList.length === 0) {
      setLoadingProps(true);
      fetch('/api/client/properties?limit=100')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setProperties(json.data);
            if (!selectedPropId && json.data.length > 0) {
              setSelectedPropId(json.data[0].id);
            }
          }
        })
        .catch((err) => console.error('Error loading properties for ticket:', err))
        .finally(() => setLoadingProps(false));
    } else if (!selectedPropId && propertiesList.length > 0) {
      setSelectedPropId(propertiesList[0].id);
    }
  }, [isOpen, propertiesList, selectedPropId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a ticket subject.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a detailed description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/client/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedPropId || null,
          subject: subject.trim(),
          description: description.trim(),
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create support ticket.');
      }

      toast.success('Support ticket created successfully. Support team notified.');
      setSubject('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raise Support Ticket</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct request to AAA Engineering &amp; Telecom Operations.
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
              Related Property Location
            </label>
            <select
              value={selectedPropId}
              onChange={(e) => setSelectedPropId(e.target.value)}
              disabled={loadingProps || submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
            >
              {properties.length === 0 ? (
                <option value="">General Organization Issue (No Property)</option>
              ) : (
                properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.city ? `(${p.city}, ${p.state})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Urgency / Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-1.5 px-2 rounded-lg border text-center font-semibold text-[11px] transition cursor-pointer ${
                    priority === p
                      ? p === 'URGENT'
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-600 dark:text-rose-400'
                        : p === 'HIGH'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#181920]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Issue Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Inbound DID routing issue on Hotel Grandview"
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the phone line, timestamp, symptoms, or error codes observed..."
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
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
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Ticket</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
