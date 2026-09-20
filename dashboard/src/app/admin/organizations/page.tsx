'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setOrganizations,
  setOrgContacts,
  addOrgContactOptimistic,
  removeOrgContactOptimistic,
  updateOrgStatusOptimistic,
  updateOrganizationOptimistic,
  setPrimaryContactOptimistic,
  unassignOrgPropertyOptimistic,
  setFilters,
  setLoading,
  setError,
  type OrgRecord,
  type OrgContact,
} from '@/store/slices/organizationsSlice';
import { CreateOrgModal } from '@/components/admin/CreateOrgModal';

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
  hidden: { opacity: 0, y: 16, scale: 0.98 },
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

interface PropertyItem {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  main_phone?: string;
  status?: string;
}

export default function AdminOrganizationsPage() {
  const dispatch = useAppDispatch();
  const {
    items: organizations,
    metrics,
    totalCount,
    totalPages,
    currentPage,
    searchQuery,
    selectedStatus,
    selectedPropFilter,
    loading,
    error,
    orgContacts,
  } = useAppSelector((state) => state.organizations);

  // Local Sort state
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

  // Delete Organization State
  const [orgToDelete, setOrgToDelete] = useState<OrgRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Organization Drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<OrgRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
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
  const [loadingOrgContacts, setLoadingOrgContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Delete Contact Confirmation Modal
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch Organizations from backend
  const fetchOrganizations = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchQuery,
        status: selectedStatus,
        has_properties: selectedPropFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch organizations.');
      }

      dispatch(
        setOrganizations({
          data: json.data || [],
          pagination: json.pagination,
          metrics: json.metrics,
        })
      );
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
      dispatch(setError(err.message || 'Error loading organizations.'));
    }
  }, [currentPage, searchQuery, selectedStatus, selectedPropFilter, sortBy, dispatch]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Client-side Instant Filtered Items (Keystroke reactivity)
  const displayedOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const lower = searchQuery.toLowerCase();
    return organizations.filter(
      (org: OrgRecord) =>
        org.name.toLowerCase().includes(lower) ||
        (org.address && org.address.toLowerCase().includes(lower)) ||
        (org.contact_name && org.contact_name.toLowerCase().includes(lower)) ||
        (org.email && org.email.toLowerCase().includes(lower)) ||
        (org.phone && org.phone.toLowerCase().includes(lower))
    );
  }, [organizations, searchQuery]);

  // Open 3-Dots Action Menu (Upside detection)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, org: OrgRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 8;
    setMenuPosition({ bottom, left, org });
  };

  useEffect(() => {
    const handleClose = () => setMenuPosition(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const handleCopyText = (text: string, label: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Change handler with instant Redux state update
  const handleUpdateStatus = async (orgId: string, newStatus: string) => {
    dispatch(updateOrgStatusOptimistic({ id: orgId, status: newStatus }));
    setMenuPosition(null);
    showToast(`Organization status updated to ${newStatus}.`);

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update status');
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
      fetchOrganizations();
    }
  };

  // Delete Organization Handler
  const handleConfirmDeleteOrg = async () => {
    if (!orgToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/organizations/${orgToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete organization');
      showToast(`Organization '${orgToDelete.name}' was removed.`, 'success');
      setOrgToDelete(null);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error deleting organization', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open Edit Drawer
  const handleOpenEditDrawer = (org: OrgRecord) => {
    setSelectedOrgForEdit(org);
    setEditFormData({
      name: org.name || '',
      address: org.street_address || org.address || '',
      city: org.city || '',
      state: org.state || '',
      zip_code: org.zip_code || '',
      phone: org.phone && org.phone !== '—' ? org.phone : '',
      email: org.email && org.email !== '—' ? org.email : '',
      status: org.status || 'ACTIVE',
    });
    setShowEditDrawer(true);
    setMenuPosition(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForEdit) return;
    setEditSaving(true);

    const updates = {
      name: editFormData.name.trim(),
      address: editFormData.address.trim(),
      street_address: editFormData.address.trim(),
      city: editFormData.city.trim(),
      state: editFormData.state.trim(),
      zip_code: editFormData.zip_code.trim(),
      phone: editFormData.phone.trim() || '—',
      email: editFormData.email.trim() || '—',
      status: editFormData.status as any,
    };

    dispatch(updateOrganizationOptimistic({ id: selectedOrgForEdit.id, updates }));
    setShowEditDrawer(false);
    showToast('Organization details updated successfully.');

    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update organization');
    } catch (err: any) {
      showToast(err.message || 'Error updating organization', 'error');
      fetchOrganizations();
    } finally {
      setEditSaving(false);
    }
  };

  // Properties Drawer
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
      console.error('Error loading org properties:', err);
    } finally {
      setLoadingOrgProps(false);
    }
  };

  const handleOpenAssignModal = async () => {
    setShowAssignPropModal(true);
    setLoadingAvailableProps(true);
    try {
      const res = await fetch('/api/admin/properties?status=ACTIVE&limit=100');
      const json = await res.json();
      if (json.success) {
        // Only allow unassigned properties (Rule 1)
        const unassigned = (json.data || []).filter(
          (p: any) => !p.organization_id || p.organization_id === selectedOrgForProps?.id
        );
        setAllAvailableProps(unassigned);
        if (unassigned.length > 0) {
          setSelectedPropToAssign(unassigned[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching available properties:', err);
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

  // Contacts Drawer
  const handleOpenContacts = async (org: OrgRecord) => {
    setSelectedOrgForContacts(org);
    setShowContactsDrawer(true);
    setMenuPosition(null);
    setLoadingOrgContacts(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/contacts`);
      const json = await res.json();
      if (json.success) {
        dispatch(setOrgContacts({ orgId: org.id, contacts: json.data || [] }));
      }
    } catch (err) {
      console.error('Error loading org contacts:', err);
    } finally {
      setLoadingOrgContacts(false);
    }
  };

  const currentOrgContactsList = selectedOrgForContacts
    ? orgContacts[selectedOrgForContacts.id] || []
    : [];

  const handleConfirmDeleteContact = async () => {
    if (!selectedOrgForContacts || !contactToDelete) return;
    setDeletingContact(true);

    const contactId = contactToDelete.id;
    dispatch(removeOrgContactOptimistic({ orgId: selectedOrgForContacts.id, contactId }));
    setContactToDelete(null);
    showToast('Contact removed successfully.');

    try {
      const res = await fetch(
        `/api/admin/organizations/${selectedOrgForContacts.id}/contacts?member_id=${contactId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
      if (selectedOrgForContacts) handleOpenContacts(selectedOrgForContacts);
    } finally {
      setDeletingContact(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForContacts) return;
    setSavingContact(true);

    const newContact: OrgContact = {
      id: `temp-${Date.now()}`,
      name: contactFormData.full_name.trim(),
      email: contactFormData.email.trim(),
      phone: contactFormData.phone_number.trim() || '—',
      role: contactFormData.is_primary ? 'ADMIN' : 'USER',
      is_primary: contactFormData.is_primary,
      status: 'ACTIVE',
    };

    dispatch(addOrgContactOptimistic({ orgId: selectedOrgForContacts.id, contact: newContact }));
    if (contactFormData.is_primary) {
      dispatch(
        setPrimaryContactOptimistic({
          orgId: selectedOrgForContacts.id,
          contactId: newContact.id,
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
        })
      );
    }

    setShowAddContactModal(false);
    setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
    showToast('Contact added successfully.');

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
      if (json.data && selectedOrgForContacts) {
        handleOpenContacts(selectedOrgForContacts);
      }
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
      if (selectedOrgForContacts) handleOpenContacts(selectedOrgForContacts);
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
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
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

      {/* 2. Top KPI Cards Row (5 Variant 1 Deep Blue Standardized Cards) */}
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
              {metrics.noPropertiesCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Unassigned</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Orgs with 0 assigned properties</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
          {/* Search Input (Instant char-by-char) */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => dispatch(setFilters({ searchQuery: e.target.value, currentPage: 1 }))}
              placeholder="Search by organization, address, contact, email, or phone..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => dispatch(setFilters({ searchQuery: '', currentPage: 1 }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => dispatch(setFilters({ selectedStatus: e.target.value, currentPage: 1 }))}
            aria-label="Filter by organization status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_ONBOARDING">Pending Onboarding</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Properties Assignment Filter */}
          <select
            value={selectedPropFilter}
            onChange={(e) => dispatch(setFilters({ selectedPropFilter: e.target.value, currentPage: 1 }))}
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
            onChange={(e) => setSortBy(e.target.value)}
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
              dispatch(setFilters({ searchQuery: '', selectedStatus: 'ALL', selectedPropFilter: 'ALL', currentPage: 1 }));
              setSortBy('NEWEST');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium self-end lg:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Organization Table */}
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
      ) : displayedOrganizations.length === 0 ? (
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
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[200px]">
                    Organization Name
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[240px]">
                    Address
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[150px]">
                    Primary Contact
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[180px]">
                    Email
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[120px]">
                    Phone
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap min-w-[100px]">
                    People Count
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap min-w-[100px]">
                    Properties
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Status
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Created At
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap min-w-[110px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {displayedOrganizations.map((org: OrgRecord) => {
                  const peopleCount = org.people_count || (org as any).contacts_count || (org.members?.length || 1);

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors group"
                    >
                      {/* Column 1: Organization Name */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{org.name}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </div>
                      </td>

                      {/* Column 2: Address */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[240px]">
                        <div className="text-slate-700 dark:text-slate-300 truncate max-w-[230px]" title={org.address}>
                          {org.address || 'Address not specified'}
                        </div>
                      </td>

                      {/* Column 3: Primary Contact Name */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[150px]">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {org.contact_name || (org as any).primary_contact_name || '—'}
                        </span>
                      </td>

                      {/* Column 4: Email */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[180px]">
                        {org.email && org.email !== '—' ? (
                          <button
                            onClick={(e) => handleCopyText(org.email, 'Email', `email-${org.id}`, e)}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group/copy"
                          >
                            <span>{org.email}</span>
                            {copiedId === `email-${org.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 5: Phone */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[120px]">
                        {org.phone && org.phone !== '—' ? (
                          <button
                            onClick={(e) => handleCopyText(org.phone, 'Phone', `phone-${org.id}`, e)}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group/copy"
                          >
                            <span>{org.phone}</span>
                            {copiedId === `phone-${org.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 6: People Count */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap min-w-[100px]">
                        <button
                          onClick={() => handleOpenContacts(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold text-xs transition cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{peopleCount}</span>
                        </button>
                      </td>

                      {/* Column 7: Properties Count */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap min-w-[100px]">
                        <button
                          onClick={() => handleOpenProperties(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold text-xs transition cursor-pointer"
                        >
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{org.properties_count || 0}</span>
                        </button>
                      </td>

                      {/* Column 8: Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : org.status === 'INACTIVE'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : org.status === 'PENDING_ONBOARDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : org.status === 'INACTIVE'
                                ? 'bg-rose-500'
                                : org.status === 'PENDING_ONBOARDING'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {org.status === 'ACTIVE'
                            ? 'Active'
                            : org.status === 'INACTIVE'
                            ? 'Inactive'
                            : org.status === 'PENDING_ONBOARDING'
                            ? 'Pending'
                            : org.status === 'SUSPENDED'
                            ? 'Suspended'
                            : 'Archived'}
                        </span>
                      </td>

                      {/* Column 9: Created At */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px] text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(org.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Column 10: Actions (3-Dots Trigger) */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap min-w-[110px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="View Organization Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={(e) => handleOpenMenu(e, org)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
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

          {/* Pagination Controls */}
          <div className="p-3.5 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#12131a]/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{displayedOrganizations.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{totalCount}</strong> organizations
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => dispatch(setFilters({ currentPage: Math.max(1, currentPage - 1) }))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => dispatch(setFilters({ currentPage: Math.min(totalPages, currentPage + 1) }))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed 3-Dots Action Menu (Upside Floating) */}
      {menuPosition && (
        <div
          style={{
            position: 'fixed',
            bottom: `${menuPosition.bottom}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-56 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#252733] rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430]">
            <p className="font-bold text-slate-900 dark:text-white truncate">{menuPosition.org.name}</p>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Action Menu
            </span>
          </div>

          <Link
            href={`/admin/organizations/${menuPosition.org.id}`}
            onClick={() => setMenuPosition(null)}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Details</span>
          </Link>

          <button
            onClick={() => handleOpenEditDrawer(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Organization</span>
          </button>

          <button
            onClick={() => handleOpenContacts(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Manage Contacts</span>
          </button>

          <button
            onClick={() => handleOpenProperties(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned Properties</span>
          </button>

          <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

          {menuPosition.org.status !== 'ACTIVE' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'ACTIVE')}
              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer text-left font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Set as Active</span>
            </button>
          )}

          {menuPosition.org.status !== 'INACTIVE' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'INACTIVE')}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer text-left font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Set as Inactive</span>
            </button>
          )}

          {menuPosition.org.status !== 'SUSPENDED' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'SUSPENDED')}
              className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer text-left font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspend Tenant</span>
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

          <button
            onClick={() => {
              setOrgToDelete(menuPosition.org);
              setMenuPosition(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer text-left font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Organization</span>
          </button>
        </div>
      )}

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          showToast('Client organization created successfully.');
          fetchOrganizations();
        }}
      />

      {/* Edit Organization Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedOrgForEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowEditDrawer(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Organization</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedOrgForEdit.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">ZIP</label>
                    <input
                      type="text"
                      value={editFormData.zip_code}
                      onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_ONBOARDING">Pending Onboarding</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
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
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Properties Drawer */}
      <AnimatePresence>
        {showPropertiesDrawer && selectedOrgForProps && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowPropertiesDrawer(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Properties</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrgForProps.name} ({orgPropertiesList.length} Properties)
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

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Properties Managed
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOpenAssignModal}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Property</span>
                  </motion.button>
                </div>

                {loadingOrgProps ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-400">Loading properties...</span>
                  </div>
                ) : orgPropertiesList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-white">No properties assigned</p>
                    <p className="text-slate-400 text-[11px]">
                      Click &quot;Assign Property&quot; to link properties to this organization portfolio.
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
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {prop.address || `${prop.city || ''}, ${prop.state || ''}`}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {prop.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

      {/* Assign Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAssignPropModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assign Property to {selectedOrgForProps?.name}
                  </h3>
                  <button
                    onClick={() => setShowAssignPropModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignPropertySubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Select Property to Link
                    </label>
                    {loadingAvailableProps ? (
                      <div className="p-3 bg-slate-50 dark:bg-[#111217] rounded-lg text-slate-400">
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

      {/* Contacts Drawer */}
      <AnimatePresence>
        {showContactsDrawer && selectedOrgForContacts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowContactsDrawer(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
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
                      {selectedOrgForContacts.name} ({currentOrgContactsList.length} Contacts)
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
                ) : currentOrgContactsList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-white">No contacts listed</p>
                    <p className="text-slate-400 text-[11px]">
                      Click &quot;Add Contact&quot; to create authorized personnel for this organization.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentOrgContactsList.map((contact: OrgContact) => (
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
                                Primary Contact
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
                          <button
                            onClick={(e) => handleCopyText(contact.email, 'Email', `c-email-${contact.id}`, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-[#252836] transition cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedId === `c-email-${contact.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setContactToDelete({ id: contact.id, name: contact.name })}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Delete Contact Confirmation Dialog */}
      <AnimatePresence>
        {contactToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactToDelete(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-70 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-70 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Remove Contact?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{contactToDelete.name}</strong> from this organization?
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactToDelete(null)}
                    disabled={deletingContact}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1b22]"
                  >
                    No, Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmDeleteContact}
                    disabled={deletingContact}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deletingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Yes, Remove</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAddContactModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
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
                      id="is_primary"
                      checked={contactFormData.is_primary}
                      onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_primary" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      Designate as Primary Contact for this Organization
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
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
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Contact</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Organization Confirmation Modal */}
      <AnimatePresence>
        {orgToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Organization</h3>
                  <p className="text-xs text-slate-400 font-mono">{orgToDelete.name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Are you sure you want to delete organization <span className="font-semibold text-slate-900 dark:text-white">"{orgToDelete.name}"</span>? This will unassign linked properties and remove tenant access.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setOrgToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteOrg}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Organization'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

