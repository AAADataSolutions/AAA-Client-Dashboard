'use client';

import React from 'react';
import { User, Mail, Phone, Tag, Hotel, Paperclip, FileImage, Maximize2 } from 'lucide-react';
import { TicketPriority, TicketDetailData, getPriorityBadge } from './types';

interface TicketDetailsTabProps {
  data: TicketDetailData;
  activeTicketId: string;
  onUpdatePriority: (ticketId: string, priority: TicketPriority) => void;
  onSwitchToAttachments: () => void;
  onZoomImage: (url: string, name: string) => void;
}

export default function TicketDetailsTab({
  data,
  activeTicketId,
  onUpdatePriority,
  onSwitchToAttachments,
  onZoomImage,
}: TicketDetailsTabProps) {
  const attachmentsCount = data.attachments?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
      {/* Customer & Organization Info Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-600" />
          <span>Client &amp; Contact Details</span>
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Organization</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
              {data.organization_name}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Reported By</span>
            <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
              {data.created_by_name}
            </span>
            {data.created_by_email && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" /> {data.created_by_email}
              </span>
            )}
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Contact Phone No.</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-500" />
              {data.created_by_phone || data.related_items?.['Your Phone No.'] || 'Not provided'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Assigned Staff</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
              {data.assigned_to_name}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Meta & Priority Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-blue-600" />
          <span>Category &amp; Classification</span>
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Ticket Category</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-200/70 dark:bg-[#20222a] text-slate-800 dark:text-slate-200 mt-1">
              {data.category}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Priority Level</span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={data.priority}
                onChange={(e) => onUpdatePriority(activeTicketId, e.target.value as TicketPriority)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${getPriorityBadge(data.priority)}`}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Created Timestamp</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs block mt-0.5">
              {new Date(data.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 text-[10.5px] block font-medium">Last Activity</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs block mt-0.5">
              {new Date(data.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Associated Operational Items Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Hotel className="w-3.5 h-3.5 text-blue-600" />
          <span>Associated Client Resources</span>
        </h4>

        <div className="space-y-2.5">
          <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Hospitality Property:</span>
            <span className="font-bold text-slate-900 dark:text-white text-right">
              {data.property_name} {data.property_location ? `(${data.property_location})` : ''}
            </span>
          </div>

          {data.related_items?.['E911'] && (
            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">E911 Record:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {data.related_items['E911']}
              </span>
            </div>
          )}

          {data.related_items?.['Onboarding'] && (
            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Onboarding Pipeline:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {data.related_items['Onboarding']}
              </span>
            </div>
          )}

          {data.related_items?.['Service'] && (
            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Telecom Line / DID:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {data.related_items['Service']}
              </span>
            </div>
          )}

          {data.related_items?.['Porting'] && (
            <div className="flex items-start justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Porting Request:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {data.related_items['Porting']}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-2">
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Issue Description
        </h4>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {data.clean_description || 'No description entered.'}
        </p>
      </div>

      {/* Attachments Preview */}
      {attachmentsCount > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
              <span>Attached Screenshots ({attachmentsCount})</span>
            </h4>
            <button
              onClick={onSwitchToAttachments}
              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(data.attachments || []).map((att) => (
              <div
                key={att.id}
                onClick={() => {
                  if (att.url) {
                    onZoomImage(att.url, att.file_name);
                  }
                }}
                className="w-20 h-20 rounded-lg border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-100 dark:bg-[#15161c] relative group cursor-pointer"
              >
                {att.url ? (
                  <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
