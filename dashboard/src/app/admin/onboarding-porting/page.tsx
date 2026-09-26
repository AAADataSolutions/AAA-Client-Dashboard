'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  Loader2,
  Check,
  Hotel,
  Copy,
  Mail,
  Phone,
  MapPin,
  Eye,
  GitBranch,
  ShieldCheck,
  Building2,
  UserCheck,
  User,
  Paperclip,
  FileText,
  File,
  Trash2,
  UploadCloud,
  ExternalLink,
  Lock,
  UserPlus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchOnboardings,
  setSearchQuery,
  setStageFilter,
  setSortBy,
  setPagination,
  optimisticUpdateStage,
  OnboardingItem,
  OnboardingRecord,
  OnboardingAttachment,
} from '@/store/slices/onboardingSlice';

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

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

const STAGES_ROAD: { key: OnboardingStatus; label: string; step: number; desc: string; dateField: string }[] = [
  { key: 'DRAFT', label: 'Draft Initialized', step: 1, desc: 'Property draft initialized with inactive status', dateField: 'draft_date' },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', step: 2, desc: 'Service agreement dispatched to GM', dateField: 'contract_sent_date' },
  { key: 'SIGNED', label: 'Contract Signed', step: 3, desc: 'Agreement executed and verified', dateField: 'signed_date' },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', step: 4, desc: 'LSR submitted to winning carrier', dateField: 'porting_submitted_date' },
  { key: 'SOF_WAITING', label: 'SOF Review', step: 5, desc: 'Service Order Form technical review', dateField: 'sof_review_date' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 6, desc: 'Firm Order Confirmation date locked', dateField: 'foc_confirmed_date' },
  { key: 'COMPLETED', label: 'Onboarded', step: 7, desc: 'Traffic migrated & property activated', dateField: 'live_cutover_date' },
];

function getStageBadge(status: OnboardingStatus): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]', pct: 14 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', pct: 28 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', pct: 42 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', pct: 57 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 71 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50', pct: 85 };
    case 'COMPLETED':
      return { label: 'Onboarded', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', pct: 100 };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700', pct: 0 };
  }
}

interface OrgOption {
  id: string;
  name: string;
}

interface Teammate {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminOnboardingPortingPage() {
  const dispatch = useAppDispatch();
  const {
    items: onboardings,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.onboarding);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'STAGE'>('DETAILS');
  const [selectedRecord, setSelectedRecord] = useState<OnboardingItem | null>(null);

  // Stage Edit State inside Unified Modal
  const [editStageStatus, setEditStageStatus] = useState<OnboardingStatus>('DRAFT');
  const [editTargetDate, setEditTargetDate] = useState<string>('');
  const [stageDates, setStageDates] = useState({
    draft_date: '',
    contract_sent_date: '',
    signed_date: '',
    porting_submitted_date: '',
    sof_review_date: '',
    foc_confirmed_date: '',
    live_cutover_date: '',
  });

  // Internal Assignment, Notes & Attachments (Admin Only)
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [assignedToName, setAssignedToName] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'TEAMMATE' | 'CUSTOM'>('TEAMMATE');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [existingAttachments, setExistingAttachments] = useState<OnboardingAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  // 3-Dots Action Menu Position (strictly opens ABOVE)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; record: OnboardingItem } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Form State for creating new onboarding
  const [createForm, setCreateForm] = useState({
    property_name: '',
    organization_id: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    target_date: '',
    e911_status: 'PENDING',
    ray_baum_status: 'AUDIT_REQUIRED',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load organizations for dropdown
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/admin/organizations?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrgOptions(data.data.map((o: any) => ({ id: o.id, name: o.name })));
        }
      } catch (err) {
        console.warn('Could not load org options:', err);
      }
    }
    loadOrgs();
  }, []);

  // Load admin teammates for assignment
  useEffect(() => {
    async function loadTeammates() {
      try {
        const res = await fetch('/api/admin/members');
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setTeammates(data.members);
        }
      } catch (err) {
        console.warn('Could not load teammates:', err);
      }
    }
    loadTeammates();
  }, []);

  // Fetch Onboardings
  const loadData = useCallback(() => {
    dispatch(
      fetchOnboardings({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        stage: filters.selectedStage,
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

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${text} copied to clipboard.`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open 3-Dots Menu strictly ABOVE the line (Rule 8)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, record });
  };

  // Open Unified Modal
  const openUnifiedModal = (record: OnboardingItem, defaultTab: 'DETAILS' | 'STAGE' = 'DETAILS') => {
    setSelectedRecord(record);
    setActiveTab(defaultTab);
    const currentStatus = (record.status || (record as any).stage || 'DRAFT') as OnboardingStatus;
    setEditStageStatus(currentStatus);
    setEditTargetDate(record.target_date || '');
    setStageDates({
      draft_date: (record as any).draft_date ? (record as any).draft_date.split('T')[0] : '',
      contract_sent_date: (record as any).contract_sent_date ? (record as any).contract_sent_date.split('T')[0] : '',
      signed_date: (record as any).signed_date ? (record as any).signed_date.split('T')[0] : '',
      porting_submitted_date: (record as any).porting_submitted_date ? (record as any).porting_submitted_date.split('T')[0] : '',
      sof_review_date: (record as any).sof_review_date ? (record as any).sof_review_date.split('T')[0] : '',
      foc_confirmed_date: (record as any).foc_confirmed_date ? (record as any).foc_confirmed_date.split('T')[0] : '',
      live_cutover_date: (record as any).live_cutover_date ? (record as any).live_cutover_date.split('T')[0] : '',
    });

    const rawAssignedTo = record.assigned_to || '';
    const rawAssignedToName = record.assigned_to_name || '';
    setAssignedTo(rawAssignedTo);
    setAssignedToName(rawAssignedToName);
    if (rawAssignedTo) {
      setAssignmentMode('TEAMMATE');
    } else if (rawAssignedToName) {
      setAssignmentMode('CUSTOM');
    } else {
      setAssignmentMode('TEAMMATE');
    }

    setInternalNotes(record.internal_notes || '');
    setExistingAttachments(record.attachments || []);
    setNewFiles([]);
    setShowUnifiedModal(true);
  };

  // Handle Save Create Onboarding
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_name.trim()) {
      setCreateError('Property name is required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to initialize onboarding.');

      showToast('Onboarding Initialized', `${createForm.property_name} saved as Draft Initialized (INACTIVE).`, 'success');
      setShowCreateModal(false);
      setCreateForm({
        property_name: '',
        organization_id: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        general_manager_name: '',
        general_manager_phone: '',
        general_manager_email: '',
        target_date: '',
        e911_status: 'PENDING',
        ray_baum_status: 'AUDIT_REQUIRED',
      });
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Remove Existing Attachment
  const handleRemoveExistingAttachment = async (attId?: string, storagePath?: string) => {
    if (!selectedRecord) return;
    const targetKey = attId || storagePath;
    if (!targetKey) return;

    try {
      setDeletingAttId(targetKey);
      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          remove_attachment_id: targetKey,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setExistingAttachments((prev) => prev.filter((a) => (a.id || a.storage_path) !== targetKey));
        showToast('Attachment Removed', 'Internal attachment was removed.', 'info');
      } else {
        throw new Error(result.error || 'Failed to remove attachment');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to remove attachment', 'error');
    } finally {
      setDeletingAttId(null);
    }
  };

  // Handle Download / Preview Attachment
  const handleDownloadAttachment = (att: OnboardingAttachment) => {
    const url = `/api/admin/onboarding/attachment?path=${encodeURIComponent(att.storage_path)}&name=${encodeURIComponent(att.file_name)}`;
    window.open(url, '_blank');
  };

  // Handle Update Stage Submit (includes internal assignment, notes & attachments)
  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    // Instant optimistic Redux update (< 1ms zero reload)
    dispatch(optimisticUpdateStage({ id: selectedRecord.id, stage: editStageStatus, status: editStageStatus }));

    try {
      setUpdatingStage(true);

      // Upload new files to Supabase storage if any
      const newAttachmentsPayload: {
        file_name: string;
        file_size: number;
        mime_type: string;
        storage_path: string;
      }[] = [];

      if (newFiles.length > 0) {
        setUploadingFiles(true);
        const supabase = createClient();
        for (const file of newFiles) {
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `onboarding_${selectedRecord.id}/${Date.now()}_${safeName}`;

          // Attempt storage upload in onboarding-attachments bucket, fallback to porting-attachments
          let uploadRes = await supabase.storage.from('onboarding-attachments').upload(storagePath, file, {
            upsert: true,
          });

          if (uploadRes.error) {
            uploadRes = await supabase.storage.from('porting-attachments').upload(storagePath, file, {
              upsert: true,
            });
          }

          newAttachmentsPayload.push({
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
          });
        }
        setUploadingFiles(false);
      }

      // Determine final assignee name
      let finalAssignedTo = assignmentMode === 'TEAMMATE' ? (assignedTo || null) : null;
      let finalAssignedToName = assignedToName.trim();
      if (assignmentMode === 'TEAMMATE' && assignedTo) {
        const match = teammates.find((t) => t.id === assignedTo);
        if (match) {
          finalAssignedToName = match.full_name || match.email;
        }
      }

      const payload: any = {
        id: selectedRecord.id,
        status: editStageStatus,
        target_date: editTargetDate || null,
        draft_date: stageDates.draft_date || null,
        contract_sent_date: stageDates.contract_sent_date || null,
        signed_date: stageDates.signed_date || null,
        porting_submitted_date: stageDates.porting_submitted_date || null,
        sof_review_date: stageDates.sof_review_date || null,
        foc_confirmed_date: stageDates.foc_confirmed_date || null,
        live_cutover_date: stageDates.live_cutover_date || null,
        assigned_to: finalAssignedTo,
        assigned_to_name: finalAssignedToName || null,
        internal_notes: internalNotes || null,
      };

      if (newAttachmentsPayload.length > 0) {
        payload.new_attachments = newAttachmentsPayload;
      }

      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update stage.');

      if (editStageStatus === 'COMPLETED') {
        showToast(
          'Property Activated!',
          `${selectedRecord.property_name} cutover complete — property is now ACTIVE!`,
          'success'
        );
      } else {
        showToast('Stage & Internal Details Saved', `Pipeline updated to ${getStageBadge(editStageStatus).label}.`, 'success');
      }

      setShowUnifiedModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    } finally {
      setUpdatingStage(false);
      setUploadingFiles(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStageFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters = filters.searchQuery.trim() !== '' || filters.selectedStage !== 'ALL' || filters.sortBy !== 'NEWEST';
  const isStage3OrAbove = ['SIGNED', 'PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED', 'COMPLETED'].includes(editStageStatus);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Container */}
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
            <ArrowLeftRight size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding &amp; Porting</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['ID,Property,Organization,Stage,Assignee,Target Date,GM Name,GM Phone,GM Email\n'];
              const rows = onboardings.map((o: OnboardingRecord) =>
                `"${o.id}","${o.property_name}","${o.organization_name}","${o.stage || o.status || ''}","${o.assigned_to_name || 'Unassigned'}","${o.target_date || ''}","${o.general_manager_name || ''}","${o.general_manager_phone || ''}","${o.general_manager_email || ''}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `onboardings-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Onboardings exported as CSV.', 'info');
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
                property_name: '',
                organization_id: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                general_manager_name: '',
                general_manager_phone: '',
                general_manager_email: '',
                target_date: '',
                e911_status: 'PENDING',
                ray_baum_status: 'AUDIT_REQUIRED',
              });
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-[#4f46e5] text-white text-xs font-medium rounded-lg flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#4338ca] transition"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Pipeline
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards (4 Key Metrics) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Onboarding</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalOnboardings}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live / Activated</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Flight / Porting</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Review / SOF</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pendingReviewCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Filters & Real-time Search */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search property, GM, assignee..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Stage Filter */}
          <select
            value={filters.selectedStage}
            onChange={(e) => {
              dispatch(setStageFilter(e.target.value));
              dispatch(setPagination({ currentPage: 1 }));
            }}
            className="px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Lifecycle Stages</option>
            {STAGES_ROAD.map((s) => (
              <option key={s.key} value={s.key}>
                Stage {s.step}: {s.label}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy}
            onChange={(e) => {
              dispatch(setSortBy(e.target.value as any));
              dispatch(setPagination({ currentPage: 1 }));
            }}
            className="px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PROP_ASC">Sort: Property Name (A-Z)</option>
            <option value="ORG_ASC">Sort: Organization (A-Z)</option>
            <option value="STATUS">Sort: Progress Percentage</option>
          </select>
        </div>
      </motion.div>

      {/* Main Table / Empty State */}
      {loading && onboardings.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading onboarding pipelines...</p>
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1a1c24] flex items-center justify-center mx-auto text-slate-400">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No onboarding records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try clearing active search or stage filters to see all pipelines.'
                : 'Initialize your first onboarding pipeline to start tracking cutover lifecycle stages.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={() => {
                setCreateForm({
                  property_name: '',
                  organization_id: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  general_manager_name: '',
                  general_manager_phone: '',
                  general_manager_email: '',
                  target_date: '',
                  e911_status: 'PENDING',
                  ray_baum_status: 'AUDIT_REQUIRED',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize Pipeline
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ADDRESS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STAGE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ASSIGNEE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">TARGET CUTOVER DATE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM PHONE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM EMAIL</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {onboardings.map((rec: OnboardingRecord) => {
                  const stageBadge = getStageBadge(((rec as any).stage || rec.status) as OnboardingStatus);
                  const fullAddress = rec.property_address || rec.address
                    ? `${rec.property_address || rec.address}, ${(rec as any).property_city || rec.city || ''} ${(rec as any).property_state || rec.state || ''}`.trim()
                    : 'Pending Address';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openUnifiedModal(rec, 'DETAILS')}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Property Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {rec.property_name}
                        </span>
                      </td>

                      {/* 2. Address (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-slate-300">{fullAddress}</span>
                          {fullAddress !== 'Pending Address' && (
                            <button
                              onClick={() => handleCopy(fullAddress, `addr-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy Address"
                            >
                              {copiedField === `addr-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. Organization */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {rec.organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 4. Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageBadge.bg} ${stageBadge.text} ${stageBadge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {stageBadge.label}
                        </span>
                      </td>

                      {/* 5. Assignee (Admin Side Only) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.assigned_to_name ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                              {rec.assigned_to_name.charAt(0).toUpperCase()}
                            </div>
                            <span>{rec.assigned_to_name}</span>
                          </div>
                        ) : ['SIGNED', 'PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED', 'COMPLETED'].includes(rec.stage || rec.status || '') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium border border-amber-200/50 dark:border-amber-800/40">
                            Ready to Assign
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 6. Target Cutover Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.target_date ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(rec.target_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">TBD</span>
                        )}
                      </td>

                      {/* 7. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {rec.general_manager_name || 'N/A'}
                        </span>
                      </td>

                      {/* 8. GM Phone (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_phone && rec.general_manager_phone !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">{rec.general_manager_phone}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_phone || '', `gm-phone-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Phone"
                            >
                              {copiedField === `gm-phone-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* 9. GM Email (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_email && rec.general_manager_email !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">{rec.general_manager_email}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_email || '', `gm-email-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedField === `gm-email-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* 10. Actions (Three Dots Only) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenMenu(e, rec)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
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
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} pipelines
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
            style={{ bottom: `${menuPosition.bottom}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.record.property_name}</p>
              <p className="text-[10px] text-slate-400">Pipeline Actions</p>
            </div>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'DETAILS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Stage &amp; Assignment</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Stage Road</span>
            </button>
          </div>
        </>
      )}

      {/* UNIFIED MODAL (DETAILS & STAGE TRACKING TABS WITH STAGE 3 ASSIGNMENT & ATTACHMENTS) */}
      <AnimatePresence>
        {showUnifiedModal && selectedRecord && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedRecord.property_name}</h3>
                    <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tab Navigation */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('DETAILS')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        activeTab === 'DETAILS'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('STAGE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        activeTab === 'STAGE'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Stage Tracking
                    </button>
                  </div>

                  <button
                    onClick={() => setShowUnifiedModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Details */}
              {activeTab === 'DETAILS' && (
                <div className="p-6 overflow-y-auto space-y-5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedRecord.property_name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedRecord.organization_name || 'Direct Portfolio'}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Property Address</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecord.property_address || 'Pending Address'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecord.general_manager_name || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecord.general_manager_phone || 'N/A'}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecord.general_manager_email || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Target Cutover Date</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecord.target_date
                          ? new Date(selectedRecord.target_date).toLocaleDateString()
                          : 'Not Scheduled'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Current Lifecycle Stage</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-blue-600 dark:text-blue-400">
                        {getStageBadge(((selectedRecord as any).stage || selectedRecord.status) as OnboardingStatus).label} ({selectedRecord.progress_pct ?? 0}%)
                      </p>
                    </div>
                  </div>

                  {/* Internal Admin Handoff Summary (Private) */}
                  <div className="p-4 bg-slate-50 dark:bg-[#111217] border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          Internal Assignment &amp; Operations (Admin Only)
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveTab('STAGE')}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        Edit in Stage Tab &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Teammate</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {selectedRecord.assigned_to_name ? (
                            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <UserCheck className="w-3.5 h-3.5" /> {selectedRecord.assigned_to_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not yet assigned</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Internal Attachments</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                          {selectedRecord.attachments && selectedRecord.attachments.length > 0 ? (
                            <span>{selectedRecord.attachments.length} file(s) attached</span>
                          ) : (
                            <span className="text-slate-400 italic">No attachments uploaded</span>
                          )}
                        </p>
                      </div>

                      {selectedRecord.internal_notes && (
                        <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Internal Notes</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap bg-white dark:bg-[#15161c] p-2.5 rounded-lg border border-slate-200/80 dark:border-[#222430]">
                            {selectedRecord.internal_notes}
                          </p>
                        </div>
                      )}

                      {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                        <div className="col-span-2 space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Attached Files</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedRecord.attachments.map((att, i) => (
                              <button
                                key={att.id || att.storage_path || i}
                                onClick={() => handleDownloadAttachment(att)}
                                className="px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                              >
                                <Paperclip className="w-3 h-3 text-indigo-500" />
                                <span className="font-medium truncate max-w-[150px]">{att.file_name}</span>
                                <span className="text-[10px] text-slate-400">({formatFileSize(att.file_size)})</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Stage Tracking (Curved Road with Stage 3+ Task Assignment & Attachments) */}
              {activeTab === 'STAGE' && (
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {/* Stage Road Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Onboarding Progress Roadmap
                      </h4>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {getStageBadge(editStageStatus).pct}% Complete
                      </span>
                    </div>

                    {/* Progress Bar with Fill Animation */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getStageBadge(editStageStatus).pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
                      />
                    </div>

                    {/* Curved Road Timeline Visualizer */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {STAGES_ROAD.map((st, idx) => {
                        const currentStepIndex = STAGES_ROAD.findIndex((s) => s.key === editStageStatus);
                        const isDone = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <motion.div
                            key={st.key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setEditStageStatus(st.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                                : isDone
                                ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                                : 'border-slate-200 dark:border-[#222430] opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#181920]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-[#222430] text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {isDone ? <Check className="w-3 h-3" /> : st.step}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">Stage {st.step}</span>
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white text-xs">{st.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{st.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Update Form */}
                  <form onSubmit={handleUpdateStageSubmit} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Set Next Lifecycle Stage</label>
                        <select
                          value={editStageStatus}
                          onChange={(e) => setEditStageStatus(e.target.value as OnboardingStatus)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {STAGES_ROAD.map((s) => (
                            <option key={s.key} value={s.key}>
                              Stage {s.step}: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Target Cutover Date</label>
                        <input
                          type="date"
                          value={editTargetDate ? editTargetDate.split('T')[0] : ''}
                          onChange={(e) => setEditTargetDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Milestone Expected Completion Dates */}
                    <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 dark:text-white block text-xs">
                          Milestone Expected Dates (All 7 Stages)
                        </label>
                        <span className="text-[10px] text-slate-400">Synced with client tracking view</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {STAGES_ROAD.map((s) => (
                          <div key={s.dateField} className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                              Stage {s.step}: {s.label}
                            </label>
                            <input
                              type="date"
                              value={(stageDates as any)[s.dateField] || ''}
                              onChange={(e) =>
                                setStageDates((prev) => ({ ...prev, [s.dateField]: e.target.value }))
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* STAGE 3+: INTERNAL TASK ASSIGNMENT, ATTACHMENTS & NOTES (ADMIN ONLY) */}
                    {isStage3OrAbove ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/50 dark:from-[#171827] dark:via-[#13141a] dark:to-[#1a1728] border border-indigo-200/80 dark:border-indigo-800/50 rounded-xl space-y-4 shadow-sm"
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-950/60 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                                Internal Task Assignment &amp; Operations
                              </h4>
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                                Active at Stage 3 (Contract Signed) &bull; Visible strictly on Admin Side
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800">
                            <Lock className="w-3 h-3" /> Admin Only
                          </span>
                        </div>

                        {/* 1. Task Assignee Selection */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-900 dark:text-white block text-xs">
                              Assign Onboarding Task To:
                            </label>
                            <div className="flex items-center p-0.5 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-lg text-[10px]">
                              <button
                                type="button"
                                onClick={() => setAssignmentMode('TEAMMATE')}
                                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                  assignmentMode === 'TEAMMATE'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Admin Teammates
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssignmentMode('CUSTOM')}
                                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                                  assignmentMode === 'CUSTOM'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Custom Name
                              </button>
                            </div>
                          </div>

                          {assignmentMode === 'TEAMMATE' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={assignedTo}
                                onChange={(e) => {
                                  const selectedId = e.target.value;
                                  setAssignedTo(selectedId);
                                  const tm = teammates.find((t) => t.id === selectedId);
                                  if (tm) {
                                    setAssignedToName(tm.full_name || tm.email);
                                  } else {
                                    setAssignedToName('');
                                  }
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">Select an Admin Teammate...</option>
                                {teammates.map((tm) => (
                                  <option key={tm.id} value={tm.id}>
                                    {tm.full_name || tm.email} ({tm.role || 'Admin'})
                                  </option>
                                ))}
                              </select>

                              {assignedToName && (
                                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#15161c] border border-indigo-200 dark:border-indigo-900/60 rounded-lg text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                      {assignedToName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-slate-800 dark:text-white truncate">{assignedToName}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignedTo('');
                                      setAssignedToName('');
                                    }}
                                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="relative">
                              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={assignedToName}
                                onChange={(e) => {
                                  setAssignedToName(e.target.value);
                                  setAssignedTo('');
                                }}
                                placeholder="Enter engineer or teammate full name (e.g., Alex Johnson)"
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* 2. Internal Operational Notes */}
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-900 dark:text-white block text-xs">
                            Internal Operational Notes (LOA Status, PINs, Cutover Rules)
                          </label>
                          <textarea
                            rows={3}
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                            placeholder="Add private engineering notes, carrier account PINs, routing rules, or cutover instructions..."
                            className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>

                        {/* 3. Internal Attachments (Upload & Management) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-900 dark:text-white block text-xs">
                              Internal Attachments (LOA, CSR, Signed Agreement, Floorplans)
                            </label>
                            <span className="text-[10px] text-slate-400">PDF, DOCX, PNG, JPG (Max 25MB)</span>
                          </div>

                          {/* File Upload Drop Area */}
                          <div className="p-3 bg-white dark:bg-[#15161c] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                                <UploadCloud className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  Upload documents or contracts
                                </p>
                                <p className="text-[10px] text-slate-400">Files are stored securely in Supabase storage</p>
                              </div>
                            </div>

                            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs transition">
                              <Plus className="w-3.5 h-3.5" />
                              <span>Select Files</span>
                              <input
                                type="file"
                                multiple
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const selected = Array.from(e.target.files);
                                    setNewFiles((prev) => [...prev, ...selected]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Pending New Files Queue */}
                          {newFiles.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                Ready to Upload ({newFiles.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {newFiles.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-lg text-xs flex items-center gap-2 text-indigo-900 dark:text-indigo-200"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                                    <span className="text-[10px] text-indigo-500">({formatFileSize(file.size)})</span>
                                    <button
                                      type="button"
                                      onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                                      className="text-indigo-400 hover:text-rose-500 cursor-pointer p-0.5"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Existing Uploaded Attachments List */}
                          {existingAttachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Existing Internal Attachments ({existingAttachments.length}):
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {existingAttachments.map((att) => {
                                  const attKey = att.id || att.storage_path;
                                  const isDeleting = deletingAttId === attKey;
                                  return (
                                    <div
                                      key={attKey}
                                      className="px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs flex items-center gap-2 text-slate-800 dark:text-slate-200 shadow-xs"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAttachment(att)}
                                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[140px] text-left cursor-pointer"
                                        title="Click to download/preview"
                                      >
                                        {att.file_name}
                                      </button>
                                      <span className="text-[10px] text-slate-400">({formatFileSize(att.file_size)})</span>
                                      <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => handleRemoveExistingAttachment(att.id, att.storage_path)}
                                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 disabled:opacity-40"
                                        title="Delete attachment"
                                      >
                                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          <strong>Task Assignment &amp; Internal Handoff</strong> unlocks at <strong>Stage 3 (Contract Signed)</strong>. Once contract is signed, you can assign teammates, attach LOA/CSR files, and log private operational notes.
                        </span>
                      </div>
                    )}

                    {editStageStatus === 'COMPLETED' && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Setting stage to <strong>Onboarded (COMPLETED)</strong> will automatically activate the property to <strong>ACTIVE</strong> in the database and audit trail.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowUnifiedModal(false)}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingStage || uploadingFiles}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {updatingStage || uploadingFiles ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving &amp; Uploading...</span>
                          </>
                        ) : (
                          'Save & Update Stage'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE NEW ONBOARDING MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Initialize Onboarding Pipeline</h3>
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
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Property Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.property_name}
                      onChange={(e) => setCreateForm({ ...createForm, property_name: e.target.value })}
                      placeholder="e.g. Hyatt Regency Miami"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Organization <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.organization_id}
                      onChange={(e) => setCreateForm({ ...createForm, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Organization</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">Street Address</label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      placeholder="400 SE 2nd Ave"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="Miami"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">State &amp; ZIP</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={createForm.state}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                        placeholder="FL"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={createForm.zip_code}
                        onChange={(e) => setCreateForm({ ...createForm, zip_code: e.target.value })}
                        placeholder="33131"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">General Manager Name</label>
                    <input
                      type="text"
                      value={createForm.general_manager_name}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_name: e.target.value })}
                      placeholder="e.g. David Vance"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Phone</label>
                    <input
                      type="tel"
                      value={createForm.general_manager_phone}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_phone: e.target.value })}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Email</label>
                    <input
                      type="email"
                      value={createForm.general_manager_email}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_email: e.target.value })}
                      placeholder="david@hyattmiami.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Target Cutover Date</label>
                    <input
                      type="date"
                      value={createForm.target_date}
                      onChange={(e) => setCreateForm({ ...createForm, target_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">E911 Validation Status</label>
                    <select
                      value={createForm.e911_status}
                      onChange={(e) => setCreateForm({ ...createForm, e911_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="PENDING">Pending Verification</option>
                      <option value="VERIFIED">PSAP Verified</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Ray Baum Status</label>
                    <select
                      value={createForm.ray_baum_status}
                      onChange={(e) => setCreateForm({ ...createForm, ray_baum_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="AUDIT_REQUIRED">Audit Required</option>
                      <option value="VERIFIED">Ray Baum Verified</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                  Upon initialization, the property will automatically be created in <strong>INACTIVE</strong> status with initial stage <strong>Draft Initialized</strong>. It will automatically switch to <strong>ACTIVE</strong> upon onboarding completion.
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
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Initialize Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
