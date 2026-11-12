'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { TicketPriority, TicketStatus, TicketDetailData, getStatusBadge } from './types';
import TicketDetailsTab from './TicketDetailsTab';
import TicketConversationTab from './TicketConversationTab';
import TicketAttachmentsTab from './TicketAttachmentsTab';
import ZoomImageModal from './ZoomImageModal';
import { TicketItem } from '@/store/slices/ticketsSlice';

interface TicketConversationDrawerProps {
  activeTicketId: string | null;
  drawerTicketData: TicketDetailData | null;
  drawerLoading: boolean;
  updatingTicketStatus: boolean;
  profile: any;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  onUpdatePriority: (ticketId: string, priority: TicketPriority) => void;
  onRequestDelete: (ticket: TicketItem) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  replyIsInternal: boolean;
  setReplyIsInternal: (isInternal: boolean) => void;
  replyNextStatus: string;
  setReplyNextStatus: (status: string) => void;
  sendingReply: boolean;
  onSendReply: (e: React.FormEvent) => void;
}

export default function TicketConversationDrawer({
  activeTicketId,
  drawerTicketData,
  drawerLoading,
  updatingTicketStatus,
  profile,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onRequestDelete,
  replyText,
  setReplyText,
  replyIsInternal,
  setReplyIsInternal,
  replyNextStatus,
  setReplyNextStatus,
  sendingReply,
  onSendReply,
}: TicketConversationDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<'details' | 'conversation' | 'attachments'>('details');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomedImageName, setZoomedImageName] = useState<string>('');

  const commentsCount = drawerTicketData?.comments?.length || 0;
  const attachmentsCount = drawerTicketData?.attachments?.length || 0;

  const handleZoomImage = (url: string, name: string) => {
    setZoomedImageUrl(url);
    setZoomedImageName(name);
  };

  return (
    <>
      <AnimatePresence>
        {activeTicketId && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 overflow-hidden"
            >
              {/* Drawer Top Bar */}
              <div className="px-6 pt-5 pb-0 border-b border-slate-100 dark:border-[#222430] shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                      {drawerTicketData?.display_id || `TCK-${activeTicketId.substring(0, 8).toUpperCase()}`}
                    </span>
                    {drawerTicketData && getStatusBadge(drawerTicketData.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Live Quick Status Changer */}
                    {drawerTicketData && (
                      <select
                        value={drawerTicketData.status}
                        onChange={(e) => onUpdateStatus(activeTicketId, e.target.value as TicketStatus)}
                        disabled={updatingTicketStatus}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#2a2c3a] bg-white dark:bg-[#1a1c24] text-slate-800 dark:text-slate-200 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_ON_CLIENT">Waiting On Client</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    )}

                    <button
                      onClick={() => {
                        if (drawerTicketData) {
                          onRequestDelete(drawerTicketData as unknown as TicketItem);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onClose}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#222430] transition cursor-pointer"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Ticket Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-1 truncate">
                  {drawerTicketData?.subject || 'Ticket Details'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <span>{drawerTicketData?.organization_name}</span>
                  <span>•</span>
                  <span>{drawerTicketData?.property_name}</span>
                </p>

                {/* Tabs */}
                <div className="flex border-b border-slate-200/80 dark:border-[#222430]">
                  <button
                    onClick={() => setDrawerTab('details')}
                    className={`px-4 py-2.5 text-xs font-semibold transition relative cursor-pointer ${
                      drawerTab === 'details'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Ticket Details
                    {drawerTab === 'details' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setDrawerTab('conversation')}
                    className={`px-4 py-2.5 text-xs font-semibold transition relative cursor-pointer flex items-center gap-1.5 ${
                      drawerTab === 'conversation'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>Conversation / Chat</span>
                    {commentsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        {commentsCount}
                      </span>
                    )}
                    {drawerTab === 'conversation' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setDrawerTab('attachments')}
                    className={`px-4 py-2.5 text-xs font-semibold transition relative cursor-pointer flex items-center gap-1.5 ${
                      drawerTab === 'attachments'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>Attachments</span>
                    {attachmentsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-100 text-slate-600 dark:bg-[#222430] dark:text-slate-400">
                        {attachmentsCount}
                      </span>
                    )}
                    {drawerTab === 'attachments' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                    )}
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              {drawerLoading && !drawerTicketData ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <p className="text-xs text-slate-400 font-medium">Fetching ticket &amp; client information...</p>
                </div>
              ) : !drawerTicketData ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Ticket data unavailable</p>
                </div>
              ) : (
                <>
                  {drawerTab === 'details' && (
                    <TicketDetailsTab
                      data={drawerTicketData}
                      activeTicketId={activeTicketId}
                      onUpdatePriority={onUpdatePriority}
                      onSwitchToAttachments={() => setDrawerTab('attachments')}
                      onZoomImage={handleZoomImage}
                    />
                  )}

                  {drawerTab === 'conversation' && (
                    <TicketConversationTab
                      data={drawerTicketData}
                      profile={profile}
                      replyText={replyText}
                      setReplyText={setReplyText}
                      replyIsInternal={replyIsInternal}
                      setReplyIsInternal={setReplyIsInternal}
                      replyNextStatus={replyNextStatus}
                      setReplyNextStatus={setReplyNextStatus}
                      sendingReply={sendingReply}
                      onSendReply={onSendReply}
                    />
                  )}

                  {drawerTab === 'attachments' && (
                    <TicketAttachmentsTab
                      data={drawerTicketData}
                      onZoomImage={handleZoomImage}
                    />
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ZoomImageModal
        url={zoomedImageUrl}
        name={zoomedImageName}
        onClose={() => setZoomedImageUrl(null)}
      />
    </>
  );
}
