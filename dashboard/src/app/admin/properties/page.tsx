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
  Upload,
  Server,
  Wifi,
  Globe,
  FileText,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { ImportPropertiesModal } from '@/components/admin/ImportPropertiesModal';
import { useAuth } from '@/lib/auth/auth-context';
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
  updatePropertyOptimistic,
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
  price?: number;
  status: string;
}

interface AvailableServiceOption {
  id: string;
  phone_number: string;
  service_type: string;
  price?: number;
}

interface OrgOption {
  id: string;
  name: string;
}

interface PartnerOption {
  id: string;
  name: string;
  company_name?: string;
  default_commission_rate: number;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPropertiesPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

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
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
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

  // Comprehensive Property Side Modal (Drawer)
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<PropertyRecord | null>(null);
  const [propertyDrawerData, setPropertyDrawerData] = useState<any>(null);
  const [loadingDrawerData, setLoadingDrawerData] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'OVERVIEW' | 'SERVICES' | 'E911' | 'DATA_CIRCUIT' | 'PORTING_DOCS'>('OVERVIEW');
  const [drawerAssignServiceId, setDrawerAssignServiceId] = useState('');
  const [assigningServiceInDrawer, setAssigningServiceInDrawer] = useState(false);
  const [unassigningServiceId, setUnassigningServiceId] = useState<string | null>(null);

  // Assign to Organization Modal State
  const [showAssignOrgModal, setShowAssignOrgModal] = useState(false);
  const [selectedPropForAssignOrg, setSelectedPropForAssignOrg] = useState<PropertyItem | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [assigningOrgLoading, setAssigningOrgLoading] = useState(false);

  // Import CSV Modal State
  const [showImportModal, setShowImportModal] = useState(false);

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
    partner_id: '',
    partner_commission_override: '' as string | number,
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
    base_price: '' as string | number,
    monthly_price: '' as string | number,
    onboarding_date: new Date().toISOString().slice(0, 10),
    ray_baud_and_logs_enabled: true,
    ray_baum_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    e911_status: 'VERIFIED' as 'VERIFIED' | 'AUDIT_REQUIRED',
    connectivity_type: 'PORTED' as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
    billing_status: 'BILLING_PENDING' as 'BILLING_DONE' | 'BILLING_PENDING',
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

  // Load partners for dropdown
  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch('/api/admin/partners?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPartnerOptions(
            data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              company_name: p.company_name,
              default_commission_rate: p.default_commission_rate ?? 0,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load partner options:', err);
      }
    }
    loadPartners();
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
      const removedSvc = propServicesList.find((s) => s.id === serviceId);
      const svcPrice = Number(removedSvc?.price || 0);
      setPropServicesList((prev) => prev.filter((s) => s.id !== serviceId));
      showToast('Service Unassigned', `Service unassigned. Monthly price reduced by $${svcPrice.toFixed(2)}.`, 'success');
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
            price: Number(s.price || 0),
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
      partner_id: (prop as any).partner_id || (prop as any).partner?.id || '',
      partner_commission_override: (prop as any).partner_commission_override !== null && (prop as any).partner_commission_override !== undefined ? (prop as any).partner_commission_override : '',
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
      base_price: prop.base_price !== undefined && prop.base_price !== null ? prop.base_price : (prop.monthly_price ?? ''),
      monthly_price: prop.base_price !== undefined && prop.base_price !== null ? prop.base_price : (prop.monthly_price ?? ''),
      onboarding_date: prop.onboarding_date || (prop.created_at ? prop.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      ray_baud_and_logs_enabled: isE911,
      ray_baum_status: isRayBaumActive ? 'ACTIVE' : 'INACTIVE',
      e911_status: isE911 ? 'VERIFIED' : 'AUDIT_REQUIRED',
      connectivity_type: (prop as any).connectivity_type || ((prop as any).data_circuit ? 'BOTH' : 'PORTED'),
      billing_status: ((prop as any).billing_status === 'BILLING_DONE' ? 'BILLING_DONE' : 'BILLING_PENDING') as 'BILLING_DONE' | 'BILLING_PENDING',
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

  const handleQuickUpdateStatus = async (propId: string, newStatus: string) => {
    dispatch(optimisticUpdatePropertyStatus({ id: propId, status: newStatus }));
    try {
      const res = await fetch(`/api/admin/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update status.');
      showToast('Status Updated', `Property status set to ${newStatus}.`, 'success');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    }
  };

  const handleQuickUpdateStage = async (propId: string, newStage: string) => {
    dispatch(updatePropertyOptimistic({ id: propId, updates: { onboarding_stage: newStage } }));
    try {
      const res = await fetch(`/api/admin/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_stage: newStage }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update stage.');
      showToast('Stage Updated', `Onboarding stage set to ${newStage}.`, 'success');
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    }
  };

  const handleQuickUpdateBillingStatus = async (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => {
    dispatch(updatePropertyOptimistic({ id: propId, updates: { billing_status: newBillingStatus } as any }));
    if (selectedPropForDrawer && selectedPropForDrawer.id === propId) {
      setSelectedPropForDrawer((prev) => (prev ? { ...prev, billing_status: newBillingStatus } : prev));
    }
    if (propertyDrawerData?.property?.id === propId) {
      setPropertyDrawerData((prev: any) =>
        prev ? { ...prev, property: { ...prev.property, billing_status: newBillingStatus } } : prev
      );
    }
    try {
      const res = await fetch(`/api/admin/properties/${propId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_status: newBillingStatus }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update billing status.');
      showToast(
        'Billing Status Updated',
        `Property marked as ${newBillingStatus === 'BILLING_DONE' ? 'Billing Done (Billed)' : 'Billing Pending'}.`,
        'success'
      );
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    }
  };

  // --- Handlers: Comprehensive Property Side Drawer ---
  const handleOpenPropertyDrawer = async (prop: PropertyRecord | PropertyItem) => {
    setSelectedPropForDrawer(prop as PropertyRecord);
    setShowPropertyDrawer(true);
    setDrawerTab('OVERVIEW');
    setLoadingDrawerData(true);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/details`);
      const result = await res.json();
      if (result.success && result.data) {
        setPropertyDrawerData(result.data);
      } else {
        setPropertyDrawerData(null);
      }
    } catch (err) {
      console.error('Failed to load property details', err);
      setPropertyDrawerData(null);
    } finally {
      setLoadingDrawerData(false);
    }
  };

  const refreshDrawerData = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/details`);
      const result = await res.json();
      if (result.success && result.data) {
        setPropertyDrawerData(result.data);
      }
    } catch (err) {
      console.error('Failed to refresh drawer data', err);
    }
  };

  const handleDrawerAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForDrawer || !drawerAssignServiceId) return;

    try {
      setAssigningServiceInDrawer(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: drawerAssignServiceId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign service');

      showToast('Service Assigned', 'Service linked to property successfully.', 'success');
      setDrawerAssignServiceId('');
      await refreshDrawerData(selectedPropForDrawer.id);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssigningServiceInDrawer(false);
    }
  };

  const handleDrawerUnassignService = async (serviceId: string, serviceName: string) => {
    if (!selectedPropForDrawer) return;

    try {
      setUnassigningServiceId(serviceId);
      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/services?serviceId=${serviceId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign service');

      showToast('Service Unassigned', `${serviceName || 'Service'} removed from property.`, 'success');
      await refreshDrawerData(selectedPropForDrawer.id);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setUnassigningServiceId(null);
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
    (filters.selectedOrg && filters.selectedOrg !== 'ALL') ||
    (filters.orgId && filters.orgId !== 'ALL') ||
    filters.selectedStatus !== 'ALL' ||
    filters.selectedE911 !== 'ALL' ||
    (filters.rayBaum && filters.rayBaum !== 'ALL') ||
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
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Import CSV
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
                partner_id: '',
                partner_commission_override: '',
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
                base_price: '',
                monthly_price: '',
                onboarding_date: new Date().toISOString().slice(0, 10),
                ray_baud_and_logs_enabled: true,
                ray_baum_status: 'ACTIVE',
                e911_status: 'VERIFIED',
                connectivity_type: 'PORTED',
                billing_status: 'BILLING_PENDING',
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
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={filters.selectedOrg || filters.orgId || 'ALL'}
              onChange={(e) => {
                dispatch(setOrgFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by organization"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Client: All Clients</option>
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>

            <select
              value={filters.selectedStatus || filters.status || 'ALL'}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by property status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="INACTIVE">Inactive</option>
              <option value="UNASSIGNED">Unassigned</option>
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
            {((filters.selectedOrg && filters.selectedOrg !== 'ALL') || (filters.orgId && filters.orgId !== 'ALL')) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Client: {orgOptions.find((o) => o.id === (filters.selectedOrg || filters.orgId))?.name || 'Client'}
                <button onClick={() => dispatch(setOrgFilter('ALL'))} className="cursor-pointer">
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
            {filters.rayBaum && filters.rayBaum !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Ray Baum: {filters.rayBaum}
                <button onClick={() => dispatch(setRayBaumFilter('ALL'))} className="cursor-pointer">
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
                  partner_id: '',
                  partner_commission_override: '',
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
                  base_price: '',
                  monthly_price: '',
                  onboarding_date: new Date().toISOString().slice(0, 10),
                  ray_baud_and_logs_enabled: true,
                  ray_baum_status: 'ACTIVE',
                  e911_status: 'VERIFIED',
                  connectivity_type: 'PORTED',
                  billing_status: 'BILLING_PENDING',
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
                  {isSuperAdmin && (
                    <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">MONTHLY PRICE</th>
                  )}
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">MAIN PHONE NO.</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">CLIENT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">NO. OF SERVICES</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">E911 STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">RAY BAUM AND KARY'S LAW</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM EMAIL</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">BILLING STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {properties.map((prop: PropertyRecord) => {
                  return (
                    <tr key={prop.id} onClick={() => handleOpenPropertyDrawer(prop)} className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition cursor-pointer group">
                      {/* 1. Property Name with Address & Connectivity / Data Circuit underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black dark:text-white text-sm">
                            {prop.name}
                          </span>
                          {(() => {
                            const connType = prop.connectivity_type || (prop.data_circuit ? 'BOTH' : 'PORTED');
                            if (connType === 'BOTH') {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-sans">
                                  Ported &amp; Data Circuited
                                </span>
                              );
                            }
                            if (connType === 'DATA_CIRCUITED') {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-sans">
                                  Data Circuited
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-sans">
                                Ported
                              </span>
                            );
                          })()}
                        </div>
                        {prop.data_circuit && (
                          <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-medium">
                              Carrier: <strong>{prop.data_circuit.carrier_name || 'Pending'}</strong>
                              {prop.data_circuit.bandwidth ? ` (${prop.data_circuit.bandwidth})` : ''}
                              {prop.data_circuit.circuit_monthly_price !== null && prop.data_circuit.circuit_monthly_price !== undefined
                                ? ` • $${Number(prop.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                                : ''}
                            </span>
                          </div>
                        )}
                        <span className="hidden">
                          {prop.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span>
                            {prop.city
                              ? `${prop.address ? prop.address + ', ' : ''}${prop.city}, ${prop.state || prop.country} ${prop.zip_code || ''}`
                              : (prop.address || '—')}
                          </span>
                        </div>
                      </td>

                      {/* 2. Monthly Price (Super Admin Only) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {prop.monthly_price !== null && prop.monthly_price !== undefined
                              ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '—'}
                          </span>
                          {prop.onboarding_date && (
                            <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5" title="Onboarding Date">
                              Onboarded: {prop.onboarding_date}
                            </span>
                          )}
                        </td>
                      )}

                      {/* 3. Main Phone No. (with Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.main_phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300 font-medium">
                              {prop.main_phone}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(prop.main_phone || '', `main-phone-${prop.id}`); }}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy Main Phone"
                            >
                              {copiedField === `main-phone-${prop.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* 4. Client (formerly Management Group) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {(prop.organization_name && prop.organization_name !== 'Unassigned') || prop.primary_organization || (prop.organizations && prop.organizations.length > 0) ? (
                          <div className="inline-flex items-center gap-2">
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
                            {((prop as any).organization_type === 'INDIVIDUAL' || prop.primary_organization?.type === 'INDIVIDUAL' || prop.organizations?.[0]?.type === 'INDIVIDUAL') ? (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-2xs ring-2 ring-blue-500/20"
                                title="Individual Client"
                              />
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-2xs ring-2 ring-emerald-500/20"
                                title="Group Client"
                              />
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* 5. No. of Associated Services (Dynamic) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenServicesModal(prop)}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 dark:bg-[#1a1c26] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 hover:border-blue-300 dark:border-[#282a36] dark:hover:border-blue-800/60 transition cursor-pointer"
                          title="Click to view & manage assigned services"
                        >
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {prop.services_count || 0}
                          </span>
                          <span className="font-normal text-[11px] text-slate-400 group-hover:text-blue-500">
                            Services
                          </span>
                        </button>
                      </td>

                      {/* 6. E911 Status */}
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

                      {/* 7. Ray Baum and Kary's Law (Active / Inactive) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {prop.ray_baum_status === 'Active' || prop.ray_baum_status === 'ACTIVE' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/admin/ray-baum/${prop.id}`, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                            title="Open Ray Baum and Kary's Law in a new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>View Ray Baum No.s</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* 8. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {prop.general_manager_name || prop.contact_person_name || 'N/A'}
                        </span>
                      </td>

                      {/* 9. GM Email (with Copy) */}
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

                      {/* 10. Property Status (Inline Select) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select onClick={(e) => e.stopPropagation()}
                          value={prop.status === 'ONBOARDING' ? 'ACTIVE' : (prop.status || 'ACTIVE')}
                          onChange={(e) => handleQuickUpdateStatus(prop.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
                            prop.status === 'ACTIVE' || prop.status === 'ONBOARDING'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
                              : prop.status === 'ARCHIVED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
                          }`}
                        >
                          <option value="ACTIVE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">Onboarded</option>
                          <option value="INACTIVE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">Inactive</option>
                          <option value="ARCHIVED" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">Archived</option>
                        </select>
                      </td>

                      {/* 11. Billing Status (Inline Select - Changeable Anytime) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={(prop as any).billing_status === 'BILLING_DONE' ? 'BILLING_DONE' : 'BILLING_PENDING'}
                          onChange={(e) => handleQuickUpdateBillingStatus(prop.id, e.target.value as 'BILLING_DONE' | 'BILLING_PENDING')}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
                            (prop as any).billing_status === 'BILLING_DONE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          <option value="BILLING_DONE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">Billing Done (Billed)</option>
                          <option value="BILLING_PENDING" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">Billing Pending</option>
                        </select>
                      </td>

                      {/* 12. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(prop); }}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Property"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenMenu(e, prop); }}
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
                handleOpenPropertyDrawer(menuPosition.prop);
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

            {/* Assign Service (Works for both assigned and unassigned properties) */}
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
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

              <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                {/* 2-Column Grid with Pure Black Bold Labels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.name}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Monthly Price</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {selectedPropForDetails.monthly_price !== null && selectedPropForDetails.monthly_price !== undefined
                          ? `$${Number(selectedPropForDetails.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Not set'}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Client</label>
                    <div className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>
                        {selectedPropForDetails.organization_name || (selectedPropForDetails as any).primary_organization?.name || (selectedPropForDetails as any).organizations?.[0]?.name || 'Unassigned'}
                      </span>
                      {selectedPropForDetails.organization_name && selectedPropForDetails.organization_name !== 'Unassigned' && (
                        ((selectedPropForDetails as any).organization_type === 'INDIVIDUAL' || (selectedPropForDetails as any).primary_organization?.type === 'INDIVIDUAL') ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Individual
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Group
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Channel Partner</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {(selectedPropForDetails as any).partner?.name || (selectedPropForDetails as any).partner_name || 'No Partner Assigned'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Partner Revenue Share</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                      {(selectedPropForDetails as any).partner_commission_override !== null && (selectedPropForDetails as any).partner_commission_override !== undefined && (selectedPropForDetails as any).partner_commission_override !== ''
                        ? `${(selectedPropForDetails as any).partner_commission_override}% (Custom Override)`
                        : (selectedPropForDetails as any).partner?.default_commission_rate !== undefined
                        ? `${(selectedPropForDetails as any).partner.default_commission_rate}% (Default Rate)`
                        : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Main Phone Number</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.main_phone || (selectedPropForDetails as any).phone || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Fax Number</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.fax || (selectedPropForDetails as any).fax_number || 'N/A'}
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
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedPropForDetails.status === 'ACTIVE' || selectedPropForDetails.status === 'ONBOARDING'
                        ? 'Onboarded'
                        : selectedPropForDetails.status}
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

                {/* Connectivity & Data Circuit Details Section */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
                      Connectivity &amp; Data Circuit
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                      {(() => {
                        const ct = selectedPropForDetails.connectivity_type || (selectedPropForDetails.data_circuit ? 'BOTH' : 'PORTED');
                        if (ct === 'BOTH') return 'Ported & Data Circuited';
                        if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                        return 'Ported';
                      })()}
                    </span>
                  </div>

                  {selectedPropForDetails.data_circuit ? (
                    <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-[#222430]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Carrier Name</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {selectedPropForDetails.data_circuit.carrier_name || 'Pending'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Bandwidth</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedPropForDetails.data_circuit.bandwidth || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Circuit Pricing</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {selectedPropForDetails.data_circuit.circuit_monthly_price !== null && selectedPropForDetails.data_circuit.circuit_monthly_price !== undefined
                              ? `$${Number(selectedPropForDetails.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Wholesaler (Admin Only)</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {selectedPropForDetails.data_circuit.wholesaler_name || '—'}
                            {selectedPropForDetails.data_circuit.revenue_share_percentage
                              ? ` (${selectedPropForDetails.data_circuit.revenue_share_percentage}% share)`
                              : ''}
                          </span>
                        </div>
                      </div>

                      {selectedPropForDetails.data_circuit.technical_details && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-[#222430]">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                            Technical Configuration (IP / WAN / Gateway)
                          </span>
                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {selectedPropForDetails.data_circuit.technical_details}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 pt-1">
                      No Data Circuit provisioned for this property location.
                    </p>
                  )}
                </div>
                <div className="hidden">
                  <div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
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

              <div className="p-5 overflow-y-auto flex-1 min-h-0">
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
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            +${Number(svc.price || 0).toFixed(2)}/mo
                          </span>
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

                    {/* Summary Total Calculation */}
                    <div className="mt-4 p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Property Base Rate: ${Number(selectedPropForServices?.base_price ?? selectedPropForServices?.monthly_price ?? 0).toFixed(2)}/mo
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          Services Add-on ({propServicesList.length}): +${propServicesList.reduce((sum, s) => sum + Number(s.price || 0), 0).toFixed(2)}/mo
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Monthly Rate</span>
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ${(Number(selectedPropForServices?.base_price ?? selectedPropForServices?.monthly_price ?? 0) + propServicesList.reduce((sum, s) => sum + Number(s.price || 0), 0)).toFixed(2)}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
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

              <form onSubmit={handleConfirmAssignService} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Target Property</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedPropForAssign.name}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Select Service to Assign</label>
                  <select
                    value={selectedServiceToAssign}
                    onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a service to link...</option>
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.phone_number} ({svc.service_type}) — ${Number(svc.price || 0).toFixed(2)}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {selectedServiceToAssign && (() => {
                  const chosen = availableServices.find((s) => s.id === selectedServiceToAssign);
                  const currentPropPrice = Number(selectedPropForAssign?.monthly_price ?? selectedPropForAssign?.base_price ?? 0);
                  const svcPrice = Number(chosen?.price || 0);
                  const newTotal = currentPropPrice + svcPrice;
                  return (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                      <p className="font-semibold mb-1">Pricing Update Live Preview:</p>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span>Current: ${currentPropPrice.toFixed(2)}/mo</span>
                        <span>+ Service: ${svcPrice.toFixed(2)}/mo</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">= New Total: ${newTotal.toFixed(2)}/mo</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  Rule: A service can only be assigned to one property. Assigning this service will associate it with this property.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Property Contact</h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContactSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
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

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
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
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveCreate} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
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
                      placeholder="e.g. Grand Horizon Hotel"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Client</label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Client (Optional)</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Main Phone No.</label>
                    <input
                      type="tel"
                      value={formData.main_phone}
                      onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Fax Number</label>
                    <input
                      type="tel"
                      value={formData.fax}
                      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                      placeholder="+1 (555) 019-2835"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {isSuperAdmin && (
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Base Monthly Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value, base_price: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-slate-400">Baseline rate before adding services</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Onboarding Date</label>
                    <input
                      type="date"
                      value={formData.onboarding_date}
                      onChange={(e) => setFormData({ ...formData, onboarding_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">Date from which monthly revenue begins</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Channel Partner</label>
                    <select
                      value={formData.partner_id}
                      onChange={(e) => {
                        const pId = e.target.value;
                        const matched = partnerOptions.find((p) => p.id === pId);
                        setFormData({
                          ...formData,
                          partner_id: pId,
                          partner_commission_override: pId ? (matched ? matched.default_commission_rate : '') : '',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No Partner Assigned</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} - {partner.default_commission_rate}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-black dark:text-white block">Partner Revenue Share (%)</label>
                      {formData.partner_id && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          Partner Base: {partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10}%
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!formData.partner_id}
                        value={formData.partner_commission_override}
                        onChange={(e) => setFormData({ ...formData, partner_commission_override: e.target.value })}
                        placeholder={
                          formData.partner_id
                            ? `${partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 0}% (Enter custom % to override)`
                            : 'Select a partner first'
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                    </div>
                    {isSuperAdmin && formData.partner_id && formData.monthly_price && Number(formData.monthly_price) > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>
                          Est. Monthly Partner Payout: $
                          {(
                            (Number(formData.monthly_price) *
                              Number(
                                formData.partner_commission_override !== '' && formData.partner_commission_override !== null
                                  ? formData.partner_commission_override
                                  : partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate || 0
                              )) /
                            100
                          ).toFixed(2)}
                          /mo
                        </span>
                        {formData.partner_commission_override !== '' &&
                          formData.partner_commission_override !== null &&
                          Number(formData.partner_commission_override) !==
                            (partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10) && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[9.5px]">
                              Custom Override Applied
                            </span>
                          )}
                      </p>
                    )}
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
                      placeholder="123 Ocean Drive"
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
                      placeholder="Robert Vance"
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

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Billing Status</label>
                    <select
                      value={formData.billing_status}
                      onChange={(e) => setFormData({ ...formData, billing_status: e.target.value as 'BILLING_DONE' | 'BILLING_PENDING' })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="BILLING_DONE">Billing Done (Billed)</option>
                      <option value="BILLING_PENDING">Billing Pending</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
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
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
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
                    <label className="font-bold text-black dark:text-white block">Client</label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Client (Optional)</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Main Phone No.</label>
                    <input
                      type="tel"
                      value={formData.main_phone}
                      onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Fax Number</label>
                    <input
                      type="tel"
                      value={formData.fax}
                      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                      placeholder="+1 (555) 019-2835"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {isSuperAdmin && (
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Base Monthly Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.monthly_price}
                        onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value, base_price: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-slate-400">Total monthly rate will automatically include attached services</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Onboarding Date</label>
                    <input
                      type="date"
                      value={formData.onboarding_date}
                      onChange={(e) => setFormData({ ...formData, onboarding_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400">Date from which monthly revenue begins</p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Channel Partner</label>
                    <select
                      value={formData.partner_id}
                      onChange={(e) => {
                        const pId = e.target.value;
                        const matched = partnerOptions.find((p) => p.id === pId);
                        setFormData({
                          ...formData,
                          partner_id: pId,
                          partner_commission_override: pId ? (matched ? matched.default_commission_rate : '') : '',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No Partner Assigned</option>
                      {partnerOptions.map((partner) => (
                        <option key={partner.id} value={partner.id}>
                          {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} - {partner.default_commission_rate}%
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-black dark:text-white block">Partner Revenue Share (%)</label>
                      {formData.partner_id && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          Partner Base: {partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10}%
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={!formData.partner_id}
                        value={formData.partner_commission_override}
                        onChange={(e) => setFormData({ ...formData, partner_commission_override: e.target.value })}
                        placeholder={
                          formData.partner_id
                            ? `${partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 0}% (Enter custom % to override)`
                            : 'Select a partner first'
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                    </div>
                    {isSuperAdmin && formData.partner_id && formData.monthly_price && Number(formData.monthly_price) > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>
                          Est. Monthly Partner Payout: $
                          {(
                            (Number(formData.monthly_price) *
                              Number(
                                formData.partner_commission_override !== '' && formData.partner_commission_override !== null
                                  ? formData.partner_commission_override
                                  : partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate || 0
                              )) /
                            100
                          ).toFixed(2)}
                          /mo
                        </span>
                        {formData.partner_commission_override !== '' &&
                          formData.partner_commission_override !== null &&
                          Number(formData.partner_commission_override) !==
                            (partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10) && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[9.5px]">
                              Custom Override Applied
                            </span>
                          )}
                      </p>
                    )}
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

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Billing Status</label>
                    <select
                      value={formData.billing_status}
                      onChange={(e) => setFormData({ ...formData, billing_status: e.target.value as 'BILLING_DONE' | 'BILLING_PENDING' })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="BILLING_DONE">Billing Done (Billed)</option>
                      <option value="BILLING_PENDING">Billing Pending</option>
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

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
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

              <form onSubmit={handleAssignOrgSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
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

                <div className="pt-2 flex justify-end gap-2 shrink-0">
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

      {/* 10. COMPREHENSIVE PROPERTY RIGHT-SIDE DRAWER (ALL TABS) */}
      <AnimatePresence>
        {showPropertyDrawer && selectedPropForDrawer && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setShowPropertyDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 overflow-hidden"
            >
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/80 dark:bg-[#111217] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 dark:text-white text-base">
                        {selectedPropForDrawer.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        {selectedPropForDrawer.status === 'ACTIVE' || selectedPropForDrawer.status === 'ONBOARDING'
                          ? 'ONBOARDED'
                          : selectedPropForDrawer.status || 'ACTIVE'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        {(propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                          ? 'BILLING DONE'
                          : 'BILLING PENDING'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                        {(() => {
                          const ct = selectedPropForDrawer.connectivity_type || (selectedPropForDrawer.data_circuit ? 'BOTH' : 'PORTED');
                          if (ct === 'BOTH') return 'Ported & Data Circuited';
                          if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                          return 'Ported';
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {selectedPropForDrawer.address
                          ? `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city || ''}, ${selectedPropForDrawer.state || ''} ${selectedPropForDrawer.zip_code || ''}`
                          : 'Property Master Record'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => refreshDrawerData(selectedPropForDrawer.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDrawerData ? 'animate-spin text-blue-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowPropertyDrawer(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs: 1. Overview | 2. Services | 3. E911 State | 4. Data Circuit */}
              <div className="flex items-center border-b border-slate-200 dark:border-[#222430] px-4 bg-white dark:bg-[#15161c] text-xs font-bold shrink-0 overflow-x-auto">
                {[
                  { key: 'OVERVIEW', label: '1. Overview', icon: Building2 },
                  {
                    key: 'SERVICES',
                    label: `2. Services (${propertyDrawerData?.services?.length ?? selectedPropForDrawer.services_count ?? 0})`,
                    icon: PhoneCall,
                  },
                  { key: 'E911', label: '3. E911 State', icon: ShieldCheck },
                  {
                    key: 'DATA_CIRCUIT',
                    label: '4. Data Circuit',
                    icon: Wifi,
                  },
                  {
                    key: 'PORTING_DOCS',
                    label: `5. Porting Docs (${propertyDrawerData?.porting_attachments?.length ?? 0})`,
                    icon: FileText,
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = drawerTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setDrawerTab(t.key as any)}
                      className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                        isActive
                          ? 'border-black dark:border-white text-black dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {loadingDrawerData && !propertyDrawerData ? (
                  <div className="p-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-blue-600" />
                    <p className="font-medium">Loading complete property database details...</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: OVERVIEW */}
                    {drawerTab === 'OVERVIEW' && (
                      <div className="space-y-5">
                        {/* Section 1: Property Identity & Primary Info */}
                        <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Property Name
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
                                {propertyDrawerData?.property?.name || selectedPropForDrawer.name}
                              </p>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Street Address
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.address || selectedPropForDrawer.address || '—'}
                              </p>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                City, State &amp; ZIP
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.city || selectedPropForDrawer.city},{' '}
                                {propertyDrawerData?.property?.state || selectedPropForDrawer.state}{' '}
                                {propertyDrawerData?.property?.zip_code || selectedPropForDrawer.zip_code}
                              </p>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Country
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.country || selectedPropForDrawer.country || 'USA'}
                              </p>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Main Phone Number
                              </label>
                              <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                <span>{propertyDrawerData?.property?.main_phone || selectedPropForDrawer.main_phone || '—'}</span>
                                {selectedPropForDrawer.main_phone && (
                                  <button
                                    onClick={() => handleCopy(selectedPropForDrawer.main_phone || '', 'drawer-main-phone')}
                                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                  >
                                    {copiedField === 'drawer-main-phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Fax Number
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.fax || selectedPropForDrawer.fax || '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Client & Administration */}
                        <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                            Client &amp; Management Administration
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                Client / Organization
                              </label>
                              <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                                {propertyDrawerData?.organization ? (
                                  <a
                                    href={`/admin/organizations/${propertyDrawerData.organization.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  >
                                    <span>{propertyDrawerData.organization.name}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                  </a>
                                ) : (
                                  <span className="text-slate-400">Unassigned (Direct Property)</span>
                                )}
                                {propertyDrawerData?.organization && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300">
                                    {propertyDrawerData.organization.type || 'GROUP'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                General Manager Name
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
                                {propertyDrawerData?.property?.general_manager_name || selectedPropForDrawer.general_manager_name || '—'}
                              </p>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                General Manager Email
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{propertyDrawerData?.property?.general_manager_email || selectedPropForDrawer.general_manager_email || '—'}</span>
                              </p>
                            </div>

                            <div>
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
                                General Manager Phone
                              </label>
                              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {propertyDrawerData?.property?.general_manager_phone ||
                                    selectedPropForDrawer.general_manager_phone ||
                                    propertyDrawerData?.property?.main_phone ||
                                    '—'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Property Contacts List */}
                          {propertyDrawerData?.contacts && propertyDrawerData.contacts.length > 0 && (
                            <div className="pt-2">
                              <label className="font-bold text-black dark:text-white block text-[11px] mb-1.5">
                                Saved Property Contacts ({propertyDrawerData.contacts.length})
                              </label>
                              <div className="space-y-1.5">
                                {propertyDrawerData.contacts.map((c: any) => (
                                  <div
                                    key={c.id}
                                    className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300">
                                          {c.role || 'Contact'}
                                        </span>
                                        {c.is_primary && (
                                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200">
                                            PRIMARY
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                                        {c.email && <span>{c.email}</span>}
                                        {c.phone && <span>{c.phone}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Section 3: Commercial & Billing Details */}
                        <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                            Commercial &amp; Financial Details
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Monthly Price</span>
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {propertyDrawerData?.property?.monthly_price !== null && propertyDrawerData?.property?.monthly_price !== undefined
                                  ? `$${Number(propertyDrawerData.property.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : selectedPropForDrawer.monthly_price !== null && selectedPropForDrawer.monthly_price !== undefined
                                  ? `$${Number(selectedPropForDrawer.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Recurring revenue</span>
                            </div>

                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Base Price</span>
                              <span className="text-base font-bold text-slate-700 dark:text-slate-300">
                                {propertyDrawerData?.property?.base_price !== null && propertyDrawerData?.property?.base_price !== undefined
                                  ? `$${Number(propertyDrawerData.property.base_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Before added services</span>
                            </div>

                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Services Cost</span>
                              <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                                ${Number(propertyDrawerData?.stats?.services_monthly_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {propertyDrawerData?.services?.length || 0} active services
                              </span>
                            </div>

                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Onboarding Date</span>
                              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.onboarding_date || selectedPropForDrawer.onboarding_date || '—'}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Billing start date</span>
                            </div>
                          </div>

                          {/* Billing Status Quick Selector Inside Overview Drawer */}
                          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Property Billing Status</span>
                              <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                                Change billing status between Billing Done and Billing Pending anytime
                              </span>
                            </div>
                            <select
                              value={
                                (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                                  ? 'BILLING_DONE'
                                  : 'BILLING_PENDING'
                              }
                              onChange={(e) =>
                                handleQuickUpdateBillingStatus(
                                  selectedPropForDrawer.id,
                                  e.target.value as 'BILLING_DONE' | 'BILLING_PENDING'
                                )
                              }
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${
                                (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              <option value="BILLING_DONE">Billing Done (Billed)</option>
                              <option value="BILLING_PENDING">Billing Pending</option>
                            </select>
                          </div>

                          {/* Channel Partner Row */}
                          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Channel Partner</span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {propertyDrawerData?.partner?.name || (selectedPropForDrawer as any).partner?.name || 'No Partner Assigned'}
                                {propertyDrawerData?.partner?.company_name ? ` (${propertyDrawerData.partner.company_name})` : ''}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Partner Commission Rate</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {propertyDrawerData?.property?.partner_commission_override !== null && propertyDrawerData?.property?.partner_commission_override !== undefined
                                  ? `${propertyDrawerData.property.partner_commission_override}% (Custom Override)`
                                  : propertyDrawerData?.partner?.default_commission_rate !== undefined
                                  ? `${propertyDrawerData.partner.default_commission_rate}% (Default Rate)`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: System Audit & Dates */}
                        <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2 text-[11.5px]">
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
                            <span className="text-slate-500 font-medium">Ray Baum Act &amp; Kari's Law Compliance:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {propertyDrawerData?.property?.ray_baud_and_logs_enabled ? 'Active / Compliant' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
                            <span className="text-slate-500 font-medium">E911 Registry Status:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {propertyDrawerData?.e911?.property_e911_status || 'VERIFIED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
                            <span className="text-slate-500 font-medium">Record Created At:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {propertyDrawerData?.property?.created_at ? new Date(propertyDrawerData.property.created_at).toLocaleString() : '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-500 font-medium">Last Record Update:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {propertyDrawerData?.property?.updated_at ? new Date(propertyDrawerData.property.updated_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SERVICES (LIST + ADD + DELETE SERVICES DIRECTLY) */}
                    {drawerTab === 'SERVICES' && (
                      <div className="space-y-4">
                        {/* Summary & Quick Stats */}
                        <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                              <PhoneCall className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-xs">
                                {propertyDrawerData?.services?.length || 0} Attached Services
                              </p>
                              <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                                Total Service Charges: ${Number(propertyDrawerData?.stats?.services_monthly_total || 0).toFixed(2)}/mo
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Assign / Add Service Directly Form */}
                        <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block">
                            + Add Service to this Property
                          </span>
                          <form onSubmit={handleDrawerAssignService} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <select
                              value={drawerAssignServiceId}
                              onChange={(e) => setDrawerAssignServiceId(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                            >
                              <option value="">-- Choose an Available Service to Link --</option>
                              {(propertyDrawerData?.available_services || []).map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.phone_number} — {s.service_type || 'Voice Trunk'} (${Number(s.price || 0).toFixed(2)}/mo)
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              disabled={!drawerAssignServiceId || assigningServiceInDrawer}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                            >
                              {assigningServiceInDrawer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                              Link Service
                            </button>
                          </form>
                          {(!propertyDrawerData?.available_services || propertyDrawerData.available_services.length === 0) && (
                            <p className="text-[10.5px] text-slate-400 italic">
                              All available numbers in the system are currently assigned.
                            </p>
                          )}
                        </div>

                        {/* List of Attached Services */}
                        <div className="space-y-2.5">
                          <label className="font-bold text-black dark:text-white block text-xs">
                            Active Services Assigned to {selectedPropForDrawer.name}
                          </label>

                          {(!propertyDrawerData?.services || propertyDrawerData.services.length === 0) ? (
                            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
                              <PhoneCall className="w-6 h-6 mx-auto mb-2 opacity-40" />
                              <p className="font-semibold">No services attached to this property yet.</p>
                              <p className="text-[11px] mt-0.5">Use the selector above to assign a telephone number or trunk.</p>
                            </div>
                          ) : (
                            propertyDrawerData.services.map((svc: any) => (
                              <div
                                key={svc.id}
                                className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-[#2e3140] transition"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                      {svc.phone_number}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(svc.phone_number, `svc-copy-${svc.id}`)}
                                      className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                                      title="Copy Number"
                                    >
                                      {copiedField === `svc-copy-${svc.id}` ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                                      {svc.service_type || 'Voice Trunk'}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      {svc.status || 'ACTIVE'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                                    {svc.service_name && <span>Name: <strong>{svc.service_name}</strong></span>}
                                    {svc.custom_service_id && <span>ID: <strong className="font-mono">{svc.custom_service_id}</strong></span>}
                                    {svc.description && <span>{svc.description}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                                    ${Number(svc.price || 0).toFixed(2)}/mo
                                  </span>
                                  <button
                                    onClick={() => handleDrawerUnassignService(svc.id, svc.phone_number)}
                                    disabled={unassigningServiceId === svc.id}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                                    title="Unassign / Remove Service"
                                  >
                                    {unassigningServiceId === svc.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: E911 STATE */}
                    {drawerTab === 'E911' && (
                      <div className="space-y-4">
                        {/* E911 Big Status Banner */}
                        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-sm">
                                E911 Routing &amp; PSAP Validation Status
                              </p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                                Status: {propertyDrawerData?.e911?.property_e911_status || 'VERIFIED'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            PSAP Active
                          </span>
                        </div>

                        {/* Registered Emergency Address */}
                        <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
                          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                            Registered Emergency Dispatchable Address
                          </span>
                          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-xs space-y-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {propertyDrawerData?.e911?.registered_address ||
                                `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city}, ${selectedPropForDrawer.state} ${selectedPropForDrawer.zip_code}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Matches property street location: <strong className="text-emerald-600">Yes (Geocoded)</strong>
                            </p>
                          </div>
                        </div>

                        {/* Ray Baum's Act & Kari's Law Compliance */}
                        <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                            Ray Baum's Act &amp; Kari's Law Compliance Audit
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] text-slate-400 block">Dispatchable Location Status</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Check className="w-3.5 h-3.5" /> Compliant &amp; Active
                              </span>
                            </div>
                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] text-slate-400 block">Direct 911 Dialing (Kari's Law)</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Check className="w-3.5 h-3.5" /> No Prefix Required (911 Active)
                              </span>
                            </div>
                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] text-slate-400 block">Automated Notification Logs</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                                {propertyDrawerData?.e911?.ray_baud_and_logs_enabled ? 'Enabled (Instant SMS/Email)' : 'Disabled'}
                              </span>
                            </div>
                            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                              <span className="text-[10px] text-slate-400 block">PSAP Verification Timestamp</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                                {propertyDrawerData?.e911?.verified_at
                                  ? new Date(propertyDrawerData.e911.verified_at).toLocaleDateString()
                                  : 'System Verified'}
                              </span>
                            </div>
                          </div>

                          {propertyDrawerData?.e911?.correction_notes && (
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300">
                              <span className="font-bold block text-xs">PSAP Audit Correction Notes:</span>
                              <p className="mt-1 text-[11px]">{propertyDrawerData.e911.correction_notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Shortcut to E911 Hub */}
                        <div className="pt-2 flex justify-end">
                          <a
                            href="/admin/e911"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#222430] dark:hover:bg-[#2c2f3e] text-slate-800 dark:text-white rounded-xl font-bold flex items-center gap-1.5 transition"
                          >
                            <span>Open E911 Compliance Center</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: DATA CIRCUIT ("DATA SUBJECT" / DATA CIRCUIT DETAILS) */}
                    {drawerTab === 'DATA_CIRCUIT' && (
                      <div className="space-y-4">
                        {propertyDrawerData?.data_circuit ? (
                          <>
                            {/* Circuit Primary Stage Banner */}
                            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                  <Wifi className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-sm">
                                    Data Circuit Provisioning
                                  </p>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                                    Stage: {propertyDrawerData.data_circuit.status?.replace(/_/g, ' ') || 'STARTED'}
                                  </p>
                                </div>
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                                {propertyDrawerData.data_circuit.status || 'STARTED'}
                              </span>
                            </div>

                            {/* Carrier & Client Pricing Specs */}
                            <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                              <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                                Carrier &amp; Pricing Parameters
                              </span>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                                  <span className="text-[10px] text-slate-400 block">Carrier (Client Sees)</span>
                                  <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                                    {propertyDrawerData.data_circuit.carrier_name || 'Pending Selection'}
                                  </span>
                                </div>

                                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                                  <span className="text-[10px] text-slate-400 block">Bandwidth</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                                    {propertyDrawerData.data_circuit.bandwidth || '1 Gig'}
                                  </span>
                                </div>

                                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                                  <span className="text-[10px] text-slate-400 block">Client Monthly Price</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                                    ${Number(propertyDrawerData.data_circuit.circuit_monthly_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                                  </span>
                                </div>

                                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                                  <span className="text-[10px] text-slate-400 block">Wholesaler (Hidden)</span>
                                  <span className="font-bold text-amber-700 dark:text-amber-400 text-sm mt-0.5 block">
                                    {propertyDrawerData.data_circuit.wholesaler_name || '—'}
                                  </span>
                                </div>
                              </div>

                              {/* Wholesaler Revenue Share Breakdown */}
                              <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Wholesaler Revenue Share Percentage</span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {propertyDrawerData.data_circuit.revenue_share_percentage || 0}%
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">Estimated Monthly Revenue Share</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    ${Number(propertyDrawerData.data_circuit.monthly_revenue_share_amount || 0).toFixed(2)}/mo
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Full Descriptive Technical Details (Entered during creation/provisioning) */}
                            <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
                                  Descriptive Technical Information (WAN IP, IP Address, Gateway, DNS, etc.)
                                </span>
                                {propertyDrawerData.data_circuit.technical_details && (
                                  <button
                                    onClick={() => handleCopy(propertyDrawerData.data_circuit.technical_details, 'tech-details-copy')}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                                  >
                                    {copiedField === 'tech-details-copy' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>Copy Technical Details</span>
                                  </button>
                                )}
                              </div>

                              {propertyDrawerData.data_circuit.technical_details ? (
                                <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                                  {propertyDrawerData.data_circuit.technical_details}
                                </div>
                              ) : (
                                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
                                  No technical details recorded yet for this circuit.
                                </div>
                              )}
                            </div>

                            {/* Lifecycle Milestones & Signed Agreement Gate */}
                            <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5 text-xs">
                              <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                                Lifecycle Milestones &amp; Agreement Documents
                              </span>

                              <div className="space-y-2">
                                <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                                  <span>Signed Agreement PDF:</span>
                                  {propertyDrawerData.data_circuit.agreement_file_url ? (
                                    <a
                                      href={propertyDrawerData.data_circuit.agreement_file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>{propertyDrawerData.data_circuit.agreement_file_name || 'View Agreement PDF'}</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">Pending Upload</span>
                                  )}
                                </div>

                                <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                                  <span>Site Survey Status:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {propertyDrawerData.data_circuit.site_survey_status || 'PENDING'}
                                  </span>
                                </div>

                                <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                                  <span>FOC Status &amp; Date:</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {propertyDrawerData.data_circuit.foc_date
                                      ? `${propertyDrawerData.data_circuit.foc_status || 'CONFIRMED'} (${propertyDrawerData.data_circuit.foc_date})`
                                      : propertyDrawerData.data_circuit.foc_status || 'PENDING'}
                                  </span>
                                </div>

                                {propertyDrawerData.data_circuit.installed_at && (
                                  <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                                    <span>Installation Completed At:</span>
                                    <span className="font-mono text-emerald-600 font-bold">
                                      {new Date(propertyDrawerData.data_circuit.installed_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Competing Wholesaler Quotes History */}
                            {propertyDrawerData.data_circuit.quotes && propertyDrawerData.data_circuit.quotes.length > 0 && (
                              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5">
                                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                                  Wholesaler Quotes History ({propertyDrawerData.data_circuit.quotes.length})
                                </span>
                                <div className="space-y-1.5">
                                  {propertyDrawerData.data_circuit.quotes.map((q: any) => (
                                    <div
                                      key={q.id}
                                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                        q.is_selected
                                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                                          : 'border-slate-200 dark:border-[#222430] bg-white dark:bg-[#181a24]'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900 dark:text-white">{q.wholesaler_name}</span>
                                          <span className="text-slate-400">via</span>
                                          <span className="font-medium text-slate-700 dark:text-slate-300">{q.carrier_name}</span>
                                          {q.is_selected && (
                                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-600 text-white">
                                              FINALIZED
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          Bandwidth: {q.bandwidth} • Rev Share: {q.proposed_rev_share_percentage}% (${Number(q.proposed_rev_share_amount || 0).toFixed(2)}/mo)
                                        </p>
                                      </div>
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        ${Number(q.quoted_monthly_price || 0).toFixed(2)}/mo
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Shortcut to Data Circuits Manager */}
                            <div className="pt-2 flex justify-end">
                              <a
                                href="/admin/data-circuits"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                              >
                                <span>Manage Circuit in Data Circuits Center</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </>
                        ) : (
                          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-3">
                            <Wifi className="w-8 h-8 mx-auto text-slate-400" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-sm">
                                Ported Only — No Data Circuit Attached
                              </p>
                              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                This property currently has Voice/DID services provisioned without an active dedicated Data Circuit pipeline.
                              </p>
                            </div>
                            <div className="pt-2">
                              <a
                                href="/admin/data-circuits"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Start Data Circuit for this Property</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 5: PORTING DOCS & IMAGES (VIEW & DOWNLOAD) */}
                    {drawerTab === 'PORTING_DOCS' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white text-sm">
                                Porting Documents &amp; Images
                              </p>
                              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                                All LOAs, CSRs, signed contracts, billing copies &amp; images uploaded during porting
                              </p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                            {propertyDrawerData?.porting_attachments?.length || 0} File{(propertyDrawerData?.porting_attachments?.length || 0) === 1 ? '' : 's'}
                          </span>
                        </div>

                        {(!propertyDrawerData?.porting_attachments || propertyDrawerData.porting_attachments.length === 0) ? (
                          <div className="p-10 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-2 text-slate-400">
                            <FileText className="w-8 h-8 mx-auto opacity-40" />
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                              No Porting Documents or Images Attached
                            </p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              Documents or images uploaded while creating or managing this property in the Porting section will automatically appear here for viewing and download.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {propertyDrawerData.porting_attachments.map((att: any, idx: number) => {
                              const downloadUrl = `/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
                              const isImage =
                                (att.mime_type && att.mime_type.startsWith('image/')) ||
                                /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.file_name || '');
                              const sizeKb = att.file_size ? `${(Number(att.file_size) / 1024).toFixed(1)} KB` : '';

                              return (
                                <div
                                  key={att.id || att.storage_path || idx}
                                  className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl space-y-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800/60 transition"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                          {att.file_name || 'Porting Attachment'}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                                          <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300 font-semibold uppercase text-[9.5px]">
                                            {isImage ? 'IMAGE' : 'DOCUMENT / PDF'}
                                          </span>
                                          {sizeKb && <span>• {sizeKb}</span>}
                                          {att.created_at && (
                                            <span>• {new Date(att.created_at).toLocaleDateString()}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.file_name || true}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download / View</span>
                                      </a>
                                    </div>
                                  </div>

                                  {isImage && (
                                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] max-h-60 flex items-center justify-center p-2">
                                      <img
                                        src={downloadUrl}
                                        alt={att.file_name || 'Porting Image'}
                                        className="max-h-56 w-auto object-contain rounded"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT CSV MODAL */}
      <ImportPropertiesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadData();
          showToast('Properties Imported', 'All properties were successfully imported and marked as Onboarded.', 'success');
        }}
      />
    </motion.div>
  );
}
