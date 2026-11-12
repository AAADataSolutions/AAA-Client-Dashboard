'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setOrganizations,
  updateOrgStatusOptimistic,
  updateOrganizationOptimistic,
  setFilters,
  setLoading,
  setError,
  type OrgRecord,
} from '@/store/slices/organizationsSlice';
import {
  type EditOrgFormData,
  type OrgMenuPosition,
  exportOrganizationsToCSV,
} from './types';
import { useOrgDrawers } from './useOrgDrawers';

export function useOrganizationsPage() {
  const dispatch = useAppDispatch();
  const {
    items: organizations,
    metrics,
    totalCount,
    totalPages,
    currentPage,
    searchQuery,
    selectedStatus,
    selectedTypeFilter,
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
  const [menuPosition, setMenuPosition] = useState<OrgMenuPosition | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Delete Organization State
  const [orgToDelete, setOrgToDelete] = useState<OrgRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Invite Modal State
  const [inviteModalOrg, setInviteModalOrg] = useState<{ id: string; name: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Edit Organization Drawer
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<OrgRecord | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = React.useRef<HTMLInputElement>(null);
  const [editFormData, setEditFormData] = useState<EditOrgFormData>({
    name: '',
    logo_url: '',
    type: 'GROUP',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    contact_name: '',
    status: 'ACTIVE',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [syncingPbx, setSyncingPbx] = useState(false);

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
        type: selectedTypeFilter,
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
  }, [currentPage, searchQuery, selectedStatus, selectedTypeFilter, selectedPropFilter, sortBy, dispatch]);

  const loadOrganizations = fetchOrganizations;

  const handleSyncPbxPortal = async () => {
    try {
      setSyncingPbx(true);
      const res = await fetch('/api/admin/pbx/sync-organizations', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to sync with PBX Portal');
      }
      showToast(json.message || 'Management Groups synced with PBX Portal.');
      loadOrganizations();
    } catch (err: any) {
      showToast(err.message || 'PBX Sync error', 'error');
    } finally {
      setSyncingPbx(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Client-side Instant Filtered Items (Keystroke reactivity)
  const displayedOrganizations = useMemo(() => {
    let result = organizations;
    if (selectedTypeFilter !== 'ALL') {
      result = result.filter((org) => (org.type || 'GROUP') === selectedTypeFilter);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (org: OrgRecord) =>
          org.name.toLowerCase().includes(lower) ||
          (org.address && org.address.toLowerCase().includes(lower)) ||
          (org.contact_name && org.contact_name.toLowerCase().includes(lower)) ||
          (org.email && org.email.toLowerCase().includes(lower)) ||
          (org.phone && org.phone.toLowerCase().includes(lower))
      );
    }
    return result;
  }, [organizations, searchQuery, selectedTypeFilter]);

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      await exportOrganizationsToCSV(organizations);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

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
    setEditLogoFile(null);
    setEditLogoPreview(org.logo_url || null);
    setEditFormData({
      name: org.name || '',
      logo_url: org.logo_url || '',
      type: (org.type === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GROUP') as 'GROUP' | 'INDIVIDUAL',
      address: org.street_address || org.address || '',
      city: org.city || '',
      state: org.state || '',
      zip_code: org.zip_code || '',
      phone: org.phone && org.phone !== '—' ? org.phone : '',
      email: org.email && org.email !== '—' ? org.email : '',
      contact_name: org.contact_name || (org as any).primary_contact_name || '',
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
      let finalLogoUrl: string | null = editFormData.logo_url || null;
      if (editLogoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', editLogoFile);
        logoFormData.append('organization_id', selectedOrgForEdit.id);
        const logoRes = await fetch('/api/admin/organizations/logo', {
          method: 'POST',
          body: logoFormData,
        });
        const logoJson = await logoRes.json();
        if (logoJson.success && logoJson.logo_url) {
          finalLogoUrl = logoJson.logo_url;
        }
      }

      const updates = {
        name: editFormData.name.trim(),
        logo_url: finalLogoUrl,
        type: editFormData.type,
        address: editFormData.address.trim(),
        street_address: editFormData.address.trim(),
        city: editFormData.city.trim(),
        state: editFormData.state.trim(),
        zip_code: editFormData.zip_code.trim(),
        phone: editFormData.phone.trim() || '—',
        email: editFormData.email.trim() || '—',
        contact_name: editFormData.contact_name.trim(),
        primary_contact_name: editFormData.contact_name.trim(),
        status: editFormData.status as any,
      };

      dispatch(updateOrganizationOptimistic({ id: selectedOrgForEdit.id, updates }));
      setShowEditDrawer(false);
      showToast('Organization details updated successfully.');

      const res = await fetch(`/api/admin/organizations/${selectedOrgForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          logo_url: finalLogoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update organization');
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error updating organization', 'error');
      fetchOrganizations();
    } finally {
      setEditSaving(false);
    }
  };

  const drawerState = useOrgDrawers({
    dispatch,
    orgContacts,
    showToast,
    fetchOrganizations,
    setMenuPosition,
  });

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedStatus !== 'ALL' ||
    selectedTypeFilter !== 'ALL' ||
    selectedPropFilter !== 'ALL';

  return {
    dispatch,
    organizations,
    metrics,
    totalCount,
    totalPages,
    currentPage,
    searchQuery,
    selectedStatus,
    selectedTypeFilter,
    selectedPropFilter,
    loading,
    error,
    sortBy,
    setSortBy,
    copiedId,
    menuPosition,
    setMenuPosition,
    showCreateModal,
    setShowCreateModal,
    orgToDelete,
    setOrgToDelete,
    deleteLoading,
    inviteModalOrg,
    setInviteModalOrg,
    showImportModal,
    setShowImportModal,
    exporting,
    showEditDrawer,
    setShowEditDrawer,
    selectedOrgForEdit,
    editLogoFile,
    setEditLogoFile,
    editLogoPreview,
    setEditLogoPreview,
    editLogoInputRef,
    editFormData,
    setEditFormData,
    editSaving,
    syncingPbx,
    toastMsg,
    showToast,
    fetchOrganizations,
    handleSyncPbxPortal,
    displayedOrganizations,
    handleExportCSV,
    handleOpenMenu,
    handleCopyText,
    handleUpdateStatus,
    handleConfirmDeleteOrg,
    handleOpenEditDrawer,
    handleSaveEdit,
    hasActiveFilters,
    setFilters,
    ...drawerState,
  };
}
