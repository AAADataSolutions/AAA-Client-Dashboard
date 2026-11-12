'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './ClientToast';
import { TicketConversationDrawerProps, TabType } from './ticket-drawer/types';
import { getStatusBadge } from './ticket-drawer/helpers';
import { TicketDetailsTab } from './ticket-drawer/TicketDetailsTab';
import { TicketConversationTab } from './ticket-drawer/TicketConversationTab';
import { TicketAttachmentsTab } from './ticket-drawer/TicketAttachmentsTab';
import { TicketImageZoomModal } from './ticket-drawer/TicketImageZoomModal';

export const TicketConversationDrawer: React.FC<TicketConversationDrawerProps> = ({
  ticketId,
  onClose,
  onStatusChange,
}) => {
  const { profile } = useAuth();
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
            {activeTab === 'details' && (
              <TicketDetailsTab
                ticket={ticket}
                attachmentsCount={attachmentsCount}
                commentsCount={commentsCount}
                setActiveTab={setActiveTab}
                onUpdateStatus={handleUpdateStatus}
                updatingStatus={updatingStatus}
              />
            )}

            {activeTab === 'conversation' && (
              <TicketConversationTab
                ticket={ticket}
                profile={profile}
                replyText={replyText}
                setReplyText={setReplyText}
                sending={sending}
                onSendReply={handleSendReply}
                messagesEndRef={messagesEndRef}
              />
            )}

            {activeTab === 'attachments' && (
              <TicketAttachmentsTab
                attachments={ticket.attachments || []}
                onZoomImage={(url, name) => {
                  setZoomedImageUrl(url);
                  setZoomedImageName(name);
                }}
              />
            )}
          </>
        )}

        {/* Client Fullscreen Zoom Image Modal */}
        <TicketImageZoomModal
          zoomedImageUrl={zoomedImageUrl}
          zoomedImageName={zoomedImageName}
          onClose={() => setZoomedImageUrl(null)}
        />
      </div>
    </div>
  );
};
