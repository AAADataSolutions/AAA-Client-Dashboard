'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  LifeBuoy,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Clock,
  Building2,
  AlertCircle,
  Check,
  Tag,
  Phone,
  Calendar,
  Hash,
  ArrowUpRight,
  Download,
  FileImage,
  Shield,
  Paperclip,
  Layers,
  Radio,
  FileText,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './ClientToast';

interface TicketConversationDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

type TabType = 'details' | 'conversation' | 'attachments';

export const TicketConversationDrawer: React.FC<TicketConversationDrawerProps> = ({
  ticketId,
  onClose,
  onStatusChange,
}) => {
  const { profile, effectiveRole } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomedImageName, setZoomedImageName] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/client/tickets/${ticketId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load ticket details.');
      }
      setTicket(json.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      setActiveTab('details');
      fetchTicketDetails();
    }
  }, [ticketId]);

  useEffect(() => {
    if (activeTab === 'conversation') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [ticket?.comments, activeTab]);

  if (!ticketId) return null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/client/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send reply');
      }

      setReplyText('');
      toast.success('Reply posted.');
      await fetchTicketDetails();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'RESOLVED' | 'CLOSED' | 'OPEN') => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/client/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update status');
      }

      toast.success(`Ticket marked as ${newStatus.toLowerCase()}.`);
      await fetchTicketDetails();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
      IN_PROGRESS: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      WAITING_ON_CLIENT: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900/40',
      RESOLVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
      CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200 dark:border-slate-700/40',
    };
    const dotColors: Record<string, string> = {
      OPEN: 'bg-blue-500',
      IN_PROGRESS: 'bg-amber-500',
      WAITING_ON_CLIENT: 'bg-purple-500',
      RESOLVED: 'bg-emerald-500',
      CLOSED: 'bg-slate-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${styles[status] || styles.OPEN}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.OPEN}`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityDisplay = (priority: string) => {
    const config: Record<string, { color: string; icon: string }> = {
      URGENT: { color: 'text-rose-600 dark:text-rose-400', icon: '🔴' },
      HIGH: { color: 'text-amber-600 dark:text-amber-400', icon: '🟠' },
      MEDIUM: { color: 'text-blue-600 dark:text-blue-400', icon: '🔵' },
      LOW: { color: 'text-emerald-600 dark:text-emerald-400', icon: '🟢' },
    };
    const c = config[priority] || config.MEDIUM;
    return (
      <span className={`font-semibold text-xs ${c.color} flex items-center gap-1`}>
        <span className="text-[10px]">{c.icon}</span> {priority}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const commentsCount = ticket?.comments?.length || 0;
  const attachmentsCount = ticket?.attachments?.length || 0;

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'details', label: 'Details' },
    { key: 'conversation', label: 'Conversation', count: commentsCount },
    { key: 'attachments', label: 'Attachments', count: attachmentsCount },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Top Header */}
        <div className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Ticket #{ticket?.ticket_number || ticketId?.substring(0, 8)}
              </span>
              {ticket && getStatusBadge(ticket.status)}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200/80 dark:border-[#222430]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-semibold transition-colors relative cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-[#222430] dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-medium">Loading ticket details...</p>
          </div>
        ) : error || !ticket ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load ticket</p>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : (
          <>
            {/* ===== DETAILS TAB ===== */}
            {activeTab === 'details' && (
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
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      disabled={updatingStatus}
                      className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ===== CONVERSATION TAB ===== */}
            {activeTab === 'conversation' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Initial ticket message */}
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#222430] flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {(ticket.creator?.full_name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10.5px] mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{ticket.creator?.full_name || 'Client User'}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-[#1f212c] border border-slate-200/60 dark:border-[#2a2c3a] text-xs leading-relaxed text-slate-900 dark:text-slate-100">
                        <p className="whitespace-pre-wrap">{ticket.clean_description || ticket.description}</p>
                      </div>
                    </div>
                  </div>

                  {(ticket.comments || []).length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <p>No replies yet. Send a message below to communicate with support.</p>
                    </div>
                  )}

                  {(ticket.comments || []).map((comment: any) => {
                    const isSelf = comment.author?.id === profile?.id;
                    const isStaff = comment.author?.role === 'SUPER_ADMIN' || comment.author?.role === 'SUB_SUPER_ADMIN';

                    return (
                      <div key={comment.id} className="flex gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          isStaff
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-[#222430] dark:text-slate-300'
                        }`}>
                          {isStaff ? 'A' : (comment.author?.full_name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[10.5px] mb-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {isSelf ? 'You' : comment.author?.full_name || 'Support Staff'}
                            </span>
                            {isStaff && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/40">
                                AAA Support
                              </span>
                            )}
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">
                              {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isStaff
                              ? 'rounded-tl-none bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-slate-900 dark:text-slate-100'
                              : isSelf
                              ? 'rounded-tr-none bg-slate-100 dark:bg-[#1f212c] border border-slate-200/60 dark:border-[#2a2c3a] text-slate-900 dark:text-slate-100'
                              : 'rounded-tl-none bg-slate-100 dark:bg-[#1f212c] border border-slate-200/60 dark:border-[#2a2c3a] text-slate-900 dark:text-slate-100'
                          }`}>
                            <p className="whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Box */}
                <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217]/70 shrink-0">
                  {ticket.status === 'CLOSED' ? (
                    <div className="p-3 text-center rounded-xl bg-slate-100 dark:bg-[#1c1d25] text-slate-500 text-xs">
                      This ticket has been marked as <strong>Closed</strong>. Raise a new ticket if further assistance is needed.
                    </div>
                  ) : (
                    <form onSubmit={handleSendReply} className="flex items-end gap-2">
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        disabled={sending}
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(e);
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sending || !replyText.trim()}
                        className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ===== ATTACHMENTS TAB ===== */}
            {activeTab === 'attachments' && (
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
                      {(ticket.attachments || []).map((att: any) => (
                        <div key={att.id} className="rounded-xl border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-white dark:bg-[#111217] group">
                          <div
                            onClick={() => {
                              if (att.url) {
                                setZoomedImageUrl(att.url);
                                setZoomedImageName(att.file_name);
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
            )}
          </>
        )}

        {/* Client Fullscreen Zoom Image Modal */}
        {zoomedImageUrl && (
          <div
            onClick={() => setZoomedImageUrl(null)}
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-default"
            >
              <div className="p-3.5 bg-black/50 flex items-center justify-between text-white border-b border-white/10">
                <span className="text-xs font-semibold truncate max-w-sm">{zoomedImageName}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button
                    onClick={() => setZoomedImageUrl(null)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center overflow-auto bg-black/30">
                <img src={zoomedImageUrl} alt={zoomedImageName} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
