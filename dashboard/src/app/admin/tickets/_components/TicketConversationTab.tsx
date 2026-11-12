'use client';

import React, { useRef, useEffect } from 'react';
import { MessageSquare, Lock, Send, Loader2 } from 'lucide-react';
import { TicketDetailData } from './types';

interface TicketConversationTabProps {
  data: TicketDetailData;
  profile: any;
  replyText: string;
  setReplyText: (text: string) => void;
  replyIsInternal: boolean;
  setReplyIsInternal: (isInternal: boolean) => void;
  replyNextStatus: string;
  setReplyNextStatus: (status: string) => void;
  sendingReply: boolean;
  onSendReply: (e: React.FormEvent) => void;
}

export default function TicketConversationTab({
  data,
  replyText,
  setReplyText,
  replyIsInternal,
  setReplyIsInternal,
  replyNextStatus,
  setReplyNextStatus,
  sendingReply,
  onSendReply,
}: TicketConversationTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.comments) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [data?.comments]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Initial request from client */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#20222a] flex items-center justify-center shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
            {(data.created_by_name || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] mb-1">
              <span className="font-bold text-slate-900 dark:text-white">
                {data.created_by_name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-400 font-semibold">
                Client
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">
                {new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100/80 dark:bg-[#181920] border border-slate-200/60 dark:border-[#222430] text-xs leading-relaxed text-slate-900 dark:text-slate-100">
              <p className="whitespace-pre-wrap">{data.clean_description || data.description}</p>
            </div>
          </div>
        </div>

        {/* Thread Comments */}
        {(data.comments || []).map((c) => {
          const isStaff = c.author?.role === 'SUPER_ADMIN' || c.author?.role === 'SUB_SUPER_ADMIN' || c.is_internal;

          return (
            <div key={c.id} className="flex gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  c.is_internal
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : isStaff
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-[#20222a] dark:text-slate-300'
                }`}
              >
                {c.is_internal ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  (c.author?.full_name || 'A').substring(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.author?.full_name || 'Administrator'}
                  </span>

                  {c.is_internal ? (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                      🔒 Internal Staff Note
                    </span>
                  ) : isStaff ? (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                      AAA Support
                    </span>
                  ) : (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600 dark:bg-[#20222a] dark:text-slate-400">
                      Client
                    </span>
                  )}

                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    c.is_internal
                      ? 'rounded-tl-none bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-amber-950 dark:text-amber-100'
                      : isStaff
                      ? 'rounded-tl-none bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-slate-900 dark:text-slate-100'
                      : 'rounded-tl-none bg-slate-100/80 dark:bg-[#181920] border border-slate-200/60 dark:border-[#222430] text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Reply Composer */}
      <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217]/70 shrink-0 space-y-3">
        {/* Mode Selector & Quick Options */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-[#1c1d25] p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setReplyIsInternal(false)}
              className={`px-3 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                !replyIsInternal
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Public Reply (To Client)</span>
            </button>

            <button
              type="button"
              onClick={() => setReplyIsInternal(true)}
              className={`px-3 py-1 rounded-md font-semibold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                replyIsInternal
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Internal Note (Staff Only)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10.5px]">Status on send:</span>
            <select
              value={replyNextStatus}
              onChange={(e) => setReplyNextStatus(e.target.value)}
              className="px-2 py-1 rounded-md bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="DEFAULT">
                {replyIsInternal ? 'Keep Current' : 'Waiting on Client'}
              </option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting on Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Text Composer Form */}
        <form onSubmit={onSendReply} className="flex items-end gap-2">
          <textarea
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              replyIsInternal
                ? 'Write an internal staff note (will NOT be visible to client)...'
                : 'Type reply message to client... (Press Enter to send)'
            }
            disabled={sendingReply}
            className={`flex-1 px-3.5 py-2.5 bg-white dark:bg-[#16171d] border rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none resize-none focus:ring-1 ${
              replyIsInternal
                ? 'border-amber-300 dark:border-amber-900/60 focus:ring-amber-500'
                : 'border-slate-200 dark:border-[#232530] focus:ring-blue-500'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendReply(e);
              }
            }}
          />

          <button
            type="submit"
            disabled={sendingReply || !replyText.trim()}
            className={`h-10 px-4 rounded-xl text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 shrink-0 cursor-pointer ${
              replyIsInternal
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {sendingReply ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{replyIsInternal ? 'Save Note' : 'Send'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
