'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  FileText,
  Clock,
  Loader2,
  Check,
  Hotel,
} from 'lucide-react';

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'PORTING_WAITING'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

interface PropertyDetails {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  zip_code?: string;
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
  address_line1?: string;
  city?: string;
  state?: string;
}

interface OnboardingRecord {
  id: string;
  status: OnboardingStatus;
  target_date: string | null;
  contract_sent_at?: string | null;
  signed_at?: string | null;
  porting_waiting_at?: string | null;
  porting_submitted_at?: string | null;
  sof_waiting_at?: string | null;
  foc_received_at?: string | null;
  completed_at?: string | null;
  progress_pct: number;
  property_id?: string;
  property_name: string;
  organization_id?: string;
  organization_name: string;
  property_details?: PropertyDetails | null;
  organization_details?: OrganizationDetails | null;
  created_at: string;
  updated_at?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

function getStageBadge(status: OnboardingStatus): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]', pct: 10 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', pct: 25 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', pct: 40 };
    case 'PORTING_WAITING':
      return { label: 'Waiting for LOA', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 55 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', pct: 70 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 80 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50', pct: 90 };
    case 'COMPLETED':
      return { label: 'Live Cutover', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', pct: 100 };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700', pct: 0 };
  }
}

export default function AdminOnboardingPortingPage() {
  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-Side Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Real Database Metrics (No fake data)
  const [metrics, setMetrics] = useState({
    totalOnboardings: 0,
    completedCount: 0,
    inProgressCount: 0,
    pendingReviewCount: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; record: OnboardingRecord } | null>(null);

  // Drawers & Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<OnboardingRecord | null>(null);

  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<OnboardingRecord | null>(null);

  // Form State for creating a brand new property onboarding (NO Organization input needed)
  const [newPropertyForm, setNewPropertyForm] = useState({
    property_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    general_manager_name: '',
    contact_person_name: '',
    contact_person_email: '',
    main_phone: '',
    status: 'DRAFT' as OnboardingStatus,
    target_date: '',
  });

  // Form State for editing
  const [editFormData, setEditFormData] = useState({
    status: 'DRAFT' as OnboardingStatus,
    target_date: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Onboardings (Server-Side Paginated)
  const fetchOnboardings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        stage: selectedStageFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/onboarding?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch onboarding records.');
      }

      setOnboardings(result.data || []);
      if (result.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching onboarding:', err);
      setError(err.message || 'Error loading onboarding records.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedStageFilter, sortBy]);

  useEffect(() => {
    fetchOnboardings();
  }, [fetchOnboardings]);

  // Open 3-Dots Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record });
  };

  // --- Handlers: Create Brand New Property Onboarding ---
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyForm.property_name.trim()) {
      setFormError('Please enter the Property Name.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPropertyForm),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to initialize onboarding.');

      showToast('Property Added & Onboarding Started', `${newPropertyForm.property_name} registered in database.`, 'success');
      setShowCreateModal(false);
      fetchOnboardings();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Edit ---
  const handleOpenEdit = (record: OnboardingRecord) => {
    setSelectedRecordForEdit(record);
    setEditFormData({
      status: record.status,
      target_date: record.target_date || '',
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

      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForEdit.id,
          status: editFormData.status,
          target_date: editFormData.target_date || null,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update record.');

      showToast('Updated', 'Onboarding status updated.', 'success');
      setShowEditDrawer(false);
      fetchOnboardings();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedStageFilter('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStageFilter !== 'ALL' ||
    sortBy !== 'NEWEST';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all ${
                t.type === 'success'
                  ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                  : t.type === 'error'
                  ? 'bg-slate-900/95 border-rose-500/30 text-white'
                  : 'bg-slate-900/95 border-indigo-500/30 text-white'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
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

      {/* Page Header (Clean: No Subtitle, No Mini Component) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding & Porting</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const headers = ['ID,Property,Organization,Status,Progress,TargetDate\n'];
              const rows = onboardings.map((o) =>
                `"${o.id}","${o.property_name}","${o.organization_name}","${o.status}","${o.progress_pct}%","${o.target_date || 'N/A'}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `onboarding-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Onboarding records exported as CSV.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetAllFilters}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setNewPropertyForm({
                property_name: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                general_manager_name: '',
                contact_person_name: '',
                contact_person_email: '',
                main_phone: '',
                status: 'DRAFT',
                target_date: '',
              });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Onboarding
          </motion.button>
        </div>
      </div>

      {/* Real KPI Cards (No Fake Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && onboardings.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl animate-pulse space-y-2.5"
            >
              <div className="h-3 w-24 bg-slate-200 dark:bg-[#222430] rounded"></div>
              <div className="h-7 w-12 bg-slate-200 dark:bg-[#222430] rounded"></div>
              <div className="h-3 w-28 bg-slate-200 dark:bg-[#222430] rounded"></div>
            </div>
          ))
        ) : (
          <>
            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Onboardings
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Hotel className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalOnboardings}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tracked Deployments</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Live Cutover
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.completedCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Completed Cutover</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Porting In-Flight
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.inProgressCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Carrier LOA / FOC Stage</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Draft & Contract
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.pendingReviewCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pending Signatures</p>
            </motion.div>
          </>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property or organization name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
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
              value={selectedStageFilter}
              onChange={(e) => {
                setSelectedStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by stage"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">Stage: All Stages</option>
              <option value="DRAFT">Draft Initialized</option>
              <option value="CONTRACT_SENT">Contract Sent</option>
              <option value="SIGNED">Contract Signed</option>
              <option value="PORTING_WAITING">Waiting for LOA</option>
              <option value="PORTING_SUBMITTED">Porting Submitted</option>
              <option value="SOF_WAITING">SOF Review</option>
              <option value="FOC_RECEIVED">FOC Confirmed</option>
              <option value="COMPLETED">Live Cutover</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort records"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Created</option>
              <option value="PROP_ASC">Sort: Property Name (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
              <option value="STATUS">Sort: Progress % (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStageFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {selectedStageFilter}
                <button onClick={() => setSelectedStageFilter('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-slate-500 hover:text-indigo-600 text-xs font-medium underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Table View (Pure Black Headers, Separate Property & Org columns, No Location in table) */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load onboarding records</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchOnboardings()}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-1/5"></div>
              <div className="h-4 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <Hotel className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Onboarding Records</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No records matched the selected filters.'
              : 'Add a new property to start its onboarding and porting milestone tracker.'}
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
                setNewPropertyForm({
                  property_name: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  general_manager_name: '',
                  contact_person_name: '',
                  contact_person_email: '',
                  main_phone: '',
                  status: 'DRAFT',
                  target_date: '',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Onboarding
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">STAGE / MILESTONE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">TARGET CUTOVER</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {onboardings.map((record) => {
                  const badge = getStageBadge(record.status);
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
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-indigo-100 dark:border-indigo-900/40">
                            <Building2 className="w-3.5 h-3.5" />
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

                      {/* 3. Stage & Progress */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 max-w-[200px]">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                          <div className="w-full bg-slate-100 dark:bg-[#222430] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${record.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 4. Target Cutover Date */}
                      <td className="py-3.5 px-4">
                        {record.target_date ? (
                          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(record.target_date).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">TBD</span>
                        )}
                      </td>

                      {/* 5. Actions (3-Dots Trigger) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
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
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentPage === num
                      ? 'bg-[#4f46e5] text-white'
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
        </div>
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
              <p className="text-[10px] text-slate-400">Onboarding Options</p>
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
              <Info className="w-3.5 h-3.5 text-blue-500" /> View Details
            </button>

            {/* 2. Edit */}
            <button
              onClick={() => {
                const record = menuPosition.record;
                setMenuPosition(null);
                handleOpenEdit(record);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Edit Stage
            </button>
          </motion.div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW DETAILS DRAWER (High Contrast, No Light Gray) */}
      {/* ========================================================================= */}
      {showDetailsDrawer && selectedRecordForDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">Onboarding & Porting Details</h3>
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
                {/* Status & Timeline */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                  <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                    Stage & Timeline
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Current Milestone</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-400">
                      {getStageBadge(selectedRecordForDetails.status).label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Progress Completion</span>
                    <span className="font-bold text-black dark:text-white">{selectedRecordForDetails.progress_pct}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Target Cutover Date</span>
                    <span className="font-bold text-black dark:text-white">
                      {selectedRecordForDetails.target_date
                        ? new Date(selectedRecordForDetails.target_date).toLocaleDateString()
                        : 'Not Set'}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                  <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                    Property Specifications
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Property Name</span>
                    <span className="font-bold text-black dark:text-white">{selectedRecordForDetails.property_name}</span>
                  </div>
                  {selectedRecordForDetails.property_details && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">General Manager</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedRecordForDetails.property_details.general_manager_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Primary Contact</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedRecordForDetails.property_details.contact_person_name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Contact Email</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedRecordForDetails.property_details.contact_person_email || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Main Phone</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          {selectedRecordForDetails.property_details.main_phone || 'N/A'}
                        </span>
                      </div>
                      <div className="pt-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Address</span>
                        <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                          {selectedRecordForDetails.property_details.address || 'N/A'},{' '}
                          {selectedRecordForDetails.property_details.city}{' '}
                          {selectedRecordForDetails.property_details.state}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Organization Details */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                  <h4 className="font-bold text-black dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                    Managing Organization
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Organization Name</span>
                    <span className="font-bold text-black dark:text-white">
                      {selectedRecordForDetails.organization_name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowDetailsDrawer(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT ONBOARDING DRAWER */}
      {/* ========================================================================= */}
      {showEditDrawer && selectedRecordForEdit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-base font-bold text-black dark:text-white">Edit Onboarding Milestone</h3>
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

              <form onSubmit={handleSaveEdit} id="edit-onboarding-form" className="space-y-3.5 mt-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Onboarding Stage / Milestone *
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="DRAFT">Draft Initialized</option>
                    <option value="CONTRACT_SENT">Contract Sent</option>
                    <option value="SIGNED">Contract Signed</option>
                    <option value="PORTING_WAITING">Waiting for LOA</option>
                    <option value="PORTING_SUBMITTED">Porting Submitted</option>
                    <option value="SOF_WAITING">SOF Review</option>
                    <option value="FOC_RECEIVED">FOC Confirmed</option>
                    <option value="COMPLETED">Live Cutover (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Target Cutover Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.target_date}
                    onChange={(e) => setEditFormData({ ...editFormData, target_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowEditDrawer(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-onboarding-form"
                disabled={formLoading}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. START NEW PROPERTY ONBOARDING MODAL (No Organization Dropdown Required) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white">Start New Property Onboarding</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Register a new hotel property to track contract and porting cutover
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-3.5 text-xs">
              {/* 1. New Property Name */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Property Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grand Hyatt Miami Downtown"
                  value={newPropertyForm.property_name}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, property_name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 2. Physical Address */}
              <div>
                <label className="block font-bold text-slate-900 dark:text-white mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100 Biscayne Boulevard"
                  value={newPropertyForm.address}
                  onChange={(e) => setNewPropertyForm({ ...newPropertyForm, address: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 3. City, State, Zip */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Miami"
                    value={newPropertyForm.city}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, city: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">State</label>
                  <input
                    type="text"
                    placeholder="FL"
                    value={newPropertyForm.state}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, state: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">Zip Code</label>
                  <input
                    type="text"
                    placeholder="33131"
                    value={newPropertyForm.zip_code}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, zip_code: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 4. Contacts */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">General Manager</label>
                  <input
                    type="text"
                    placeholder="GM Full Name"
                    value={newPropertyForm.general_manager_name}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, general_manager_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">Main Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (305) 555-0100"
                    value={newPropertyForm.main_phone}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, main_phone: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* 5. Stage & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={newPropertyForm.status}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="DRAFT">Draft Initialized</option>
                    <option value="CONTRACT_SENT">Contract Sent</option>
                    <option value="SIGNED">Contract Signed</option>
                    <option value="PORTING_WAITING">Waiting for LOA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-900 dark:text-white mb-1">
                    Target Cutover Date
                  </label>
                  <input
                    type="date"
                    value={newPropertyForm.target_date}
                    onChange={(e) => setNewPropertyForm({ ...newPropertyForm, target_date: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Tracker
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
