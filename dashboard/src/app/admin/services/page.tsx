'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
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
} from '@/store/slices/servicesSlice';

import {
  containerVariants,
  PropertyOption,
  Toast,
  ServiceTypeItem,
  ServiceFormData,
  INITIAL_SERVICE_FORM_DATA,
} from './_components/types';
import ServicesHeaderAndFilters from './_components/ServicesHeaderAndFilters';
import ServicesTable from './_components/ServicesTable';
import ServiceDetailDrawer from './_components/ServiceDetailDrawer';
import ProvisionServiceModal from './_components/ProvisionServiceModal';
import EditServiceModal from './_components/EditServiceModal';
import ManageServiceTypesModal from './_components/ManageServiceTypesModal';
import ServiceAssignModals from './_components/ServiceAssignModals';

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
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_SERVICE_FORM_DATA);
  const [showCustomServiceId, setShowCustomServiceId] = useState(false);
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState<ServiceItem | null>(null);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<ServiceItem | null>(null);
  const [selectedServiceForAssign, setSelectedServiceForAssign] = useState<ServiceItem | null>(null);
  const [selectedServiceForStatus, setSelectedServiceForStatus] = useState<ServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  // 3-Dots Action Menu Position (strictly opens ABOVE)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; service: ServiceItem } | null>(null);

  // Dynamic Service Types
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [showManageTypesModal, setShowManageTypesModal] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

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

  const availableServiceTypes = useMemo(() => {
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

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.selectedType !== 'ALL' ||
    filters.selectedStatus !== 'ALL'
  );

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setTypeFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
  };

  const handleOpenStatusSlider = (e: React.MouseEvent, svc: ServiceItem) => {
    e.stopPropagation();
    setSelectedServiceForStatus(svc);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setSelectedServiceForEdit(svc);
  };

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, svc: ServiceItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, service: svc });
  };

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

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#0c0d12] p-4 sm:p-6 lg:p-8">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 pointer-events-auto backdrop-blur-md ${
                t.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
                  : t.type === 'info'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : t.type === 'info' ? (
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
                {t.message && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header, KPI Cards & Filter Toolbar */}
        <ServicesHeaderAndFilters
          metrics={metrics}
          filters={filters}
          services={services}
          availableServiceTypes={availableServiceTypes}
          hasActiveFilters={hasActiveFilters}
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          onStatusChange={(s: string) => dispatch(setStatusFilter(s))}
          onTypeChange={(t: string) => dispatch(setTypeFilter(t))}
          onSortChange={(sb: string) => dispatch(setSortBy(sb))}
          onResetFilters={resetAllFilters}
          onOpenManageTypes={() => setShowManageTypesModal(true)}
          onOpenProvision={() => {
            setFormData(INITIAL_SERVICE_FORM_DATA);
            setShowCustomServiceId(false);
            setShowCreateModal(true);
          }}
          onToast={showToast}
        />

        {/* Services Table */}
        <ServicesTable
          error={error}
          loading={loading}
          services={services}
          loadData={loadData}
          hasActiveFilters={hasActiveFilters}
          resetAllFilters={resetAllFilters}
          setFormData={setFormData}
          setShowCustomServiceId={setShowCustomServiceId}
          setShowCreateModal={setShowCreateModal}
          setSelectedServiceForDetails={setSelectedServiceForDetails}
          setShowDetailsDrawer={setShowDetailsDrawer}
          handleOpenStatusSlider={handleOpenStatusSlider}
          handleOpenEdit={handleOpenEdit}
          handleOpenMenu={handleOpenMenu}
          pagination={pagination}
          menuPosition={menuPosition}
          setMenuPosition={setMenuPosition}
          handleOpenAssignModal={(svc: any) => setSelectedServiceForAssign(svc)}
          handleUnassignProperty={handleUnassignProperty}
          setServiceToDelete={setServiceToDelete}
        />
      </motion.div>

      {/* Slide-out View Details Drawer */}
      <ServiceDetailDrawer
        showDetailsDrawer={showDetailsDrawer}
        selectedServiceForDetails={selectedServiceForDetails}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedServiceForDetails(null);
        }}
      />

      {/* Provision New Service Modal */}
      <ProvisionServiceModal
        showCreateModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(title, msg) => {
          showToast(title, msg, 'success');
          loadData();
        }}
        availableServiceTypes={availableServiceTypes}
        propertyOptions={propertyOptions}
      />

      {/* Edit Service Modal */}
      <EditServiceModal
        showEditModal={Boolean(selectedServiceForEdit)}
        selectedServiceForEdit={selectedServiceForEdit}
        onClose={() => setSelectedServiceForEdit(null)}
        onSuccess={(title, msg) => {
          showToast(title, msg, 'success');
          loadData();
        }}
        availableServiceTypes={availableServiceTypes}
        propertyOptions={propertyOptions}
      />

      {/* Manage Service Types Modal */}
      <ManageServiceTypesModal
        showManageTypesModal={showManageTypesModal}
        onClose={() => setShowManageTypesModal(false)}
        serviceTypes={serviceTypes}
        loadServiceTypes={loadServiceTypes}
        onToast={showToast}
      />

      {/* Service Assign / Status Slider / Delete Confirmation Modals */}
      <ServiceAssignModals
        statusService={selectedServiceForStatus}
        onCloseStatus={() => setSelectedServiceForStatus(null)}
        assignService={selectedServiceForAssign}
        onCloseAssign={() => setSelectedServiceForAssign(null)}
        deleteService={serviceToDelete}
        onCloseDelete={() => setServiceToDelete(null)}
        propertyOptions={propertyOptions}
        onSuccess={(title, msg) => {
          showToast(title, msg, title === 'Error' ? 'error' : 'success');
          loadData();
        }}
        onOptimisticStatus={(id, status) => {
          dispatch(optimisticUpdateServiceStatus({ id, status }));
        }}
      />
    </div>
  );
}
