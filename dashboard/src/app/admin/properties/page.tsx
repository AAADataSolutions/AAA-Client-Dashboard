'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  Search,
  Plus,
  Download,
  MoreVertical,
  Settings,
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
  Trash2,
  Copy,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchProperties,
  setSearchQuery,
  setStatusFilter,
  setOrgFilter,
  setE911Filter,
  setRayBaumFilter,
  setSortBy,
  setPagination,
  optimisticUpdatePropertyStatus,
  optimisticRemoveProperty,
  PropertyItem,
  PropertyRecord,
} from '@/store/slices/propertiesSlice';

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

interface AssignedServiceItem {
  id: string;
  phone_number: string;
  service_type: string;
  description?: string;
  status: string;
}

interface AvailableServiceOption {
  id: string;
  phone_number: string;
  service_type: string;
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
  const dispatch = useAppDispatch();
  const {
    items: properties,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.properties);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Search input state (char-by-char)
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPropForEdit, setSelectedPropForEdit] = useState<PropertyItem | null>(null);

  // View Details Modal (pure black bold labels)
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPropForDetails, setSelectedPropForDetails] = useState<PropertyItem | null>(null);

  // View Services Modal
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedPropForServices, setSelectedPropForServices] = useState<PropertyItem | null>(null);
  const [propServicesList, setPropServicesList] = useState<AssignedServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Assign Service Modal
  const [showAssignServiceModal, setShowAssignServiceModal] = useState(false);
  const [selectedPropForAssign, setSelectedPropForAssign] = useState<PropertyItem | null>(null);
  const [availableServices, setAvailableServices] = useState<AvailableServiceOption[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState('');
  const [assigningService, setAssigningService] = useState(false);

  // Manage Contacts Drawer
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedPropForContacts, setSelectedPropForContacts] = useState<PropertyItem | null>(null);
  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'Property Contact',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Delete Contact Confirmation Modal (Yes/No)
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Change Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPropForStatus, setSelectedPropForStatus] = useState<PropertyItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // 3-Dots Action Menu Position (opens ABOVE the line)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; prop: PropertyItem } | null>(null);

  // Assign to Organization Modal State
  const [showAssignOrgModal, setShowAssignOrgModal] = useState(false);
  const [selectedPropForAssignOrg, setSelectedPropForAssignOrg] = useState<PropertyItem | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [assigningOrgLoading, setAssigningOrgLoading] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Delete Property State
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyItem | null>(null);
  const [deletePropertyLoading, setDeletePropertyLoading] = useState(false);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Form State for Create & Edit Property
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
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    ray_baud_and_logs_enabled: true,
    ray_baum_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    e911_status: 'VERIFIED' as 'VERIFIED' | 'AUDIT_REQUIRED',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  // Sync search input with Redux (char-by-char instant)
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Fetch properties from Redux
  const loadData = useCallback(() => {
    dispatch(
      fetchProperties({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        orgId: filters.selectedOrg,
        status: filters.selectedStatus,
        e911: filters.selectedE911,
        rayBaum: filters.rayBaum,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${text} copied to clipboard.`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open 3-Dots Menu (opens ABOVE the line per Rule 8)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, prop });
  };

  // Assign to Org Handler
  const handleAssignOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForAssignOrg || !targetOrgId) return;
    setAssigningOrgLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${targetOrgId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropForAssignOrg.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to assign property to organization');
      }
      showToast('Success', 'Property assigned to organization successfully.');
      setShowAssignOrgModal(false);
      setSelectedPropForAssignOrg(null);
      setTargetOrgId('');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to assign organization', 'error');
    } finally {
      setAssigningOrgLoading(false);
    }
  };

  // Unassign from Org Handler
  const handleUnassignFromOrg = async (prop: PropertyItem) => {
    const orgId = prop.primary_organization?.id || (prop.organizations?.[0]?.id);
    if (!orgId) return;
    if (!confirm(`Are you sure you want to unassign "${prop.name}" from ${prop.primary_organization?.name || 'its organization'}?`)) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties?propertyId=${prop.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to unassign property');
      }
      showToast('Success', 'Property unassigned from organization.');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to unassign', 'error');
    }
  };

  // --- Handlers: Contacts ---
  const handleOpenContactsDrawer = async (prop: PropertyItem) => {
    setSelectedPropForContacts(prop);
    setShowContactsDrawer(true);
    setLoadingContacts(true);

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

      showToast('Contact Saved', `${contactFormData.full_name} saved successfully.`, 'success');
      setShowAddContactModal(false);

      if (result.data) {
        setContactsList((prev) => [
          result.data,
          ...prev.filter((c) => c.id !== result.data.id && (!result.data.is_primary || !c.is_primary)),
        ]);
      }

      setContactFormData({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'Property Contact',
        is_primary: false,
      });

      // Refresh contacts list
      handleOpenContactsDrawer(selectedPropForContacts);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleConfirmDeleteContact = async () => {
    if (!selectedPropForContacts || !contactToDelete) return;

    try {
      setDeletingContact(true);
      const res = await fetch(
        `/api/admin/properties/${selectedPropForContacts.id}/contacts?contactId=${contactToDelete.id}`,
        { method: 'DELETE' }
      );

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to remove contact.');

      // Optimistic instant state update
      setContactsList((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      showToast('Contact Removed', `${contactToDelete.name} was removed.`, 'success');
      setContactToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeletingContact(false);
    }
  };

  // Handle Confirm Delete Property
  const handleConfirmDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      setDeletePropertyLoading(true);
      const res = await fetch(`/api/admin/properties/${propertyToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete property');
      showToast('Deleted', `Property '${propertyToDelete.name}' was removed.`, 'success');
      setPropertyToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete property', 'error');
    } finally {
      setDeletePropertyLoading(false);
    }
  };

  // --- Handlers: View Services ---
  const handleOpenServicesModal = async (prop: PropertyItem) => {
    setSelectedPropForServices(prop);
    setShowServicesModal(true);
    setLoadingServices(true);

    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/services`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setPropServicesList(result.data);
      } else {
        setPropServicesList([]);
      }
    } catch (err) {
      setPropServicesList([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleUnassignService = async (serviceId: string) => {
    if (!selectedPropForServices) return;

    try {
      const res = await fetch(
        `/api/admin/properties/${selectedPropForServices.id}/services?serviceId=${serviceId}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign service.');

      // Optimistic instant update in UI
      setPropServicesList((prev) => prev.filter((s) => s.id !== serviceId));
      showToast('Service Unassigned', 'Service successfully unassigned from property.', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // --- Handlers: Assign Service ---
  const handleOpenAssignServiceModal = async (prop: PropertyItem) => {
    setSelectedPropForAssign(prop);
    setSelectedServiceToAssign('');
    setShowAssignServiceModal(true);

    try {
      const res = await fetch('/api/admin/services?limit=100');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        // Filter unassigned services or list all
        setAvailableServices(
          result.data.map((s: any) => ({
            id: s.id,
            phone_number: s.phone_number,
            service_type: s.service_type || 'Voice Trunk',
          }))
        );
      }
    } catch (err) {
      setAvailableServices([]);
    }
  };

  const handleConfirmAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForAssign || !selectedServiceToAssign) {
      showToast('Validation', 'Please select a service to assign.', 'error');
      return;
    }

    try {
      setAssigningService(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForAssign.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedServiceToAssign }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign service.');

      showToast('Service Assigned', 'Service linked to property successfully.', 'success');
      setShowAssignServiceModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssigningService(false);
    }
  };

  // --- Handlers: Create Property ---
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError('Property name, street address, city, state, and ZIP code are required.');
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
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Edit Property ---
  const handleOpenEdit = (prop: PropertyItem) => {
    setSelectedPropForEdit(prop);
    const isE911 = prop.ray_baud_and_logs_enabled ?? true;
    const isRayBaumActive = (prop as any).ray_baum_status === 'Active' || (prop as any).ray_baum_status === 'ACTIVE';

    setFormData({
      name: prop.name || '',
      organization_id: prop.primary_organization?.id || prop.organizations?.[0]?.id || prop.organization_id || '',
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      zip_code: prop.zip_code || '',
      country: prop.country || 'USA',
      main_phone: prop.main_phone || '',
      fax: prop.fax || '',
      general_manager_name: prop.general_manager_name || '',
      general_manager_phone: prop.general_manager_phone || '',
      general_manager_email: prop.general_manager_email || '',
      ray_baud_and_logs_enabled: isE911,
      ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
      e911_status: isE911 ? 'VERIFIED' : 'AUDIT_REQUIRED',
      status: (prop.status as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') || 'ACTIVE',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForEdit) return;

    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError('Property name, street address, city, state, and ZIP code are required.');
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
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // --- Handlers: Change Status ---
  const handleOpenStatusModal = (prop: PropertyItem) => {
    setSelectedPropForStatus(prop);
    setTargetStatus((prop.status as any) || 'ACTIVE');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedPropForStatus) return;

    // Optimistic Redux instant update (< 1ms zero reload)
    dispatch(optimisticUpdatePropertyStatus({ id: selectedPropForStatus.id, status: targetStatus }));

    try {
      setStatusChangeLoading(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to change property status.');

      showToast('Status Updated', `${selectedPropForStatus.name} is now ${targetStatus}.`, 'success');
      setShowStatusModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setOrgFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
    dispatch(setE911Filter('ALL'));
    dispatch(setSortBy('NAME_ASC'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedOrg !== 'ALL' ||
    filters.selectedStatus !== 'ALL' ||
    filters.selectedE911 !== 'ALL' ||
    filters.sortBy !== 'NAME_ASC';

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

      {/* Page Header */}
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
              const headers = ['ID,Name,Address,City,State,Zip,GM Name,GM Phone,GM Email,Status\n'];
              const rows = properties.map((p: PropertyRecord) =>
                `"${p.id}","${p.name}","${p.address}","${p.city}","${p.state}","${p.zip_code}","${p.general_manager_name || ''}","${p.general_manager_phone || ''}","${p.general_manager_email || ''}","${p.status}"`
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
                general_manager_name: '',
                general_manager_phone: '',
                general_manager_email: '',
                ray_baud_and_logs_enabled: true,
                ray_baum_status: 'ACTIVE',
                e911_status: 'VERIFIED',
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

      {/* KPI Cards - ONLY Variant 1 (Deep Blue) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Properties */}
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

        {/* Card 2: E911 PSAP Verified */}
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

        {/* Card 3: Associated Services */}
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

        {/* Card 4: Pending / Inactive */}
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
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box (char-by-char) */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search properties by name, city, GM, contact..."
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
              value={filters.selectedOrg}
              onChange={(e) => {
                dispatch(setOrgFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
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

            <select
              value={filters.selectedStatus}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by property status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={filters.selectedE911}
              onChange={(e) => {
                dispatch(setE911Filter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by E911"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">E911: All E911</option>
              <option value="VERIFIED">Verified</option>
              <option value="AUDIT_REQUIRED">Audit Required</option>
            </select>

            <select
              value={filters.rayBaum || 'ALL'}
              onChange={(e) => {
                dispatch(setRayBaumFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by Ray Baum and Kary's Law"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Ray Baum: All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
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
            {filters.selectedE911 !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                E911: {filters.selectedE911}
                <button onClick={() => dispatch(setE911Filter('ALL'))} className="cursor-pointer">
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
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load properties</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && properties.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
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
                className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer"
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
                  general_manager_name: '',
                  general_manager_phone: '',
                  general_manager_email: '',
                  ray_baud_and_logs_enabled: true,
                  ray_baum_status: 'ACTIVE',
                  e911_status: 'VERIFIED',
                  status: 'ACTIVE',
                });
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Property
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">LOCATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">NO. OF SERVICES</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">E911 STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">RAY BAUM AND KARY'S LAW</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM PHONE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM EMAIL</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ONBOARDING STAGE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {properties.map((prop: PropertyRecord) => {
                  return (
                    <tr key={prop.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      {/* 1. Property Name (Pure Black bold, NO initials icon) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {prop.name}
                        </span>
                      </td>

                      {/* 2. Location */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300">
                          {prop.city ? `${prop.city}, ${prop.state || prop.country} ${prop.zip_code || ''}` : prop.address}
                        </span>
                      </td>

                      {/* 3. Organization */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {(prop.organization_name && prop.organization_name !== 'Unassigned') || prop.primary_organization || (prop.organizations && prop.organizations.length > 0) ? (
                          <a
                            href={`/admin/organizations/${prop.primary_organization?.id || prop.organizations?.[0]?.id || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>{prop.organization_name && prop.organization_name !== 'Unassigned' ? prop.organization_name : (prop.primary_organization?.name || prop.organizations?.[0]?.name)}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* 4. No. of Associated Services (Dynamic) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {prop.services_count || 0}{' '}
                          <span className="font-normal text-[11px] text-slate-400">Services</span>
                        </span>
                      </td>

                      {/* 5. E911 Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.ray_baud_and_logs_enabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" /> PSAP Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" /> Audit Required
                          </span>
                        )}
                      </td>

                      {/* 6. Ray Baum and Kary's Law (Active / Inactive) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.ray_baum_status === 'Active' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/admin/ray-baum/${prop.id}`, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                            title="Open Ray Baum and Kary's Law in a new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* 6. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {prop.general_manager_name || prop.contact_person_name || 'N/A'}
                        </span>
                      </td>

                      {/* 7. GM Phone (with Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.general_manager_phone || prop.main_phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">
                              {prop.general_manager_phone || prop.main_phone}
                            </span>
                            <button
                              onClick={() => handleCopy(prop.general_manager_phone || prop.main_phone || '', `gm-phone-${prop.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Phone"
                            >
                              {copiedField === `gm-phone-${prop.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>

                      {/* 8. GM Email (with Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.general_manager_email || prop.contact_person_email ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">
                              {prop.general_manager_email || prop.contact_person_email}
                            </span>
                            <button
                              onClick={() => handleCopy(prop.general_manager_email || prop.contact_person_email || '', `gm-email-${prop.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedField === `gm-email-${prop.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>

                      {/* 10. Property Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!prop.is_assigned && !prop.primary_organization && (!prop.organizations || prop.organizations.length === 0) && (!prop.organization_name || prop.organization_name === 'Unassigned') ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Unassigned
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenStatusModal(prop)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition whitespace-nowrap ${
                              prop.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                                : prop.status === 'ARCHIVED'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                prop.status === 'ACTIVE'
                                  ? 'bg-emerald-500'
                                  : prop.status === 'ARCHIVED'
                                  ? 'bg-rose-500'
                                  : 'bg-blue-500'
                              }`}
                            />
                            {prop.status === 'ACTIVE' ? 'Active' : prop.status === 'ARCHIVED' ? 'Archived' : 'Assigned'}
                          </button>
                        )}
                      </td>

                      {/* 10. Onboarding Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-[#1a1c24] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#222430]">
                          {(prop as any).onboarding_stage === 'DRAFT' || !(prop as any).onboarding_stage ? 'Draft Initialized' : (prop as any).onboarding_stage}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(prop)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Property"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, prop)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
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
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} properties
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
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.prop.name}</p>
              <p className="text-[10px] text-slate-400">Property Options</p>
            </div>

            <button
              onClick={() => {
                setSelectedPropForDetails(menuPosition.prop);
                setShowDetailsModal(true);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property Details</span>
            </button>

            <button
              onClick={() => {
                handleOpenServicesModal(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-purple-500" />
              <span>View Services</span>
            </button>

            {/* If assigned to an org, show Assign Service */}
            {(menuPosition.prop.primary_organization || (menuPosition.prop.organizations && menuPosition.prop.organizations.length > 0)) && (
              <button
                onClick={() => {
                  handleOpenAssignServiceModal(menuPosition.prop);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assign Service</span>
              </button>
            )}

            {/* If UNASSIGNED, show Assign to Organization */}
            {!menuPosition.prop.primary_organization && (!menuPosition.prop.organizations || menuPosition.prop.organizations.length === 0) && (
              <button
                onClick={() => {
                  setSelectedPropForAssignOrg(menuPosition.prop);
                  setShowAssignOrgModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Assign to Organization</span>
              </button>
            )}

            {/* If ASSIGNED, show Unassign from Organization */}
            {(menuPosition.prop.primary_organization || (menuPosition.prop.organizations && menuPosition.prop.organizations.length > 0)) && (
              <button
                onClick={() => {
                  const p = menuPosition.prop;
                  setMenuPosition(null);
                  handleUnassignFromOrg(p);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
              >
                <Unlink className="w-3.5 h-3.5 text-amber-500" />
                <span>Unassign from Organization</span>
              </button>
            )}

            <button
              onClick={() => {
                handleOpenContactsDrawer(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manage Contacts</span>
            </button>

            <button
              onClick={() => {
                handleOpenStatusModal(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Change Status</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

            <button
              onClick={() => {
                handleOpenEdit(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Property Settings</span>
            </button>

            <button
              onClick={() => {
                setPropertyToDelete(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Property</span>
            </button>
          </div>
        </>
      )}

      {/* 1. VIEW PROPERTY DETAILS MODAL (Pure Black Labels) */}
      <AnimatePresence>
        {showDetailsModal && selectedPropForDetails && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Property Overview</h3>
                    <p className="text-xs text-slate-500">{selectedPropForDetails.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {/* 2-Column Grid with Pure Black Bold Labels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Parent Organization</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.organization_name || (selectedPropForDetails as any).primary_organization?.name || (selectedPropForDetails as any).organizations?.[0]?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Street Address</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.address}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">City, State & ZIP</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.city}, {selectedPropForDetails.state} {selectedPropForDetails.zip_code}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.general_manager_name || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.general_manager_phone || selectedPropForDetails.main_phone || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.general_manager_email || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Status</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.status}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ray Baum Act Compliance: {selectedPropForDetails.ray_baud_and_logs_enabled ? 'Verified' : 'Not-Verified'}</span>
                  </div>
                  <div className="text-slate-500 font-medium">
                    Services: {selectedPropForDetails.services_count || 0} active
                  </div>
                </div>
              </div>

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

      {/* 2. VIEW SERVICES MODAL */}
      <AnimatePresence>
        {showServicesModal && selectedPropForServices && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <PhoneCall className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Assigned Services</h3>
                    <p className="text-xs text-slate-500">{selectedPropForServices.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1">
                {loadingServices ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading assigned services...
                  </div>
                ) : propServicesList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-400">
                    <PhoneCall className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    No services currently assigned to this property.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#222430]">
                    {propServicesList.map((svc) => (
                      <div key={svc.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{svc.phone_number}</p>
                          <p className="text-slate-400 text-[11px]">{svc.service_type} {svc.description ? `• ${svc.description}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            svc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {svc.status}
                          </span>
                          <button
                            onClick={() => handleUnassignService(svc.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                            title="Unassign Service"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowServicesModal(false);
                    handleOpenAssignServiceModal(selectedPropForServices);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Another Service
                </button>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ASSIGN SERVICE MODAL */}
      <AnimatePresence>
        {showAssignServiceModal && selectedPropForAssign && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign Service</h3>
                </div>
                <button
                  onClick={() => setShowAssignServiceModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAssignService} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Target Property</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedPropForAssign.name}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Select Service</label>
                  <select
                    value={selectedServiceToAssign}
                    onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a service to link...</option>
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.phone_number} ({svc.service_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  Rule: A service can only be assigned to one property. Assigning this service will associate it with this property.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAssignServiceModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningService || !selectedServiceToAssign}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {assigningService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MANAGE CONTACTS DRAWER */}
      <AnimatePresence>
        {showContactsDrawer && selectedPropForContacts && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setShowContactsDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Property Contacts</h3>
                    <p className="text-xs text-slate-400">{selectedPropForContacts.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-[#222430] flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {contactsList.length} Contacts
                </span>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingContacts ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading contacts...
                  </div>
                ) : contactsList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-400">
                    No contacts saved for this property yet.
                  </div>
                ) : (
                  contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{contact.name}</span>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </p>
                        {contact.phone && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setContactToDelete(contact)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Remove Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ADD CONTACT MODAL */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Property Contact</h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContactSubmit} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    placeholder="sarah@hotel.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={contactFormData.phone_number}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="prop_contact_primary"
                    checked={contactFormData.is_primary}
                    onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="prop_contact_primary" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Set as Primary Contact for this Property
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DELETE CONTACT CONFIRMATION MODAL (Yes/No) */}
      <AnimatePresence>
        {contactToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Remove Contact</h3>
                  <p className="text-xs text-slate-500">Are you sure you want to delete this contact?</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{contactToDelete.name}</p>
                <p className="text-slate-500">{contactToDelete.email}</p>
              </div>

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setContactToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteContact}
                  disabled={deletingContact}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deletingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CHANGE STATUS MODAL */}
      <AnimatePresence>
        {showStatusModal && selectedPropForStatus && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Change Property Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Select new operational status for <span className="font-bold text-black dark:text-white">{selectedPropForStatus.name}</span>:
                </p>

                <div className="space-y-2">
                  {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        targetStatus === st
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#181920]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st === 'ACTIVE' ? 'bg-emerald-500' : st === 'ARCHIVED' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-bold uppercase text-[11px]">{st}</span>
                      </div>
                      {targetStatus === st && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={statusChangeLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {statusChangeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. CREATE PROPERTY MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Create New Property</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveCreate} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Property Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Grand Horizon Resort"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Organization</label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Organization (Optional)</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Ocean Blvd"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Miami"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      State & ZIP <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="FL"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        required
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        placeholder="33139"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Full Name</label>
                    <input
                      type="text"
                      value={formData.general_manager_name}
                      onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                      placeholder="e.g. Robert Smith"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Phone Number</label>
                    <input
                      type="tel"
                      value={formData.general_manager_phone}
                      onChange={(e) => setFormData({ ...formData, general_manager_phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Email</label>
                    <input
                      type="email"
                      value={formData.general_manager_email}
                      onChange={(e) => setFormData({ ...formData, general_manager_email: e.target.value })}
                      placeholder="robert@horizon.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">E911 Compliance Status</label>
                    <select
                      value={formData.e911_status}
                      onChange={(e) => {
                        const val = e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED';
                        setFormData({
                          ...formData,
                          e911_status: val,
                          ray_baud_and_logs_enabled: val === 'VERIFIED',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="VERIFIED">PSAP Verified (Active)</option>
                      <option value="AUDIT_REQUIRED">Audit Required (Pending)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Ray Baum and Kari&apos;s Law</label>
                    <select
                      value={formData.ray_baum_status}
                      onChange={(e) => {
                        const val = e.target.value as 'ACTIVE' | 'INACTIVE';
                        setFormData({
                          ...formData,
                          ray_baum_status: val,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active (Compliant)</option>
                      <option value="INACTIVE">Inactive (Non-Compliant)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. EDIT PROPERTY MODAL */}
      <AnimatePresence>
        {showEditModal && selectedPropForEdit && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Property Details</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Property Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Organization</label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Organization (Optional)</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      State & ZIP <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        required
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Full Name</label>
                    <input
                      type="text"
                      value={formData.general_manager_name}
                      onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Phone Number</label>
                    <input
                      type="tel"
                      value={formData.general_manager_phone}
                      onChange={(e) => setFormData({ ...formData, general_manager_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Email</label>
                    <input
                      type="email"
                      value={formData.general_manager_email}
                      onChange={(e) => setFormData({ ...formData, general_manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">E911 Compliance Status</label>
                    <select
                      value={formData.e911_status}
                      onChange={(e) => {
                        const val = e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED';
                        setFormData({
                          ...formData,
                          e911_status: val,
                          ray_baud_and_logs_enabled: val === 'VERIFIED',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="VERIFIED">PSAP Verified (Active)</option>
                      <option value="AUDIT_REQUIRED">Audit Required (Pending)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Ray Baum and Kari&apos;s Law</label>
                    <select
                      value={formData.ray_baum_status}
                      onChange={(e) => {
                        const val = e.target.value as 'ACTIVE' | 'INACTIVE';
                        setFormData({
                          ...formData,
                          ray_baum_status: val,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active (Compliant)</option>
                      <option value="INACTIVE">Inactive (Non-Compliant)</option>
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">Property Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN TO ORGANIZATION MODAL */}
      <AnimatePresence>
        {showAssignOrgModal && selectedPropForAssignOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign to Organization</h3>
                    <p className="text-xs text-slate-400">{selectedPropForAssignOrg.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignOrgModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignOrgSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Select Organization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="">Choose an organization...</option>
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  Assigning this property will set its status to <strong>ONBOARDING</strong> and initialize its 7-stage onboarding tracker at <strong>Draft Initialized</strong>.
                </p>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignOrgModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningOrgLoading || !targetOrgId}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {assigningOrgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Assign Property</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROPERTY CONFIRMATION MODAL */}
      <AnimatePresence>
        {propertyToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Property</h3>
                  <p className="text-xs text-slate-400 font-mono">{propertyToDelete.name}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Are you sure you want to permanently delete property <span className="font-semibold text-slate-900 dark:text-white">"{propertyToDelete.name}"</span>? This will unassign linked services, compliance records, and tenant assignments.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPropertyToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteProperty}
                  disabled={deletePropertyLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deletePropertyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Property'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
