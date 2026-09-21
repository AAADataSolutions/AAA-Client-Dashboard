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
  PhoneCall,
  FileText,
  AlertTriangle,
  XCircle,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPortingRequests,
  setSearchQuery,
  setStatusFilter,
  setSortBy,
  setPagination,
  optimisticUpdatePortingStatus,
  PortingItem,
  PortingRecord,
} from '@/store/slices/portingSlice';

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

export type PortingStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'FOC_RECEIVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

const PORTING_STAGES: { key: PortingStatus; label: string; step: number; desc: string }[] = [
  { key: 'DRAFT', label: 'Draft', step: 1, desc: 'Porting request initialized' },
  { key: 'SUBMITTED', label: 'Submitted', step: 2, desc: 'LOA & CSR submitted to carrier' },
  { key: 'IN_PROGRESS', label: 'In Progress', step: 3, desc: 'Carrier processing port order' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 4, desc: 'Firm Order Confirmation date set' },
  { key: 'COMPLETED', label: 'Completed', step: 5, desc: 'Numbers ported & services activated' },
];

function getStatusBadge(status: PortingStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 dark:bg-[#1a1c24]',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-[#2a2c3a]',
      };
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/50',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
      };
    case 'PENDING':
      return {
        label: 'Pending Review',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
      };
    case 'FOC_RECEIVED':
      return {
        label: 'FOC Confirmed',
        bg: 'bg-sky-50 dark:bg-sky-950/50',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/50',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-slate-100 dark:bg-slate-900/50',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-800/50',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}

interface OrgPropertyOption {
  id: string;
  property_name: string;
  organization_name: string;
  property_id: string;
}

interface ServiceOption {
  id: string;
  phone_number: string;
  service_type: string;
  status: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPortingPage() {
  const dispatch = useAppDispatch();
  const {
    items: portings,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.porting);

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ATTACHMENTS' | 'WORKFLOW'>('DETAILS');
  const [selectedRecord, setSelectedRecord] = useState<PortingItem | null>(null);
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);

  // Workflow Edit State
  const [editStatus, setEditStatus] = useState<PortingStatus>('DRAFT');
  const [editTargetDate, setEditTargetDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // 3-Dots Action Menu Position (strictly opens ABOVE)
  const [menuPosition, setMenuPosition] = useState<{
    bottom: number;
    left: number;
    record: PortingItem;
  } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activating, setActivating] = useState(false);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const handleActivateProperty = async (portingId: string) => {
    try {
      setActivating(true);
      const res = await fetch(`/api/admin/porting/${portingId}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Activation failed');
      }
      showToast('Property Activated', 'Property activated successfully! Onboarding initiated at Draft stage.', 'success');
      loadData();
      if (showUnifiedModal) setShowUnifiedModal(false);
    } catch (err: any) {
      showToast('Activation Failed', err.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  const handleDeletePorting = async (portingId: string) => {
    if (!confirm('Are you sure you want to delete this porting request? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/porting?id=${portingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete porting request');
      }
      showToast('Deleted', 'Porting request deleted successfully.', 'success');
      loadData();
      setMenuPosition(null);
    } catch (err: any) {
      showToast('Delete Failed', err.message, 'error');
    }
  };

  // Organizations state for create modal
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    organization_id: '',
    property_name: '',
    property_address: '',
    property_phone: '',
    fax: '',
    carrier_details: '',
  });
  const [createAttachedFiles, setCreateAttachedFiles] = useState<{
    file: File;
    name: string;
    size: number;
    type: string;
  }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const createFileInputRef = React.useRef<HTMLInputElement>(null);

  // Load organizations for dropdown
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/admin/organizations?limit=200');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrganizations(data.data.map((o: any) => ({ id: o.id, name: o.name })));
        }
      } catch (err) {
        console.warn('Could not load organizations:', err);
      }
    }
    loadOrgs();
  }, []);

  const pdfCount = createAttachedFiles.filter(
    (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  ).length;
  const imgCount = createAttachedFiles.filter(
    (f) => f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name)
  ).length;

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    let curPdfs = pdfCount;
    let curImgs = imgCount;

    const accepted: typeof createAttachedFiles = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        showToast('File too large', `File "${f.name}" exceeds 10MB limit.`, 'error');
        continue;
      }
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      const isImg = f.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(f.name);

      if (!isPdf && !isImg) {
        showToast('Invalid file type', `File "${f.name}" is not supported. Only PDFs and images allowed.`, 'error');
        continue;
      }

      if (isPdf) {
        if (curPdfs >= 2) {
          showToast('Limit reached', 'Maximum 2 PDF documents allowed.', 'error');
          continue;
        }
        curPdfs++;
      } else if (isImg) {
        if (curImgs >= 2) {
          showToast('Limit reached', 'Maximum 2 image files allowed.', 'error');
          continue;
        }
        curImgs++;
      }

      accepted.push({
        file: f,
        name: f.name,
        size: f.size,
        type: f.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
      });
    }

    setCreateAttachedFiles((prev) => [...prev, ...accepted]);
    if (createFileInputRef.current) createFileInputRef.current.value = '';
  };

  const removeCreateFile = (index: number) => {
    setCreateAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch Porting Requests
  const loadData = useCallback(() => {
    dispatch(
      fetchPortingRequests({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        status: filters.selectedStatus,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search input handler
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
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    record: PortingItem
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, record });
  };

  // Open Unified Modal
  const openUnifiedModal = (
    record: PortingItem,
    defaultTab: 'DETAILS' | 'ATTACHMENTS' | 'WORKFLOW' = 'DETAILS'
  ) => {
    setSelectedRecord(record);
    setActiveTab(defaultTab);
    setEditStatus(record.status as PortingStatus);
    setEditTargetDate(record.target_date || '');
    setEditNotes(record.notes || '');
    setShowUnifiedModal(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.organization_id) {
      setCreateError('Please select an organization.');
      return;
    }
    if (!createForm.property_name.trim() || !createForm.property_phone.trim()) {
      setCreateError('Property Name and Phone Number are required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const uploadedAttachments: {
        file_name: string;
        file_size: number;
        mime_type: string;
        storage_path: string;
      }[] = [];

      if (createAttachedFiles.length > 0) {
        const supabase = createClient();
        for (let i = 0; i < createAttachedFiles.length; i++) {
          const item = createAttachedFiles[i];
          setUploadProgress(`Uploading ${i + 1} of ${createAttachedFiles.length}: ${item.name}...`);
          const cleanName = item.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `admin/${Date.now()}_${cleanName}`;
          const { error: uploadErr } = await supabase.storage
            .from('porting-attachments')
            .upload(storagePath, item.file, {
              contentType: item.type,
              upsert: false,
            });
          if (uploadErr) {
            console.error('Storage upload error:', uploadErr);
          } else {
            uploadedAttachments.push({
              file_name: item.name,
              file_size: item.size,
              mime_type: item.type,
              storage_path: storagePath,
            });
          }
        }
      }

      setUploadProgress('Saving porting request...');

      const res = await fetch('/api/admin/porting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: createForm.organization_id,
          property_name: createForm.property_name.trim(),
          property_address: createForm.property_address.trim() || null,
          property_phone: createForm.property_phone.trim(),
          fax: createForm.fax.trim() || null,
          carrier_details: createForm.carrier_details.trim() || null,
          status: 'SUBMITTED',
          attachments: uploadedAttachments,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error || 'Failed to create porting request.');

      showToast(
        'Porting Request Created',
        `Port request for ${createForm.property_name} submitted successfully.`,
        'success'
      );
      setShowCreateModal(false);
      setCreateForm({
        organization_id: '',
        property_name: '',
        property_address: '',
        property_phone: '',
        fax: '',
        carrier_details: '',
      });
      setCreateAttachedFiles([]);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
      setUploadProgress(null);
    }
  };

  // Handle Update Status / Workflow
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    // Optimistic update
    dispatch(
      optimisticUpdatePortingStatus({ id: selectedRecord.id, status: editStatus })
    );

    try {
      setUpdatingStatus(true);
      const res = await fetch('/api/admin/porting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          status: editStatus,
          target_date: editTargetDate || null,
          notes: editNotes || null,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success)
        throw new Error(result.error || 'Failed to update porting request.');

      if (editStatus === 'COMPLETED') {
        showToast(
          'Porting Completed!',
          `Numbers for ${selectedRecord.property_name} have been ported successfully!`,
          'success'
        );
      } else {
        showToast(
          'Status Updated',
          `Porting request updated to ${getStatusBadge(editStatus).label}.`,
          'success'
        );
      }

      setShowUnifiedModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStatusFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedStatus !== 'ALL' ||
    filters.sortBy !== 'NEWEST';

  // Timeline helpers
  const isOverdue = (targetDate: string | null) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date();
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStepIndex = (status: string) => {
    const idx = PORTING_STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
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
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <ArrowLeftRight size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Porting Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = [
                'ID,Property,Organization,Status,Target Date,Services Count,Notes,Created\n',
              ];
              const rows = portings.map(
                (p: PortingRecord) =>
                  `"${p.id}","${p.property_name}","${p.organization_name}","${p.status}","${p.target_date || ''}","${p.services_count}","${(p.notes || '').replace(/"/g, '""')}","${p.created_at}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], {
                type: 'text/csv',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `porting-requests-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Porting requests exported as CSV.', 'info');
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
                organization_id: '',
                property_name: '',
                property_address: '',
                property_phone: '',
                fax: '',
                carrier_details: '',
              });
              setCreateAttachedFiles([]);
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Porting Request
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Total Requests */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Total Requests
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalRequests}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Ports</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">
            All porting requests across all orgs
          </p>
        </motion.div>

        {/* Card 2: In Progress */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              In Progress
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Loader2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.inProgressCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">
            Carrier processing &amp; submitted orders
          </p>
        </motion.div>

        {/* Card 3: FOC Received */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              FOC Received
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.focReceivedCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Confirmed</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">
            Firm Order Confirmation received
          </p>
        </motion.div>

        {/* Card 4: Completed */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.completedCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Done</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">
            Numbers ported &amp; services activated
          </p>
        </motion.div>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, organization, phone number, notes..."
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

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filters.selectedStatus}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING">Pending Review</option>
              <option value="FOC_RECEIVED">FOC Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="ACTION_REQUIRED">Action Required</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Sort porting requests"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PROP_ASC">Sort: Property (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
              <option value="STATUS">Sort: Status Progress</option>
              <option value="TARGET_DATE">Sort: Target Date</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                &quot;{filters.searchQuery}&quot;
                <button onClick={() => handleSearchChange('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Status: {filters.selectedStatus}
                <button
                  onClick={() => dispatch(setStatusFilter('ALL'))}
                  className="cursor-pointer"
                >
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
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            Could not load porting requests
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && portings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 py-2 animate-pulse"
            >
              <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </div>
      ) : portings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <ArrowLeftRight className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">
            No Porting Requests Found
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No porting requests match the selected filters.'
              : 'Create your first porting request to begin number migration.'}
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
                  organization_id: '',
                  property_name: '',
                  property_address: '',
                  property_phone: '',
                  fax: '',
                  carrier_details: '',
                });
                setCreateAttachedFiles([]);
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Porting Request
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    PROPERTY NAME
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    ADDRESS
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    PHONE
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    ORGANIZATION NAME
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    FAX
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    ATTACHMENTS
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {portings.map((rec: PortingRecord) => {
                  const badge = getStatusBadge(rec.status as PortingStatus);

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

                      {/* 2. Address */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-300 text-xs">
                          {rec.property_address || '—'}
                        </span>
                      </td>

                      {/* 3. Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 dark:text-slate-200 font-mono text-xs">
                            {rec.property_phone || '—'}
                          </span>
                          {rec.property_phone && rec.property_phone !== '—' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(rec.property_phone, `phone-${rec.id}`);
                              }}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedField === `phone-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 4. Organization Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white text-xs">
                          {rec.organization_name || '—'}
                        </span>
                      </td>

                      {/* 5. Fax */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {rec.fax || '—'}
                        </span>
                      </td>

                      {/* 6. Attachments */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                          <FileText className="w-3 h-3" />
                          <span>{rec.attachments?.length || 0}</span>
                        </span>
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openUnifiedModal(rec, 'DETAILS')}
                            className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800/50 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          {rec.status === 'COMPLETED' && !rec.is_activated && (
                            <button
                              onClick={() => handleActivateProperty(rec.id)}
                              disabled={activating}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                              title="Activate Property into Onboarding"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Activate Property</span>
                            </button>
                          )}
                          {rec.is_activated && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                              <Check className="w-3 h-3" /> Activated
                            </span>
                          )}
                          <button
                            onClick={(e) => handleOpenMenu(e, rec)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Actions"
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

          {/* Pagination Bar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(
                pagination.currentPage * pagination.limit,
                pagination.totalCount
              )}{' '}
              of {pagination.totalCount} requests
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  dispatch(
                    setPagination({
                      currentPage: Math.max(1, pagination.currentPage - 1),
                    })
                  )
                }
                disabled={pagination.currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((num) => (
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
                onClick={() =>
                  dispatch(
                    setPagination({
                      currentPage: Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      ),
                    })
                  )
                }
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
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
          />
          <div
            style={{
              bottom: `${menuPosition.bottom}px`,
              left: `${menuPosition.left}px`,
            }}
            className="fixed z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuPosition.record.property_name}
              </p>
              <p className="text-[10px] text-slate-400">Porting Actions</p>
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
                openUnifiedModal(menuPosition.record, 'WORKFLOW');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Update Workflow</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'WORKFLOW');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Pipeline</span>
            </button>

            {menuPosition.record.status === 'COMPLETED' && !menuPosition.record.is_activated && (
              <button
                onClick={() => {
                  const recId = menuPosition.record.id;
                  setMenuPosition(null);
                  handleActivateProperty(recId);
                }}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 cursor-pointer font-semibold border-t border-slate-100 dark:border-[#222430]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Activate Property</span>
              </button>
            )}

            <button
              onClick={() => {
                const recId = menuPosition.record.id;
                setMenuPosition(null);
                handleDeletePorting(recId);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 dark:border-[#222430]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Request</span>
            </button>
          </div>
        </>
      )}

      {/* UNIFIED MODAL (DETAILS & WORKFLOW TRACKING) */}
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
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedRecord.property_name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Porting Request &bull; {selectedRecord.organization_name}
                    </p>
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
                      onClick={() => setActiveTab('ATTACHMENTS')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'ATTACHMENTS'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>PDFs &amp; Images</span>
                      {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          {selectedRecord.attachments.length}
                        </span>
                      )}
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

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {activeTab === 'DETAILS' ? (
                  <>
                    {/* Property Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Property Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Hotel className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {selectedRecord.property_name}
                            </span>
                          </div>
                          {selectedRecord.property_address && (
                            <div className="flex items-start gap-2 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                              <span className="text-slate-600 dark:text-slate-300">
                                {selectedRecord.property_address}
                              </span>
                            </div>
                          )}
                          {selectedRecord.property_phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-500 font-medium">Phone:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-mono">
                                {selectedRecord.property_phone}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    selectedRecord.property_phone,
                                    'detail-phone'
                                  )
                                }
                                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                {copiedField === 'detail-phone' ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          {selectedRecord.fax && (
                            <div className="flex items-center gap-2 text-xs">
                              <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-500 font-medium">Fax:</span>
                              <span className="text-slate-600 dark:text-slate-300 font-mono">
                                {selectedRecord.fax}
                              </span>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    selectedRecord.fax || '',
                                    'detail-fax'
                                  )
                                }
                                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                              >
                                {copiedField === 'detail-fax' ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500 font-medium">Organization:</span>
                            <span className="text-slate-600 dark:text-slate-300 font-semibold">
                              {selectedRecord.organization_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Timeline
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500">Created:</span>
                            <span className="font-semibold text-slate-800 dark:text-white">
                              {formatDate(selectedRecord.created_at)}
                            </span>
                          </div>
                          {selectedRecord.target_date && (
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-500">Target:</span>
                              <span className="font-semibold text-slate-800 dark:text-white">
                                {formatDate(selectedRecord.target_date)}
                              </span>
                            </div>
                          )}
                          {selectedRecord.completed_at && (
                            <div className="flex items-center gap-2 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-slate-500">Completed:</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatDate(selectedRecord.completed_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Carrier Details & Account Info */}
                    {selectedRecord.carrier_details && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Carrier Details &amp; Account Info
                        </h4>
                        <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedRecord.carrier_details}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedRecord.notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Notes
                        </h4>
                        <div className="p-3 bg-slate-50 dark:bg-[#111217] rounded-lg border border-slate-200 dark:border-[#222430] text-xs text-slate-700 dark:text-slate-300">
                          {selectedRecord.notes}
                        </div>
                      </div>
                    )}

                    {/* Attached Services */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Attached Services ({selectedRecord.services_count || selectedRecord.services?.length || 0})
                      </h4>
                      {(selectedRecord.services || []).length > 0 ? (
                        <div className="border border-slate-200 dark:border-[#222430] rounded-lg overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-[#111217]">
                              <tr>
                                <th className="py-2 px-3 text-left text-slate-500 font-semibold">
                                  Phone Number
                                </th>
                                <th className="py-2 px-3 text-left text-slate-500 font-semibold">
                                  Type
                                </th>
                                <th className="py-2 px-3 text-left text-slate-500 font-semibold">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                              {(selectedRecord.services || []).map((svc, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-white">
                                    {svc.phone_number}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                    {svc.service_type}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        svc.status === 'ACTIVE'
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                          : svc.status === 'PENDING_PORT'
                                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      {svc.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 dark:bg-[#111217] rounded-lg border border-slate-200 dark:border-[#222430]">
                          No services attached to this porting request.
                        </div>
                      )}
                    </div>

                    {/* Uploaded Attachments (LOA, Bills, Documents) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Attachments ({selectedRecord.attachments?.length || 0})
                        </h4>
                      </div>
                      {selectedRecord.attachments && selectedRecord.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {selectedRecord.attachments.map((att: any, idx: number) => {
                            const fileUrl = `/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
                            return (
                              <div
                                key={att.id || idx}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                                      {att.file_name}
                                    </p>
                                    <p className="text-[10.5px] text-slate-400">
                                      {att.file_size ? `${(att.file_size / 1024 / 1024).toFixed(2)} MB • ` : ''}
                                      {att.mime_type || 'Document'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={att.file_name}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 dark:bg-[#111217] rounded-lg border border-slate-200 dark:border-[#222430]">
                          No attachments uploaded for this porting request.
                        </div>
                      )}
                    </div>

                    {/* Activate Property Banner */}
                    {selectedRecord.status === 'COMPLETED' && !selectedRecord.is_activated && (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Ready to Activate Property
                          </h4>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            This porting request is complete. Activate to create the property and start the onboarding pipeline.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleActivateProperty(selectedRecord.id)}
                          disabled={activating}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {activating ? 'Activating...' : 'Activate Property'}
                        </button>
                      </div>
                    )}

                    {selectedRecord.is_activated && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>This property has already been activated and enrolled into the onboarding tracker.</span>
                      </div>
                    )}

                    {/* Status & Workflow Updater */}
                    <form onSubmit={handleUpdateStatusSubmit} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Update Porting Status
                        </h4>
                        {(() => {
                          const b = getStatusBadge(selectedRecord.status as PortingStatus);
                          return (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${b.bg} ${b.text} ${b.border}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              Current: {b.label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {(['SUBMITTED', 'IN_PROGRESS', 'FOC_RECEIVED', 'COMPLETED', 'REJECTED', 'CANCELLED'] as PortingStatus[]).map((st) => {
                          const isSel = editStatus === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setEditStatus(st)}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
                                isSel
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-white dark:bg-[#111217] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#181a24]'
                              }`}
                            >
                              {getStatusBadge(st).label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Target / FOC Date
                          </label>
                          <input
                            type="date"
                            value={editTargetDate}
                            onChange={(e) => setEditTargetDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            Add / Update Notes
                          </label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Carrier reference, notes..."
                            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={updatingStatus}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {updatingStatus ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          {updatingStatus ? 'Saving...' : 'Save Status'}
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  /* TAB 2: ATTACHMENTS (Download & Inline Preview) */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Porting Documents &amp; Attachments
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Carrier LOA documents and customer invoices
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                        {selectedRecord.attachments?.length || 0} Files
                      </span>
                    </div>

                    {selectedRecord.attachments && selectedRecord.attachments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedRecord.attachments.map((att: any, idx: number) => {
                          const isImg =
                            att.mime_type?.startsWith('image/') ||
                            /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
                          const isPdf =
                            att.mime_type === 'application/pdf' ||
                            /\.pdf$/i.test(att.file_name);
                          const isExpanded = previewAttachmentId === (att.id || String(idx));
                          const fileUrl = `/api/client/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;

                          return (
                            <div
                              key={att.id || idx}
                              className="rounded-xl border border-slate-200/80 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] overflow-hidden"
                            >
                              <div className="p-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100/70 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                                      {att.file_name}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      {(att.file_size / 1024 / 1024).toFixed(2)} MB &bull; {att.mime_type || 'Document'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {(isImg || isPdf) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewAttachmentId(
                                          isExpanded ? null : (att.id || String(idx))
                                        )
                                      }
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      <span>{isExpanded ? 'Hide Preview' : 'Inline Preview'}</span>
                                    </button>
                                  )}
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    download={att.file_name}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download</span>
                                  </a>
                                </div>
                              </div>

                              {/* Inline Preview Container */}
                              {isExpanded && (
                                <div className="border-t border-slate-200 dark:border-[#222430] p-4 bg-white dark:bg-[#15161c]">
                                  {isImg && (
                                    <div className="flex justify-center bg-slate-900/5 dark:bg-black/40 rounded-lg p-2 max-h-96 overflow-auto">
                                      <img
                                        src={fileUrl}
                                        alt={att.file_name}
                                        className="max-h-80 object-contain rounded"
                                      />
                                    </div>
                                  )}
                                  {isPdf && (
                                    <iframe
                                      src={fileUrl}
                                      title={att.file_name}
                                      className="w-full h-96 rounded-lg border border-slate-200 dark:border-[#222430]"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430]">
                        <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p>No documents or attachments uploaded for this porting request.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE PORTING REQUEST MODAL (FOR NEW NON-EXISTING PROPERTY) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Create Porting Request
                    </h3>
                    <p className="text-xs text-slate-400">
                      Submit a new property porting request
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                onSubmit={handleCreateSubmit}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                {createError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {createError}
                  </div>
                )}

                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.organization_id}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        organization_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Property Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Property Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin Grand Resort"
                    value={createForm.property_name}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, property_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Property Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Property Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Congress Ave, Austin, TX 78701"
                    value={createForm.property_address}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, property_address: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Phone & Fax Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Property Phone No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +1 512-555-0100"
                      value={createForm.property_phone}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, property_phone: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Fax (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +1 512-555-0199"
                      value={createForm.fax}
                      onChange={(e) =>
                        setCreateForm((p) => ({ ...p, fax: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Carrier Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Carrier Details (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Losing carrier, account number, PIN / passcode, billing name..."
                    value={createForm.carrier_details}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, carrier_details: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Attachments (Max 2 PDFs and Max 2 Images) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Add Attachments (LOA &amp; Bills)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      PDFs ({pdfCount}/2) &bull; Images ({imgCount}/2)
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={createFileInputRef}
                    multiple
                    accept="application/pdf,image/png,image/jpeg,image/webp"
                    onChange={handleCreateFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    disabled={createLoading}
                    className="w-full py-3 px-4 border border-dashed border-slate-300 dark:border-[#282a36] hover:border-blue-500 rounded-xl bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-semibold text-xs">Choose Files (LOA, Carrier Invoices)</span>
                  </button>

                  {/* Attached Files List */}
                  {createAttachedFiles.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {createAttachedFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-[#181a24] border border-slate-200/80 dark:border-[#242634] text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                              {f.name}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              ({(f.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCreateFile(idx)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{uploadProgress || 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Porting Request</span>
                      </>
                    )}
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
