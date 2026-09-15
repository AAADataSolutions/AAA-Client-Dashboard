'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  X,
  Plus,
  Hotel,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  MessageSquare,
  RefreshCw,
  Copy,
  Check,
  User,
  Shield,
  Tag,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { TicketConversationDrawer } from '@/components/client/TicketConversationDrawer';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

interface TicketRecordItem {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  property_id: string | null;
  property_name: string;
  property_location: string;
  created_by_name: string;
  created_by_email: string;
  assigned_to_name: string;
  comments_count: number;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClientTicketsPage() {
  const { effectiveRole, orgMembership } = useAuth();
  const toast = useToast();
  const orgName = orgMembership?.organization?.name || 'Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

  // Data state
  const [tickets, setTickets] = useState<TicketRecordItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    waitingOnClient: 0,
    resolvedOrClosed: 0,
    last24Hours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketIdForDrawer, setActiveTicketIdForDrawer] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu with upside detection
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    ticket: TicketRecordItem;
  } | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        status: statusFilter,
        priority: priorityFilter,
      });

      const res = await fetch(`/api/client/tickets?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load tickets');
      }

      setTickets(json.data || []);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, ticket: TicketRecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const isNearBottom = rect.bottom + 200 > window.innerHeight;
    if (isNearBottom) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        left,
        ticket,
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 4,
        left,
        ticket,
      });
    }
  };

  const handleCopyTicketId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Ticket reference ID copied.');
  };

  const handleMarkStatus = async (ticketId: string, status: 'RESOLVED' | 'CLOSED') => {
    try {
      const res = await fetch(`/api/client/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Status update failed');
      }
      toast.success(`Ticket marked as ${status.toLowerCase()}.`);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket');
    }
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || priorityFilter !== 'ALL';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <LifeBuoy size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Tickets Desk
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise New Ticket</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Top Metric Cards - ALL VARIANT 1 ONLY */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Tickets */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Total Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.total}
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-1">Total Support Inquiries</p>
        </motion.div>

        {/* Card 2: Active / Open */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Active / Open
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.open}
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-1">{metrics.last24Hours} opened in last 24h</p>
        </motion.div>

        {/* Card 3: Waiting On Client */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Waiting On Client
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.waitingOnClient}
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-1">Pending Your Response</p>
        </motion.div>

        {/* Card 4: Resolved & Closed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Resolved &amp; Closed
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.resolvedOrClosed}
            </span>
          </div>
          <p className="text-[11px] text-slate-200 mt-1">Successfully Completed</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tickets by subject, description, or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter tickets by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting on Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter tickets by priority"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Priority: All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load support tickets</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchTickets()}
            className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && tickets.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 animate-pulse">
              <div className="w-1/3 h-4 bg-slate-200 dark:bg-[#222430] rounded" />
              <div className="w-1/4 h-4 bg-slate-200 dark:bg-[#222430] rounded" />
              <div className="w-16 h-5 bg-slate-200 dark:bg-[#222430] rounded-full" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <LifeBuoy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Support Tickets Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No tickets match your filter criteria.'
              : 'You do not have any active support tickets. Click below to raise one.'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Raise New Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">TICKET SUBJECT &amp; PROPERTY</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">PRIORITY</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">REPORTED BY</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">MESSAGES</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">OPENED DATE</th>
                  <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setActiveTicketIdForDrawer(t.id)}
                    className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition-colors cursor-pointer"
                  >
                    {/* Subject & Property */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                          {t.subject}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Hotel className="w-3 h-3 text-slate-400" />
                          <span>{t.property_name}</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                            : t.status === 'WAITING_ON_CLIENT'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {t.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold text-[11px] ${
                          t.priority === 'URGENT'
                            ? 'text-rose-600 dark:text-rose-400'
                            : t.priority === 'HIGH'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    {/* Reported By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {t.created_by_name}
                        </span>
                      </div>
                    </td>

                    {/* Messages count */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                        <span>{t.comments_count} replies</span>
                      </span>
                    </td>

                    {/* Opened Date */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveTicketIdForDrawer(t.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                          title="Open Discussion Thread"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, t)}
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
              <p className="text-[10px] text-slate-400">Ticket Options</p>
            </div>

            <button
              onClick={() => {
                const t = menuPosition.ticket;
                setMenuPosition(null);
                setActiveTicketIdForDrawer(t.id);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Open Discussion Thread
            </button>

            {menuPosition.ticket.status !== 'RESOLVED' && menuPosition.ticket.status !== 'CLOSED' && (
              <button
                onClick={() => {
                  const t = menuPosition.ticket;
                  setMenuPosition(null);
                  handleMarkStatus(t.id, 'RESOLVED');
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
                handleCopyTicketId(t.id);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Ticket ID
            </button>
          </div>
        </>
      )}

      {/* Discussion Thread Drawer */}
      <TicketConversationDrawer
        ticketId={activeTicketIdForDrawer}
        onClose={() => setActiveTicketIdForDrawer(null)}
        onStatusChange={fetchTickets}
      />

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchTickets}
      />
    </motion.div>
  );
}
