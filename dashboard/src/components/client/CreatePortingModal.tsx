'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  ArrowLeftRight,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
  Trash2,
  Building2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from './ClientToast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

interface CreatePortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AttachedFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

export const CreatePortingModal: React.FC<CreatePortingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [propertyName, setPropertyName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyPhone, setPropertyPhone] = useState('');
  const [fax, setFax] = useState('');
  const [carrierDetails, setCarrierDetails] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const pdfCount = attachedFiles.filter(
    (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  ).length;
  const imgCount = attachedFiles.filter(
    (f) => f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name)
  ).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    let curPdfs = pdfCount;
    let curImgs = imgCount;

    const accepted: AttachedFile[] = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File "${f.name}" exceeds the 10MB limit.`);
        continue;
      }
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImg = f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name);

      if (!isPdf && !isImg) {
        toast.error(`File "${f.name}" is not supported. Only PDF and image files are allowed.`);
        continue;
      }

      if (isPdf) {
        if (curPdfs >= 2) {
          toast.error('Maximum 2 PDF documents allowed.');
          continue;
        }
        curPdfs++;
      } else if (isImg) {
        if (curImgs >= 2) {
          toast.error('Maximum 2 image files allowed.');
          continue;
        }
        curImgs++;
      }

      accepted.push({
        file: f,
        name: f.name,
        size: f.size,
        type: f.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
      });
    }

    setAttachedFiles((prev) => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim() || !propertyPhone.trim()) {
      setError('Property Name and Main Phone to Port are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    try {
      // 1. Upload attachments to 'porting-attachments' bucket if any
      const uploadedAttachments: { file_name: string; file_size: number; mime_type: string; storage_path: string }[] = [];

      for (let i = 0; i < attachedFiles.length; i++) {
        const item = attachedFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${attachedFiles.length}: ${item.name}...`);

        const cleanName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user?.id || 'anon'}/${Date.now()}_${cleanName}`;

        const { error: uploadErr } = await supabase.storage
          .from('porting-attachments')
          .upload(storagePath, item.file, {
            contentType: item.type,
            upsert: false,
          });

        if (uploadErr) {
          console.error('Failed to upload file to storage:', uploadErr);
          throw new Error(`Failed to upload ${item.name}: ${uploadErr.message}`);
        }

        uploadedAttachments.push({
          file_name: item.name,
          file_size: item.size,
          mime_type: item.type,
          storage_path: storagePath,
        });
      }

      setUploadProgress('Finalizing porting request...');

      // 2. Submit porting request
      const res = await fetch('/api/client/porting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_name: propertyName.trim(),
          property_address: propertyAddress.trim() || null,
          property_phone: propertyPhone.trim(),
          fax: fax.trim() || null,
          carrier_details: carrierDetails.trim() || null,
          attachments: uploadedAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit porting request.');
      }

      toast.success('Porting request submitted! An email alert has been sent to support@aaadatasolutions.com.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
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
                Submit phone numbers and carrier documentation for property migration.
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Property Name */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Property Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Austin Grand Hotel & Conference Center"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs"
            />
          </div>

          {/* Property Address */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Property Street Address
            </label>
            <input
              type="text"
              placeholder="e.g. 100 Congress Ave, Austin, TX 78701"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs"
            />
          </div>

          {/* Phone & Fax Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Main Phone to Port <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +1 512-555-0100"
                value={propertyPhone}
                onChange={(e) => setPropertyPhone(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Fax Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. +1 512-555-0199"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Carrier Details */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Current Carrier Details &amp; Account Info
            </label>
            <textarea
              rows={2}
              placeholder="Current Carrier (e.g. AT&T / Spectrum), Billing Account Number, PIN / Passcode, Authorized Contact Name..."
              value={carrierDetails}
              onChange={(e) => setCarrierDetails(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500 text-xs resize-none"
            />
          </div>

          {/* Attachments Upload (LOA, Phone Bills) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800 dark:text-slate-200">
                Porting Attachments (LOA &amp; Phone Bills)
              </label>
              <span className="text-[10px] text-slate-400">
                PDFs ({pdfCount}/2) &bull; Images ({imgCount}/2) &bull; Max 10MB
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
              className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-[#282a36] hover:border-purple-500 dark:hover:border-purple-500 rounded-xl bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="font-semibold text-xs">Choose Files (LOA, Recent Carrier Invoice)</span>
            </button>

            {/* Attached files list */}
            {attachedFiles.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-[#181a24] border border-slate-200/80 dark:border-[#242634] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#181a24] text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{uploadProgress || 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Submit Porting Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
