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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Tag,
  Shield,
  FileImage,
  Lock,
  Maximize2,
  Hash,
  Calendar,
  ArrowUpRight,
  Sparkles,
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
import { useAuth } from '@/lib/auth/auth-context';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [drawerTicketData, setDrawerTicketData] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'details' | 'conversation' | 'attachments'>('details');

  // Zoom Image Modal
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [zoomedImageName, setZoomedImageName] = useState<string>('');

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

  // Scroll to bottom of conversation
  useEffect(() => {
    if (drawerTab === 'conversation' && drawerTicketData?.comments) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [drawerTab, drawerTicketData?.comments]);

  // Search input handler
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
        showToast('Invalid Type', `${f.name} is not an image file.`, 'error');
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

  const handleRemoveAttachment = (index: number) => {
    URL.revokeObjectURL(attachmentPreviews[index]);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Ticket Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.subject.trim()) {
      setCreateError('Subject is required');
      return;
    }
    if (!createForm.description.trim()) {
      setCreateError('Description is required');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const formData = new FormData();
      formData.append('subject', createForm.subject.trim());
      formData.append('description', `[Category: ${createForm.category}]\n\n${createForm.description.trim()}`);
      formData.append('priority', createForm.priority);
      formData.append('status', 'OPEN');
      if (createForm.property_id) {
        formData.append('property_id', createForm.property_id);
      }

      attachments.forEach((file, i) => {
        formData.append(`attachment_${i}`, file);
      });

      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create ticket');
      }

      showToast('Success', 'Support ticket created successfully', 'success');
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
      setCreateError(err.message || 'Failed to create ticket');
    } finally {
      setCreateLoading(false);
    }
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
        // When sending public reply, prompt status as WAITING_ON_CLIENT or IN_PROGRESS
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

  // Handle 3-Dots popup open
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

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/40';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
      IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
      WAITING_ON_CLIENT: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
      RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
      CLOSED: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700/40',
    };
    const dotColors: Record<string, string> = {
      OPEN: 'bg-blue-500',
      IN_PROGRESS: 'bg-amber-500',
      WAITING_ON_CLIENT: 'bg-purple-500',
      RESOLVED: 'bg-emerald-500',
      CLOSED: 'bg-slate-500',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${styles[status] || styles.OPEN}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.OPEN}`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const commentsCount = drawerTicketData?.comments?.length || 0;
  const attachmentsCount = drawerTicketData?.attachments?.length || 0;

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

      {/* 2. Top Metric KPI Cards - Blue Variant 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Open */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => dispatch(setStatusFilter('OPEN'))}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Open Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalOpen || metrics.openCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Awaiting engineering response</p>
        </motion.div>

        {/* Card 2: Urgent Priority */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => dispatch(setPriorityFilter('URGENT'))}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Urgent Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalUrgent || metrics.urgentCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Critical</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">High SLA impact items</p>
        </motion.div>

        {/* Card 3: Waiting on Client */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => dispatch(setStatusFilter('WAITING_ON_CLIENT'))}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Waiting On Client
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalWaiting || metrics.waitingCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Pending</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Replied &amp; awaiting customer</p>
        </motion.div>

        {/* Card 4: Resolved & Closed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => dispatch(setStatusFilter('RESOLVED'))}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Resolved / Closed
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalResolved || metrics.resolvedCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Done</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Successfully closed requests</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Omni Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by ticket ID, subject, customer organization, property..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filters.selectedPriority}
              onChange={(e) => {
                dispatch(setPriorityFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by priority"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🔵 Medium</option>
              <option value="LOW">🟢 Low</option>
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
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting On Client</option>
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
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
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
                      onClick={() => setActiveTicketId(t.id)}
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
                            onClick={() => setActiveTicketId(t.id)}
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
                      ? 'bg-blue-600 text-white'
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
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.ticket.subject}</p>
              <p className="text-[10px] text-slate-400">Quick Actions</p>
            </div>

            <button
              onClick={() => {
                setActiveTicketId(menuPosition.ticket.id);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details &amp; Chat</span>
            </button>

            <button
              onClick={() => {
                handleUpdateStatus(menuPosition.ticket.id, 'IN_PROGRESS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark as In Progress</span>
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

            <button
              onClick={() => {
                setTicketToDelete(menuPosition.ticket);
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

      {/* CREATE TICKET MODAL */}
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
                    placeholder="e.g. Inbound DID routing issue"
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

      {/* COMPREHENSIVE ADMIN TICKET DETAIL & TWO-WAY CONVERSATION DRAWER */}
      <AnimatePresence>
        {activeTicketId && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setActiveTicketId(null)} aria-hidden="true" />
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
                        onChange={(e) => handleUpdateStatus(activeTicketId, e.target.value as TicketStatus)}
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
                          setTicketToDelete(drawerTicketData as any);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveTicketId(null)}
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
                  {/* ===== 1. DETAILS TAB ===== */}
                  {drawerTab === 'details' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                      {/* Customer & Organization Info Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                          <span>Client &amp; Contact Details</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Organization</span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                              {drawerTicketData.organization_name}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Reported By</span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                              {drawerTicketData.created_by_name}
                            </span>
                            {drawerTicketData.created_by_email && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {drawerTicketData.created_by_email}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Contact Phone No.</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-500" />
                              {drawerTicketData.created_by_phone || drawerTicketData.related_items?.['Your Phone No.'] || 'Not provided'}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Assigned Staff</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs block mt-0.5">
                              {drawerTicketData.assigned_to_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Meta & Priority Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span>Category &amp; Classification</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Ticket Category</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs bg-slate-200/70 dark:bg-[#20222a] text-slate-800 dark:text-slate-200 mt-1">
                              {drawerTicketData.category}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Priority Level</span>
                            <div className="flex items-center gap-2 mt-1">
                              <select
                                value={drawerTicketData.priority}
                                onChange={(e) => handleUpdatePriority(activeTicketId, e.target.value as TicketPriority)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer ${getPriorityBadge(drawerTicketData.priority)}`}
                              >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="URGENT">URGENT</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Created Timestamp</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs block mt-0.5">
                              {new Date(drawerTicketData.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(drawerTicketData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[10.5px] block font-medium">Last Activity</span>
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-xs block mt-0.5">
                              {new Date(drawerTicketData.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}, {new Date(drawerTicketData.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Associated Operational Items Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-blue-600" />
                          <span>Associated Client Resources</span>
                        </h4>

                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Hospitality Property:</span>
                            <span className="font-bold text-slate-900 dark:text-white text-right">
                              {drawerTicketData.property_name} {drawerTicketData.property_location ? `(${drawerTicketData.property_location})` : ''}
                            </span>
                          </div>

                          {drawerTicketData.related_items?.['E911'] && (
                            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">E911 Record:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                                {drawerTicketData.related_items['E911']}
                              </span>
                            </div>
                          )}

                          {drawerTicketData.related_items?.['Onboarding'] && (
                            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Onboarding Pipeline:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                                {drawerTicketData.related_items['Onboarding']}
                              </span>
                            </div>
                          )}

                          {drawerTicketData.related_items?.['Service'] && (
                            <div className="flex items-start justify-between py-1.5 border-b border-slate-200/60 dark:border-[#1e2029]">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Telecom Line / DID:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                                {drawerTicketData.related_items['Service']}
                              </span>
                            </div>
                          )}

                          {drawerTicketData.related_items?.['Porting'] && (
                            <div className="flex items-start justify-between py-1.5">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">Porting Request:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                                {drawerTicketData.related_items['Porting']}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description Card */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Issue Description
                        </h4>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {drawerTicketData.clean_description || 'No description entered.'}
                        </p>
                      </div>

                      {/* Attachments Preview */}
                      {attachmentsCount > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                              <span>Attached Screenshots ({attachmentsCount})</span>
                            </h4>
                            <button
                              onClick={() => setDrawerTab('attachments')}
                              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            >
                              View All
                            </button>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {(drawerTicketData.attachments || []).map((att: any) => (
                              <div
                                key={att.id}
                                onClick={() => {
                                  if (att.url) {
                                    setZoomedImageUrl(att.url);
                                    setZoomedImageName(att.file_name);
                                  }
                                }}
                                className="w-20 h-20 rounded-lg border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-100 dark:bg-[#15161c] relative group cursor-pointer"
                              >
                                {att.url ? (
                                  <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileImage className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ===== 2. CONVERSATION TAB ===== */}
                  {drawerTab === 'conversation' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Initial request from client */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#20222a] flex items-center justify-center shrink-0 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {(drawerTicketData.created_by_name || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[11px] mb-1">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {drawerTicketData.created_by_name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-400 font-semibold">
                                Client
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-400">
                                {new Date(drawerTicketData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100/80 dark:bg-[#181920] border border-slate-200/60 dark:border-[#222430] text-xs leading-relaxed text-slate-900 dark:text-slate-100">
                              <p className="whitespace-pre-wrap">{drawerTicketData.clean_description || drawerTicketData.description}</p>
                            </div>
                          </div>
                        </div>

                        {/* Thread Comments */}
                        {(drawerTicketData.comments || []).map((c: any) => {
                          const isStaff = c.author?.role === 'SUPER_ADMIN' || c.author?.role === 'SUB_SUPER_ADMIN' || c.is_internal;
                          const isSelf = c.author?.id === profile?.id;

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
                        <form onSubmit={handleSendReply} className="flex items-end gap-2">
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
                                handleSendReply(e);
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
                  )}

                  {/* ===== 3. ATTACHMENTS TAB ===== */}
                  {drawerTab === 'attachments' && (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {attachmentsCount === 0 ? (
                        <div className="py-16 text-center">
                          <Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No Attachments</p>
                          <p className="text-xs text-slate-400 mt-1">No screenshots were uploaded with this ticket.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                              {attachmentsCount} Image Attachment{attachmentsCount !== 1 ? 's' : ''}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(drawerTicketData.attachments || []).map((att: any) => (
                              <div
                                key={att.id}
                                className="rounded-xl border border-slate-200 dark:border-[#2a2c3a] overflow-hidden bg-slate-50 dark:bg-[#111217] shadow-xs group"
                              >
                                <div
                                  onClick={() => {
                                    if (att.url) {
                                      setZoomedImageUrl(att.url);
                                      setZoomedImageName(att.file_name);
                                    }
                                  }}
                                  className="aspect-video bg-slate-100 dark:bg-[#16171d] relative cursor-pointer overflow-hidden flex items-center justify-center"
                                >
                                  {att.url ? (
                                    <img src={att.url} alt={att.file_name} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                                  ) : (
                                    <FileImage className="w-8 h-8 text-slate-300" />
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2">
                                    <span className="text-xs font-semibold flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-lg">
                                      <Maximize2 className="w-3.5 h-3.5" /> Enlarge
                                    </span>
                                  </div>
                                </div>

                                <div className="p-3 flex items-center justify-between bg-white dark:bg-[#15161c]">
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{att.file_name}</p>
                                    <p className="text-[10.5px] text-slate-400">{formatFileSize(att.file_size)}</p>
                                  </div>
                                  {att.url && (
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer shrink-0"
                                      title="Download image"
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN ZOOM IMAGE MODAL */}
      <AnimatePresence>
        {zoomedImageUrl && (
          <div
            onClick={() => setZoomedImageUrl(null)}
            className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-default"
            >
              <div className="p-3.5 bg-black/50 flex items-center justify-between text-white border-b border-white/10">
                <span className="text-xs font-semibold truncate max-w-sm">{zoomedImageName}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center gap-1 text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button
                    onClick={() => setZoomedImageUrl(null)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center overflow-auto bg-black/30">
                <img src={zoomedImageUrl} alt={zoomedImageName} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {ticketToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Ticket</h3>
                  <p className="text-xs text-slate-400 font-mono">TCK-{ticketToDelete.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Are you sure you want to permanently delete ticket <span className="font-semibold text-slate-900 dark:text-white">"{ticketToDelete.subject}"</span>? All comments and attachments will be deleted. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTicketToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTicket}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
