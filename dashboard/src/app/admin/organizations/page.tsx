'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Layers,
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  ArrowUpRight,
  Loader2,
  Check,
  Copy,
  AlertTriangle,
  RefreshCw,
  Eye,
  Send,
  ExternalLink,
  ShieldCheck,
  Building,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { CreateOrgModal } from '@/components/admin/CreateOrgModal';
import { InviteManagerModal } from '@/components/admin/InviteManagerModal';

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
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
    },
  },
};

// --- Interfaces ---
interface OrgRecord {
  id: string;
  name: string;
  type?: string;
  address: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  properties_count: number;
  properties?: any[];
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED' | 'PENDING_ONBOARDING';
  invite: {
    status: string;
    url: string | null;
    expires_at: string | null;
    id: string | null;
  };
  members?: any[];
  contacts_count?: number;
  created_at: string;
  updated_at?: string;
}

interface PropertyItem {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  main_phone?: string;
  status?: string;
}

interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  status: string;
}

export default function AdminOrganizationsPage() {
  // State: Organizations & Meta
  const [organizations, setOrganizations] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // 5 Exact KPI Metrics per Task.md
  const [metrics, setMetrics] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    pendingOrInvited: 0,
    totalProperties: 0,
    noPropertiesOrganizations: 0,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPropFilter, setSelectedPropFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu Positioning (Opens upside)
  const [menuPosition, setMenuPosition] = useState<{
    bottom: number;
    left: number;
    org: OrgRecord;
  } | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedOrgForInvite, setSelectedOrgForInvite] = useState<OrgRecord | null>(null);

  // Edit Organization Drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<OrgRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Properties Drawer & Assign Modal
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [selectedOrgForProps, setSelectedOrgForProps] = useState<OrgRecord | null>(null);
  const [orgPropertiesList, setOrgPropertiesList] = useState<PropertyItem[]>([]);
  const [loadingOrgProps, setLoadingOrgProps] = useState(false);
  const [showAssignPropModal, setShowAssignPropModal] = useState(false);
  const [allAvailableProps, setAllAvailableProps] = useState<PropertyItem[]>([]);
  const [loadingAvailableProps, setLoadingAvailableProps] = useState(false);
  const [selectedPropToAssign, setSelectedPropToAssign] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Contacts Drawer & Add Contact Modal
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedOrgForContacts, setSelectedOrgForContacts] = useState<OrgRecord | null>(null);
  const [orgContactsList, setOrgContactsList] = useState<ContactItem[]>([]);
  const [loadingOrgContacts, setLoadingOrgContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Organizations
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearch,
        status: selectedStatus,
        has_properties: selectedPropFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch organizations.');
      }

      setOrganizations(json.data || []);
      if (json.pagination) {
        setTotalCount(json.pagination.totalCount);
        setTotalPages(json.pagination.totalPages);
      }
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Error loading organizations.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedStatus, selectedPropFilter, sortBy]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Open 3-Dots Action Menu (Opens upside above trigger button)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, org: OrgRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = Math.max(16, window.innerHeight - rect.top + 6);
    setMenuPosition({ bottom, left, org });
  };

  // Copy Quick Action
  const handleCopyText = (text: string, label: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Invite Manager
  const handleOpenInvite = (org: OrgRecord) => {
    setSelectedOrgForInvite(org);
    setShowInviteModal(true);
    setMenuPosition(null);
  };

  // Open Edit Drawer
  const handleOpenEdit = (org: OrgRecord) => {
    setSelectedOrgForEdit(org);
    setEditFormData({
      name: org.name || '',
      address: org.street_address || '',
      city: org.city || '',
      state: org.state || '',
      zip_code: org.zip_code || '',
      country: org.country || 'USA',
      phone: org.phone !== '—' ? org.phone : '',
      email: org.email !== '—' ? org.email : '',
      status: org.status || 'ACTIVE',
    });
    setShowEditDrawer(true);
    setMenuPosition(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForEdit) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update organization');
      }
      showToast('Organization updated successfully.');
      setShowEditDrawer(false);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error updating organization', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (org: OrgRecord) => {
    const nextStatus = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to toggle status');
      showToast(`Organization set to ${nextStatus}.`);
      setMenuPosition(null);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  // Open Properties Drawer
  const handleOpenProperties = async (org: OrgRecord) => {
    setSelectedOrgForProps(org);
    setShowPropertiesDrawer(true);
    setMenuPosition(null);
    setLoadingOrgProps(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/properties`);
      const json = await res.json();
      if (json.success) {
        setOrgPropertiesList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching org properties:', err);
    } finally {
      setLoadingOrgProps(false);
    }
  };

  // Open Assign Property Modal
  const handleOpenAssignPropModal = async () => {
    setShowAssignPropModal(true);
    setLoadingAvailableProps(true);
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const json = await res.json();
      if (json.success) {
        setAllAvailableProps(json.data || []);
        if (json.data?.length > 0) {
          setSelectedPropToAssign(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading properties catalog:', err);
    } finally {
      setLoadingAvailableProps(false);
    }
  };

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForProps || !selectedPropToAssign) return;
    setAssigningLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForProps.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to assign property');
      }
      showToast('Property assigned to organization.');
      setShowAssignPropModal(false);
      handleOpenProperties(selectedOrgForProps);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error assigning property', 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string) => {
    if (!selectedOrgForProps) return;
    try {
      const res = await fetch(
        `/api/admin/organizations/${selectedOrgForProps.id}/properties?propertyId=${propertyId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to unassign property');
      showToast('Property unassigned from organization.');
      handleOpenProperties(selectedOrgForProps);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error unassigning property', 'error');
    }
  };

  // Open Contacts Drawer
  const handleOpenContacts = async (org: OrgRecord) => {
    setSelectedOrgForContacts(org);
    setShowContactsDrawer(true);
    setMenuPosition(null);
    setLoadingOrgContacts(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/contacts`);
      const json = await res.json();
      if (json.success) {
        setOrgContactsList(json.data || []);
      }
    } catch (err) {
      console.error('Error loading org contacts:', err);
    } finally {
      setLoadingOrgContacts(false);
    }
  };

  const handleDeleteContactFromDrawer = async (contactId: string) => {
    if (!selectedOrgForContacts) return;
    try {
      const res = await fetch(
        `/api/admin/organizations/${selectedOrgForContacts.id}/contacts?member_id=${contactId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
      showToast('Contact removed successfully.');
      handleOpenContacts(selectedOrgForContacts);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForContacts) return;
    setSavingContact(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add contact');
      }
      showToast('Contact added successfully.');
      setShowAddContactModal(false);
      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
      handleOpenContacts(selectedOrgForContacts);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== 'ALL' || selectedPropFilter !== 'ALL';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* Toast alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
            }`}
        >
          {toastMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl text-black dark:text-white flex items-center justify-center">
              <Building2 size={256} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Client Organizations
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Organization</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. KPI Cards (5 Cards as specified in Task.md) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5"
      >
        {/* Card 1: Total Organizations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Total Organizations
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalOrganizations}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Clients</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">All provisioned tenant accounts</p>
        </motion.div>

        {/* Card 2: Active Organizations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Active Organizations
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.activeOrganizations}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Live Portfolios</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Operational active accounts</p>
        </motion.div>

        {/* Card 3: Pending / Invited */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Pending / Invited
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.pendingOrInvited}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Awaiting Setup</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Pending invite or onboarding</p>
        </motion.div>

        {/* Card 4: Total Properties */}
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
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalProperties}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Locations</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Assigned across all clients</p>
        </motion.div>

        {/* Card 5: Organizations with No Properties */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              No Properties
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.noPropertiesOrganizations}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Unassigned</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Orgs with 0 assigned properties</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by organization, address, contact, email, or phone..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by organization status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_ONBOARDING">Pending Onboarding</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Properties Assignment Filter */}
          <select
            value={selectedPropFilter}
            onChange={(e) => {
              setSelectedPropFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by assigned properties"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Property Statuses</option>
            <option value="HAS_PROPERTIES">Has Assigned Properties</option>
            <option value="NO_PROPERTIES">No Assigned Properties (0)</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Sort organizations"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PROPERTIES_DESC">Most Properties First</option>
            <option value="PROPERTIES_ASC">Least Properties First</option>
            <option value="NAME_ASC">Name (A-Z)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('ALL');
              setSelectedPropFilter('ALL');
              setSortBy('NEWEST');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium self-end lg:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Organization Table (10 Distinct Unmixed Columns per Task.md) */}
      {loading ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 space-y-4 shadow-xs animate-pulse">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchOrganizations}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : organizations.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No client organizations found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No organizations matched your search and filter criteria.'
              : 'Create your first client organization to begin onboarding and managing telecom services.'}
          </p>
          {!hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Organization
            </motion.button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[1320px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[190px]">
                    Organization Name
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[240px]">
                    Address
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[140px]">
                    Primary Contact
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[180px]">
                    Email
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Phone
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap min-w-[90px]">
                    Properties
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[100px]">
                    Status
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[120px]">
                    Invite
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[105px]">
                    Created At
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap min-w-[105px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {organizations.map((org) => {
                  const initials = org.name.substring(0, 2).toUpperCase();

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors group"
                    >
                      {/* Column 1: Organization Name */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[190px]">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            target="_blank"
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                          >
                            <span>{org.name}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity shrink-0" />
                          </Link>
                        </div>
                      </td>

                      {/* Column 2: Address */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[240px]">
                        <span
                          className="text-slate-700 dark:text-slate-300 block max-w-[240px] truncate"
                          title={org.address}
                        >
                          {org.address}
                        </span>
                      </td>

                      {/* Column 3: Primary Contact */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[140px]">
                        <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[160px]">
                          {org.primary_contact_name}
                        </span>
                      </td>

                      {/* Column 4: Email */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[180px]">
                        <div className="flex items-center gap-1 text-[11px]">
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={org.email}>
                            {org.email}
                          </span>
                          {org.email !== '—' && (
                            <button
                              onClick={(e) => handleCopyText(org.email, 'Email', `email-${org.id}`, e)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer shrink-0"
                              title="Copy email"
                            >
                              {copiedId === `email-${org.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Phone */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px]">
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                          {org.phone}
                        </span>
                      </td>

                      {/* Column 6: Properties */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap min-w-[90px]">
                        <button
                          onClick={() => handleOpenProperties(org)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${org.properties_count > 0
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 hover:bg-purple-100'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 hover:bg-rose-100'
                            }`}
                          title="Click to view & assign properties"
                        >
                          <Layers className="w-3 h-3" />
                          <span>{org.properties_count}</span>
                        </button>
                      </td>

                      {/* Column 7: Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[100px]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${org.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : org.status === 'PENDING_ONBOARDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${org.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : org.status === 'PENDING_ONBOARDING'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                          />
                          {org.status === 'PENDING_ONBOARDING' ? 'Pending' : org.status}
                        </span>
                      </td>

                      {/* Column 8: Invite */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold ${org.invite.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50'
                                : org.invite.status === 'APPROVED' || org.invite.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                          >
                            <Mail className="w-3 h-3" />
                            <span>{org.invite.status === 'NO_INVITE' ? 'None' : org.invite.status}</span>
                          </span>
                          <button
                            onClick={() => handleOpenInvite(org)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                            title="Manage invite link"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Column 9: Created At */}
                      <td className="py-3.5 px-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap min-w-[105px]">
                        {new Date(org.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Column 10: Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap min-w-[105px]">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition cursor-pointer"
                            title="Open organization workspace in new tab"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
                          <button
                            onClick={(e) => handleOpenMenu(e, org)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                            aria-label="More organization actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {totalCount > itemsPerPage && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] px-4 py-3 rounded-xl shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * itemsPerPage, totalCount)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> organizations
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Fixed 3-Dots Overlay Action Menu */}
      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              bottom: `${menuPosition.bottom}px`,
              left: `${menuPosition.left}px`,
            }}
            className="z-50 w-60 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-32px)] overflow-y-auto"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#252733]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Organization Actions
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.org.name}
              </span>
            </div>

            {/* View in New Tab */}
            <Link
              href={`/admin/organizations/${menuPosition.org.id}`}
              target="_blank"
              onClick={() => setMenuPosition(null)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer text-slate-800 dark:text-slate-200 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              <span>Open Workspace (New Tab)</span>
            </Link>

            {/* Contacts */}
            <button
              onClick={() => handleOpenContacts(menuPosition.org)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Manage Contacts</span>
            </button>

            {/* Properties */}
            <button
              onClick={() => handleOpenProperties(menuPosition.org)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Manage Properties ({menuPosition.org.properties_count})</span>
            </button>

            {/* Invitation URL */}
            <button
              onClick={() => handleOpenInvite(menuPosition.org)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
            >
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              <span>Invitation URL &amp; Token</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            {/* Edit details */}
            <button
              onClick={() => handleOpenEdit(menuPosition.org)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Organization Details</span>
            </button>

            {/* Activate / Deactivate */}
            <button
              onClick={() => handleToggleStatus(menuPosition.org)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{menuPosition.org.status === 'ACTIVE' ? 'Deactivate Organization' : 'Activate Organization'}</span>
            </button>
          </div>
        </>
      )}

      {/* 7. Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchOrganizations()}
      />

      {/* 8. Invite Manager Modal */}
      {selectedOrgForInvite && (
        <InviteManagerModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedOrgForInvite(null);
          }}
          orgId={selectedOrgForInvite.id}
          orgName={selectedOrgForInvite.name}
          onSuccess={() => fetchOrganizations()}
        />
      )}

      {/* 9. Properties Drawer */}
      <AnimatePresence>
        {showPropertiesDrawer && selectedOrgForProps && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowPropertiesDrawer(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Assigned Properties
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrgForProps.name} ({orgPropertiesList.length} Assigned)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPropertiesDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Property Portfolio
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOpenAssignPropModal}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign New Property</span>
                  </motion.button>
                </div>

                {loadingOrgProps ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-400">Loading assigned properties...</span>
                  </div>
                ) : orgPropertiesList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-white">No properties assigned</p>
                    <p className="text-slate-400 text-[11px]">
                      Click &quot;Assign New Property&quot; to associate an existing property with this organization.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orgPropertiesList.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {prop.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {prop.address || `${prop.city}, ${prop.state}`}
                          </span>
                          <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                            Main Phone: {prop.main_phone || '—'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnassignProperty(prop.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Unassign
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex justify-end">
                <button
                  onClick={() => setShowPropertiesDrawer(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 10. Assign Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAssignPropModal(false)}
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs"
            />
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assign Existing Property
                  </h3>
                  <button onClick={() => setShowAssignPropModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignPropertySubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Select Property from Database
                    </label>
                    {loadingAvailableProps ? (
                      <div className="p-3 bg-slate-50 dark:bg-[#181920] rounded-lg text-center text-slate-400">
                        Loading properties...
                      </div>
                    ) : (
                      <select
                        value={selectedPropToAssign}
                        onChange={(e) => setSelectedPropToAssign(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {allAvailableProps.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setShowAssignPropModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={assigningLoading || !selectedPropToAssign}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 11. Contacts Drawer */}
      <AnimatePresence>
        {showContactsDrawer && selectedOrgForContacts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowContactsDrawer(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Organization Contacts
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrgForContacts.name} ({orgContactsList.length} Contacts)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactsDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Contacts &amp; Authorized Personnel
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAddContactModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Contact</span>
                  </motion.button>
                </div>

                {loadingOrgContacts ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-400">Loading contacts...</span>
                  </div>
                ) : orgContactsList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-white">No contacts listed</p>
                    <p className="text-slate-400 text-[11px]">
                      Click &quot;Add Contact&quot; to create authorized personnel for this organization.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orgContactsList.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">
                              {contact.name}
                            </span>
                            {contact.is_primary && (
                              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                                Primary Admin
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({contact.role})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                            {contact.email}
                          </span>
                          <span className="text-[10.5px] text-slate-400 block mt-0.5">
                            {contact.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(contact as any).invite_url && (
                            <button
                              onClick={(e) => handleCopyText((contact as any).invite_url, 'Invite URL', `url-${contact.id}`, e)}
                              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                              title="Copy Invitation URL"
                            >
                              {copiedId === `url-${contact.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Mail className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={(e) => handleCopyText(contact.email, 'Email', `c-email-${contact.id}`, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-[#252836] transition cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedId === `c-email-${contact.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteContactFromDrawer(contact.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove Contact"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex justify-end">
                <button
                  onClick={() => setShowContactsDrawer(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 12. Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAddContactModal(false)}
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs"
            />
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Organization Contact
                  </h3>
                  <button onClick={() => setShowAddContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddContactSubmit} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactFormData.full_name}
                      onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                      placeholder="e.g., Alex Johnson"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      placeholder="alex@company.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactFormData.phone_number}
                      onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_primary_checkbox"
                      checked={contactFormData.is_primary}
                      onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_primary_checkbox" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                      Set as Primary Administrator
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={savingContact}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {savingContact ? 'Saving...' : 'Add Contact'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 13. Edit Organization Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedOrgForEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowEditDrawer(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Edit Organization Details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrgForEdit.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">ZIP</label>
                    <input
                      type="text"
                      value={editFormData.zip_code}
                      onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Main Phone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Primary Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Operational Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_ONBOARDING">PENDING_ONBOARDING</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditDrawer(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={editSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {editSaving ? 'Saving Changes...' : 'Save Organization'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
