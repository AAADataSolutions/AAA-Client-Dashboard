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
  Eye,
  MessageSquare,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchE911Records,
  setSearchQuery,
  setStatusFilter,
  setComplianceFilter,
  setSortBy,
  setPagination,
  optimisticUpdateE911Status,
  E911Item,
} from '@/store/slices/e911Slice';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export type E911Status = 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUIRED' | 'FAILED' | 'ACTIVE';

function getStatusBadge(status: E911Status | string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'VERIFIED':
    case 'ACTIVE':
      return {
        label: 'Active / PSAP Verified',
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

interface PropertyOption {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  org_property_id?: string;
  organization_name?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminE911Page() {
  const dispatch = useAppDispatch();
  const {
    items: records,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.e911);

  const [propertyList, setPropertyList] = useState<PropertyOption[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<E911Item | null>(null);

  // Unified Details & Notes Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<E911Item | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'DETAILS' | 'NOTES'>('DETAILS');
  const [newCorrectionNote, setNewCorrectionNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // 3-Dots Action Menu Position
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; record: E911Item } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Form State for Add / Edit
  const [createForm, setCreateForm] = useState({
    property_id: '',
    emergency_address: '',
    status: 'PENDING' as E911Status,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    emergency_address: '',
    status: 'PENDING' as E911Status,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load all properties for the Add modal dropdown
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/admin/properties?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const props: PropertyOption[] = data.data.map((p: any) => {
            const orgLinks = Array.isArray(p.org_links) ? p.org_links : (p.org_links ? [p.org_links] : []);
            const firstOrg = orgLinks[0]?.organization?.name || p.primary_organization?.name || p.organization_name || 'Unassigned';
            const firstOrgPropId = p.org_property_id || orgLinks[0]?.id || '';

            return {
              id: p.id,
              name: p.name,
              address: p.address,
              city: p.city,
              state: p.state,
              zip_code: p.zip_code,
              org_property_id: firstOrgPropId,
              organization_name: firstOrg,
            };
          });
          setPropertyList(props);
        }
      } catch (err) {
        console.warn('Could not load properties dropdown:', err);
      }
    }
    loadProperties();
  }, []);

  // Fetch E911 Records via Redux
  const loadData = useCallback(() => {
    dispatch(
      fetchE911Records({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        status: filters.selectedStatus,
        compliance: filters.selectedCompliance,
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

  // Open 3-Dots Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, rec: E911Item) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record: rec });
  };

  // Open Details Modal
  const openDetailsModal = (rec: E911Item, tab: 'DETAILS' | 'NOTES' = 'DETAILS') => {
    setSelectedRecordForDetails(rec);
    setModalActiveTab(tab);
    setNewCorrectionNote('');
    setShowDetailsModal(true);
  };

  // Handle Create E911 Record
  const handlePropertySelectInAdd = (propId: string) => {
    const selectedProp = propertyList.find((p) => p.id === propId);
    if (selectedProp) {
      const fullAddr = `${selectedProp.address}, ${selectedProp.city}, ${selectedProp.state} ${selectedProp.zip_code}`.trim();
      setCreateForm({
        ...createForm,
        property_id: propId,
        emergency_address: fullAddr,
      });
    } else {
      setCreateForm({
        ...createForm,
        property_id: propId,
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_id) {
      setCreateError('Please choose a property.');
      return;
    }
    if (!createForm.emergency_address.trim()) {
      setCreateError('Emergency dispatch address is required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const chosenProp = propertyList.find((p) => p.id === createForm.property_id);

      const res = await fetch('/api/admin/e911', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: createForm.property_id,
          organization_property_id: chosenProp?.org_property_id || null,
          emergency_address: createForm.emergency_address.trim(),
          status: createForm.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create E911 record.');

      showToast('E911 Created', `Record registered for ${chosenProp?.name || 'property'}.`, 'success');
      setShowCreateModal(false);
      setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Edit E911 Record
  const handleOpenEdit = (rec: E911Item) => {
    setSelectedRecordForEdit(rec);
    setEditForm({
      emergency_address: rec.emergency_address || '',
      status: (rec.status as E911Status) || 'PENDING',
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    if (!editForm.emergency_address.trim()) {
      setEditError('Emergency dispatch address is required.');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForEdit.id,
          emergency_address: editForm.emergency_address.trim(),
          status: editForm.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update E911 record.');

      showToast('E911 Updated', 'Record details updated successfully.', 'success');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Append Correction Note
  const handleAddCorrectionNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForDetails || !newCorrectionNote.trim()) return;

    try {
      setAddingNote(true);
      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForDetails.id,
          append_correction_note: newCorrectionNote.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to add note.');

      showToast('Note Added', 'Correction note appended successfully.', 'success');
      setNewCorrectionNote('');
      setShowDetailsModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStatusFilter('ALL'));
    dispatch(setComplianceFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedStatus !== 'ALL' ||
    filters.selectedCompliance !== 'ALL' ||
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
            <ShieldCheck size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ray Baum and Kary's Law Compliance</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['Property,Property Address,Organization,Emergency Dispatch Address,Status,Ray Baum\n'];
              const rows = records.map((r: E911Item) =>
                `"${r.property_name}","${r.emergency_address}","${r.organization_name}","${r.emergency_address}","${r.status}","${r.ray_baum_compliant ? 'Verified' : 'Non-Verified'}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `e911-records-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'E911 records exported as CSV.', 'info');
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
              setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add E911 Location
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards - ONLY Variant 1 (Deep Blue) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Locations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Total Locations
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalRecordsCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Mapped</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Dispatchable hotel locations</p>
        </motion.div>

        {/* Card 2: PSAP Verified */}
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
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Compliant</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">100% emergency dispatch ready</p>
        </motion.div>

        {/* Card 3: Correction Required */}
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
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Action</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Address formatting review</p>
        </motion.div>

        {/* Card 4: Pending or Failed */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Pending / In-Flight
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.pendingOrFailedCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">In-Queue</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Carrier validation in progress</p>
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
              placeholder="Search by property, emergency address, org, PSAP..."
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
              value={filters.selectedStatus}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by validation status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="VERIFIED">PSAP Verified</option>
              <option value="PENDING">Validation Pending</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="FAILED">Routing Failed</option>
            </select>

            <select
              value={filters.selectedCompliance}
              onChange={(e) => {
                dispatch(setComplianceFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by Ray Baum compliance"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Ray Baum: All</option>
              <option value="COMPLIANT">Verified</option>
              <option value="NON_COMPLIANT">Non-Verified</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Sort E911 records"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PROP_ASC">Sort: Property (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
              <option value="STATUS">Sort: Status</option>
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
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load E911 records</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && records.length === 0 ? (
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
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No E911 Records Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No records match the selected filters.'
              : 'Add your first dispatchable location for PSAP verification.'}
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
                setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add E911 Location
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
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY ADDRESS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">EMERGENCY DISPATCH ADDRESS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">RAY BAUM AND KARY'S LAW</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {records.map((rec: E911Item) => {
                  const badge = getStatusBadge(rec.status as E911Status);

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openDetailsModal(rec, 'DETAILS')}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Property Name (NO badge icon) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {rec.property_name}
                        </span>
                      </td>

                      {/* 2. Property Address */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300">
                          {rec.property_details?.address || rec.emergency_address}
                        </span>
                      </td>

                      {/* 3. Organization Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {rec.organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 4. Emergency Dispatch Address */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {rec.emergency_address}
                        </span>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                      </td>

                      {/* 6. Ray Baum Act (Single Line) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.ray_baum_compliant ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 whitespace-nowrap">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" /> Non-Verified
                          </span>
                        )}
                      </td>

                      {/* 7. Actions (Edit Pencil and Three Dots) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, rec)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="More Options"
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
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} records
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
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.record.property_name}</p>
              <p className="text-[10px] text-slate-400">E911 Options</p>
            </div>

            <button
              onClick={() => {
                openDetailsModal(menuPosition.record, 'DETAILS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                handleOpenEdit(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Record</span>
            </button>

            <button
              onClick={() => {
                openDetailsModal(menuPosition.record, 'NOTES');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>Correction Notes</span>
            </button>
          </div>
        </>
      )}

      {/* 1. UNIFIED DETAILS & CORRECTION NOTES MODAL */}
      <AnimatePresence>
        {showDetailsModal && selectedRecordForDetails && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedRecordForDetails.property_name}</h3>
                    <p className="text-xs text-slate-400">Emergency Dispatch &amp; PSAP Record</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                    <button
                      type="button"
                      onClick={() => setModalActiveTab('DETAILS')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        modalActiveTab === 'DETAILS'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalActiveTab('NOTES')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        modalActiveTab === 'NOTES'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Correction Notes
                    </button>
                  </div>

                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Details */}
              {modalActiveTab === 'DETAILS' && (
                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Property Name</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRecordForDetails.property_name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Assigned Organization</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRecordForDetails.organization_name}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-black dark:text-white block">Emergency Dispatch Address</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedRecordForDetails.emergency_address}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Validation Status</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedRecordForDetails.status}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Ray Baum Compliance</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRecordForDetails.ray_baum_compliant ? 'Verified' : 'Audit Required'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Correction Notes */}
              {modalActiveTab === 'NOTES' && (
                <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Audit History &amp; Correction Logs</h4>
                    {selectedRecordForDetails.correction_notes ? (
                      <div className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl space-y-2 whitespace-pre-wrap font-mono text-[11px] text-slate-800 dark:text-slate-200">
                        {selectedRecordForDetails.correction_notes}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic p-4 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                        No correction notes logged for this location yet.
                      </p>
                    )}
                  </div>

                  {/* Add New Note */}
                  <form onSubmit={handleAddCorrectionNote} className="pt-3 border-t border-slate-100 dark:border-[#222430] space-y-2.5">
                    <label className="font-bold text-black dark:text-white block">Add Note / Carrier Feedback</label>
                    <textarea
                      rows={3}
                      required
                      value={newCorrectionNote}
                      onChange={(e) => setNewCorrectionNote(e.target.value)}
                      placeholder="Enter verification notes, PSAP dispatch corrections, or room-level details..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={addingNote || !newCorrectionNote.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Append Note'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ADD E911 MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Emergency Dispatch Location</h3>
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
                {/* 1. Choose Property */}
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Choose Property <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.property_id}
                    onChange={(e) => handlePropertySelectInAdd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Property...</option>
                    {propertyList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.organization_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Emergency Dispatch Address */}
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Emergency Dispatch Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={createForm.emergency_address}
                    onChange={(e) => setCreateForm({ ...createForm, emergency_address: e.target.value })}
                    placeholder="Enter full MSAG-compliant street address, suite/floor, city, state & zip..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 3. Validation Status */}
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Validation Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as E911Status })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="VERIFIED">Active / PSAP Verified</option>
                    <option value="PENDING">Pending Validation</option>
                    <option value="CORRECTION_REQUIRED">Correction Required</option>
                  </select>
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
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Register Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. EDIT E911 MODAL */}
      <AnimatePresence>
        {showEditModal && selectedRecordForEdit && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit E911 Record</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Property</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                    {selectedRecordForEdit.property_name} ({selectedRecordForEdit.organization_name})
                  </p>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Emergency Dispatch Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.emergency_address}
                    onChange={(e) => setEditForm({ ...editForm, emergency_address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Validation Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as E911Status })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="VERIFIED">Active / PSAP Verified</option>
                    <option value="PENDING">Pending Validation</option>
                    <option value="CORRECTION_REQUIRED">Correction Required</option>
                    <option value="FAILED">Routing Failed</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
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
