'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertCircle,
  RefreshCw,
  Plus,
  MessageSquare,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TicketItem } from '@/store/slices/ticketsSlice';
import { TicketPriority, TicketStatus, getPriorityBadge, getStatusBadge } from './types';

interface TicketsTableProps {
  tickets: TicketItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onResetFilters: () => void;
  onOpenCreateModal: () => void;
  onSelectTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
  onDeleteTicket: (ticket: TicketItem) => void;
}

export default function TicketsTable({
  tickets,
  loading,
  error,
  pagination,
  hasActiveFilters,
  onPageChange,
  onRetry,
  onResetFilters,
  onOpenCreateModal,
  onSelectTicket,
  onUpdateStatus,
  onDeleteTicket,
}: TicketsTableProps) {
  // 3-Dots Action Menu Position
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; ticket: TicketItem } | null>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, ticket: TicketItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearBottom = rect.bottom + 190 > window.innerHeight;
    setMenuPosition({
      top: isNearBottom ? rect.top - 170 : rect.bottom + 4,
      left: Math.max(16, rect.right - 200),
      ticket,
    });
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load tickets</p>
        <p className="text-xs text-slate-400 mt-0.5">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
            <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
            <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
        <LifeBuoy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Tickets Found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {hasActiveFilters
            ? 'No tickets match the selected filters.'
            : 'Create your first support ticket to track operational tasks.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Raise New Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">TICKET ID</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">TICKET SUBJECT</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ASSIGNEE</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PRIORITY</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STATUS</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">UPDATED AT</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
            {tickets.map((t: TicketItem) => {
              const truncatedSubject =
                t.subject.length > 32 ? `${t.subject.substring(0, 32)}...` : t.subject;
              const displayId = `TCK-${t.id.slice(0, 8).toUpperCase()}`;

              return (
                <tr
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                >
                  {/* 1. Ticket ID */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-black dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                      {displayId}
                    </span>
                  </td>

                  {/* 2. Ticket Subject */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white text-xs" title={t.subject}>
                      {truncatedSubject}
                    </span>
                  </td>

                  {/* 3. Organization Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {t.organization_name || 'Unassigned'}
                    </span>
                  </td>

                  {/* 4. Property Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-700 dark:text-slate-300">
                      {t.property_name || 'General'}
                    </span>
                  </td>

                  {/* 5. Assignee */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {t.assigned_to_name || 'Engineering'}
                    </span>
                  </td>

                  {/* 6. Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${getPriorityBadge(
                        t.priority as TicketPriority
                      )}`}
                    >
                      {t.priority}
                    </span>
                  </td>

                  {/* 7. Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(t.status)}
                  </td>

                  {/* 8. Updated At */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(t.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  {/* 9. Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onSelectTicket(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                        title="View Ticket & Conversation"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenMenu(e, t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                        title="More Actions"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Server-Side Pagination Bar */}
      <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} tickets
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
            disabled={pagination.currentPage <= 1 || loading}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                pagination.currentPage === num
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
            disabled={pagination.currentPage >= pagination.totalPages || loading}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3-DOTS ACTION POPUP */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.ticket.subject}</p>
              <p className="text-[10px] text-slate-400">Quick Actions</p>
            </div>

            <button
              onClick={() => {
                onSelectTicket(menuPosition.ticket.id);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details &amp; Chat</span>
            </button>

            <button
              onClick={() => {
                onUpdateStatus(menuPosition.ticket.id, 'IN_PROGRESS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark as In Progress</span>
            </button>

            <button
              onClick={() => {
                onUpdateStatus(menuPosition.ticket.id, 'RESOLVED');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-emerald-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Resolved</span>
            </button>

            <button
              onClick={() => {
                onUpdateStatus(menuPosition.ticket.id, 'CLOSED');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Ticket</span>
            </button>

            <button
              onClick={() => {
                onDeleteTicket(menuPosition.ticket);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Ticket</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
