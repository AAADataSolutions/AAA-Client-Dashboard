'use client';

import React from 'react';
import { Paperclip, FileImage, Maximize2, Download } from 'lucide-react';
import { TicketDetailData, formatFileSize } from './types';

interface TicketAttachmentsTabProps {
  data: TicketDetailData;
  onZoomImage: (url: string, name: string) => void;
}

export default function TicketAttachmentsTab({ data, onZoomImage }: TicketAttachmentsTabProps) {
  const attachmentsCount = data.attachments?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {attachmentsCount === 0 ? (
        <div className="py-16 text-center">
          <Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No Attachments</p>
          <p className="text-xs text-slate-400 mt-1">No screenshots were uploaded with this ticket.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {attachmentsCount} Image Attachment{attachmentsCount !== 1 ? 's' : ''}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(data.attachments || []).map((att) => (
              <div
                key={att.id}
                className="rounded-xl border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-50 dark:bg-[#111217] shadow-xs group"
              >
                <div
                  onClick={() => {
                    if (att.url) {
                      onZoomImage(att.url, att.file_name);
                    }
                  }}
                  className="aspect-video bg-slate-100 dark:bg-[#16171d] relative cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {att.url ? (
                    <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  ) : (
                    <FileImage className="w-8 h-8 text-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2">
                    <span className="text-xs font-semibold flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg">
                      <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                    </span>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between bg-white dark:bg-[#15161c]">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.file_name}</p>
                    <p className="text-[10.5px] text-slate-400">{formatFileSize(att.file_size)}</p>
                  </div>
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer shrink-0"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
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
