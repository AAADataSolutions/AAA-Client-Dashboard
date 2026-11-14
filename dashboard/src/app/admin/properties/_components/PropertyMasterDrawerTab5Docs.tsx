'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  FileText,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';

interface PropertyMasterDrawerTab5DocsProps {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  onDataChanged?: () => void;
}

export function PropertyMasterDrawerTab5Docs({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  onDataChanged,
}: PropertyMasterDrawerTab5DocsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  if (drawerTab !== 'PORTING_DOCS') return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setUploadError(null);
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i]);
      }
      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/attachment`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload attachments.');
      }
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (storagePath: string, attId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to remove "${fileName}"?`)) return;
    try {
      setDeletingPath(storagePath || attId);
      const res = await fetch(
        `/api/admin/properties/${selectedPropForDrawer.id}/attachment?storage_path=${encodeURIComponent(
          storagePath || ''
        )}&id=${encodeURIComponent(attId || '')}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove attachment.');
      }
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete attachment.');
    } finally {
      setDeletingPath(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm">Porting Documents &amp; Images</p>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
              LOAs, CSRs, signed contracts, billing copies &amp; attachments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
          </button>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
            {propertyDrawerData?.porting_attachments?.length || 0} File
            {(propertyDrawerData?.porting_attachments?.length || 0) === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs">
          {uploadError}
        </div>
      )}

      {!propertyDrawerData?.porting_attachments || propertyDrawerData.porting_attachments.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-3 text-slate-400">
          <FileText className="w-8 h-8 mx-auto opacity-40" />
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No Porting Documents or Images Attached
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Upload LOAs, utility bills, CSRs or site images for this property.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {propertyDrawerData.porting_attachments.map((att: any, idx: number) => {
            const downloadUrl = `/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
            const isImage =
              (att.mime_type && att.mime_type.startsWith('image/')) ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.file_name || '');
            const sizeKb = att.file_size ? `${(Number(att.file_size) / 1024).toFixed(1)} KB` : '';

            return (
              <div
                key={att.id || att.storage_path || idx}
                className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl space-y-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800/60 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {att.file_name || 'Porting Attachment'}
                      </p>
                      <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300 font-semibold uppercase text-[9.5px]">
                          {isImage ? 'IMAGE' : 'DOCUMENT / PDF'}
                        </span>
                        {sizeKb && <span>• {sizeKb}</span>}
                        {att.created_at && <span>• {new Date(att.created_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={att.file_name || true}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.storage_path, att.id, att.file_name)}
                      disabled={deletingPath === att.storage_path || deletingPath === att.id}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove Attachment"
                    >
                      {deletingPath === att.storage_path || deletingPath === att.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isImage && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] max-h-60 flex items-center justify-center p-2">
                    <img
                      src={downloadUrl}
                      alt={att.file_name || 'Porting Image'}
                      className="max-h-56 w-auto object-contain rounded"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
