'use client';

import React from 'react';
import {
  FileText,
  Download,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

interface PortingAttachment {
  id?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  created_at?: string;
}

interface PropertyPortingDocsTabProps {
  attachments: PortingAttachment[];
}

export function PropertyPortingDocsTab({ attachments = [] }: PropertyPortingDocsTabProps) {
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              Porting Documents &amp; Attachments
            </p>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
              LOAs, CSRs, signed cutover paperwork &amp; site documentation
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
          {safeAttachments.length} {safeAttachments.length === 1 ? 'Document' : 'Documents'}
        </span>
      </div>

      {safeAttachments.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-2 text-slate-400">
          <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
            No Porting Documents Attached
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Porting LOAs, carrier CSRs, and execution agreements will appear here once uploaded by operations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeAttachments.map((att, idx) => {
            const downloadUrl = `/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
            const isImage =
              (att.mime_type && att.mime_type.startsWith('image/')) ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.file_name || '');
            const sizeKb = att.file_size ? `${(Number(att.file_size) / 1024).toFixed(1)} KB` : '';

            return (
              <div
                key={att.id || att.storage_path || idx}
                className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200/80 dark:border-[#222430] rounded-xl space-y-2.5 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800/60 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                      {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {att.file_name || 'Porting_Attachment.pdf'}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300 font-semibold uppercase text-[9px]">
                          {isImage ? 'IMAGE' : 'DOCUMENT / PDF'}
                        </span>
                        {sizeKb && <span>• {sizeKb}</span>}
                        {att.created_at && (
                          <span>• {new Date(att.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={att.file_name || true}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>

                {isImage && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block rounded-lg overflow-hidden border border-slate-200 dark:border-[#222430] max-h-48 bg-slate-50 dark:bg-[#111217]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={downloadUrl}
                        alt={att.file_name || 'Porting preview'}
                        className="w-full h-auto max-h-48 object-contain mx-auto"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <span>Open Full Size</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </a>
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

