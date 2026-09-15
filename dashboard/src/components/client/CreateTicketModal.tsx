'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, LifeBuoy, Loader2, AlertCircle, Paperclip } from 'lucide-react';
import { useToast } from './ClientToast';

interface SelectOption {
  id: string;
  label: string;
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPropertyId?: string | null;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedPropertyId,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [category, setCategory] = useState('');

  // Dropdown selections
  const [selectedPropId, setSelectedPropId] = useState<string>(preselectedPropertyId || '');
  const [selectedE911, setSelectedE911] = useState('');
  const [selectedOnboarding, setSelectedOnboarding] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedPorting, setSelectedPorting] = useState('');

  // Dropdown data
  const [properties, setProperties] = useState<SelectOption[]>([]);
  const [e911Records, setE911Records] = useState<SelectOption[]>([]);
  const [onboardings, setOnboardings] = useState<SelectOption[]>([]);
  const [services, setServices] = useState<SelectOption[]>([]);
  const [portingRequests, setPortingRequests] = useState<SelectOption[]>([]);

  // Attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);

  // UI state
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES = [
    { value: 'PROPS', label: 'Properties' },
    { value: 'E911', label: 'E911' },
    { value: 'ONBOARDING', label: 'Onboarding' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'PORTING', label: 'Porting' },
    { value: 'OTHER', label: 'Other' },
  ];

  useEffect(() => {
    if (preselectedPropertyId) {
      setSelectedPropId(preselectedPropertyId);
    }
  }, [preselectedPropertyId]);

  // Fetch all dropdown data when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingData(true);

    const fetchAll = async () => {
      try {
        // Fetch properties
        const propsRes = await fetch('/api/client/properties?limit=100');
        const propsJson = await propsRes.json();
        if (propsJson.success && propsJson.data) {
          setProperties(
            propsJson.data.map((p: any) => ({
              id: p.id,
              label: `${p.name}${p.city ? ` (${p.city})` : ''}`,
            }))
          );
          if (!selectedPropId && propsJson.data.length > 0) {
            setSelectedPropId(propsJson.data[0].id);
          }
        }

        // Fetch E911 records
        const e911Res = await fetch('/api/client/e911?limit=100');
        const e911Json = await e911Res.json();
        if (e911Json.success && e911Json.data) {
          setE911Records(
            e911Json.data.map((r: any) => ({
              id: r.id,
              label: `${r.emergency_address || r.property_name || 'E911 Record'} — ${r.status}`,
            }))
          );
        }

        // Fetch onboarding records
        const onbRes = await fetch('/api/client/onboarding?limit=100');
        const onbJson = await onbRes.json();
        if (onbJson.success && onbJson.data) {
          setOnboardings(
            onbJson.data.map((o: any) => ({
              id: o.id,
              label: `${o.property_name || 'Onboarding'} — ${o.status?.replace(/_/g, ' ')}`,
            }))
          );
        }

        // Fetch services
        const svcRes = await fetch('/api/client/services?limit=100');
        const svcJson = await svcRes.json();
        if (svcJson.success && svcJson.data) {
          setServices(
            svcJson.data.map((s: any) => ({
              id: s.id,
              label: `${s.phone_number || s.service_type_name || 'Service'} — ${s.status}`,
            }))
          );
        }

        // Fetch porting requests
        const portRes = await fetch('/api/client/porting?limit=100');
        const portJson = await portRes.json();
        if (portJson.success && portJson.data) {
          setPortingRequests(
            portJson.data.map((p: any) => ({
              id: p.id,
              label: `${p.property_name || 'Porting Request'} — ${p.status?.replace(/_/g, ' ')}`,
            }))
          );
        }
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchAll();
  }, [isOpen]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviews]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxRemaining = 3 - attachments.length;
    const filesToAdd = newFiles.slice(0, maxRemaining);

    if (filesToAdd.length < newFiles.length) {
      toast.error('Maximum 3 attachments allowed.');
    }

    const validFiles = filesToAdd.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 5MB limit.`);
        return false;
      }
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name} is not an image file.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setAttachments((prev) => [...prev, ...validFiles]);
    setAttachmentPreviews((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    URL.revokeObjectURL(attachmentPreviews[index]);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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
    if (!category) {
      setError('Please select a category.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build category context with related selections
      const relatedSelections: string[] = [];
      if (selectedPropId) relatedSelections.push(`Property: ${properties.find(p => p.id === selectedPropId)?.label || selectedPropId}`);
      if (selectedE911) relatedSelections.push(`E911: ${e911Records.find(r => r.id === selectedE911)?.label || selectedE911}`);
      if (selectedOnboarding) relatedSelections.push(`Onboarding: ${onboardings.find(o => o.id === selectedOnboarding)?.label || selectedOnboarding}`);
      if (selectedService) relatedSelections.push(`Service: ${services.find(s => s.id === selectedService)?.label || selectedService}`);
      if (selectedPorting) relatedSelections.push(`Porting: ${portingRequests.find(p => p.id === selectedPorting)?.label || selectedPorting}`);

      const formData = new FormData();
      formData.append('property_id', selectedPropId || '');
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('category', CATEGORIES.find(c => c.value === category)?.label || category);
      if (phoneNumber.trim()) {
        formData.append('phone_number', phoneNumber.trim());
      }

      // Append related selections as metadata in the description
      if (relatedSelections.length > 0) {
        formData.set('description', `${description.trim()}\n\n--- Related Items ---\n${relatedSelections.join('\n')}`);
      }

      attachments.forEach((file, i) => {
        formData.append(`attachment_${i}`, file);
      });

      const res = await fetch('/api/client/tickets', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create support ticket.');
      }

      toast.success('Support ticket created successfully. Support team notified.');
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('');
      setPhoneNumber('');
      setPriority('MEDIUM');
      setSelectedE911('');
      setSelectedOnboarding('');
      setSelectedService('');
      setSelectedPorting('');
      setAttachments([]);
      setAttachmentPreviews([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const selectClasses = "w-full px-3 py-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer";
  const labelClasses = "font-semibold text-slate-800 dark:text-slate-200 block text-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 pb-3.5 border-b border-slate-100 dark:border-[#222430] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <LifeBuoy className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Raise New Ticket</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Submit a support request to the AAA Engineering team.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer transition"
              aria-label="Close modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 pt-4">
          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Subject */}
            <div className="space-y-1">
              <label className={labelClasses}>
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Inbound DID routing issue"
                disabled={submitting}
                className={selectClasses}
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className={labelClasses}>
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className={selectClasses}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* All separate dropdowns in 2-column grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Properties Dropdown */}
              <div className="space-y-1">
                <label className={labelClasses}>Property</label>
                <select
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(e.target.value)}
                  disabled={loadingData || submitting}
                  className={selectClasses}
                >
                  <option value="">Select Property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* E911 Dropdown */}
              <div className="space-y-1">
                <label className={labelClasses}>E911</label>
                <select
                  value={selectedE911}
                  onChange={(e) => setSelectedE911(e.target.value)}
                  disabled={loadingData || submitting}
                  className={selectClasses}
                >
                  <option value="">Select E911 Record</option>
                  {e911Records.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Onboarding Dropdown */}
              <div className="space-y-1">
                <label className={labelClasses}>Onboarding</label>
                <select
                  value={selectedOnboarding}
                  onChange={(e) => setSelectedOnboarding(e.target.value)}
                  disabled={loadingData || submitting}
                  className={selectClasses}
                >
                  <option value="">Select Onboarding</option>
                  {onboardings.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Services Dropdown */}
              <div className="space-y-1">
                <label className={labelClasses}>Services</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  disabled={loadingData || submitting}
                  className={selectClasses}
                >
                  <option value="">Select Service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Porting Dropdown */}
              <div className="space-y-1">
                <label className={labelClasses}>Porting</label>
                <select
                  value={selectedPorting}
                  onChange={(e) => setSelectedPorting(e.target.value)}
                  disabled={loadingData || submitting}
                  className={selectClasses}
                >
                  <option value="">Select Porting Request</option>
                  {portingRequests.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className={labelClasses}>Your Phone No.</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 98765 43210"
                  disabled={submitting}
                  className={selectClasses}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className={labelClasses}>Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2 rounded-lg border text-center font-semibold text-[11px] transition cursor-pointer ${
                      priority === p
                        ? p === 'URGENT'
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                          : p === 'HIGH'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                          : p === 'MEDIUM'
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#181920]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className={labelClasses}>
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                disabled={submitting}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none text-xs"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <label className={labelClasses}>
                Attachments <span className="text-slate-400 font-normal">(Max 3 images)</span>
              </label>

              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  className="w-full py-2.5 px-4 border-2 border-dashed border-slate-200 dark:border-[#2a2c3a] rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-600 dark:hover:text-blue-400 transition flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-[#111217]/50"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">
                    Attach Image ({3 - attachments.length} remaining)
                  </span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Preview attached images */}
              {attachments.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group w-16 h-16 rounded-lg border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-100 dark:bg-[#111217]"
                    >
                      <img
                        src={attachmentPreviews[idx]}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-lg"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-0.5 py-px">
                        <p className="text-[7px] text-white truncate">{file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer text-xs"
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
    </div>
  );
};
