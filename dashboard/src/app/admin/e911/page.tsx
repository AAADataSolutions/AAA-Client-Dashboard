'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  Plus,
  Download,
  MoreVertical,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Sparkles,
  RefreshCw,
  Info,
  FileText,
  AlertTriangle,
  Loader2,
  Check,
  Phone,
  Mail,
  MapPin,
  Send,
  Hotel,
  BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] as any },
  },
};

export type E911Status = 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUIRED' | 'FAILED';

interface PropertyDetails {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  main_phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  general_manager_name?: string;
}

interface OrganizationDetails {
  id?: string;
  name: string;
  primary_email?: string;
  primary_phone?: string;
}

interface E911Record {
  id: string;
  emergency_address: string;
  psap_id: string;
  status: E911Status;
  correction_notes: string | null;
  verified_at: string | null;
  ray_baum_compliant: boolean;
  karis_law_direct_dial: boolean;
  created_at: string;
  updated_at?: string;
  property_id?: string;
  property_name: string;
  organization_id?: string;
  organization_name: string;
  property_details?: PropertyDetails | null;
  organization_details?: OrganizationDetails | null;
}

interface OrgPropertyOption {
  org_property_id: string;
  property_id: string;
  property_name: string;
  organization_id: string;
  organization_name: string;
  address?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

function getStatusBadge(status: E911Status): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'PSAP Verified',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
      };
    case 'CORRECTION_REQUIRED':
      return {
        label: 'Correction Required',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
      };
    case 'PENDING':
      return {
        label: 'Validation Pending',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
      };
    case 'FAILED':
      return {
        label: 'Routing Failed',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-[#1a1c24]',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-[#2a2c3a]',
      };
  }
}

export default function AdminE911Page() {
  const [records, setRecords] = useState<E911Record[]>([]);
  const [orgPropOptions, setOrgPropOptions] = useState<OrgPropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-Side Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Real Database Metrics (No fake data)
  const [metrics, setMetrics] = useState({
    totalRecordsCount: 0,
    verifiedCount: 0,
    correctionRequiredCount: 0,
    pendingOrFailedCount: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedComplianceFilter, setSelectedComplianceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Debounce search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fixed 3-Dots Action Menu Overlay
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; record: E911Record } | null>(null);

  // Drawers & Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<E911Record | null>(null);

  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<E911Record | null>(null);

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRecordForNotes, setSelectedRecordForNotes] = useState<E911Record | null>(null);
  const [correctionNoteInput, setCorrectionNoteInput] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    org_property_id: '',
    emergency_address: '',
    psap_id: '',
    status: 'PENDING' as E911Status,
    correction_notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Org-Property Options
  const loadOrgPropertyOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const options: OrgPropertyOption[] = [];
        data.data.forEach((p: any) => {
          const links = Array.isArray(p.org_links) ? p.org_links : (p.org_links ? [p.org_links] : []);
          links.forEach((l: any) => {
            if (l && l.organization) {
              options.push({
                org_property_id: l.id,
                property_id: p.id,
                property_name: p.name,
                organization_id: l.organization.id,
                organization_name: l.organization.name,
                address: p.address ? `${p.address}, ${p.city || ''} ${p.state || ''}` : '',
              });
            }
          });
        });
        setOrgPropOptions(options);
      }
    } catch (err) {
      console.warn('Could not load org property options:', err);
    }
  }, []);

  useEffect(() => {
    loadOrgPropertyOptions();
  }, [loadOrgPropertyOptions]);

  // Fetch E911 Records (Server-Side Paginated)
  const fetchE911Records = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        status: selectedStatusFilter,
        compliance: selectedComplianceFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/e911?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch E911 records.');
      }

      setRecords(result.data || []);
      if (result.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching E911:', err);
      setError(err.message || 'Error loading E911 records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedStatusFilter, selectedComplianceFilter, sortBy]);

  useEffect(() => {
    fetchE911Records();
  }, [fetchE911Records]);

  // Open 3-Dots Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: E911Record) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record });
  };

  // --- Handlers: Create ---
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.org_property_id || !formData.emergency_address.trim()) {
      setFormError('Please select a Property and enter the Emergency Dispatch Address.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/e911', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_property_id: formData.org_property_id,
          emergency_address: formData.emergency_address.trim(),
          psap_id: formData.psap_id.trim() || null,
          status: formData.status,
          correction_notes: formData.correction_notes || null,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create E911 record.');

      showToast('Created', 'E911 dispatch record registered successfully.', 'success');
      setShowCreateModal(false);
      fetchE911Records();
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Edit ---
  const handleOpenEdit = (record: E911Record) => {
    setSelectedRecordForEdit(record);
    setFormData({
      org_property_id: '',
      emergency_address: record.emergency_address,
      psap_id: record.psap_id || '',
      status: record.status,
      correction_notes: record.correction_notes || '',
    });
    setFormError(null);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForEdit.id,
          emergency_address: formData.emergency_address,
          psap_id: formData.psap_id,
          status: formData.status,
          correction_notes: formData.correction_notes,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update E911 record.');

      showToast('Updated', 'E911 record updated.', 'success');
      setShowEditDrawer(false);
      fetchE911Records();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Correction Notes ---
  const handleOpenCorrectionNotes = (record: E911Record) => {
    setSelectedRecordForNotes(record);
    setCorrectionNoteInput('');
    setShowNotesModal(true);
  };

  const handleSaveCorrectionNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForNotes || !correctionNoteInput.trim()) return;

    try {
      setNoteLoading(true);

      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForNotes.id,
          append_correction_note: correctionNoteInput.trim(),
          status: 'CORRECTION_REQUIRED',
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save correction note.');

      showToast('Note Added', 'Correction note appended and status updated.', 'success');
      setShowNotesModal(false);
      fetchE911Records();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedStatusFilter('ALL');
    setSelectedComplianceFilter('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStatusFilter !== 'ALL' ||
    selectedComplianceFilter !== 'ALL' ||
    sortBy !== 'NEWEST';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all ${t.type === 'success'
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
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Page Header (Clean: No Subtitle, No Mini Pill next to Title) */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <ShieldCheck size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E911 & Emergency Routing</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['ID,Property,Organization,EmergencyAddress,PSAP,Status,RayBaum\n'];
              const rows = records.map((r) =>
                `"${r.id}","${r.property_name}","${r.organization_name}","${r.emergency_address}","${r.psap_id}","${r.status}","${r.ray_baum_compliant}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `e911-records-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'E911 records exported as CSV.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetAllFilters}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const firstOpt = orgPropOptions[0];
              setFormData({
                org_property_id: firstOpt?.org_property_id || '',
                emergency_address: firstOpt?.address || '',
                psap_id: '',
                status: 'PENDING',
                correction_notes: '',
              });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Register E911 Record
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards (5 Design System Variants with Hover Pop) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && records.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl animate-pulse space-y-2.5 shadow-sm"
            >
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#222430] rounded"></div>
              <div className="h-7 w-12 bg-slate-200 dark:bg-[#222430] rounded"></div>
              <div className="h-3 w-28 bg-slate-200 dark:bg-[#222430] rounded"></div>
            </div>
          ))
        ) : (
          <>
            {/* Card 1: Total Records -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Total E911 Records
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.totalRecordsCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Endpoints</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Registered dispatch endpoints</p>
            </motion.div>

            {/* Card 2: PSAP Verified -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  PSAP Verified
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.verifiedCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Verified</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Direct emergency routing active</p>
            </motion.div>

            {/* Card 3: Correction Required -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Correction Required
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.correctionRequiredCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Flagged</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Address / suite audit flagged</p>
            </motion.div>

            {/* Card 4: Pending Validation -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Pending Validation
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.pendingOrFailedCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Pending</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Carrier validation pending</p>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Search & Filter Toolbar */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, organization, emergency address, PSAP ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="VERIFIED">PSAP Verified</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="PENDING">Validation Pending</option>
              <option value="FAILED">Routing Failed</option>
            </select>

            <select
              value={selectedComplianceFilter}
              onChange={(e) => {
                setSelectedComplianceFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by compliance"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Compliance: All</option>
              <option value="COMPLIANT">Ray Baum Compliant</option>
              <option value="NON_COMPLIANT">Audit Required</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort records"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PROP_ASC">Sort: Property Name (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
              <option value="STATUS">Sort: Status</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                {selectedStatusFilter}
                <button onClick={() => setSelectedStatusFilter('ALL')} className="cursor-pointer">
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
      </motion.div>

      {/* Main Table View (Pure Black Headers, Separate Property & Org columns, No Location displayed in table) */}
      {error ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load E911 records</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchE911Records()}
            className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      ) : loading && records.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
            </div>
          ))}
        </motion.div>
      ) : records.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No E911 Records Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No records matched the selected filters.'
              : 'Register your first property emergency dispatch address for Kari’s Law and Ray Baum compliance.'}
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                const firstOpt = orgPropOptions[0];
                setFormData({
                  org_property_id: firstOpt?.org_property_id || '',
                  emergency_address: firstOpt?.address || '',
                  psap_id: '',
                  status: 'PENDING',
                  correction_notes: '',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Register E911 Record
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">EMERGENCY DISPATCH ADDRESS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">RAY BAUM ACT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {records.map((record) => {
                  const badge = getStatusBadge(record.status);
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.6)' }}
                      className="transition"
                    >
                      {/* 1. Property Name (ONLY Name, No Location) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-blue-100 dark:border-blue-900/40">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-black dark:text-white text-sm block">
                              {record.property_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Organization Name (ONLY Name, No Location) */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-black dark:text-white">
                          {record.organization_name}
                        </span>
                      </td>

                      {/* 3. Emergency Dispatch Address */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 max-w-[240px]">
                          <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                            {record.emergency_address}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            PSAP ID: {record.psap_id}
                          </span>
                        </div>
                      </td>

                      {/* 4. Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* 5. Ray Baum Compliance */}
                      <td className="py-3.5 px-4">
                        {record.ray_baum_compliant ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> Audit Needed
                          </span>
                        )}
                      </td>

                      {/* 6. Actions (3-Dots Trigger) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, record)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar (10 items per page) */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} records
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${currentPage === num
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                    }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* FIXED 3-DOTS ACTION POPUP */}
      {/* ========================================================================= */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-bold text-black dark:text-white truncate">{menuPosition.record.property_name}</p>
              <p className="text-[10px] text-slate-400">E911 Options</p>
            </div>

            {/* 1. View Details */}
            <button
              onClick={() => {
                const record = menuPosition.record;
                setMenuPosition(null);
                setSelectedRecordForDetails(record);
                setShowDetailsDrawer(true);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> View Details
            </button>

            {/* 2. Edit E911 Record */}
            <button
              onClick={() => {
                const record = menuPosition.record;
                setMenuPosition(null);
                handleOpenEdit(record);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Edit Record
            </button>

            {/* 3. Correction Notes */}
            <button
              onClick={() => {
                const record = menuPosition.record;
                setMenuPosition(null);
                handleOpenCorrectionNotes(record);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-[#222430]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Correction Notes
            </button>
          </motion.div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW DETAILS DRAWER (No Light Gray Text, High Contrast) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDetailsDrawer && selectedRecordForDetails && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-black dark:text-white">E911 Record Specifications</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                      {selectedRecordForDetails.property_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsDrawer(false)}
                    className="p-1 rounded text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  {/* Emergency Address & PSAP */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Emergency Dispatch Configuration
                    </h4>
                    <div className="pt-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Registered Dispatch Address</span>
                      <p className="font-bold text-black dark:text-white mt-1 text-sm">
                        {selectedRecordForDetails.emergency_address}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">PSAP Routing ID</span>
                      <span className="font-bold text-black dark:text-white">
                        {selectedRecordForDetails.psap_id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Validation Status</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {getStatusBadge(selectedRecordForDetails.status).label}
                      </span>
                    </div>
                  </div>

                  {/* Compliance Verification */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Federal Regulatory Compliance
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Ray Baum's Act (Dispatchable Location)</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Kari's Law (Direct 911 Dialing)</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                      </span>
                    </div>
                  </div>

                  {/* Property & Organization Details */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Tenant & Location
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Property</span>
                      <span className="font-bold text-black dark:text-white">{selectedRecordForDetails.property_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Organization</span>
                      <span className="font-bold text-black dark:text-white">{selectedRecordForDetails.organization_name}</span>
                    </div>
                  </div>

                  {/* Correction Notes History */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Correction Notes & Audit Flags
                    </h4>
                    {selectedRecordForDetails.correction_notes ? (
                      <div className="bg-white dark:bg-[#111217] p-3 rounded-lg border border-slate-200 dark:border-[#222430] whitespace-pre-line text-slate-900 dark:text-slate-100 font-sans">
                        {selectedRecordForDetails.correction_notes}
                      </div>
                    ) : (
                      <p className="text-slate-500 font-medium italic">No correction notes or audit flags reported.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#2c2e3c] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. EDIT E911 DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEditDrawer && selectedRecordForEdit && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-black dark:text-white">Edit E911 Record</h3>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                      {selectedRecordForEdit.property_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditDrawer(false)}
                    className="p-1 rounded text-slate-500 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
                  </div>
                )}

                <form onSubmit={handleSaveEdit} id="edit-e911-form" className="space-y-3.5 mt-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      Emergency Dispatch Address *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.emergency_address}
                      onChange={(e) => setFormData({ ...formData, emergency_address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      PSAP Routing ID
                    </label>
                    <input
                      type="text"
                      value={formData.psap_id}
                      onChange={(e) => setFormData({ ...formData, psap_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      Validation Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="VERIFIED">PSAP Verified</option>
                      <option value="CORRECTION_REQUIRED">Correction Required</option>
                      <option value="PENDING">Validation Pending</option>
                      <option value="FAILED">Routing Failed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white mb-1">
                      Correction Notes / Audit Details
                    </label>
                    <textarea
                      rows={4}
                      value={formData.correction_notes}
                      onChange={(e) => setFormData({ ...formData, correction_notes: e.target.value })}
                      placeholder="e.g. Suite 400 location verification required by county PSAP."
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditDrawer(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  form="edit-e911-form"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. CORRECTION NOTES MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showNotesModal && selectedRecordForNotes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">Add E911 Correction Note</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                    {selectedRecordForNotes.property_name}
                  </p>
                </div>
                <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCorrectionNote} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Correction / Audit Note *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={correctionNoteInput}
                    onChange={(e) => setCorrectionNoteInput(e.target.value)}
                    placeholder="e.g. PSAP mismatch on floor/suite number; property contacted for clarification."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    Saving will set the record to "Correction Required" and append to the audit log.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNotesModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={noteLoading || !correctionNoteInput.trim()}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {noteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Save Note
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. CREATE E911 RECORD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-black dark:text-white">Register E911 Dispatch Endpoint</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Select Property & Organization *
                  </label>
                  <select
                    required
                    value={formData.org_property_id}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const opt = orgPropOptions.find((o) => o.org_property_id === selId);
                      setFormData({
                        ...formData,
                        org_property_id: selId,
                        emergency_address: opt?.address || formData.emergency_address,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">-- Choose Property --</option>
                    {orgPropOptions.map((opt, idx) => (
                      <option key={idx} value={opt.org_property_id}>
                        {opt.property_name} &bull; {opt.organization_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Emergency Dispatch Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. 100 Ocean Drive, Suite 200, Miami, FL 33139"
                    value={formData.emergency_address}
                    onChange={(e) => setFormData({ ...formData, emergency_address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    PSAP Identifier (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FL-MIA-PSAP-01"
                    value={formData.psap_id}
                    onChange={(e) => setFormData({ ...formData, psap_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Validation Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="PENDING">Validation Pending</option>
                    <option value="VERIFIED">PSAP Verified</option>
                    <option value="CORRECTION_REQUIRED">Correction Required</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={formLoading}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Register Address
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
