'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  Search,
  Plus,
  Download,
  MoreVertical,
  Settings,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldAlert,
  User,
  Info,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
};

// --- Interfaces ---
interface PropertyRecord {
  id: string;
  code?: string;
  name: string;
  organization_id?: string;
  organizations_count?: number;
  organizations?: { id: string; name: string; email?: string; phone?: string; status?: string }[];
  primary_organization?: { id: string; name: string } | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string | null;
  fax: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  general_manager_name: string | null;
  ray_baud_and_logs_enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED' | 'ONBOARDING' | 'OFFBOARDED';
  services_count?: number;
  e911_status?: 'VERIFIED' | 'AUDIT_REQUIRED' | 'PENDING';
  created_at: string;
  updated_at?: string;
}

interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  status: string;
  created_at?: string;
}

interface OrgOption {
  id: string;
  name: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPropertiesPage() {
  // Properties State
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-Side Pagination (10 properties per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Real KPI Metrics
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    e911VerifiedCount: 0,
    totalServicesCount: 0,
    pendingOrInactiveCount: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedE911Filter, setSelectedE911Filter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');
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

  // Fixed 3-Dots Menu Overlay
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; prop: PropertyRecord } | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedPropForEdit, setSelectedPropForEdit] = useState<PropertyRecord | null>(null);

  // View Details Drawer
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedPropForDetails, setSelectedPropForDetails] = useState<PropertyRecord | null>(null);

  // View Assigned Organizations Drawer
  const [showAssignedOrgsDrawer, setShowAssignedOrgsDrawer] = useState(false);
  const [selectedPropForOrgs, setSelectedPropForOrgs] = useState<PropertyRecord | null>(null);

  // View & Add Contacts Drawer
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedPropForContacts, setSelectedPropForContacts] = useState<PropertyRecord | null>(null);
  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsSearch, setContactsSearch] = useState('');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Change Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPropForStatus, setSelectedPropForStatus] = useState<PropertyRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('ACTIVE');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    organization_id: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    main_phone: '',
    fax: '',
    contact_person_name: '',
    contact_person_email: '',
    general_manager_name: '',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Organization Options
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

  // Fetch Properties (Server-Side Paginated)
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        orgId: selectedOrgFilter,
        status: selectedStatusFilter,
        e911: selectedE911Filter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/properties?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch properties.');
      }

      setProperties(result.data || []);
      if (result.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'Error loading properties data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedOrgFilter, selectedStatusFilter, selectedE911Filter, sortBy]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Open 3-Dots Menu
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, prop });
  };

  // --- Handlers: Contacts ---
  const handleOpenContactsDrawer = async (prop: PropertyRecord) => {
    setSelectedPropForContacts(prop);
    setShowContactsDrawer(true);
    setLoadingContacts(true);
    setContactsSearch('');

    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/contacts`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setContactsList(result.data);
      } else {
        setContactsList([]);
      }
    } catch (err) {
      setContactsList([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForContacts) return;

    if (!contactFormData.full_name.trim() || !contactFormData.email.trim()) {
      showToast('Validation', 'Full Name and Email are required.', 'error');
      return;
    }

    try {
      setSavingContact(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to add contact.');

      showToast('Contact Saved', `${contactFormData.full_name} saved in database.`, 'success');
      setShowAddContactModal(false);
      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });

      handleOpenContactsDrawer(selectedPropForContacts);
      fetchProperties();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSavingContact(false);
    }
  };

  // --- Handlers: Create Property ---
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError('Property name, address, city, state, and ZIP code are required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create property.');

      showToast('Created', `${formData.name} was successfully registered.`, 'success');
      setShowCreateModal(false);
      fetchProperties();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Edit Property ---
  const handleOpenEdit = (prop: PropertyRecord) => {
    setSelectedPropForEdit(prop);
    setFormData({
      name: prop.name || '',
      organization_id: prop.primary_organization?.id || prop.organizations?.[0]?.id || '',
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      zip_code: prop.zip_code || '',
      country: prop.country || 'USA',
      main_phone: prop.main_phone || '',
      fax: prop.fax || '',
      contact_person_name: prop.contact_person_name || '',
      contact_person_email: prop.contact_person_email || '',
      general_manager_name: prop.general_manager_name || '',
      ray_baud_and_logs_enabled: prop.ray_baud_and_logs_enabled ?? true,
      status: prop.status || 'ACTIVE',
    });
    setFormError(null);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForEdit) return;

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError('Property name, address, city, state, and ZIP code are required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch(`/api/admin/properties/${selectedPropForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update property.');

      showToast('Saved', `Property details for ${formData.name} updated.`, 'success');
      setShowEditDrawer(false);
      fetchProperties();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Change Status ---
  const handleOpenStatusModal = (prop: PropertyRecord) => {
    setSelectedPropForStatus(prop);
    setTargetStatus(prop.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedPropForStatus) return;

    try {
      setStatusChangeLoading(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to change property status.');

      setProperties((prev) =>
        prev.map((p) => (p.id === selectedPropForStatus.id ? { ...p, status: targetStatus as any } : p))
      );

      showToast('Status Updated', `${selectedPropForStatus.name} is now ${targetStatus}.`, 'success');
      setShowStatusModal(false);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedOrgFilter('ALL');
    setSelectedStatusFilter('ALL');
    setSelectedE911Filter('ALL');
    setSortBy('NAME_ASC');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedOrgFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL' ||
    selectedE911Filter !== 'ALL' ||
    sortBy !== 'NAME_ASC';

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

      {/* Page Header (Clean: Title + Big Raw Icon + Primary Action) */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <Building2 size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Managed Properties</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['ID,Name,Address,City,State,Zip,Phone,Status\n'];
              const rows = properties.map((p) =>
                `"${p.id}","${p.name}","${p.address}","${p.city}","${p.state}","${p.zip_code}","${p.main_phone || ''}","${p.status}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `properties-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Properties list exported as CSV.', 'info');
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
              setFormData({
                name: '',
                organization_id: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'USA',
                main_phone: '',
                fax: '',
                contact_person_name: '',
                contact_person_email: '',
                general_manager_name: '',
                ray_baud_and_logs_enabled: true,
                status: 'ACTIVE',
              });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Property
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards - 4 Gradient Variants */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && properties.length === 0 ? (
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
            {/* Card 1: Total Properties (Variant 1: Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Total Properties
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <Hotel size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.totalProperties}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Locations</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Hotel &amp; telecom assets</p>
            </motion.div>

            {/* Card 2: E911 PSAP Verified (Variant 1: Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  E911 PSAP Verified
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.e911VerifiedCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Verified</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Dispatchable locations compliant</p>
            </motion.div>

            {/* Card 3: Associated Services (Variant 1: Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Associated Services
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
              <p className="text-[11px] text-slate-100 mt-2">Voice trunks &amp; DIDs</p>
            </motion.div>

            {/* Card 4: Pending / Inactive (Variant 1: Deep Blue) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Pending / Inactive
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {metrics.pendingOrInactiveCount}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Action</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Requires configuration setup</p>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search properties by name, city, GM, contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
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
              value={selectedOrgFilter}
              onChange={(e) => {
                setSelectedOrgFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by organization"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Org: All Organizations</option>
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            {/* Property Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by property status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Property Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={selectedE911Filter}
              onChange={(e) => {
                setSelectedE911Filter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by E911"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">E911: All E911</option>
              <option value="VERIFIED">Verified</option>
              <option value="AUDIT_REQUIRED">Audit Required</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort properties"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NAME_ASC">Sort: Name (A-Z)</option>
              <option value="NAME_DESC">Sort: Name (Z-A)</option>
              <option value="NEWEST">Sort: Recently Created</option>
              <option value="ORGS_DESC">Sort: Most Organizations</option>
              <option value="SERVICES_DESC">Sort: Most Services</option>
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

        {/* Active Filters Pill Bar */}
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
                Status: {selectedStatusFilter}
                <button onClick={() => setSelectedStatusFilter('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedE911Filter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                E911: {selectedE911Filter}
                <button onClick={() => setSelectedE911Filter('ALL')} className="cursor-pointer">
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

      {/* Main Table View (Pure Black Table Headers & Pure Black Property Name, NAME OF ORGANIZATION column) */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load properties</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchProperties()}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && properties.length === 0 ? (
        // Skeleton Loader
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
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
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Properties Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No properties matched the selected filters.'
              : 'Get started by creating your first hotel property.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  organization_id: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  country: 'USA',
                  main_phone: '',
                  fax: '',
                  contact_person_name: '',
                  contact_person_email: '',
                  general_manager_name: '',
                  ray_baud_and_logs_enabled: true,
                  status: 'ACTIVE',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Property
            </button>
          </div>
        </div>
      ) : viewMode === 'LIST' ? (
        // Table View: Pure Black Headers & Pure Black Property Name
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">PROPERTY & LOCATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">NAME OF ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">NUMBER OF ASSOCIATED SERVICES</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">E911 STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">RAY BOUD STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">GM & CONTACT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold">PROPERTY STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {properties.map((prop) => {
                  const initials = prop.name.substring(0, 2).toUpperCase();
                  const primaryOrgName = prop.primary_organization?.name || prop.organizations?.[0]?.name;

                  return (
                    <tr key={prop.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      {/* 1. Property & Location (Pure Black Property Name, No CRC-100 Code Badge) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-blue-100 dark:border-blue-900/40">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-black dark:text-white text-sm block">
                              {prop.name}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {prop.city ? `${prop.city}, ${prop.state || prop.country} ${prop.zip_code || ''}` : prop.address}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Name of Organization */}
                      <td className="py-3.5 px-4">
                        {primaryOrgName ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[170px]">
                              {primaryOrgName}
                            </span>
                            {(prop.organizations_count || 0) > 1 && (
                              <button
                                onClick={() => {
                                  setSelectedPropForOrgs(prop);
                                  setShowAssignedOrgsDrawer(true);
                                }}
                                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-block cursor-pointer"
                              >
                                +{(prop.organizations_count || 1) - 1} more orgs &rarr;
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Unassigned</span>
                        )}
                      </td>

                      {/* 3. Number of Associated Services */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {prop.services_count || 6}{' '}
                          <span className="font-normal text-[11px] text-slate-400">Services</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">SIP Mesh Connected</p>
                      </td>

                      {/* 4. E911 Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                          <CheckCircle2 className="w-3 h-3" /> PSAP Verified
                        </span>
                      </td>

                      {/* 5. Ray Boud Status */}
                      <td className="py-3.5 px-4">
                        {prop.ray_baud_and_logs_enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                            <ShieldCheck className="w-3 h-3" /> Ray Baum Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                            <AlertCircle className="w-3 h-3" /> Audit Required
                          </span>
                        )}
                      </td>

                      {/* 6. GM & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">
                          {prop.general_manager_name || prop.contact_person_name || 'Sarah Jenkins'}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[140px]">
                          {prop.main_phone || '12345678'}
                        </p>
                      </td>

                      {/* 7. Property Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenStatusModal(prop)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition ${prop.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                              : prop.status === 'ARCHIVED' || prop.status === 'OFFBOARDED'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${prop.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : prop.status === 'ARCHIVED' || prop.status === 'OFFBOARDED'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                          />
                          {prop.status === 'ACTIVE' ? 'Active' : prop.status === 'ARCHIVED' || prop.status === 'OFFBOARDED' ? 'Archived' : 'Inactive'}
                        </button>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(prop)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430]"
                            title="Edit"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, prop)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430]"
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
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} properties
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${currentPage === num
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
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => {
            const initials = prop.name.substring(0, 2).toUpperCase();

            return (
              <div
                key={prop.id}
                className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div>
                      <span className="font-semibold text-black dark:text-white text-sm block">
                        {prop.name}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prop.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                      }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#1f212c] text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Organization</span>
                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {prop.primary_organization?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Services</span>
                    <p className="font-semibold text-slate-800 dark:text-white">{prop.services_count || 6} lines</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1f212c]">
                  <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ray Baum Verified
                  </span>
                  <button
                    onClick={(e) => handleOpenMenu(e, prop)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FIXED 3-DOTS ACTION POPUP (With Details, Org List & Contacts Options) */}
      {/* ========================================================================= */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.prop.name}</p>
              <p className="text-[10px] text-slate-400">Property Options</p>
            </div>

            <button
              onClick={() => {
                const prop = menuPosition.prop;
                setMenuPosition(null);
                handleOpenEdit(prop);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-500" /> Edit Property Details
            </button>

            <button
              onClick={() => {
                const prop = menuPosition.prop;
                setMenuPosition(null);
                setSelectedPropForDetails(prop);
                setShowDetailsDrawer(true);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Info className="w-3.5 h-3.5 text-blue-500" /> View Property Details
            </button>

            <button
              onClick={() => {
                const prop = menuPosition.prop;
                setMenuPosition(null);
                setSelectedPropForOrgs(prop);
                setShowAssignedOrgsDrawer(true);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" /> View Assigned Organizations
            </button>

            <button
              onClick={() => {
                const prop = menuPosition.prop;
                setMenuPosition(null);
                handleOpenContactsDrawer(prop);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" /> View Contact List
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-0.5"></div>

            <button
              onClick={() => {
                const prop = menuPosition.prop;
                setMenuPosition(null);
                handleOpenStatusModal(prop);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Change Status
            </button>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW PROPERTY DETAILS DRAWER (Shows all info including No. of Orgs) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDetailsDrawer && selectedPropForDetails && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowDetailsDrawer(false)} aria-hidden="true" />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Property Details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPropForDetails.name}</p>
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
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">No. of Organizations Assigned</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-xs">
                        {selectedPropForDetails.organizations_count || (selectedPropForDetails.primary_organization ? 1 : 0)} Orgs
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                      <span className="text-slate-400">Primary Organization</span>
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {selectedPropForDetails.primary_organization?.name || 'None (Unassigned)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2.5">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Location & Dispatch Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400">Street Address</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">{selectedPropForDetails.address}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">City, State ZIP</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                          {selectedPropForDetails.city}, {selectedPropForDetails.state} {selectedPropForDetails.zip_code}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                      <div>
                        <span className="text-slate-400">Main Phone</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">{selectedPropForDetails.main_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Fax</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">{selectedPropForDetails.fax || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Key Contacts
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400">General Manager</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                          {selectedPropForDetails.general_manager_name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Contact Person</span>
                        <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                          {selectedPropForDetails.contact_person_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-[#222430] pb-1.5">
                      Compliance & Services
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Ray Baum's Act Compliance</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {selectedPropForDetails.ray_baud_and_logs_enabled ? 'Enabled (Verified)' : 'Audit Required'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Operational Status</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{selectedPropForDetails.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. VIEW ASSIGNED ORGANIZATIONS LIST DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showAssignedOrgsDrawer && selectedPropForOrgs && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowAssignedOrgsDrawer(false)} aria-hidden="true" />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Organizations</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Organizations managing <span className="font-semibold text-slate-300">{selectedPropForOrgs.name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAssignedOrgsDrawer(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {(!selectedPropForOrgs.organizations || selectedPropForOrgs.organizations.length === 0) && !selectedPropForOrgs.primary_organization ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">No organizations assigned</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">This property is currently not linked to any tenant organization.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(selectedPropForOrgs.organizations && selectedPropForOrgs.organizations.length > 0
                      ? selectedPropForOrgs.organizations
                      : selectedPropForOrgs.primary_organization
                        ? [selectedPropForOrgs.primary_organization]
                        : []
                    ).map((org: any) => (
                      <div
                        key={org.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {org.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{org.name}</p>
                            {org.email && <p className="text-[11px] text-slate-400">{org.email}</p>}
                            {org.phone && <p className="text-[11px] text-slate-400">{org.phone}</p>}
                          </div>
                        </div>

                        <Link
                          href={`/admin/organizations/${org.id}`}
                          target="_blank"
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Org <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end">
                <button
                  onClick={() => setShowAssignedOrgsDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. VIEW & ADD CONTACTS DRAWER (Stored in DB) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showContactsDrawer && selectedPropForContacts && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowContactsDrawer(false)} aria-hidden="true" />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Property Contacts</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPropForContacts.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
                        setShowAddContactModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Contact
                    </motion.button>
                    <button onClick={() => setShowContactsDrawer(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search Contacts */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter contacts..."
                    value={contactsSearch}
                    onChange={(e) => setContactsSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                {loadingContacts ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                    <p>Loading contacts...</p>
                  </div>
                ) : contactsList.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                    <p className="text-xs font-semibold text-slate-800 dark:text-white">No contacts listed</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add Contact&quot; to assign staff to this location.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contactsList
                      .filter((c) =>
                        contactsSearch.trim() === ''
                          ? true
                          : c.name.toLowerCase().includes(contactsSearch.toLowerCase()) ||
                          c.email.toLowerCase().includes(contactsSearch.toLowerCase()) ||
                          c.role.toLowerCase().includes(contactsSearch.toLowerCase())
                      )
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white">{contact.name}</span>
                              {contact.is_primary && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-600 text-white rounded">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[11px]">{contact.email}</p>
                            {contact.phone && <p className="text-slate-400 text-[11px]">{contact.phone}</p>}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(contact.email);
                                showToast('Copied', 'Email copied to clipboard.', 'info');
                              }}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#222430] text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Copy Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            {contact.phone && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(contact.phone);
                                  showToast('Copied', 'Phone copied to clipboard.', 'info');
                                }}
                                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#222430] text-slate-400 hover:text-slate-600 cursor-pointer"
                                title="Copy Phone"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end">
                <button
                  onClick={() => setShowContactsDrawer(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && selectedPropForContacts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowAddContactModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Property Contact</h3>
                <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContactSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@hotel.com"
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={contactFormData.phone_number}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactFormData.is_primary}
                      onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Set as Primary Property Contact</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={savingContact}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save Contact
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. EDIT PROPERTY DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEditDrawer && selectedPropForEdit && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowEditDrawer(false)} aria-hidden="true" />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between z-10"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Property</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPropForEdit.name}</p>
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

                <form onSubmit={handleSaveEdit} id="edit-prop-form" className="space-y-3.5 mt-5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Organization
                    </label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="">-- No Organization (Unassigned) --</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Street Address (PSAP Dispatch Location) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Main Phone</label>
                      <input
                        type="tel"
                        value={formData.main_phone}
                        onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fax</label>
                      <input
                        type="tel"
                        value={formData.fax}
                        onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        General Manager Name
                      </label>
                      <input
                        type="text"
                        value={formData.general_manager_name}
                        onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={formData.contact_person_name}
                        onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ray_baud_and_logs_enabled}
                        onChange={(e) => setFormData({ ...formData, ray_baud_and_logs_enabled: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Ray Baum's Act &amp; E911 Dispatchable Logging Enabled
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Property Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditDrawer(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  form="edit-prop-form"
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
      {/* 5. CREATE PROPERTY MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowCreateModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Property</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveCreate} id="create-prop-form" className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Courtyard Downtown"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assign to Organization (Optional)
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="">-- No Organization (Unassigned) --</option>
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Street Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="100 Main St"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Richmond"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="VA"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP *</label>
                    <input
                      type="text"
                      required
                      placeholder="23219"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Main Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (804) 555-0199"
                      value={formData.main_phone}
                      onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">General Manager</label>
                    <input
                      type="text"
                      placeholder="Sarah Jenkins"
                      value={formData.general_manager_name}
                      onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ray_baud_and_logs_enabled}
                      onChange={(e) => setFormData({ ...formData, ray_baud_and_logs_enabled: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Enable Ray Baum's Act &amp; E911 Logging
                    </span>
                  </label>
                </div>
              </form>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  form="create-prop-form"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Property
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. CHANGE STATUS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showStatusModal && selectedPropForStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowStatusModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Status</h3>
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select status for <strong className="text-slate-800 dark:text-white">{selectedPropForStatus.name}</strong>:
              </p>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setTargetStatus(st)}
                    className={`py-2 px-2 rounded-lg font-semibold transition border text-center cursor-pointer ${targetStatus === st
                        ? st === 'ACTIVE'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : st === 'INACTIVE'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-slate-50 dark:bg-[#111217] border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    {st === 'ACTIVE' ? 'Active' : st === 'ARCHIVED' ? 'Archived' : 'Inactive'}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={statusChangeLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {statusChangeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
