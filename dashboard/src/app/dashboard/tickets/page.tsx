'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Plus,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { TicketConversationDrawer } from '@/components/client/TicketConversationDrawer';
import { TicketRecordItem, containerVariants, itemVariants } from './_components/types';
import { TicketsMetricCards } from './_components/TicketsMetricCards';
import { TicketsFilterBar } from './_components/TicketsFilterBar';
import { TicketsTableView } from './_components/TicketsTableView';

export default function ClientTicketsPage() {
  const { orgMembership } = useAuth();
  const toast = useToast();
  const orgName = orgMembership?.organization?.name || 'Organization';

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
  const [sortBy, setSortBy] = useState('NEWEST');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketIdForDrawer, setActiveTicketIdForDrawer] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu
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
        sortBy: sortBy,
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
      setCurrentPage(1); // Reset page on filter change
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Error loading tickets');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, priorityFilter, sortBy]);

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

  const handleCopyTicketId = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    toast.success('Ticket ID copied.');
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setSortBy('NEWEST');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || sortBy !== 'NEWEST';

  // Pagination calc
  const totalPages = Math.ceil(tickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white shrink-0">
              <LifeBuoy size={28} />
            </div>
            Support Tickets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-10">
            Raise and track your support requests. Our team is here to help.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Raise New Ticket</span>
        </motion.button>
      </motion.div>

      {/* 2. Top Metric Cards */}
      <TicketsMetricCards metrics={metrics} />

      {/* 3. Status Tabs + Search/Filter */}
      <TicketsFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        metrics={metrics}
        tickets={tickets}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

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
        <TicketsTableView
          paginatedTickets={paginatedTickets}
          tickets={tickets}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          setCurrentPage={setCurrentPage}
          onSelectTicket={setActiveTicketIdForDrawer}
          menuPosition={menuPosition}
          setMenuPosition={setMenuPosition}
          onOpenMenu={handleOpenMenu}
          onCopyTicketId={handleCopyTicketId}
          onMarkStatus={handleMarkStatus}
        />
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
