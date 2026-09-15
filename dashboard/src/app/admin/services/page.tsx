'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Search,
  Plus,
  Download,
  MoreVertical,
  Building2,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  ArrowUpRight,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  Info,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] as any },
  },
};

// --- Interfaces ---
interface AttachedProperty {
  link_id?: string;
  org_property_id?: string;
  property_id?: string;
  name: string;
  city?: string;
  state?: string;
  address?: string;
  organization_id?: string;
  organization_name?: string;
}

interface ServiceRecord {
  id: string;
  phone_number: string;
  service_type: string;
  service_type_id?: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISCONNECTED';
  attached_properties: AttachedProperty[];
  attached_property_name: string;
  attached_organization_name: string;
  created_at: string;
  updated_at?: string;
}

interface OrgPropertyOption {
  org_property_id: string;
  property_id: string;
  property_name: string;
  property_city?: string;
  property_state?: string;
  organization_id: string;
  organization_name: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminServicesPage() {
  // Services State
  const [services, setServices] = useState<ServiceRecord[]>([]);
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
    totalServicesCount: 0,
    activeServicesCount: 0,
    assignedServicesCount: 0,
    inactiveOrSuspendedCount: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; service: ServiceRecord } | null>(null);

  // Drawers & Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<ServiceRecord | null>(null);

  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<ServiceRecord | null>(null);

  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [selectedServiceForProps, setSelectedServiceForProps] = useState<ServiceRecord | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedServiceForAssign, setSelectedServiceForAssign] = useState<ServiceRecord | null>(null);
  const [selectedOrgPropId, setSelectedOrgPropId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Form State for Provision / Edit
  const [formData, setFormData] = useState({
    phone_number: '',
    service_type_name: 'Direct Inward Dial (DID)',
    org_property_id: '',
    description: '',
    status: 'ACTIVE',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Property/Org Options for dropdowns
  const loadOrgPropertyOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const options: OrgPropertyOption[] = [];
        data.data.forEach((p: any) => {
          const links = Array.isArray(p.org_links) ? p.org_links : (p.org_links ? [p.org_links] : []);
          if (links.length > 0) {
            links.forEach((l: any) => {
              if (l && l.organization) {
                options.push({
                  org_property_id: l.id,
                  property_id: p.id,
                  property_name: p.name,
                  property_city: p.city,
                  property_state: p.state,
                  organization_id: l.organization.id,
                  organization_name: l.organization.name,
                });
              }
            });
          } else {
            // Unattached property option
            options.push({
              org_property_id: '',
              property_id: p.id,
              property_name: p.name,
              property_city: p.city,
              property_state: p.state,
              organization_id: '',
              organization_name: 'Unassigned',
            });
          }
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

  // Fetch Services (Server-Side Paginated)
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        serviceType: selectedTypeFilter,
        status: selectedStatusFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/services?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch services.');
      }

      setServices(result.data || []);
      if (result.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err.message || 'Error loading services data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedTypeFilter, selectedStatusFilter, sortBy]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Open 3-Dots Fixed Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, service: ServiceRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, service });
  };

  // --- Handlers: Create Service ---
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone_number.trim()) {
      setFormError('Phone number / DID identifier is required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create service.');

      showToast('Created', `${formData.phone_number} provisioned successfully.`, 'success');
      setShowCreateModal(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Edit Service ---
  const handleOpenEdit = (service: ServiceRecord) => {
    setSelectedServiceForEdit(service);
    const primaryLink = service.attached_properties[0];
    setFormData({
      phone_number: service.phone_number,
      service_type_name: service.service_type,
      org_property_id: primaryLink?.org_property_id || '',
      description: service.description || '',
      status: service.status,
    });
    setFormError(null);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForEdit) return;

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedServiceForEdit.id,
          ...formData,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update service.');

      showToast('Saved', `Service updated successfully.`, 'success');
      setShowEditDrawer(false);
      fetchServices();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Assign Service to Property ---
  const handleOpenAssignModal = (service: ServiceRecord) => {
    setSelectedServiceForAssign(service);
    const primaryLink = service.attached_properties[0];
    setSelectedOrgPropId(primaryLink?.org_property_id || 'UNASSIGNED');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForAssign) return;

    try {
      setAssignLoading(true);

      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedServiceForAssign.id,
          org_property_id: selectedOrgPropId === 'UNASSIGNED' ? '' : selectedOrgPropId,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update property assignment.');

      showToast('Assigned', 'Service property assignment updated.', 'success');
      setShowAssignModal(false);
      fetchServices();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedTypeFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedTypeFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL' ||
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
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-3 ${t.type === 'success'
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

      {/* Page Header (Clean: No Subtitle, No Mini Component) */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <PhoneCall size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Telephony Services</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['ID,PhoneNumber,ServiceType,Organization,AttachedProperty,Status\n'];
              const rows = services.map((s) =>
                `"${s.id}","${s.phone_number}","${s.service_type}","${s.attached_organization_name}","${s.attached_property_name}","${s.status}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `services-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Services list exported as CSV.', 'info');
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
              setFormData({
                phone_number: '',
                service_type_name: 'Direct Inward Dial (DID)',
                org_property_id: '',
                description: '',
                status: 'ACTIVE',
              });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Provision Service
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards (5 Design System Variants with Hover Pop) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && services.length === 0 ? (
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
            {/* Card 1: Total Services -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Total Services
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.totalServicesCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Lines</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Provisioned voice lines &amp; DIDs</p>
            </motion.div>

            {/* Card 2: Active Services -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Active Services
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.activeServicesCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Connected</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Operational &amp; connected</p>
            </motion.div>

            {/* Card 3: Assigned Services -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Assigned Services
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <Building2 size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.assignedServicesCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Bound</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Bound to property locations</p>
            </motion.div>

            {/* Card 4: Pending / Suspended -> Variant 1 (Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Pending / Suspended
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.inactiveOrSuspendedCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Attention</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Requires admin review</p>
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
              placeholder="Search services by phone number, DID, description..."
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
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by service type"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Type: All Types</option>
              <option value="Direct Inward Dial (DID)">Direct Inward Dial (DID)</option>
              <option value="SIP Trunk">SIP Trunk</option>
              <option value="Emergency PRI">Emergency PRI</option>
              <option value="Toll-Free DID">Toll-Free DID</option>
            </select>

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
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort services"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Created</option>
              <option value="NUMBER_ASC">Sort: Phone Number (A-Z)</option>
              <option value="NUMBER_DESC">Sort: Phone Number (Z-A)</option>
              <option value="TYPE_ASC">Sort: Service Type</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg">
              <button
                onClick={() => setViewMode('LIST')}
                aria-label="List View"
                className={`p-1 rounded transition cursor-pointer ${viewMode === 'LIST'
                    ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                aria-label="Grid View"
                className={`p-1 rounded transition cursor-pointer ${viewMode === 'GRID'
                    ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
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
            {selectedTypeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                {selectedTypeFilter}
                <button onClick={() => setSelectedTypeFilter('ALL')} className="cursor-pointer">
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

      {/* Main Table / Grid View */}
      {error ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load services</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchServices()}
            className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </motion.div>
      ) : loading && services.length === 0 ? (
        // Skeleton Loader
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-8 h-8 bg-slate-200 dark:bg-[#222430] rounded-lg"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-3/4"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-[#222430] rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </motion.div>
      ) : services.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <PhoneCall className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Services Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No services matched the selected filters.'
              : 'Get started by provisioning your first telephony voice line or DID.'}
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
                setFormData({
                  phone_number: '',
                  service_type_name: 'Direct Inward Dial (DID)',
                  org_property_id: '',
                  description: '',
                  status: 'ACTIVE',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Provision Service
            </motion.button>
          </div>
        </motion.div>
      ) : viewMode === 'LIST' ? (
        // Table View: Pure Black Headers & Pure Black Phone Number & ONLY Org Name
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">SERVICE & PHONE NUMBER</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">SERVICE TYPE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">ATTACHED PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {services.map((service) => {
                  return (
                    <tr key={service.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      {/* 1. Service & Phone Number (Arimo Font, No font-mono) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-blue-100 dark:border-blue-900/40">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-black dark:text-white text-sm block">
                              {service.phone_number}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">
                              {service.description || 'Voice Service Line'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Service Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {service.service_type}
                        </span>
                      </td>

                      {/* 3. Organization (ONLY NAME) */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-black dark:text-white">
                          {service.attached_organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 4. Attached Property */}
                      <td className="py-3.5 px-4">
                        {service.attached_property_name !== 'Unassigned' ? (
                          <div className="space-y-0.5">
                            <span className="font-medium text-slate-800 dark:text-slate-200 block truncate max-w-[170px]">
                              {service.attached_property_name}
                            </span>
                            {service.attached_properties.length > 1 && (
                              <button
                                onClick={() => {
                                  setSelectedServiceForProps(service);
                                  setShowPropertiesDrawer(true);
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-block cursor-pointer"
                              >
                                +{service.attached_properties.length - 1} more locations &rarr;
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Unassigned</span>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${service.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                            }`}
                        >
                          {service.status}
                        </span>
                      </td>

                      {/* 6. Actions (3-Dots Trigger) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(service)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, service)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
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

          {/* Server-Side Pagination Bar (10 items per page) */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} services
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
      ) : (
        // Grid View
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-black dark:text-white text-sm block">
                      {service.phone_number}
                    </span>
                    <p className="text-[11px] text-slate-400">{service.service_type}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${service.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                    }`}
                >
                  {service.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#1f212c] text-xs">
                <div>
                  <span className="text-slate-400 text-[11px]">Organization</span>
                  <p className="font-semibold text-black dark:text-white truncate">
                    {service.attached_organization_name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">Attached Property</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                    {service.attached_property_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1f212c]">
                <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {service.description || 'Voice Service'}
                </span>
                <button
                  onClick={(e) => handleOpenMenu(e, service)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* FIXED 3-DOTS ACTION POPUP (4 Specified Options) */}
      {/* ========================================================================= */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.service.phone_number}</p>
              <p className="text-[10px] text-slate-400">Service Options</p>
            </div>

            {/* Option 1: Edit Service */}
            <button
              onClick={() => {
                const service = menuPosition.service;
                setMenuPosition(null);
                handleOpenEdit(service);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Edit Service
            </button>

            {/* Option 2: View Details */}
            <button
              onClick={() => {
                const service = menuPosition.service;
                setMenuPosition(null);
                setSelectedServiceForDetails(service);
                setShowDetailsDrawer(true);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> View Details
            </button>

            {/* Option 3: See Properties in which this service is attached */}
            <button
              onClick={() => {
                const service = menuPosition.service;
                setMenuPosition(null);
                setSelectedServiceForProps(service);
                setShowPropertiesDrawer(true);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> See Properties
            </button>

            {/* Option 4: Assign this service to property (dropdown modal) */}
            <button
              onClick={() => {
                const service = menuPosition.service;
                setMenuPosition(null);
                handleOpenAssignModal(service);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 border-t border-slate-100 dark:border-[#222430] cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /> Assign to Property
            </button>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW SERVICE DETAILS DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDetailsDrawer && selectedServiceForDetails && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Service Details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Specifications & configuration</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsDrawer(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Telephony Identification
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phone Number / DID</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedServiceForDetails.phone_number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                      <span className="text-slate-400">Service Type</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {selectedServiceForDetails.service_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Organization & Property Association
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Organization</span>
                      <span className="font-semibold text-black dark:text-white">
                        {selectedServiceForDetails.attached_organization_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Attached Property</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {selectedServiceForDetails.attached_property_name}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Status & Description
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedServiceForDetails.status}
                      </span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-400">Description</span>
                      <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                        {selectedServiceForDetails.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2e3c] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. SEE PROPERTIES DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPropertiesDrawer && selectedServiceForProps && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Attached Properties</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Properties using <span className="font-semibold text-slate-900 dark:text-white">{selectedServiceForProps.phone_number}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPropertiesDrawer(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedServiceForProps.attached_properties.length === 0 && selectedServiceForProps.attached_property_name === 'Unassigned' ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">No properties attached</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">This service is currently not assigned to any property.</p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setShowPropertiesDrawer(false);
                        handleOpenAssignModal(selectedServiceForProps);
                      }}
                      className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <LinkIcon className="w-3.5 h-3.5" /> Assign Property Now
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(selectedServiceForProps.attached_properties.length > 0
                      ? selectedServiceForProps.attached_properties
                      : [{ name: selectedServiceForProps.attached_property_name, organization_name: selectedServiceForProps.attached_organization_name }]
                    ).map((prop: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{prop.name}</p>
                            <p className="text-[11px] text-slate-400">
                              Organization: <span className="font-medium text-slate-700 dark:text-slate-300">{prop.organization_name || 'Unassigned'}</span>
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/admin/properties`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          View <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end">
                <button
                  onClick={() => setShowPropertiesDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#2c2e3c] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. ASSIGN SERVICE TO PROPERTY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAssignModal && selectedServiceForAssign && (
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
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Service to Property</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedServiceForAssign.phone_number}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Property & Organization
                  </label>
                  <select
                    value={selectedOrgPropId}
                    onChange={(e) => setSelectedOrgPropId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs cursor-pointer"
                  >
                    <option value="UNASSIGNED">-- Unassigned (No Property) --</option>
                    {orgPropOptions.map((opt, idx) => (
                      <option key={idx} value={opt.org_property_id || opt.property_id}>
                        {opt.property_name} {opt.property_city ? `(${opt.property_city})` : ''} &bull; {opt.organization_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Associating this service allows the property's PBX routing and DID allocation to activate.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={assignLoading}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {assignLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save Assignment
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. EDIT SERVICE DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEditDrawer && selectedServiceForEdit && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Service</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedServiceForEdit.phone_number}</p>
                  </div>
                  <button
                    onClick={() => setShowEditDrawer(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {formError && (
                  <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
                  </div>
                )}

                <form onSubmit={handleSaveEdit} id="edit-service-form" className="space-y-3.5 mt-5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number / DID *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Service Type
                    </label>
                    <select
                      value={formData.service_type_name}
                      onChange={(e) => setFormData({ ...formData, service_type_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="Direct Inward Dial (DID)">Direct Inward Dial (DID)</option>
                      <option value="SIP Trunk">SIP Trunk</option>
                      <option value="Emergency PRI">Emergency PRI</option>
                      <option value="Toll-Free DID">Toll-Free DID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Attached Property Location
                    </label>
                    <select
                      value={formData.org_property_id}
                      onChange={(e) => setFormData({ ...formData, org_property_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="">-- No Property (Unassigned) --</option>
                      {orgPropOptions.map((opt, idx) => (
                        <option key={idx} value={opt.org_property_id || opt.property_id}>
                          {opt.property_name} ({opt.organization_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Front Desk Direct Line"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditDrawer(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  form="edit-service-form"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
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
      {/* 5. PROVISION SERVICE MODAL */}
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Provision New Service</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveCreate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number / DID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.service_type_name}
                    onChange={(e) => setFormData({ ...formData, service_type_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="Direct Inward Dial (DID)">Direct Inward Dial (DID)</option>
                    <option value="SIP Trunk">SIP Trunk</option>
                    <option value="Emergency PRI">Emergency PRI</option>
                    <option value="Toll-Free DID">Toll-Free DID</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attach to Property
                  </label>
                  <select
                    value={formData.org_property_id}
                    onChange={(e) => setFormData({ ...formData, org_property_id: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">-- Leave Unassigned --</option>
                    {orgPropOptions.map((opt, idx) => (
                      <option key={idx} value={opt.org_property_id || opt.property_id}>
                        {opt.property_name} ({opt.organization_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Label
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Reservation Line"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={formLoading}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Provision Line
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
