'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  setBillingStatusFilter,
  setSortBy,
  setPagination,
  PropertyItem,
} from '@/store/slices/propertiesSlice';

import {
  containerVariants,
  OrgOption,
  PartnerOption,
  ServerOption,
  VendorOption,
  Toast,
} from './_components/types';
import { PropertiesKpiAndFilters } from './_components/PropertiesKpiAndFilters';
import { PropertiesTable } from './_components/PropertiesTable';
import { PropertyViewDetailsModal } from './_components/PropertyViewDetailsModal';
import { CreatePropertyModal } from './_components/CreatePropertyModal';
import { EditPropertyModal } from './_components/EditPropertyModal';
import { PropertyServicesAndOrgModals } from './_components/PropertyServicesAndOrgModals';
import { PropertyContactsDrawer } from './_components/PropertyContactsDrawer';
import { PropertyMasterDrawer } from './_components/PropertyMasterDrawer';
import { usePropertyDrawerActions } from './_components/usePropertyDrawerActions';
import { usePropertyServicesAndContacts } from './_components/usePropertyServicesAndContacts';
import { usePropertyFormModals } from './_components/usePropertyFormModals';

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
  const [serverOptions, setServerOptions] = useState<ServerOption[]>([]);
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Search input state (char-by-char)
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // 3-Dots Action Menu Position (opens ABOVE the line per Rule 8)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; prop: PropertyItem } | null>(null);

  // Import CSV Modal State
  const [showImportModal, setShowImportModal] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

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

  // Load servers and vendors for dropdowns
  useEffect(() => {
    async function loadServersAndVendors() {
      try {
        const [srvRes, vndRes] = await Promise.all([
          fetch('/api/admin/servers'),
          fetch('/api/admin/vendors'),
        ]);
        const [srvData, vndData] = await Promise.all([srvRes.json(), vndRes.json()]);
        if (srvData.success && Array.isArray(srvData.data)) {
          setServerOptions(
            srvData.data.map((s: any) => ({
              id: s.id,
              name: s.name,
              provider: s.provider,
              status: s.status,
            }))
          );
        }
        if (vndData.success && Array.isArray(vndData.data)) {
          setVendorOptions(
            vndData.data.map((v: any) => ({
              id: v.id,
              name: v.name,
              category: v.category,
              status: v.status,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load server/vendor options:', err);
      }
    }
    loadServersAndVendors();
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
        billingStatus: filters.billingStatus,
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

  // Open 3-Dots Menu (opens ABOVE the line)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, prop });
  };

  // Custom Hooks for Modularized Actions
  const drawerActions = usePropertyDrawerActions({
    loadData,
    showToast,
  });

  const formModals = usePropertyFormModals({
    loadData,
    showToast,
    onBillingStatusUpdate: (propId, newBillingStatus) => {
      if (drawerActions.selectedPropForDrawer && drawerActions.selectedPropForDrawer.id === propId) {
        drawerActions.setSelectedPropForDrawer((prev) =>
          prev ? { ...prev, billing_status: newBillingStatus } : prev
        );
      }
      if (drawerActions.propertyDrawerData?.property?.id === propId) {
        drawerActions.setPropertyDrawerData((prev: any) =>
          prev ? { ...prev, property: { ...prev.property, billing_status: newBillingStatus } } : prev
        );
      }
    },
  });

  const servicesAndContacts = usePropertyServicesAndContacts({
    loadData,
    showToast,
  });

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setOrgFilter('ALL'));
    dispatch(setStatusFilter('ALL'));
    dispatch(setE911Filter('ALL'));
    dispatch(setRayBaumFilter('ALL'));
    dispatch(setBillingStatusFilter('ALL'));
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
    (filters.billingStatus && filters.billingStatus !== 'ALL') ||
    filters.sortBy !== 'NAME_ASC';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* KPI Cards & Filter Bar */}
      <PropertiesKpiAndFilters
        toasts={toasts}
        setToasts={setToasts}
        properties={properties}
        metrics={metrics}
        filters={filters}
        searchInput={searchInput}
        handleSearchChange={handleSearchChange}
        orgOptions={orgOptions}
        hasActiveFilters={hasActiveFilters}
        resetAllFilters={resetAllFilters}
        setShowImportModal={setShowImportModal}
        setFormData={formModals.setFormData}
        setFormError={formModals.setFormError}
        setShowCreateModal={formModals.setShowCreateModal}
        showToast={showToast}
      />

      {/* Main Table View */}
      <PropertiesTable
        properties={properties}
        loading={loading}
        error={error}
        pagination={pagination}
        hasActiveFilters={hasActiveFilters}
        resetAllFilters={resetAllFilters}
        loadData={loadData}
        isSuperAdmin={isSuperAdmin}
        copiedField={copiedField}
        handleCopy={handleCopy}
        handleOpenPropertyDrawer={drawerActions.handleOpenPropertyDrawer}
        handleOpenServicesModal={servicesAndContacts.handleOpenServicesModal}
        handleQuickUpdateStatus={formModals.handleQuickUpdateStatus}
        handleQuickUpdateBillingStatus={formModals.handleQuickUpdateBillingStatus}
        handleOpenEdit={formModals.handleOpenEdit}
        handleOpenMenu={handleOpenMenu}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        setSelectedPropForDetails={formModals.setSelectedPropForDetails}
        handleOpenAssignServiceModal={servicesAndContacts.handleOpenAssignServiceModal}
        setSelectedPropForAssignOrg={servicesAndContacts.setSelectedPropForAssignOrg}
        setShowAssignOrgModal={servicesAndContacts.setShowAssignOrgModal}
        handleUnassignFromOrg={servicesAndContacts.handleUnassignFromOrg}
        handleOpenContactsDrawer={servicesAndContacts.handleOpenContactsDrawer}
        handleOpenStatusModal={formModals.handleOpenStatusModal}
        setPropertyToDelete={formModals.setPropertyToDelete}
        setFormData={formModals.setFormData}
        setShowCreateModal={formModals.setShowCreateModal}
      />

      {/* 1. VIEW PROPERTY DETAILS MODAL */}
      <PropertyViewDetailsModal
        showDetailsModal={formModals.showDetailsModal}
        setShowDetailsModal={formModals.setShowDetailsModal}
        selectedPropForDetails={formModals.selectedPropForDetails}
        isSuperAdmin={isSuperAdmin}
      />

      {/* CREATE NEW PROPERTY MODAL */}
      <CreatePropertyModal
        showCreateModal={formModals.showCreateModal}
        setShowCreateModal={formModals.setShowCreateModal}
        formData={formModals.formData}
        setFormData={formModals.setFormData}
        formError={formModals.formError}
        formLoading={formModals.formLoading}
        handleSaveCreate={formModals.handleSaveCreate}
        orgOptions={orgOptions}
        partnerOptions={partnerOptions}
        serverOptions={serverOptions}
        vendorOptions={vendorOptions}
        isSuperAdmin={isSuperAdmin}
      />

      {/* EDIT PROPERTY MODAL */}
      <EditPropertyModal
        showEditModal={formModals.showEditModal}
        setShowEditModal={formModals.setShowEditModal}
        selectedPropForEdit={formModals.selectedPropForEdit}
        formData={formModals.formData}
        setFormData={formModals.setFormData}
        formError={formModals.formError}
        formLoading={formModals.formLoading}
        handleSaveEdit={formModals.handleSaveEdit}
        orgOptions={orgOptions}
        partnerOptions={partnerOptions}
        serverOptions={serverOptions}
        vendorOptions={vendorOptions}
        isSuperAdmin={isSuperAdmin}
      />

      {/* SERVICES, STATUS & ORG MODALS */}
      <PropertyServicesAndOrgModals
        showServicesModal={servicesAndContacts.showServicesModal}
        setShowServicesModal={servicesAndContacts.setShowServicesModal}
        selectedPropForServices={servicesAndContacts.selectedPropForServices}
        loadingServices={servicesAndContacts.loadingServices}
        propServicesList={servicesAndContacts.propServicesList}
        handleUnassignService={servicesAndContacts.handleUnassignService}
        handleOpenAssignServiceModal={servicesAndContacts.handleOpenAssignServiceModal}
        showAssignServiceModal={servicesAndContacts.showAssignServiceModal}
        setShowAssignServiceModal={servicesAndContacts.setShowAssignServiceModal}
        selectedPropForAssign={servicesAndContacts.selectedPropForAssign}
        selectedServiceToAssign={servicesAndContacts.selectedServiceToAssign}
        setSelectedServiceToAssign={servicesAndContacts.setSelectedServiceToAssign}
        availableServices={servicesAndContacts.availableServices}
        assigningService={servicesAndContacts.assigningService}
        handleConfirmAssignService={servicesAndContacts.handleConfirmAssignService}
        showStatusModal={formModals.showStatusModal}
        setShowStatusModal={formModals.setShowStatusModal}
        selectedPropForStatus={formModals.selectedPropForStatus}
        targetStatus={formModals.targetStatus}
        setTargetStatus={formModals.setTargetStatus}
        statusChangeLoading={formModals.statusChangeLoading}
        handleConfirmStatusChange={formModals.handleConfirmStatusChange}
        showAssignOrgModal={servicesAndContacts.showAssignOrgModal}
        setShowAssignOrgModal={servicesAndContacts.setShowAssignOrgModal}
        selectedPropForAssignOrg={servicesAndContacts.selectedPropForAssignOrg}
        targetOrgId={servicesAndContacts.targetOrgId}
        setTargetOrgId={servicesAndContacts.setTargetOrgId}
        orgOptions={orgOptions}
        assigningOrgLoading={servicesAndContacts.assigningOrgLoading}
        handleAssignOrgSubmit={servicesAndContacts.handleAssignOrgSubmit}
        propertyToDelete={formModals.propertyToDelete}
        setPropertyToDelete={formModals.setPropertyToDelete}
        deletePropertyLoading={formModals.deletePropertyLoading}
        handleConfirmDeleteProperty={formModals.handleConfirmDeleteProperty}
      />

      {/* CONTACTS DRAWER & MODALS */}
      <PropertyContactsDrawer
        showContactsDrawer={servicesAndContacts.showContactsDrawer}
        setShowContactsDrawer={servicesAndContacts.setShowContactsDrawer}
        selectedPropForContacts={servicesAndContacts.selectedPropForContacts}
        contactsList={servicesAndContacts.contactsList}
        loadingContacts={servicesAndContacts.loadingContacts}
        showAddContactModal={servicesAndContacts.showAddContactModal}
        setShowAddContactModal={servicesAndContacts.setShowAddContactModal}
        contactFormData={servicesAndContacts.contactFormData}
        setContactFormData={servicesAndContacts.setContactFormData}
        savingContact={servicesAndContacts.savingContact}
        handleAddContactSubmit={servicesAndContacts.handleAddContactSubmit}
        contactToDelete={servicesAndContacts.contactToDelete}
        setContactToDelete={servicesAndContacts.setContactToDelete}
        deletingContact={servicesAndContacts.deletingContact}
        handleConfirmDeleteContact={servicesAndContacts.handleConfirmDeleteContact}
      />

      {/* COMPREHENSIVE PROPERTY RIGHT-SIDE DRAWER */}
      <PropertyMasterDrawer
        showPropertyDrawer={drawerActions.showPropertyDrawer}
        setShowPropertyDrawer={drawerActions.setShowPropertyDrawer}
        selectedPropForDrawer={drawerActions.selectedPropForDrawer}
        propertyDrawerData={drawerActions.propertyDrawerData}
        loadingDrawerData={drawerActions.loadingDrawerData}
        refreshDrawerData={drawerActions.refreshDrawerData}
        drawerTab={drawerActions.drawerTab}
        setDrawerTab={drawerActions.setDrawerTab}
        copiedField={copiedField}
        handleCopy={handleCopy}
        handleQuickUpdateBillingStatus={formModals.handleQuickUpdateBillingStatus}
        handleOpenCreateServiceInDrawer={drawerActions.handleOpenCreateServiceInDrawer}
        handleDrawerAssignService={drawerActions.handleDrawerAssignService}
        drawerAssignServiceId={drawerActions.drawerAssignServiceId}
        setDrawerAssignServiceId={drawerActions.setDrawerAssignServiceId}
        assigningServiceInDrawer={drawerActions.assigningServiceInDrawer}
        handleDrawerUnassignService={drawerActions.handleDrawerUnassignService}
        unassigningServiceId={drawerActions.unassigningServiceId}
        showCreateServiceInDrawerModal={drawerActions.showCreateServiceInDrawerModal}
        setShowCreateServiceInDrawerModal={drawerActions.setShowCreateServiceInDrawerModal}
        serviceCreateForm={drawerActions.serviceCreateForm}
        setServiceCreateForm={drawerActions.setServiceCreateForm}
        serviceCreateError={drawerActions.serviceCreateError}
        creatingServiceInDrawer={drawerActions.creatingServiceInDrawer}
        handleCreateServiceInDrawerSubmit={drawerActions.handleCreateServiceInDrawerSubmit}
        availableDrawerServiceTypes={drawerActions.availableDrawerServiceTypes}
        serverOptions={serverOptions}
        vendorOptions={vendorOptions}
        showCustomSvcIdInDrawer={drawerActions.showCustomSvcIdInDrawer}
        setShowCustomSvcIdInDrawer={drawerActions.setShowCustomSvcIdInDrawer}
        onOpenEdit={formModals.handleOpenEdit}
        orgOptions={orgOptions}
        partnerOptions={partnerOptions}
      />

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
