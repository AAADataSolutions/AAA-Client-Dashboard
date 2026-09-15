'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  LifeBuoy,
  Send,
  Loader2,
  CheckCircle2,
  Lock,
  User,
  Clock,
  Building2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './ClientToast';

interface TicketConversationDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
}

export const TicketConversationDrawer: React.FC<TicketConversationDrawerProps> = ({
  ticketId,
  onClose,
  onStatusChange,
}) => {
  const { profile, effectiveRole } = useAuth();
  const toast = useToast();
  const isClientAdmin = effectiveRole === 'ADMIN';

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.comments]);

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold">
                  #{ticketId.substring(0, 8)}
                </span>
                {ticket && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                        : ticket.status === 'WAITING_ON_CLIENT'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                    }`}
                  >
                    {ticket.status}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {ticket?.subject || 'Loading ticket conversation...'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ticket && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                disabled={updatingStatus}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark Resolved
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 font-medium">Loading ticket messages...</p>
          </div>
        ) : error || !ticket ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load ticket</p>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Ticket Info Card */}
            <div className="p-4 bg-slate-50/70 dark:bg-[#181920] border-b border-slate-200/80 dark:border-[#222430] text-xs space-y-2 shrink-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Property</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {ticket.organization_property?.property?.name || 'General Property'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Priority</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    {ticket.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Reported By</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {ticket.creator?.full_name || 'Client User'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Opened Date</span>
                  <span className="text-slate-800 dark:text-slate-200 block">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-[#262833]">
                <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Message Thread Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white dark:bg-[#15161c]">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 dark:bg-[#1a1b24] px-3 py-1 rounded-full border border-slate-200/60 dark:border-[#262833]">
                  Conversation History
                </span>
              </div>

              {(ticket.comments || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <p>No replies yet. Send a message below to communicate directly with support engineering.</p>
                </div>
              ) : (
                ticket.comments.map((comment: any) => {
                  const isSelf = comment.author?.id === profile?.id;
                  const isStaff =
                    comment.author?.role === 'SUPER_ADMIN' ||
                    comment.author?.role === 'SUB_SUPER_ADMIN';

                  return (
                    <div
                      key={comment.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {isSelf ? 'You' : comment.author?.full_name || 'Support Staff'}
                        </span>
                        {isStaff && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-900/40">
                            AAA Support
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isSelf
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-[#1f212c] text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-[#2a2c3a]'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
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
                    placeholder="Type your response to the engineering team..."
                    disabled={sending}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden resize-none"
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
      </div>
    </div>
  );
};
