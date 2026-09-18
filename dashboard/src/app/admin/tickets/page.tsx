'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  LifeBuoy,
  Search,
  Plus,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  X,
  Loader2,
  Check,
  MessageSquare,
  Send,
  Paperclip,
  Eye,
  Hotel,
  Building2,
  User,
  Trash2,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';

interface PropertyOption {
  id: string;
  name: string;
  organization_name?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

const CATEGORIES = [
  'Properties',
  'E911 Compliance',
  'Onboarding & Porting',
  'Telecom Services & DIDs',
  'Billing & Contracts',
  'Other Technical Support',
];

export default function AdminTicketsPage() {
  const dispatch = useAppDispatch();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketForDrawer, setActiveTicketForDrawer] = useState<TicketItem | null>(null);

  // 3-Dots Action Menu Position
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; ticket: TicketItem } | null>(null);

  // Create Form State with Attachments (Max 3)
  const [createForm, setCreateForm] = useState({
    subject: '',
    category: 'Properties',
    property_id: '',
    priority: 'MEDIUM' as TicketPriority,
    description: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Drawer Comments State
  const [newCommentText, setNewCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

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

  // Search input handler (char-by-char)
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Cleanup attachment preview URLs
  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviews]);

  // Attachment Handler (Max 3 Images)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxRemaining = 3 - attachments.length;
    const filesToAdd = newFiles.slice(0, maxRemaining);

    if (filesToAdd.length < newFiles.length) {
      showToast('Attachment Limit', 'Maximum 3 image attachments allowed.', 'error');
    }

    const validFiles = filesToAdd.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        showToast('File Too Large', `${f.name} exceeds 5MB limit.`, 'error');
        return false;
      }
      if (!f.type.startsWith('image/')) {
        showToast('Invalid Format', `${f.name} is not an image.`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
    setAttachments((prev) => [...prev, ...validFiles]);
    setAttachmentPreviews((prev) => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (idx: number) => {
    URL.revokeObjectURL(attachmentPreviews[idx]);
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Open 3-Dots Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, t: TicketItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, ticket: t });
  };

  // Status Update Handler
  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    dispatch(optimisticUpdateTicketStatus({ id: ticketId, status: newStatus }));

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update ticket status.');

      showToast('Status Updated', `Ticket marked as ${newStatus}.`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    }
  };

  // Handle Create Ticket
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim()) {
      setCreateError('Ticket subject is required.');
      return;
    }
    if (!createForm.description.trim()) {
      setCreateError('Ticket description is required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      // Build full description text with metadata & attachments notice
      let fullDesc = `[Category: ${createForm.category}]\n\n${createForm.description.trim()}`;
      if (attachments.length > 0) {
        fullDesc += `\n\n--- Attachments (${attachments.length} Image${attachments.length > 1 ? 's' : ''}) ---\n`;
        attachments.forEach((f, i) => {
          fullDesc += `[Attachment ${i + 1}: ${f.name} (${(f.size / 1024).toFixed(1)} KB)]\n`;
        });
      }

      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: createForm.subject.trim(),
          description: fullDesc,
          property_id: createForm.property_id || null,
          priority: createForm.priority,
          status: 'OPEN',
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create ticket.');

      showToast('Ticket Created', `Ticket ${result.data?.id?.slice(0, 8) || ''} logged successfully.`, 'success');
      setShowCreateModal(false);
      setCreateForm({
        subject: '',
        category: 'Properties',
        property_id: '',
        priority: 'MEDIUM',
        description: '',
      });
      setAttachments([]);
      setAttachmentPreviews([]);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Helper for priority badges
  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40';
      case 'HIGH':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40';
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setPriorityFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedPriority !== 'ALL' ||
    filters.selectedStatus !== 'ALL' ||
    filters.sortBy !== 'NEWEST';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-3 ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/30 text-white'
                : 'bg-slate-900/95 border-blue-500/30 text-white'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-semibold text-white">{t.title}</p>
              {t.message && <p className="text-slate-300 mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <LifeBuoy size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Helpdesk &amp; Support Tickets</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['Ticket ID,Subject,Organization,Property,Assignee,Priority,Created At\n'];
              const rows = tickets.map((t: TicketItem) =>
                `"${t.id.slice(0, 8).toUpperCase()}","${t.subject}","${t.organization_name}","${t.property_name}","${t.assigned_to_name || 'Unassigned'}","${t.priority}","${t.created_at}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Tickets list exported as CSV.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetAllFilters}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCreateForm({
                subject: '',
                category: 'Properties',
                property_id: '',
                priority: 'MEDIUM',
                description: '',
              });
              setAttachments([]);
              setAttachmentPreviews([]);
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Raise New Ticket
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards - ONLY Variant 1 (Deep Blue) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Open */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Open Tickets
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <LifeBuoy size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.openCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Pending</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Active customer issues</p>
        </motion.div>

        {/* Card 2: Urgent Priority */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Urgent Priority
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.urgentCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Critical</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Immediate engineering attention</p>
        </motion.div>

        {/* Card 3: Waiting on Client */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Waiting on Client
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.waitingCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">In-Queue</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Awaiting customer reply</p>
        </motion.div>

        {/* Card 4: Resolved / Closed */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Resolved &amp; Closed
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.resolvedCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Closed</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Satisfied tickets</p>
        </motion.div>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box (char-by-char) */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket ID, subject, organization, property..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filters.selectedPriority}
              onChange={(e) => {
                dispatch(setPriorityFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by priority"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Priority: All</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.selectedStatus}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting on Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Sort tickets"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PRIORITY">Sort: Priority</option>
              <option value="SUBJ_ASC">Sort: Subject (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                "{filters.searchQuery}"
                <button onClick={() => handleSearchChange('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedPriority !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Priority: {filters.selectedPriority}
                <button onClick={() => dispatch(setPriorityFilter('ALL'))} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Status: {filters.selectedStatus}
                <button onClick={() => dispatch(setStatusFilter('ALL'))} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-slate-500 hover:text-blue-600 text-xs font-medium underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Table View */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load tickets</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && tickets.length === 0 ? (
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
      ) : tickets.length === 0 ? (
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
                onClick={resetAllFilters}
                className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setCreateForm({
                  subject: '',
                  category: 'Properties',
                  property_id: '',
                  priority: 'MEDIUM',
                  description: '',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Raise New Ticket
            </button>
          </div>
        </div>
      ) : (
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
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">UPDATED AT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">CREATED AT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {tickets.map((t: TicketItem) => {
                  const truncatedSubject =
                    t.subject.length > 28 ? `${t.subject.substring(0, 28)}...` : t.subject;
                  const displayId = `TCK-${t.id.slice(0, 8).toUpperCase()}`;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setActiveTicketForDrawer(t)}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Ticket ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-black dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                          {displayId}
                        </span>
                      </td>

                      {/* 2. Ticket Subject (Short chars with ...) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm" title={t.subject}>
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
                          {t.property_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 5. Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {t.assigned_to_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 6. Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold ${getPriorityBadge(
                            t.priority as TicketPriority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* 7. Updated At */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(t.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* 8. Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveTicketForDrawer(t)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="View Conversation"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, t)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
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
                onClick={() => dispatch(setPagination({ currentPage: Math.max(1, pagination.currentPage - 1) }))}
                disabled={pagination.currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => dispatch(setPagination({ currentPage: num }))}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pagination.currentPage === num
                      ? 'bg-[#4f46e5] text-white'
                      : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => dispatch(setPagination({ currentPage: Math.min(pagination.totalPages, pagination.currentPage + 1) }))}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-DOTS ACTION POPUP */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.ticket.subject}</p>
              <p className="text-[10px] text-slate-400">Ticket Actions</p>
            </div>

            <button
              onClick={() => {
                setActiveTicketForDrawer(menuPosition.ticket);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Conversation</span>
            </button>

            <button
              onClick={() => {
                handleUpdateStatus(menuPosition.ticket.id, 'RESOLVED');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-emerald-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Resolved</span>
            </button>

            <button
              onClick={() => {
                handleUpdateStatus(menuPosition.ticket.id, 'CLOSED');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-slate-500"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* CREATE TICKET MODAL (WITH MAX 3 IMAGE ATTACHMENTS PREVIEW & REMOVE) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Raise Support Ticket</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    placeholder="e.g. SIP Trunk Registration Failure"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Property</label>
                    <select
                      value={createForm.property_id}
                      onChange={(e) => setCreateForm({ ...createForm, property_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">General Support (No Property)</option>
                      {propertyList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.organization_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setCreateForm({ ...createForm, priority: p })}
                        className={`py-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                          createForm.priority === p
                            ? p === 'URGENT'
                              ? 'bg-rose-50 text-rose-600 border-rose-500 shadow-xs'
                              : p === 'HIGH'
                              ? 'bg-amber-50 text-amber-600 border-amber-500 shadow-xs'
                              : p === 'MEDIUM'
                              ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-xs'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-500 shadow-xs'
                            : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Provide details of the issue, affected numbers, error messages..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Attachments Section (Max 3 Images) */}
                <div className="space-y-2">
                  <label className="font-bold text-black dark:text-white block">
                    Image Attachments <span className="font-normal text-slate-400">(Max 3 images, up to 5MB each)</span>
                  </label>

                  {attachments.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 border-2 border-dashed border-slate-200 dark:border-[#2a2c3a] rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2 cursor-pointer bg-slate-50/50 dark:bg-[#111217]/50"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span className="font-semibold text-xs">
                        Attach Screenshot ({3 - attachments.length} remaining)
                      </span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {attachments.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative group w-16 h-16 rounded-lg border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-100 dark:bg-[#111217]"
                        >
                          <img
                            src={attachmentPreviews[idx]}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-lg"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CONVERSATION DRAWER */}
      <AnimatePresence>
        {activeTicketForDrawer && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setActiveTicketForDrawer(null)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                    TCK-{activeTicketForDrawer.id.slice(0, 8).toUpperCase()}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{activeTicketForDrawer.subject}</h3>
                  <p className="text-xs text-slate-400">
                    {activeTicketForDrawer.property_name} • {activeTicketForDrawer.organization_name}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTicketForDrawer(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Description & Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Initial Request</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPriorityBadge(
                        activeTicketForDrawer.priority as TicketPriority
                      )}`}
                    >
                      {activeTicketForDrawer.priority}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {activeTicketForDrawer.description || 'No description provided.'}
                  </p>
                </div>

                {/* Comments Thread */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Conversation ({activeTicketForDrawer.comments?.length || 0})
                  </h4>

                  {(!activeTicketForDrawer.comments || activeTicketForDrawer.comments.length === 0) ? (
                    <p className="text-slate-400 italic text-center p-4 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl">
                      No replies logged yet.
                    </p>
                  ) : (
                    activeTicketForDrawer.comments.map((c: any) => (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border space-y-1 ${
                          c.is_internal
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                            : 'bg-slate-50 dark:bg-[#111217] border-slate-200 dark:border-[#222430]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Drawer Status Quick Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleUpdateStatus(activeTicketForDrawer.id, 'RESOLVED');
                      setActiveTicketForDrawer(null);
                    }}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Resolve Ticket
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(activeTicketForDrawer.id, 'CLOSED');
                      setActiveTicketForDrawer(null);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#111217] text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <button
                  onClick={() => setActiveTicketForDrawer(null)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
