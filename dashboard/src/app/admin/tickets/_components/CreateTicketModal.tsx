'use client';

import React, { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LifeBuoy, X, Paperclip, Loader2 } from 'lucide-react';
import { PropertyOption, TicketPriority } from './types';

interface CreateTicketModalProps {
  show: boolean;
  onClose: () => void;
  propertyList: PropertyOption[];
  onSuccess: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CreateTicketModal({
  show,
  onClose,
  propertyList,
  onSuccess,
  showToast,
}: CreateTicketModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createForm, setCreateForm] = useState({
    subject: '',
    phone_number: '',
    property_id: '',
    priority: 'MEDIUM' as TicketPriority,
    description: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const resetForm = () => {
    setCreateForm({
      subject: '',
      phone_number: '',
      property_id: '',
      priority: 'MEDIUM',
      description: '',
    });
    attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    setAttachments([]);
    setAttachmentPreviews([]);
    setCreateError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Attachment Handler (Max 3 Images)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxRemaining = 3 - attachments.length;
    const filesToAdd = newFiles.slice(0, maxRemaining);

    if (filesToAdd.length < newFiles.length) {
      showToast('Attachment Limit', 'Maximum 3 image attachments allowed.', 'error');
    }

    const validFiles = filesToAdd.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        showToast('File Too Large', `${f.name} exceeds 5MB limit.`, 'error');
        return false;
      }
      if (!f.type.startsWith('image/')) {
        showToast('Invalid Type', `${f.name} is not an image file.`, 'error');
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim()) {
      setCreateError('Subject is required');
      return;
    }
    if (!createForm.description.trim()) {
      setCreateError('Description is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append('subject', createForm.subject.trim());
      formData.append('description', createForm.description.trim());
      formData.append('priority', createForm.priority);
      formData.append('status', 'OPEN');
      if (createForm.phone_number.trim()) {
        formData.append('phone_number', createForm.phone_number.trim());
      }
      if (createForm.property_id) {
        formData.append('property_id', createForm.property_id);
      }

      attachments.forEach((file, i) => {
        formData.append(`attachment_${i}`, file);
      });

      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create ticket');
      }

      showToast('Success', 'Support ticket created successfully', 'success');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create ticket');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Raise Support Ticket</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* 1. Subject */}
              <div>
                <label className="font-bold text-black dark:text-white block mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.subject}
                  onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                  placeholder="e.g. Inbound DID routing issue"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 2-column row: Your Phone No. & Property */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Your Phone No.</label>
                  <input
                    type="tel"
                    value={createForm.phone_number}
                    onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                    placeholder="+1 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Property</label>
                  <select
                    value={createForm.property_id}
                    onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Property</option>
                    {propertyList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.organization_name ? `(${p.organization_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Priority */}
              <div>
                <label className="font-bold text-black dark:text-white block mb-1">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setCreateForm({ ...createForm, priority: p })}
                      className={`py-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                        createForm.priority === p
                          ? p === 'URGENT'
                            ? 'bg-rose-50 text-rose-600 border-rose-500 shadow-xs'
                            : p === 'HIGH'
                            ? 'bg-amber-50 text-amber-600 border-amber-500 shadow-xs'
                            : p === 'MEDIUM'
                            ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-xs'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-xs'
                          : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Description */}
              <div>
                <label className="font-bold text-black dark:text-white block mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Provide details of the issue, affected numbers, error messages..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 5. Attachments */}
              <div className="space-y-1.5">
                <label className="font-bold text-black dark:text-white block text-xs">
                  Attachments <span className="text-slate-400 font-normal">(Max 3 images)</span>
                </label>

                {attachments.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={createLoading}
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

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
