import React from 'react';
import { MessageSquare, MoreVertical, Copy, CheckCircle2 } from 'lucide-react';
import { TicketRecordItem } from './types';

interface TicketsTableViewProps {
  paginatedTickets: TicketRecordItem[];
  tickets: TicketRecordItem[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setCurrentPage: (val: number | ((p: number) => number)) => void;
  onSelectTicket: (id: string) => void;
  menuPosition: {
    top?: number;
    bottom?: number;
    left: number;
    ticket: TicketRecordItem;
  } | null;
  setMenuPosition: (pos: {
    top?: number;
    bottom?: number;
    left: number;
    ticket: TicketRecordItem;
  } | null) => void;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, ticket: TicketRecordItem) => void;
  onCopyTicketId: (ticketNumber: string) => void;
  onMarkStatus: (ticketId: string, status: 'RESOLVED' | 'CLOSED') => void;
}

export function TicketsTableView({
  paginatedTickets,
  tickets,
  currentPage,
  totalPages,
  itemsPerPage,
  setCurrentPage,
  onSelectTicket,
  menuPosition,
  setMenuPosition,
  onOpenMenu,
  onCopyTicketId,
  onMarkStatus,
}: TicketsTableViewProps) {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40',
      IN_PROGRESS: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40',
      WAITING_ON_CLIENT: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/40',
      RESOLVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
      CLOSED: 'bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/40',
    };
    const dotColors: Record<string, string> = {
      OPEN: 'bg-blue-500',
      IN_PROGRESS: 'bg-amber-500',
      WAITING_ON_CLIENT: 'bg-purple-500',
      RESOLVED: 'bg-emerald-500',
      CLOSED: 'bg-slate-500',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${styles[status] || styles.OPEN}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.OPEN}`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      URGENT: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40',
      HIGH: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40',
      MEDIUM: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40',
      LOW: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${styles[priority] || styles.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  const truncateSubject = (subject: string, maxWords: number = 3) => {
    const words = subject.split(/\s+/);
    if (words.length <= maxWords) return subject;
    return words.slice(0, maxWords).join(' ') + '...';
  };

  const formatLastReply = (ticket: TicketRecordItem) => {
    if (!ticket.last_reply) return 'No reply yet';
    const date = new Date(ticket.last_reply.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffH = Math.floor(diffMs / (1000 * 60 * 60));
    const diffD = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH} hour${diffH !== 1 ? 's' : ''} ago`;
    if (diffD === 1) return '1 day ago';
    return `${diffD} days ago`;
  };

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Ticket ID</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Subject</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Priority</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Opened Date</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Last Reply</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Reported By</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Phone</th>
              <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
            {paginatedTickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelectTicket(t.id)}
                className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition-colors cursor-pointer"
              >
                {/* Ticket ID */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                    {t.ticket_number}
                  </span>
                </td>

                {/* Subject */}
                <td className="py-3 px-4 whitespace-nowrap max-w-[160px]">
                  <span className="font-medium text-slate-900 dark:text-white text-xs truncate block" title={t.subject}>
                    {truncateSubject(t.subject)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  {getStatusBadge(t.status)}
                </td>

                {/* Priority */}
                <td className="py-3 px-4 whitespace-nowrap">
                  {getPriorityBadge(t.priority)}
                </td>

                {/* Opened Date */}
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                  {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                {/* Last Reply */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`text-xs ${t.last_reply ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400 italic'}`}>
                    {formatLastReply(t)}
                  </span>
                </td>

                {/* Reported By */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                    {t.created_by_name}
                  </span>
                </td>

                {/* Phone */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">
                    {t.created_by_phone || '—'}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectTicket(t.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                      title="Open Ticket"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => onOpenMenu(e, t)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                      title="More Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-[#222430]">
          <p className="text-[11px] text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, tickets.length)} of {tickets.length} tickets
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] disabled:opacity-40 cursor-pointer transition"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1a1c24]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] disabled:opacity-40 cursor-pointer transition"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Fixed 3-Dots Action Popup */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuPosition.ticket.subject}
              </p>
              <p className="text-[10px] text-slate-400">Ticket #{menuPosition.ticket.ticket_number}</p>
            </div>

            <button
              onClick={() => {
                const t = menuPosition.ticket;
                setMenuPosition(null);
                onSelectTicket(t.id);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Open Ticket Details
            </button>

            {menuPosition.ticket.status !== 'RESOLVED' && menuPosition.ticket.status !== 'CLOSED' && (
              <button
                onClick={() => {
                  const t = menuPosition.ticket;
                  setMenuPosition(null);
                  onMarkStatus(t.id, 'RESOLVED');
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mark as Resolved
              </button>
            )}

            <button
              onClick={() => {
                const t = menuPosition.ticket;
                setMenuPosition(null);
                onCopyTicketId(t.ticket_number);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Ticket ID
            </button>
          </div>
        </>
      )}
    </div>
  );
}
