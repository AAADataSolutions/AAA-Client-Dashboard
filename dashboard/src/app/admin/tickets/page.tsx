'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, Plus, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchTickets,
  setSearchQuery,
  setPriorityFilter,
  setStatusFilter,
  setSortBy,
  setPagination,
  optimisticUpdateTicketStatus,
  TicketItem,
} from '@/store/slices/ticketsSlice';
import { useAuth } from '@/lib/auth/auth-context';
import {
  containerVariants,
  itemVariants,
  PropertyOption,
  Toast,
  TicketPriority,
  TicketStatus,
  TicketDetailData,
} from './_components/types';
import TicketsKpisAndFilters from './_components/TicketsKpisAndFilters';
import TicketsTable from './_components/TicketsTable';
import TicketConversationDrawer from './_components/TicketConversationDrawer';
import CreateTicketModal from './_components/CreateTicketModal';
import DeleteTicketModal from './_components/DeleteTicketModal';

export default function AdminTicketsPage() {
  const dispatch = useAppDispatch();
  const { profile } = useAuth();
  const {
    items: tickets,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.tickets);

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [propertyList, setPropertyList] = useState<PropertyOption[]>([]);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [drawerTicketData, setDrawerTicketData] = useState<TicketDetailData | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Drawer Reply Composer State
  const [replyText, setReplyText] = useState('');
  const [replyIsInternal, setReplyIsInternal] = useState(false);
  const [replyNextStatus, setReplyNextStatus] = useState<string>('DEFAULT');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingTicketStatus, setUpdatingTicketStatus] = useState(false);

  // Delete Ticket State
  const [ticketToDelete, setTicketToDelete] = useState<TicketItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Load properties for dropdown
  useEffect(() => {
    async function loadProps() {
      try {
        const res = await fetch('/api/admin/properties?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPropertyList(
            data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              organization_name: p.primary_organization?.name || p.organizations?.[0]?.name || 'Unassigned',
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load properties:', err);
      }
    }
    loadProps();
  }, []);

  // Fetch Tickets via Redux
  const loadData = useCallback(() => {
    dispatch(
      fetchTickets({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        priority: filters.selectedPriority,
        status: filters.selectedStatus,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch single ticket details when drawer opens
  const fetchSingleTicket = useCallback(async (id: string) => {
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load ticket details');
      }
      setDrawerTicketData(json.data);
    } catch (err: any) {
      showToast('Error', err.message || 'Error loading ticket details', 'error');
    } finally {
      setDrawerLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTicketId) {
      fetchSingleTicket(activeTicketId);
    } else {
      setDrawerTicketData(null);
    }
  }, [activeTicketId, fetchSingleTicket]);

  // Search input handler
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Send Reply from Admin to Client
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply || !activeTicketId) return;

    setSendingReply(true);
    try {
      const bodyPayload: any = {
        content: replyText.trim(),
        is_internal: replyIsInternal,
      };

      if (replyNextStatus !== 'DEFAULT') {
        bodyPayload.new_status = replyNextStatus;
      } else if (!replyIsInternal) {
        bodyPayload.new_status = 'WAITING_ON_CLIENT';
      }

      const res = await fetch(`/api/admin/tickets/${activeTicketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send reply');
      }

      setReplyText('');
      setReplyNextStatus('DEFAULT');
      showToast('Message Sent', replyIsInternal ? 'Internal note added.' : 'Reply sent to client.', 'success');
      await fetchSingleTicket(activeTicketId);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // Update Status from Drawer
  const handleUpdateStatus = async (ticketId: string, status: TicketStatus) => {
    setUpdatingTicketStatus(true);
    try {
      dispatch(optimisticUpdateTicketStatus({ id: ticketId, status }));

      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update status');
      }

      showToast('Status Updated', `Ticket marked as ${status.replace(/_/g, ' ')}.`, 'success');
      if (activeTicketId === ticketId) {
        await fetchSingleTicket(ticketId);
      }
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update status', 'error');
      loadData();
    } finally {
      setUpdatingTicketStatus(false);
    }
  };

  // Delete Ticket Handler
  const handleConfirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/tickets/${ticketToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete ticket');
      showToast('Deleted', 'Ticket was deleted successfully.', 'success');
      if (activeTicketId === ticketToDelete.id) {
        setActiveTicketId(null);
      }
      setTicketToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete ticket', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Update Priority from Drawer
  const handleUpdatePriority = async (ticketId: string, priority: TicketPriority) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update priority');
      }

      showToast('Priority Updated', `Priority set to ${priority}.`, 'success');
      if (activeTicketId === ticketId) {
        await fetchSingleTicket(ticketId);
      }
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update priority', 'error');
    }
  };

  // Reset Filters
  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setPriorityFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.selectedPriority !== 'ALL' ||
    filters.selectedStatus !== 'ALL' ||
    filters.sortBy !== 'NEWEST';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 pb-12 font-sans"
    >
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              t.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : t.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {t.type === 'info' && <LifeBuoy className="w-5 h-5 text-blue-500 shrink-0" />}
            <div>
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="text-xs opacity-90">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-auto p-1 hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* 1. Header with Title & Actions */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center text-black dark:text-white shrink-0">
              <LifeBuoy size={28} />
            </div>
            Support Tickets
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-10">
            Monitor, assign, and respond to incoming customer incidents and telecom requests across all tenants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] transition cursor-pointer"
            title="Refresh Tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>

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

      {/* 2. KPIs & Filter Controls */}
      <TicketsKpisAndFilters
        metrics={metrics}
        filters={filters}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onPriorityChange={(val) => {
          dispatch(setPriorityFilter(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onStatusChange={(val) => {
          dispatch(setStatusFilter(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onSortByChange={(val) => {
          dispatch(setSortBy(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onResetFilters={resetAllFilters}
      />

      {/* 3. Main Tickets Table */}
      <TicketsTable
        tickets={tickets}
        loading={loading}
        error={error}
        pagination={pagination}
        hasActiveFilters={hasActiveFilters}
        onPageChange={(page) => dispatch(setPagination({ currentPage: page }))}
        onRetry={loadData}
        onResetFilters={resetAllFilters}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onSelectTicket={(ticketId) => setActiveTicketId(ticketId)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteTicket={(ticket) => setTicketToDelete(ticket)}
      />

      {/* 4. Create Ticket Modal */}
      <CreateTicketModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        propertyList={propertyList}
        onSuccess={loadData}
        showToast={showToast}
      />

      {/* 5. Ticket Conversation & Detail Drawer */}
      <TicketConversationDrawer
        activeTicketId={activeTicketId}
        drawerTicketData={drawerTicketData}
        drawerLoading={drawerLoading}
        updatingTicketStatus={updatingTicketStatus}
        profile={profile}
        onClose={() => setActiveTicketId(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onRequestDelete={(ticket) => setTicketToDelete(ticket)}
        replyText={replyText}
        setReplyText={setReplyText}
        replyIsInternal={replyIsInternal}
        setReplyIsInternal={setReplyIsInternal}
        replyNextStatus={replyNextStatus}
        setReplyNextStatus={setReplyNextStatus}
        sendingReply={sendingReply}
        onSendReply={handleSendReply}
      />

      {/* 6. Delete Ticket Modal */}
      <DeleteTicketModal
        ticket={ticketToDelete}
        loading={deleteLoading}
        onClose={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDeleteTicket}
      />
    </motion.div>
  );
}
