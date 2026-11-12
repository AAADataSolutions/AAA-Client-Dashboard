import React from 'react';
import {
  Hash,
  User,
  Tag,
  Phone,
  ArrowUpRight,
  Building2,
  Shield,
  Calendar,
  Layers,
  Clock,
  Radio,
  FileText,
  FileImage,
  Check,
} from 'lucide-react';
import { getStatusBadge, getPriorityDisplay, formatFileSize } from './helpers';
import { TabType } from './types';

interface TicketDetailsTabProps {
  ticket: any;
  attachmentsCount: number;
  commentsCount: number;
  setActiveTab: (tab: TabType) => void;
  onUpdateStatus: (newStatus: 'RESOLVED' | 'CLOSED' | 'OPEN') => void;
  updatingStatus: boolean;
}

export function TicketDetailsTab({
  ticket,
  attachmentsCount,
  commentsCount,
  setActiveTab,
  onUpdateStatus,
  updatingStatus,
}: TicketDetailsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Ticket Title */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222430]">
        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
          {ticket.subject}
        </h3>
        <p className="text-[11px] text-slate-400 mt-1">
          Created on {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Info Grid */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222430]">
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
          <div className="flex items-start gap-2">
            <Hash className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Ticket ID</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.ticket_number}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Reported By</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.creator?.full_name || 'Client User'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Category</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.category || 'General'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Phone Number</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.creator?.phone_number || '—'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Priority</p>
              {getPriorityDisplay(ticket.priority)}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Property</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{ticket.organization_property?.property?.name || 'General'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Status</p>
              {getStatusBadge(ticket.status)}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-400 text-[11px] font-medium">Created On</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Client Resources if linked */}
      {ticket.related_items && Object.keys(ticket.related_items).length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222430] bg-blue-50/30 dark:bg-blue-950/10">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Associated Resources
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {ticket.related_items.property && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#2a2c3a] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Property</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.related_items.property}</p>
                </div>
              </div>
            )}
            {ticket.related_items.e911 && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#2a2c3a] flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">E911 Record</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.related_items.e911}</p>
                </div>
              </div>
            )}
            {ticket.related_items.onboarding && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#2a2c3a] flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Onboarding Pipeline</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.related_items.onboarding}</p>
                </div>
              </div>
            )}
            {ticket.related_items.service && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#2a2c3a] flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Telecom Line / DID</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.related_items.service}</p>
                </div>
              </div>
            )}
            {ticket.related_items.porting && (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#2a2c3a] flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Porting Request</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{ticket.related_items.porting}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222430]">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2">Description</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {ticket.clean_description || ticket.description}
        </p>
      </div>

      {/* Quick Attachments Preview */}
      {attachmentsCount > 0 && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              Attachments ({attachmentsCount})
            </h4>
            <button
              onClick={() => setActiveTab('attachments')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(ticket.attachments || []).slice(0, 3).map((att: any) => (
              <div key={att.id} className="w-20 h-20 rounded-lg border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-100 dark:bg-[#111217] relative group">
                {att.url ? (
                  <img src={att.url} alt={att.file_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-slate-300" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <p className="text-[7px] text-white truncate">{att.file_name}</p>
                  <p className="text-[7px] text-slate-300">{formatFileSize(att.file_size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Conversation Preview */}
      {commentsCount > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">
              Recent Conversation
            </h4>
            <button
              onClick={() => setActiveTab('conversation')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              View All ({commentsCount})
            </button>
          </div>
          <div className="space-y-3">
            {(ticket.comments || []).slice(-2).map((comment: any) => {
              const isStaff = comment.author?.role === 'SUPER_ADMIN' || comment.author?.role === 'SUB_SUPER_ADMIN';
              return (
                <div key={comment.id} className="flex gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    isStaff ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400' : 'bg-slate-100 text-slate-600 dark:bg-[#222430] dark:text-slate-300'
                  }`}>
                    {(comment.author?.full_name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{comment.author?.full_name || 'User'}</span>
                      {isStaff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold">AAA Support</span>}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Actions */}
      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-[#222430]">
          <button
            onClick={() => onUpdateStatus('RESOLVED')}
            disabled={updatingStatus}
            className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Mark as Resolved
          </button>
        </div>
      )}
    </div>
  );
}
