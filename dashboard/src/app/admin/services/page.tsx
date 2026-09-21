'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  PhoneCall,
  Search,
  Plus,
  Download,
  MoreVertical,
  Edit2,
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Sparkles,
  RefreshCw,
  Info,
  Check,
  Eye,
  Layers,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Flame,
  ArrowUpDown,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchServices,
  setSearchQuery,
  setTypeFilter,
  setStatusFilter,
  setSortBy,
  setPagination,
  optimisticUpdateServiceStatus,
  ServiceItem,
  ServiceRecord,
} from '@/store/slices/servicesSlice';

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
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

interface PropertyOption {
  id: string;
  name: string;
  city?: string;
  state?: string;
  organization_name?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

const SERVICE_TYPES_LIST = [
  'Direct Inward Dial (DID)',
  'Fire Lines',
  'Elevator Lines',
  'SIP Trunk - 100 Channels',
  'Toll-Free 800 Route',
  'Analog Emergency FXS',
  'Cloud PBX Extension',
  'Ray Baum Dedicated E911',
];

const isFireLineType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'firelines' || t === 'fireline' || t.includes('fireline');
};

const isElevatorLineType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'elevatorlines' || t === 'elevatorline' || t.includes('elevatorline');
};

export default function AdminServicesPage() {
  const dispatch = useAppDispatch();
  const {
    items: services,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.services);

  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<ServiceItem | null>(null);

  // View Details Drawer
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<ServiceItem | null>(null);

  // Assign to Property Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedServiceForAssign, setSelectedServiceForAssign] = useState<ServiceItem | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Status Slider Modal
  const [showStatusSliderModal, setShowStatusSliderModal] = useState(false);
  const [selectedServiceForStatus, setSelectedServiceForStatus] = useState<ServiceItem | null>(null);
  const [statusSliderValue, setStatusSliderValue] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusSliderLoading, setStatusSliderLoading] = useState(false);

  // Delete State
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 3-Dots Action Menu Position (strictly opens ABOVE)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; service: ServiceItem } | null>(null);

  // Dynamic Service Types
  const [serviceTypes, setServiceTypes] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [typeActionLoading, setTypeActionLoading] = useState(false);
  const [editingType, setEditingType] = useState<{ id: string; name: string; description?: string } | null>(null);

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
  const [formData, setFormData] = useState({
    custom_service_id: '',
    service_name: '',
    phone_number: '',
    service_type_name: 'Direct Inward Dial (DID)',
    custom_type_input: '',
    is_custom_type: false,
    property_id: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
    // Fire Lines specific fields
    device_type: '',
    serial_number: '',
    // Elevator Lines specific fields
    extension: '',
  });
  const [showCustomServiceId, setShowCustomServiceId] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load properties for dropdown
  useEffect(() => {
    async function loadProps() {
      try {
        const res = await fetch('/api/admin/properties?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPropertyOptions(
            data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              city: p.city,
              state: p.state,
              organization_name: p.primary_organization?.name || p.organizations?.[0]?.name || 'Unassigned',
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load properties:', err);
      }
    }
    loadProps();
  }, []);

  // Fetch Services via Redux
  const loadData = useCallback(() => {
    dispatch(
      fetchServices({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        serviceType: filters.selectedType,
        status: filters.selectedStatus,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Dynamic Service Types
  const loadServiceTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/service-types');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setServiceTypes(data.data);
      }
    } catch (err) {
      console.warn('Could not load service types:', err);
    }
  }, []);

  useEffect(() => {
    loadServiceTypes();
  }, [loadServiceTypes]);

  const availableServiceTypes = React.useMemo(() => {
    const dynamicNames = serviceTypes.map((t) => t.name);
    const defaults = [
      'Direct Inward Dial (DID)',
      'Fire Lines',
      'Elevator Lines',
      'SIP Trunk - 100 Channels',
      'Toll-Free 800 Route',
      'Analog Emergency FXS',
      'Cloud PBX Extension',
      'Ray Baum Dedicated E911',
    ];
    const set = new Set<string>();
    defaults.forEach((d) => set.add(d));
    dynamicNames.forEach((d) => {
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set);
  }, [serviceTypes]);

  // Search input handler (char-by-char)
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Open 3-Dots Menu strictly ABOVE the line (Rule 8)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, svc: ServiceItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, service: svc });
  };

  // Open Status Slider Modal
  const handleOpenStatusSlider = (e: React.MouseEvent, svc: ServiceItem) => {
    e.stopPropagation();
    setSelectedServiceForStatus(svc);
    setStatusSliderValue((svc.status as any) || 'ACTIVE');
    setShowStatusSliderModal(true);
  };

  // Confirm Status Slider Update
  const handleConfirmStatusSlider = async () => {
    if (!selectedServiceForStatus) return;

    // Optimistic Redux instant update (< 1ms zero reload)
    dispatch(optimisticUpdateServiceStatus({ id: selectedServiceForStatus.id, status: statusSliderValue }));

    try {
      setStatusSliderLoading(true);
      const res = await fetch(`/api/admin/services/${selectedServiceForStatus.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusSliderValue }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update status.');

      showToast('Status Updated', `${selectedServiceForStatus.phone_number} is now ${statusSliderValue}.`, 'success');
      setShowStatusSliderModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    } finally {
      setStatusSliderLoading(false);
    }
  };

  // Handle Assign to Property
  const handleOpenAssignModal = (svc: ServiceItem) => {
    setSelectedServiceForAssign(svc);
    setTargetPropertyId(svc.property_id || '');
    setShowAssignModal(true);
  };

  const handleConfirmAssignProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForAssign || !targetPropertyId) return;

    try {
      setAssignLoading(true);
      const res = await fetch(`/api/admin/services/${selectedServiceForAssign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: targetPropertyId }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign property.');

      const assignedProp = propertyOptions.find((p) => p.id === targetPropertyId);
      showToast(
        'Property Assigned',
        `${selectedServiceForAssign.phone_number} linked to ${assignedProp?.name || 'property'}.`,
        'success'
      );
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssignLoading(false);
    }
  };

  // Handle Delete Service
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete service');
      showToast('Deleted', `Service ${serviceToDelete.phone_number} removed.`, 'success');
      setServiceToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Unassign from Property
  const handleUnassignProperty = async (svc: ServiceItem) => {
    if (!confirm(`Are you sure you want to unassign ${svc.phone_number} from its property?`)) return;
    try {
      const res = await fetch(`/api/admin/services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: null }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign property.');
      showToast('Unassigned', `${svc.phone_number} is now unassigned.`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Handle Create Service Type
  const handleCreateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch('/api/admin/service-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim(), description: newTypeDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add service type');
      showToast('Service Type Added', `"${newTypeName}" is now available.`, 'success');
      setNewTypeName('');
      setNewTypeDescription('');
      loadServiceTypes();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  // Handle Update Service Type
  const handleUpdateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.name.trim()) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch('/api/admin/service-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingType.id, name: editingType.name.trim(), description: editingType.description?.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update service type');
      showToast('Updated', 'Service type updated.', 'success');
      setEditingType(null);
      loadServiceTypes();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  // Handle Delete Service Type
  const handleDeleteServiceType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete service type "${name}"?`)) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch(`/api/admin/service-types?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete service type');
      showToast('Deleted', `Service type "${name}" removed.`, 'success');
      loadServiceTypes();
    } catch (err: any) {
      showToast('Cannot Delete', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  // Handle Create Service Submit
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeType = formData.is_custom_type
      ? formData.custom_type_input.trim()
      : formData.service_type_name;

    const isFire = isFireLineType(activeType);
    const isElevator = isElevatorLineType(activeType);

    // Auto-generate service ID if needed for Fire/Elevator lines, or validate for general services
    let serviceId = formData.custom_service_id.trim();
    if (!serviceId) {
      if (isFire) {
        serviceId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
      } else if (isElevator) {
        serviceId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        serviceId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    } else if (serviceId.length < 6) {
      if (isFire || isElevator) {
        serviceId = `${isFire ? 'FL' : 'EL'}-${Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        setFormError('Service ID is mandatory and must be at least 6 characters.');
        return;
      }
    }

    if (!formData.phone_number.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    if (isFire && !formData.device_type.trim()) {
      setFormError('Device Type is required for Fire Lines.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      let serviceName = formData.service_name.trim();
      if (!serviceName) {
        if (isFire) {
          serviceName = formData.device_type.trim() || `Fire Line ${formData.phone_number.trim()}`;
        } else if (isElevator) {
          serviceName = formData.extension.trim()
            ? `Elevator - ${formData.extension.trim()}`
            : `Elevator Line ${formData.phone_number.trim()}`;
        } else {
          serviceName = `Service ${formData.phone_number.trim()}`;
        }
      }

      // 1. Provision standard service
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_service_id: serviceId,
          service_name: serviceName,
          phone_number: formData.phone_number.trim(),
          service_type_name: isFire ? 'Fire Lines' : isElevator ? 'Elevator Lines' : activeType,
          property_id: formData.property_id || null,
          description: formData.description.trim() || null,
          status: formData.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create service.');

      const createdService = result.data;

      // 2. If Fire Line, also create in fire_lines section (/api/admin/fire-lines)
      if (isFire) {
        try {
          const fireRes = await fetch('/api/admin/fire-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_type: formData.device_type.trim(),
              phone_number: formData.phone_number.trim(),
              serial_number: formData.serial_number.trim() || null,
              description: formData.description.trim() || null,
              property_id: formData.property_id || null,
              service_id: createdService?.id || null,
            }),
          });
          const fireJson = await fireRes.json();
          if (!fireRes.ok || !fireJson.success) {
            console.warn('Fire line creation warning:', fireJson.error);
          }
        } catch (fErr) {
          console.warn('Could not mirror to fire_lines:', fErr);
        }
      }

      // 3. If Elevator Line, also create in elevator_lines section (/api/admin/elevator-lines)
      if (isElevator) {
        try {
          const eleRes = await fetch('/api/admin/elevator-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: formData.phone_number.trim(),
              extension: formData.extension.trim() || null,
              description: formData.description.trim() || null,
              status: 'ACTIVE',
              property_id: formData.property_id || null,
              service_id: createdService?.id || null,
            }),
          });
          const eleJson = await eleRes.json();
          if (!eleRes.ok || !eleJson.success) {
            console.warn('Elevator line creation warning:', eleJson.error);
          }
        } catch (eErr) {
          console.warn('Could not mirror to elevator_lines:', eErr);
        }
      }

      const successTitle = isFire
        ? 'Fire Line Created'
        : isElevator
        ? 'Elevator Line Created'
        : 'Service Provisioned';
      const successMsg = isFire
        ? `Fire line ${formData.phone_number} created in Services & Fire Lines.`
        : isElevator
        ? `Elevator line ${formData.phone_number} created in Services & Elevator Lines.`
        : `${serviceId} (${formData.phone_number}) created successfully.`;

      showToast(successTitle, successMsg, 'success');
      setShowCreateModal(false);
      setFormData({
        custom_service_id: '',
        service_name: '',
        phone_number: '',
        service_type_name: 'Direct Inward Dial (DID)',
        custom_type_input: '',
        is_custom_type: false,
        property_id: '',
        description: '',
        status: 'ACTIVE',
        device_type: '',
        serial_number: '',
        extension: '',
      });
      setShowCustomServiceId(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit Service Submit
  const handleOpenEdit = (svc: ServiceItem) => {
    setSelectedServiceForEdit(svc);
    setFormData({
      custom_service_id: svc.custom_service_id || '',
      service_name: svc.service_name || '',
      phone_number: svc.phone_number || '',
      service_type_name: svc.service_type || 'Direct Inward Dial (DID)',
      custom_type_input: '',
      is_custom_type: false,
      property_id: svc.property_id || '',
      description: svc.description || '',
      status: (svc.status as any) || 'ACTIVE',
      device_type: '',
      serial_number: '',
      extension: '',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForEdit) return;

    const serviceId = formData.custom_service_id.trim();
    if (!serviceId || serviceId.length < 6) {
      setFormError('Service ID is mandatory and must be at least 6 characters.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const typeName = formData.is_custom_type
        ? formData.custom_type_input.trim()
        : formData.service_type_name;

      const res = await fetch(`/api/admin/services/${selectedServiceForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_service_id: serviceId,
          service_name: formData.service_name.trim(),
          phone_number: formData.phone_number.trim(),
          service_type_name: typeName,
          property_id: formData.property_id || null,
          description: formData.description.trim() || null,
          status: formData.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update service.');

      showToast('Saved', `Service details updated successfully.`, 'success');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setTypeFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters = filters.searchQuery.trim() !== '' || filters.selectedType !== 'ALL' || filters.selectedStatus !== 'ALL' || filters.sortBy !== 'NEWEST';

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

      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <PhoneCall size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Telecom Services</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['Service ID,Name,Number,Type,Organization,Property,Status\n'];
              const rows = services.map((s: ServiceRecord) =>
                `"${s.custom_service_id}","${s.service_name}","${s.phone_number}","${s.service_type}","${s.attached_organization_name}","${s.attached_property_name}","${s.status}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `telecom-services-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Services list exported as CSV.', 'info');
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
            onClick={() => setShowManageTypesModal(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" /> Manage Types
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setFormData({
                custom_service_id: '',
                service_name: '',
                phone_number: '',
                service_type_name: 'Direct Inward Dial (DID)',
                custom_type_input: '',
                is_custom_type: false,
                property_id: '',
                description: '',
                status: 'ACTIVE',
                device_type: '',
                serial_number: '',
                extension: '',
              });
              setShowCustomServiceId(false);
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Provision Service
          </motion.button>
        </div>
      </motion.div>

      {/* Real KPI Cards - ONLY Variant 1 (Deep Blue) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Services */}
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
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Provisioned</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">DIDs, SIP Trunks &amp; PBX Lines</p>
        </motion.div>

        {/* Card 2: Active Services */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Active Routing
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.activeServicesCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">100% operational traffic</p>
        </motion.div>

        {/* Card 3: Property Linked */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Attached to Properties
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.assignedServicesCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Mapped</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Single-property linked lines</p>
        </motion.div>

        {/* Card 4: Inactive / Suspended */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Inactive / Suspended
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.inactiveOrSuspendedCount}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Paused</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Suspended or unassigned</p>
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
              placeholder="Search by Service ID, name, number, org, property..."
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
              aria-label="Filter by service status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              value={filters.selectedType}
              onChange={(e) => {
                dispatch(setTypeFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Filter by service type"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Type: All Service Types</option>
              {availableServiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              aria-label="Sort services"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="NUMBER_ASC">Sort: Number (Asc)</option>
              <option value="NUMBER_DESC">Sort: Number (Desc)</option>
              <option value="TYPE_ASC">Sort: Service Type</option>
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
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load services</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && services.length === 0 ? (
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
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <PhoneCall className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Services Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No services match the selected filters.'
              : 'Provision your first voice trunk or DID line.'}
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
                  custom_service_id: '',
                  service_name: '',
                  phone_number: '',
                  service_type_name: 'Direct Inward Dial (DID)',
                  custom_type_input: '',
                  is_custom_type: false,
                  property_id: '',
                  description: '',
                  status: 'ACTIVE',
                  device_type: '',
                  serial_number: '',
                  extension: '',
                });
                setShowCustomServiceId(false);
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Provision Service
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE ID</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE NUMBER</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE TYPE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {services.map((svc: ServiceRecord) => {
                  return (
                    <tr
                      key={svc.id}
                      onClick={() => {
                        setSelectedServiceForDetails(svc);
                        setShowDetailsDrawer(true);
                      }}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Service ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-black dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                          {svc.custom_service_id || svc.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* 2. Service Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {svc.service_name || `Service ${svc.phone_number}`}
                        </span>
                      </td>

                      {/* 3. Service Number (NO phone icon) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {svc.phone_number}
                        </span>
                      </td>

                      {/* 4. Service Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                          {svc.service_type || 'Voice Line'}
                        </span>
                      </td>

                      {/* 5. Organization (Auto-resolved via single property) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {svc.attached_organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 6. Property */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300">
                          {svc.attached_property_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 7. Status (Click opens Smooth Slider Modal) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => handleOpenStatusSlider(e, svc)}>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition ${
                            svc.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                              : svc.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              svc.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : svc.status === 'SUSPENDED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {svc.status === 'ACTIVE' ? 'Active' : svc.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
                        </button>
                      </td>

                      {/* 8. Actions (Pencil & Three Dots) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(svc)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, svc)}
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
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} services
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
            className="fixed z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.service.phone_number}</p>
              <p className="text-[10px] text-slate-400">Service Options</p>
            </div>

            <button
              onClick={() => {
                handleOpenEdit(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Service</span>
            </button>

            <button
              onClick={() => {
                setSelectedServiceForDetails(menuPosition.service);
                setShowDetailsDrawer(true);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                handleOpenAssignModal(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assign to Property</span>
            </button>

            {menuPosition.service.property_id && (
              <button
                onClick={() => {
                  const svc = menuPosition.service;
                  setMenuPosition(null);
                  handleUnassignProperty(svc);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
              >
                <X className="w-3.5 h-3.5 text-amber-500" />
                <span>Unassign Property</span>
              </button>
            )}

            <button
              onClick={() => {
                setServiceToDelete(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Service</span>
            </button>
          </div>
        </>
      )}

      {/* 1. STATUS SLIDER MODAL (Smooth slider between Active, Inactive, Suspended) */}
      <AnimatePresence>
        {showStatusSliderModal && selectedServiceForStatus && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Update Service Status</h3>
                <button
                  onClick={() => setShowStatusSliderModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Select operating state for <span className="font-bold text-black dark:text-white">{selectedServiceForStatus.phone_number}</span>:
                </p>

                {/* Smooth Slider Control */}
                <div className="p-1.5 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] grid grid-cols-3 gap-1 relative">
                  {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusSliderValue(st)}
                      className={`py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer relative z-10 flex flex-col items-center gap-1 ${
                        statusSliderValue === st
                          ? st === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : st === 'SUSPENDED'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>{st}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-[11px]">
                  {statusSliderValue === 'ACTIVE' && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      • Traffic actively routes to PBX / SIP Trunks.
                    </p>
                  )}
                  {statusSliderValue === 'INACTIVE' && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      • Service is paused and traffic is not routed.
                    </p>
                  )}
                  {statusSliderValue === 'SUSPENDED' && (
                    <p className="text-rose-600 dark:text-rose-400 font-medium">
                      • Inbound and outbound services suspended immediately.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  onClick={() => setShowStatusSliderModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusSlider}
                  disabled={statusSliderLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {statusSliderLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. VIEW DETAILS SIDE DRAWER */}
      <AnimatePresence>
        {showDetailsDrawer && selectedServiceForDetails && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setShowDetailsDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <PhoneCall className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Service Line Details</h3>
                    <p className="text-xs text-slate-400">{selectedServiceForDetails.phone_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Service ID</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-mono font-bold text-slate-900 dark:text-white">
                    {selectedServiceForDetails.custom_service_id || selectedServiceForDetails.id}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Service Name</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedServiceForDetails.service_name}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">DID / Phone Number</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedServiceForDetails.phone_number}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Service Type</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedServiceForDetails.service_type}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Assigned Property</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedServiceForDetails.attached_property_name || 'Unassigned'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedServiceForDetails.attached_organization_name || 'Unassigned'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Status</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedServiceForDetails.status}
                  </p>
                </div>

                {selectedServiceForDetails.description && (
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Description</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300">
                      {selectedServiceForDetails.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end gap-2">
                <button
                  onClick={() => setShowDetailsDrawer(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ASSIGN TO PROPERTY MODAL */}
      <AnimatePresence>
        {showAssignModal && selectedServiceForAssign && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign Service to Property</h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAssignProperty} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Service Identifier</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedServiceForAssign.phone_number} ({selectedServiceForAssign.service_type})
                  </p>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Select Property</label>
                  <select
                    value={targetPropertyId}
                    onChange={(e) => setTargetPropertyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose property to link...</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.organization_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  Rule: One service can only be assigned to one property. Assigning this service will associate it with the selected property and its parent organization.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading || !targetPropertyId}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {assignLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. PROVISION NEW SERVICE MODAL */}
      <AnimatePresence>
        {showCreateModal && (() => {
          const currentType = formData.is_custom_type
            ? formData.custom_type_input.trim()
            : formData.service_type_name;
          const isFire = isFireLineType(currentType);
          const isElevator = isElevatorLineType(currentType);

          const handleTypeSelect = (newType: string) => {
            const isFL = isFireLineType(newType);
            const isEL = isElevatorLineType(newType);
            let newId = formData.custom_service_id;
            if (!newId || newId.startsWith('SVC-') || newId.startsWith('FL-') || newId.startsWith('EL-')) {
              if (isFL) newId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
              else if (isEL) newId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
              else newId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
            }
            setFormData((prev) => ({
              ...prev,
              service_type_name: newType,
              custom_service_id: newId,
            }));
          };

          return (
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isFire ? (
                      <Flame className="w-5 h-5 text-orange-500" />
                    ) : isElevator ? (
                      <ArrowUpDown className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-blue-600" />
                    )}
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {isFire
                        ? 'Add Fire Line'
                        : isElevator
                        ? 'Add Elevator Line'
                        : 'Provision New Service'}
                    </h3>
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
                  {/* Service Type selector when in Fire Lines mode */}
                  {isFire ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-black dark:text-white block">Service Type</label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_custom_type: !formData.is_custom_type })}
                            className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                          >
                            {formData.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
                          </button>
                        </div>

                        {formData.is_custom_type ? (
                          <input
                            type="text"
                            required
                            value={formData.custom_type_input}
                            onChange={(e) => setFormData({ ...formData, custom_type_input: e.target.value })}
                            placeholder="Enter new custom service type..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <select
                            value={formData.service_type_name}
                            onChange={(e) => handleTypeSelect(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-medium"
                          >
                            {availableServiceTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Device Type * */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Device Type <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.device_type}
                          onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                          placeholder="e.g. Fire Communicator DACT, Fire Alarm Panel"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Phone Number * */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          placeholder="e.g. +1 555-019-2831"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Serial Number */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Serial Number</label>
                        <input
                          type="text"
                          value={formData.serial_number}
                          onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                          placeholder="e.g. SN-9812-FL-01"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Description (Shown in Table UI) */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Description (Shown in Table UI)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="e.g. Primary life-safety monitoring dialer line for Main Building Fire Riser Room"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Assigned Property */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Assigned Property</label>
                        <select
                          value={formData.property_id}
                          onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {propertyOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.organization_name ? `(${p.organization_name})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subtle Service ID display / customize */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Service ID:{' '}
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                              {formData.custom_service_id || 'Auto-generated (FL-XXXXXX)'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCustomServiceId(!showCustomServiceId)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {showCustomServiceId ? 'Hide Custom ID' : 'Customize ID'}
                          </button>
                        </div>
                        {showCustomServiceId && (
                          <input
                            type="text"
                            value={formData.custom_service_id}
                            onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
                            placeholder="e.g. FL-MIA-001"
                            className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </>
                  ) : isElevator ? (
                    /* Service Type selector when in Elevator Lines mode */
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-black dark:text-white block">Service Type</label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_custom_type: !formData.is_custom_type })}
                            className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                          >
                            {formData.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
                          </button>
                        </div>

                        {formData.is_custom_type ? (
                          <input
                            type="text"
                            required
                            value={formData.custom_type_input}
                            onChange={(e) => setFormData({ ...formData, custom_type_input: e.target.value })}
                            placeholder="Enter new custom service type..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <select
                            value={formData.service_type_name}
                            onChange={(e) => handleTypeSelect(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-medium"
                          >
                            {availableServiceTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Phone Number * */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          placeholder="e.g. +1 555-019-2844"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Extension / Cab ID */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Extension / Cab ID</label>
                        <input
                          type="text"
                          value={formData.extension}
                          onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
                          placeholder="e.g. Cab #1 - North Tower"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Description (Shown in Table UI) */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Description (Shown in Table UI)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="e.g. Freight elevator cab emergency auto-dialer direct to security desk"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Assigned Property */}
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Assigned Property</label>
                        <select
                          value={formData.property_id}
                          onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {propertyOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.organization_name ? `(${p.organization_name})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subtle Service ID display / customize */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Service ID:{' '}
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                              {formData.custom_service_id || 'Auto-generated (EL-XXXXXX)'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCustomServiceId(!showCustomServiceId)}
                            className="text-blue-600 hover:underline cursor-pointer"
                          >
                            {showCustomServiceId ? 'Hide Custom ID' : 'Customize ID'}
                          </button>
                        </div>
                        {showCustomServiceId && (
                          <input
                            type="text"
                            value={formData.custom_service_id}
                            onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
                            placeholder="e.g. EL-MIA-001"
                            className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    /* Standard Provision New Service */
                    <>
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">
                          Service ID <span className="text-rose-500">* (Min 6 chars)</span>
                        </label>
                        <input
                          type="text"
                          required
                          minLength={6}
                          value={formData.custom_service_id}
                          onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
                          placeholder="e.g. SVC-MIA-001"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-black dark:text-white block mb-1">Service Name</label>
                          <input
                            type="text"
                            value={formData.service_name}
                            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                            placeholder="e.g. Main Lobby Line"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-black dark:text-white block mb-1">
                            Phone Number / DID <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            placeholder="+1 (555) 019-2834"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-black dark:text-white block">Service Type</label>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_custom_type: !formData.is_custom_type })}
                            className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                          >
                            {formData.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
                          </button>
                        </div>

                        {formData.is_custom_type ? (
                          <input
                            type="text"
                            required
                            value={formData.custom_type_input}
                            onChange={(e) => setFormData({ ...formData, custom_type_input: e.target.value })}
                            placeholder="Enter new custom service type..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        ) : (
                          <select
                            value={formData.service_type_name}
                            onChange={(e) => handleTypeSelect(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                          >
                            {availableServiceTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Attach to Property</label>
                        <select
                          value={formData.property_id}
                          onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {propertyOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.organization_name ? `(${p.organization_name})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="e.g. Primary inbound DID for front desk operations"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

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
                      disabled={formLoading}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {formLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFire ? (
                        'Save Fire Line'
                      ) : isElevator ? (
                        'Save Elevator Line'
                      ) : (
                        'Provision Service'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 5. EDIT SERVICE MODAL */}
      <AnimatePresence>
        {showEditModal && selectedServiceForEdit && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Service Details</h3>
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
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Service ID <span className="text-rose-500">* (Min 6 chars)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={formData.custom_service_id}
                    onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Service Name</label>
                    <input
                      type="text"
                      value={formData.service_name}
                      onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Service Type</label>
                  <select
                    value={formData.service_type_name}
                    onChange={(e) => setFormData({ ...formData, service_type_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    {availableServiceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Attach to Property</label>
                  <select
                    value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Unassigned</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.organization_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
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
                    disabled={formLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {serviceToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Service</h3>
                  <p className="text-xs text-slate-400 font-mono">{serviceToDelete.phone_number}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Are you sure you want to permanently delete service <span className="font-semibold text-slate-900 dark:text-white">{serviceToDelete.phone_number}</span> ({serviceToDelete.service_name})? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setServiceToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Service'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>  
      {/* 6. MANAGE SERVICE TYPES MODAL */}
      <AnimatePresence>
        {showManageTypesModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Manage Service Types</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure telecom service categories</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowManageTypesModal(false);
                    setEditingType(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 text-xs">
                {/* Form to add or edit a type */}
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-slate-50 dark:bg-[#111217]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2.5">
                    {editingType ? 'Edit Service Type' : 'Add New Service Type'}
                  </h4>
                  {editingType ? (
                    <form onSubmit={handleUpdateServiceType} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
                        <input
                          type="text"
                          required
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={editingType.description || ''}
                          onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                          placeholder="e.g. Dedicated emergency phone line"
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingType(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={typeActionLoading}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          {typeActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleCreateServiceType} className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Service Type Name</label>
                        <input
                          type="text"
                          required
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          placeholder="e.g. Dedicated Fiber Link"
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (optional)</label>
                        <input
                          type="text"
                          value={newTypeDescription}
                          onChange={(e) => setNewTypeDescription(e.target.value)}
                          placeholder="e.g. High throughput commercial fiber line"
                          className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={typeActionLoading || !newTypeName.trim()}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          {typeActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Add Type</>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* List of existing types */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center justify-between">
                    <span>Available Types ({serviceTypes.length})</span>
                    <button
                      type="button"
                      onClick={loadServiceTypes}
                      className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 cursor-pointer font-normal"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </h4>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {serviceTypes.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                          {t.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingType({ id: t.id, name: t.name, description: t.description })}
                            className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Type"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteServiceType(t.id, t.name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Delete Type"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowManageTypesModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
