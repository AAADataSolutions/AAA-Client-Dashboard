import React from 'react';
import { Paperclip, FileImage, Maximize2, Download } from 'lucide-react';
import { formatFileSize } from './helpers';

interface TicketAttachmentsTabProps {
  attachments: any[];
  onZoomImage: (url: string, name: string) => void;
}

export function TicketAttachmentsTab({
  attachments,
  onZoomImage,
}: TicketAttachmentsTabProps) {
  const attachmentsCount = attachments?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {attachmentsCount === 0 ? (
        <div className="py-12 text-center">
          <Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No Attachments</p>
          <p className="text-xs text-slate-400 mt-1">No files have been attached to this ticket.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              {attachmentsCount} Attachment{attachmentsCount !== 1 ? 's' : ''}
            </h4>
          </div>

          {/* Attachment Grid */}
          <div className="grid grid-cols-2 gap-3">
            {attachments.map((att: any) => (
              <div key={att.id} className="rounded-xl border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-white dark:bg-[#111217] group">
                <div
                  onClick={() => {
                    if (att.url) {
                      onZoomImage(att.url, att.file_name);
                    }
                  }}
                  className="aspect-video bg-slate-100 dark:bg-[#1a1c24] relative cursor-pointer overflow-hidden"
                >
                  {att.url ? (
                    <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                    <span className="text-[11px] font-medium flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md">
                      <Maximize2 className="w-3 h-3" /> Enlarge
                    </span>
                  </div>
                </div>
                <div className="p-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{att.file_name}</p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                  </div>
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
