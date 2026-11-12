import React from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TicketConversationTabProps {
  ticket: any;
  profile: any;
  replyText: string;
  setReplyText: (text: string) => void;
  sending: boolean;
  onSendReply: (e: React.FormEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function TicketConversationTab({
  ticket,
  profile,
  replyText,
  setReplyText,
  sending,
  onSendReply,
  messagesEndRef,
}: TicketConversationTabProps) {
  return (
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
          <form onSubmit={onSendReply} className="flex items-end gap-2">
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
                  onSendReply(e);
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
  );
}
