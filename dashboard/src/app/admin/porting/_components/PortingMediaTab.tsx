'use client';

import React from 'react';
import {
  Download,
  X,
  Loader2,
  Trash2,
  Upload,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { formatFileSize } from './portingTypes';

interface PortingMediaTabProps {
  existingAttachments: any[];
  modalNewFiles: File[];
  setModalNewFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleDownloadAttachment: (att: any) => void;
  handleDeleteAttachment: (storagePath: string) => void;
  uploadingFiles: boolean;
  handleSaveMediaSubmit: () => void;
}

export function PortingMediaTab({
  existingAttachments,
  modalNewFiles,
  setModalNewFiles,
  handleDownloadAttachment,
  handleDeleteAttachment,
  uploadingFiles,
  handleSaveMediaSubmit,
}: PortingMediaTabProps) {
  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" /> Attached PDFs &amp; Images
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            View, download, delete, and upload LOA, CSR, contracts, and property documents.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] font-semibold text-slate-700 dark:text-slate-300">
          {existingAttachments.length} Total File{existingAttachments.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Upload Dropzone */}
      <div className="border border-dashed border-indigo-200 dark:border-indigo-800/80 rounded-xl p-5 bg-indigo-50/20 dark:bg-indigo-950/10 text-center hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition">
        <input
          type="file"
          multiple
          id="media-tab-file-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              setModalNewFiles((prev) => [
                ...prev,
                ...Array.from(e.target.files || []),
              ]);
            }
          }}
        />
        <label
          htmlFor="media-tab-file-input"
          className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
            Click to upload new PDFs or Images
          </span>
          <span className="text-[10px] text-slate-400">
            Supports PDF, PNG, JPG, JPEG, WEBP, DOCX, CSV (Max 25MB each)
          </span>
        </label>
      </div>

      {/* New Files Staged for Save */}
      {modalNewFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Files Ready to Upload ({modalNewFiles.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {modalNewFiles.map((file, idx) => {
              const isPdf = file.name.toLowerCase().endsWith('.pdf');
              return (
                <div
                  key={idx}
                  className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isPdf ? (
                      <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing Files Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Saved Documents &amp; Media ({existingAttachments.length})
        </span>

        {existingAttachments.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430]">
            <Paperclip className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
            <p>No documents or images attached yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {existingAttachments.map((att, i) => {
              const isPdf = att.file_name?.toLowerCase().endsWith('.pdf') || att.mime_type === 'application/pdf';
              const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(att.file_name || '') || att.mime_type?.startsWith('image/');

              return (
                <div
                  key={att.storage_path || i}
                  className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-800/80 transition"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isPdf ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' :
                      isImg ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600' :
                      'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                    }`}>
                      {isPdf ? <FileText className="w-4 h-4" /> : isImg ? <ImageIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                        {att.file_name}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition"
                      title="View / Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.storage_path)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Media Button */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
        <button
          type="button"
          onClick={handleSaveMediaSubmit}
          disabled={uploadingFiles}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {uploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Attachments</span>
        </button>
      </div>
    </div>
  );
}
