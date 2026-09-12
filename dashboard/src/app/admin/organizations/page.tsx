'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building2,
  Search,
  Plus,
  Download,
  MoreVertical,
  Settings,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  LifeBuoy,
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Archive,
  BarChart3,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Copy,
  AlertTriangle,
  UserPlus,
  Sparkles,
  RefreshCw,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

// --- Interfaces ---
interface OrgRecord {
  id: string;
  code?: string;
  name: string;
  type?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED';
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  primary_contact?: {
    full_name: string;
    email: string;
    phone_number: string;
    is_primary?: boolean;
  };
  properties_count?: number;
  properties?: any[];
  admin_count?: number;
  sip_lines?: number;
  sip_architecture?: string;
  open_tickets_count?: number;
  urgent_tickets_count?: number;
  created_at: string;
  updated_at?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

interface PropertyItem {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  main_phone?: string;
  status?: string;
  e911_status?: string;
  services_count?: number;
  is_assigned_to_current_org?: boolean;
}

interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  status: string;
  avatar_url?: string;
}

export default function AdminOrganizationsPage() {
  // State: Organizations & Meta
  const [organizations, setOrganizations] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Server-side Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // KPI Metrics
  const [metrics, setMetrics] = useState({
    totalOrgsCount: 0,
    totalProperties: 0,
    totalSipLines: 0,
    totalUrgentOrAction: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTicketFilter, setSelectedTicketFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('PROPERTIES_DESC');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  // Debounce search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Toast System
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 3-Dots Fixed Dropdown Positioning (No table scrolling bugs)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; org: OrgRecord } | null>(null);

  // Modals & Drawers State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<OrgRecord | null>(null);

  // Properties Drawer
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [selectedOrgForProperties, setSelectedOrgForProperties] = useState<OrgRecord | null>(null);
  const [orgProperties, setOrgProperties] = useState<PropertyItem[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertiesSearch, setPropertiesSearch] = useState('');

  // Assign Property Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<PropertyItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedPropertyToAssign, setSelectedPropertyToAssign] = useState<string | null>(null);
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Contacts Drawer
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedOrgForContacts, setSelectedOrgForContacts] = useState<OrgRecord | null>(null);
  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsSearch, setContactsSearch] = useState('');

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [showPrimaryOverrideConfirm, setShowPrimaryOverrideConfirm] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // Change Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrgForStatus, setSelectedOrgForStatus] = useState<OrgRecord | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Franchise Portfolio',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    status: 'ACTIVE' as OrgRecord['status'],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Fetch Organizations ---
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        type: selectedType,
        status: selectedStatus,
        tickets: selectedTicketFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch organizations.');
      }

      setOrganizations(result.data || []);
      if (result.pagination) {
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
      }
      if (result.metrics) {
        setMetrics(result.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Error loading data.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedType, selectedStatus, selectedTicketFilter, sortBy]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Open 3-Dots Menu with exact coordinates outside table scroll container
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, org: OrgRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, org });
  };

  // --- Actions ---
  const handleOpenEdit = (org: OrgRecord) => {
    setSelectedOrgForEdit(org);
    setFormData({
      name: org.name || '',
      type: org.type || 'Franchise Portfolio',
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      zip_code: org.zip_code || '',
      country: org.country || 'USA',
      status: org.status || 'ACTIVE',
    });
    setFormError(null);
    setShowEditDrawer(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForEdit) return;

    if (!formData.name.trim()) {
      setFormError('Organization name is required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch(`/api/admin/organizations/${selectedOrgForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update organization.');
      }

      // Optimistic update
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === selectedOrgForEdit.id
            ? {
                ...o,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                status: formData.status,
              }
            : o
        )
      );

      showToast('Saved', `Organization details for ${formData.name} updated.`, 'success');
      setShowEditDrawer(false);
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Organization name is required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create organization.');
      }

      showToast('Created', `${formData.name} was registered successfully.`, 'success');
      setShowCreateModal(false);
      fetchOrganizations();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Properties Management ---
  const handleOpenPropertiesDrawer = async (org: OrgRecord) => {
    setSelectedOrgForProperties(org);
    setShowPropertiesDrawer(true);
    setLoadingProperties(true);
    setPropertiesSearch('');

    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/properties`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setOrgProperties(result.data);
      } else {
        setOrgProperties([]);
      }
    } catch (err) {
      setOrgProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string, propertyName: string) => {
    if (!selectedOrgForProperties) return;
    if (!confirm(`Unassign "${propertyName}" from ${selectedOrgForProperties.name}?`)) return;

    try {
      const res = await fetch(
        `/api/admin/organizations/${selectedOrgForProperties.id}/properties?propertyId=${propertyId}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign');

      setOrgProperties((prev) => prev.filter((p) => p.id !== propertyId));
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === selectedOrgForProperties.id
            ? { ...o, properties_count: Math.max(0, (o.properties_count || 1) - 1) }
            : o
        )
      );

      showToast('Unassigned', `Property removed from ${selectedOrgForProperties.name}.`, 'info');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleOpenAssignModal = (org: OrgRecord) => {
    setSelectedOrgForProperties(org);
    setShowAssignModal(true);
    setSelectedPropertyToAssign(null);
    setAssignSearchQuery('');
    fetchAvailableProperties('', org.id);
  };

  const fetchAvailableProperties = async (search: string, orgId: string) => {
    try {
      setLoadingAvailable(true);
      const res = await fetch(
        `/api/admin/properties/available?search=${encodeURIComponent(search)}&excludeOrgId=${orgId}`
      );
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAvailableProperties(result.data);
      } else {
        setAvailableProperties([]);
      }
    } catch (err) {
      setAvailableProperties([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAssignPropertySubmit = async () => {
    if (!selectedOrgForProperties || !selectedPropertyToAssign) return;

    try {
      setAssigningLoading(true);
      const res = await fetch(`/api/admin/organizations/${selectedOrgForProperties.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropertyToAssign }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign property.');

      showToast('Assigned', `Property linked to ${selectedOrgForProperties.name}.`, 'success');
      setShowAssignModal(false);
      handleOpenPropertiesDrawer(selectedOrgForProperties);
      fetchOrganizations();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  // --- Contacts Management ---
  const handleOpenContactsDrawer = async (org: OrgRecord) => {
    setSelectedOrgForContacts(org);
    setShowContactsDrawer(true);
    setLoadingContacts(true);
    setContactsSearch('');

    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/contacts`);
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

  const handleAddContactSubmit = async (overrideConfirmed = false) => {
    if (!selectedOrgForContacts) return;

    if (!contactFormData.full_name.trim() || !contactFormData.email.trim()) {
      showToast('Validation', 'Full Name and Email are required.', 'error');
      return;
    }

    const existingPrimary = contactsList.find((c) => c.is_primary);
    if (contactFormData.is_primary && existingPrimary && !overrideConfirmed) {
      setShowPrimaryOverrideConfirm(true);
      return;
    }

    try {
      setSavingContact(true);
      const res = await fetch(`/api/admin/organizations/${selectedOrgForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to add contact.');

      showToast('Contact Added', `${contactFormData.full_name} was saved.`, 'success');
      setShowAddContactModal(false);
      setShowPrimaryOverrideConfirm(false);
      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });

      handleOpenContactsDrawer(selectedOrgForContacts);
      fetchOrganizations();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSavingContact(false);
    }
  };

  // --- Change Status Management ---
  const handleOpenStatusModal = (org: OrgRecord) => {
    setSelectedOrgForStatus(org);
    setTargetStatus(org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedOrgForStatus) return;

    try {
      setStatusChangeLoading(true);
      const res = await fetch(`/api/admin/organizations/${selectedOrgForStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Status change failed.');

      setOrganizations((prev) =>
        prev.map((o) => (o.id === selectedOrgForStatus.id ? { ...o, status: targetStatus } : o))
      );

      showToast('Status Updated', `${selectedOrgForStatus.name} is now ${targetStatus}.`, 'success');
      setShowStatusModal(false);
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setSelectedTicketFilter('ALL');
    setSortBy('PROPERTIES_DESC');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedTicketFilter !== 'ALL' ||
    sortBy !== 'PROPERTIES_DESC';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
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
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organizations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
              {totalCount} Portfolios
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage client portfolios, brand franchises, hotel management groups, and multi-tenant telephony services.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const headers = ['ID,Name,Type,City,State,Status,Properties,ActiveLines\n'];
              const rows = organizations.map((o) =>
                `"${o.id}","${o.name}","${o.type || ''}","${o.city || ''}","${o.state || ''}","${o.status}","${o.properties_count || 0}","${o.sip_lines || 0}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `organizations-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Organizations list exported as CSV.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => {
              setFormData({
                name: '',
                type: 'Franchise Portfolio',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                country: 'USA',
                status: 'ACTIVE',
              });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Create Organization
          </button>
        </div>
      </div>

      {/* KPI Cards (Clean, Warm, Purplish/Bluish Small Icons) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && organizations.length === 0 ? (
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Organizations
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalOrgsCount}
                </span>
                <span className="inline-flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> All Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Franchises & Groups</p>
            </div>

            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Managed Properties
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalProperties}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across regions</p>
            </div>

            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Provisioned Services
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalSipLines}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Trunks & Extensions</p>
            </div>

            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pending Actions
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics.totalUrgentOrAction}
                </span>
                <span className="inline-flex items-center text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  Action Req.
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Onboarding / Porting</p>
            </div>
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
              placeholder="Search by organization name, domain, slug, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by type"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Type: All Types</option>
              <option value="Franchise Portfolio">Franchise Portfolio</option>
              <option value="Management Group">Management Group</option>
              <option value="Boutique Hotel Group">Boutique Hotel Group</option>
              <option value="Enterprise Corporate">Enterprise Corporate</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={selectedTicketFilter}
              onChange={(e) => {
                setSelectedTicketFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by tickets"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tickets: Any Tickets</option>
              <option value="URGENT">Urgent Tickets</option>
              <option value="OPEN">Open Tickets</option>
              <option value="ZERO">0 Tickets</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort options"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="PROPERTIES_DESC">Sort: Most Properties</option>
              <option value="PROPERTIES_ASC">Sort: Least Properties</option>
              <option value="SERVICES_DESC">Sort: Most Services</option>
              <option value="NEWEST">Sort: Recently Created</option>
              <option value="UPDATED">Sort: Recently Updated</option>
              <option value="NAME_ASC">Sort: Name A–Z</option>
              <option value="NAME_DESC">Sort: Name Z–A</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg">
              <button
                onClick={() => setViewMode('LIST')}
                aria-label="List View"
                className={`p-1 rounded transition ${
                  viewMode === 'LIST'
                    ? 'bg-white dark:bg-[#1f212c] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('GRID')}
                aria-label="Grid View"
                className={`p-1 rounded transition ${
                  viewMode === 'GRID'
                    ? 'bg-white dark:bg-[#1f212c] text-indigo-600 dark:text-indigo-400 shadow-xs'
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {selectedType}
                <button onClick={() => setSelectedType('ALL')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-slate-500 hover:text-indigo-600 text-xs font-medium underline ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Table / Grid View */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load organizations</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={() => fetchOrganizations()}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && organizations.length === 0 ? (
        // Clean Table Skeleton Loader
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-[#222430] rounded-lg"></div>
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-3/4"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-[#222430] rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-28"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Organizations Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No organizations matched the selected filters.'
              : 'Start by creating your first client organization.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  type: 'Franchise Portfolio',
                  email: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  country: 'USA',
                  status: 'ACTIVE',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Organization
            </button>
          </div>
        </div>
      ) : viewMode === 'LIST' ? (
        // Minimalist Left-Aligned Table (Matching screenshot design)
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">ORGANIZATION & DOMAIN</th>
                  <th className="py-3 px-4 font-semibold">PORTFOLIO PROPERTIES</th>
                  <th className="py-3 px-4 font-semibold">ACTIVE VOICE LINES</th>
                  <th className="py-3 px-4 font-semibold">PRIMARY CONTACT</th>
                  <th className="py-3 px-4 font-semibold">E911 STATUS</th>
                  <th className="py-3 px-4 font-semibold">OPERATIONAL STATUS</th>
                  <th className="py-3 px-4 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {organizations.map((org) => {
                  const initials = org.name.substring(0, 2).toUpperCase();

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      {/* 1. Organization & Domain */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-xs border border-indigo-100 dark:border-indigo-900/40">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/admin/organizations/${org.id}`}
                                className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                              >
                                {org.name}
                              </Link>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-[#222430] text-slate-500">
                                {org.code || 'PH-100'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{org.type || 'Franchise Portfolio'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{org.contact_name || `${org.name} Admin`}</span>
                              {org.email && (
                                <>
                                  <span>&bull;</span>
                                  <span>{org.email}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Portfolio Properties */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenPropertiesDrawer(org)}
                          className="text-left group"
                          title="Click to view assigned properties"
                        >
                          <div className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-indigo-600 transition">
                            {org.properties_count ?? 0}
                          </div>
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            target="_blank"
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                          >
                            View Organization <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </button>
                      </td>

                      {/* 3. Active Voice Lines */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {org.sip_lines ?? (org.properties_count ? org.properties_count * 6 : 0)} lines
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{org.sip_architecture || 'SIP Mesh Primary'}</p>
                      </td>

                      {/* 4. Primary Contact */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenContactsDrawer(org)}
                          className="text-left group"
                          title="Click to view contacts"
                        >
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 transition truncate">
                              {org.primary_contact?.full_name || org.contact_name || `${org.name} Admin`}
                            </span>
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded">
                              Primary
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {org.primary_contact?.email || org.email || 'No email registered'}
                          </p>
                        </button>
                      </td>

                      {/* 5. E911 Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> 0 Tickets
                        </span>
                      </td>

                      {/* 6. Operational Status (Pill with dot matching original UI) */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenStatusModal(org)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                              : org.status === 'ARCHIVED'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : org.status === 'ARCHIVED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {org.status === 'ACTIVE' ? 'Active' : org.status === 'ARCHIVED' ? 'Archived' : 'Inactive'}
                        </button>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(org)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430]"
                            title="Edit"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, org)}
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

          {/* Server-Side Pagination Bar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} organizations
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
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
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
          {organizations.map((org) => {
            const initials = org.name.substring(0, 2).toUpperCase();

            return (
              <div
                key={org.id}
                className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 text-sm block"
                      >
                        {org.name}
                      </Link>
                      <p className="text-[11px] text-slate-400">{org.type || 'Franchise Portfolio'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      org.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600'
                        : org.status === 'ARCHIVED'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {org.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#1f212c] text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Properties</span>
                    <p className="font-semibold text-slate-800 dark:text-white">{org.properties_count || 0} locations</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Voice Lines</span>
                    <p className="font-semibold text-slate-800 dark:text-white">{org.sip_lines || 0} lines</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1f212c]">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    target="_blank"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View Organization <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={(e) => handleOpenMenu(e, org)}
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
      {/* FIXED 3-DOTS POPUP OVERLAY (No table scrolling or overflow issues) */}
      {/* ========================================================================= */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.org.name}</p>
              <p className="text-[10px] text-slate-400">Admin Options</p>
            </div>

            <button
              onClick={() => {
                const org = menuPosition.org;
                setMenuPosition(null);
                handleOpenEdit(org);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Edit Organization Details
            </button>

            <button
              onClick={() => {
                const org = menuPosition.org;
                setMenuPosition(null);
                handleOpenPropertiesDrawer(org);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" /> View Assigned Properties
            </button>

            <button
              onClick={() => {
                const org = menuPosition.org;
                setMenuPosition(null);
                handleOpenAssignModal(org);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" /> Assign New Property
            </button>

            <button
              onClick={() => {
                const org = menuPosition.org;
                setMenuPosition(null);
                handleOpenContactsDrawer(org);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Users className="w-3.5 h-3.5 text-purple-500" /> View Contact List
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-0.5"></div>

            <button
              onClick={() => {
                const org = menuPosition.org;
                setMenuPosition(null);
                handleOpenStatusModal(org);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Change Status
            </button>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. EDIT ORGANIZATION DRAWER */}
      {/* ========================================================================= */}
      {showEditDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-150">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Organization</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedOrgForEdit?.name}</p>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} id="edit-form" className="space-y-3.5 mt-5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organization Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Franchise Portfolio">Franchise Portfolio</option>
                    <option value="Management Group">Management Group</option>
                    <option value="Boutique Hotel Group">Boutique Hotel Group</option>
                    <option value="Enterprise Corporate">Enterprise Corporate</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-form"
                disabled={formLoading}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE ORGANIZATION MODAL */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Organization</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCreate} id="create-form" className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pearson Hotel Group"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Franchise Portfolio">Franchise Portfolio</option>
                    <option value="Management Group">Management Group</option>
                    <option value="Boutique Hotel Group">Boutique Hotel Group</option>
                    <option value="Enterprise Corporate">Enterprise Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="admin@hotel.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Dallas"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-form"
                disabled={formLoading}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW ASSIGNED PROPERTIES WIDE DRAWER */}
      {/* ========================================================================= */}
      {showPropertiesDrawer && selectedOrgForProperties && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Properties</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedOrgForProperties.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAssignModal(selectedOrgForProperties)}
                    className="px-2.5 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Property
                  </button>
                  <button onClick={() => setShowPropertiesDrawer(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search in Drawer */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter assigned properties..."
                  value={propertiesSearch}
                  onChange={(e) => setPropertiesSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {loadingProperties ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  <p>Loading properties...</p>
                </div>
              ) : orgProperties.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">No properties assigned</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Assign Property" to link existing locations.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {orgProperties
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(propertiesSearch.toLowerCase()) ||
                        (p.city && p.city.toLowerCase().includes(propertiesSearch.toLowerCase()))
                    )
                    .map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{prop.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {prop.city ? `${prop.city}, ${prop.state || prop.country}` : prop.address || 'Address N/A'}
                          </p>
                          {prop.main_phone && (
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {prop.main_phone}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleUnassignProperty(prop.id, prop.name)}
                          className="px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition border border-rose-200 dark:border-rose-900/40"
                        >
                          Unassign
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end">
              <button
                onClick={() => setShowPropertiesDrawer(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ASSIGN NEW PROPERTY SEARCHABLE MODAL */}
      {/* ========================================================================= */}
      {showAssignModal && selectedOrgForProperties && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Property</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search properties by name, city..."
                value={assignSearchQuery}
                onChange={(e) => {
                  setAssignSearchQuery(e.target.value);
                  fetchAvailableProperties(e.target.value, selectedOrgForProperties.id);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Available Properties Results */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-[#222430]">
              {loadingAvailable ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1.5">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" />
                  <p>Searching database...</p>
                </div>
              ) : availableProperties.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No available properties found.</div>
              ) : (
                availableProperties.map((prop) => {
                  const isSelected = selectedPropertyToAssign === prop.id;
                  const isAssigned = prop.is_assigned_to_current_org;

                  return (
                    <div
                      key={prop.id}
                      onClick={() => !isAssigned && setSelectedPropertyToAssign(prop.id)}
                      className={`p-2.5 rounded-lg text-xs transition flex items-center justify-between gap-2 ${
                        isAssigned
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-[#111217]'
                          : isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-400 cursor-pointer'
                          : 'hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{prop.name}</p>
                          {isAssigned && (
                            <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-[#222430] px-1 py-0.2 rounded">
                              Assigned
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address || ''}
                        </p>
                      </div>

                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignPropertySubmit}
                disabled={!selectedPropertyToAssign || assigningLoading}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {assigningLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW CONTACT LIST DRAWER & ADD CONTACT MODAL */}
      {/* ========================================================================= */}
      {showContactsDrawer && selectedOrgForContacts && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Authorized Contacts</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedOrgForContacts.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
                      setShowAddContactModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Contact
                  </button>
                  <button onClick={() => setShowContactsDrawer(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {loadingContacts ? (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  <p>Loading contacts...</p>
                </div>
              ) : contactsList.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-60" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">No contacts listed</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Contact" to add authorized personnel.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contactsList
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(contactsSearch.toLowerCase()) ||
                        c.email.toLowerCase().includes(contactsSearch.toLowerCase())
                    )
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                          contact.is_primary
                            ? 'bg-indigo-50/50 dark:bg-[#1a1c24] border-indigo-200 dark:border-indigo-900/40'
                            : 'bg-slate-50 dark:bg-[#1a1c24] border-slate-200 dark:border-[#222430]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-slate-900 dark:text-white truncate">{contact.name}</h4>
                            {contact.is_primary && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#4f46e5] text-white rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {contact.phone || '+1 (555) 019-2834'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end">
              <button
                onClick={() => setShowContactsDrawer(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && selectedOrgForContacts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Contact</h3>
              <button onClick={() => setShowAddContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {showPrimaryOverrideConfirm ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-amber-700 dark:text-amber-400">Replace Primary Contact?</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Setting {contactFormData.full_name} as primary will replace the current primary contact.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowPrimaryOverrideConfirm(false)}
                    className="px-2.5 py-1 rounded bg-slate-200 dark:bg-[#222430] text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddContactSubmit(true)}
                    disabled={savingContact}
                    className="px-3 py-1 bg-amber-600 text-white rounded font-medium"
                  >
                    Confirm Replace
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddContactSubmit(false);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 012-3456"
                    value={contactFormData.phone_number}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactFormData.is_primary}
                      onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Set as Primary Contact</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Save Contact
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CHANGE STATUS MODAL */}
      {/* ========================================================================= */}
      {showStatusModal && selectedOrgForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl p-5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#222430]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select status for <strong className="text-slate-800 dark:text-white">{selectedOrgForStatus.name}</strong>:
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setTargetStatus(st)}
                  className={`py-2 px-2 rounded-lg font-semibold transition border text-center ${
                    targetStatus === st
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

            <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-[#111217] p-2 rounded-lg border border-slate-100 dark:border-[#222430]">
              {targetStatus === 'ARCHIVED'
                ? 'Archiving suspends services and client access while preserving all database records.'
                : targetStatus === 'INACTIVE'
                ? 'Inactive temporarily pauses operational notifications.'
                : 'Active restores full operational access.'}
            </p>

            <div className="pt-3 border-t border-slate-200 dark:border-[#222430] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusChangeLoading}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white flex items-center gap-1.5 disabled:opacity-50"
              >
                {statusChangeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
