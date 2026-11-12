'use client';

import React, { useState } from 'react';
import { PortingItem } from '@/store/slices/portingSlice';
import { LifecycleStage } from './portingTypes';

interface UsePortingActionsProps {
  loadData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePortingActions({ loadData, showToast }: UsePortingActionsProps) {
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State for creating new Porting Request
  const [createForm, setCreateForm] = useState({
    organization_id: '',
    partner_id: '',
    partner_commission_override: '' as string | number,
    property_name: '',
    monthly_price: '' as string | number,
    property_phone: '',
    fax: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    e911_status: 'VERIFIED' as 'VERIFIED' | 'AUDIT_REQUIRED',
    ray_baud_and_logs_enabled: true,
    ray_baum_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    target_date: '',
    carrier_details: '',
    status: 'DRAFT' as LifecycleStage,
  });
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PortingItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Assign Services Modal
  const [showAssignServiceModal, setShowAssignServiceModal] = useState(false);
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<PortingItem | null>(null);
  const [assignedServices, setAssignedServices] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const [assigningService, setAssigningService] = useState(false);

  // Handle Create Porting Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_name.trim() || !createForm.property_phone.trim()) {
      setCreateError('Property Name and Phone Number are required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const uploadedAttachments: {
        file_name: string;
        file_size: number;
        mime_type: string;
        storage_path: string;
      }[] = [];

      if (createFiles.length > 0) {
        for (let i = 0; i < createFiles.length; i++) {
          const file = createFiles[i];
          const fd = new FormData();
          fd.append('file', file);
          const upRes = await fetch('/api/admin/porting/attachment', { method: 'POST', body: fd });
          const upJson = await upRes.json();
          if (upRes.ok && upJson.success && upJson.data) {
            uploadedAttachments.push(upJson.data);
          } else {
            throw new Error(upJson.error || `Failed to upload ${file.name}`);
          }
        }
      }

      const res = await fetch('/api/admin/porting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: createForm.organization_id || null,
          partner_id: createForm.partner_id || null,
          partner_commission_override: createForm.partner_commission_override !== '' && createForm.partner_commission_override !== null && createForm.partner_commission_override !== undefined ? Number(createForm.partner_commission_override) : null,
          property_name: createForm.property_name.trim(),
          property_phone: createForm.property_phone.trim(),
          fax: createForm.fax.trim() || null,
          monthly_price: createForm.monthly_price ? Number(createForm.monthly_price) : null,
          property_address: createForm.address.trim() || null,
          city: createForm.city.trim() || null,
          state: createForm.state.trim() || null,
          zip_code: createForm.zip_code.trim() || null,
          country: createForm.country.trim() || 'USA',
          general_manager_name: createForm.general_manager_name.trim() || null,
          general_manager_phone: createForm.general_manager_phone.trim() || null,
          general_manager_email: createForm.general_manager_email.trim() || null,
          e911_status: createForm.e911_status,
          ray_baud_and_logs_enabled: createForm.ray_baud_and_logs_enabled,
          ray_baum_status: createForm.ray_baum_status,
          target_date: createForm.target_date || null,
          carrier_details: createForm.carrier_details.trim() || null,
          status: createForm.status || 'DRAFT',
          attachments: uploadedAttachments,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create porting record.');
      }

      showToast(
        'Porting Created Successfully',
        `Porting lifecycle initialized for ${createForm.property_name}.`,
        'success'
      );
      setShowCreateModal(false);
      setCreateForm({
        organization_id: '',
        partner_id: '',
        partner_commission_override: '',
        property_name: '',
        monthly_price: '',
        property_phone: '',
        fax: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        general_manager_name: '',
        general_manager_phone: '',
        general_manager_email: '',
        e911_status: 'VERIFIED',
        ray_baud_and_logs_enabled: true,
        ray_baum_status: 'ACTIVE',
        target_date: '',
        carrier_details: '',
        status: 'DRAFT',
      });
      setCreateFiles([]);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Assign Services Handlers
  const handleOpenAssignServices = async (record: PortingItem) => {
    setSelectedRecordForAssign(record);
    setShowAssignServiceModal(true);
    setSelectedServiceToAssign('');
    setLoadingServices(true);
    try {
      const [resAssigned, resAll] = await Promise.all([
        fetch(`/api/admin/porting/${record.id}/services`),
        fetch(`/api/admin/services?limit=100`),
      ]);
      const jsonAssigned = await resAssigned.json();
      const jsonAll = await resAll.json();
      if (jsonAssigned.success && Array.isArray(jsonAssigned.data)) {
        setAssignedServices(jsonAssigned.data);
      } else {
        setAssignedServices([]);
      }
      if (jsonAll.services || jsonAll.data) {
        const list = jsonAll.services || jsonAll.data || [];
        setAvailableServices(
          list.map((s: any) => ({
            id: s.id,
            phone_number: s.phone_number,
            service_type: s.service_type || 'Voice Trunk',
            price: Number(s.price || 0),
          }))
        );
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load services', 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleConfirmAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForAssign || !selectedServiceToAssign) {
      showToast('Validation', 'Please select a service to assign.', 'error');
      return;
    }
    try {
      setAssigningService(true);
      const res = await fetch(`/api/admin/porting/${selectedRecordForAssign.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedServiceToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign service.');

      showToast('Service Assigned', 'Service linked to porting property successfully.', 'success');
      setSelectedServiceToAssign('');

      // Refresh assigned services list
      const resAssigned = await fetch(`/api/admin/porting/${selectedRecordForAssign.id}/services`);
      const jsonAssigned = await resAssigned.json();
      if (jsonAssigned.success && Array.isArray(jsonAssigned.data)) {
        setAssignedServices(jsonAssigned.data);
      }
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to assign service', 'error');
    } finally {
      setAssigningService(false);
    }
  };

  const handleUnassignService = async (serviceId: string) => {
    if (!selectedRecordForAssign) return;
    try {
      const res = await fetch(`/api/admin/porting/${selectedRecordForAssign.id}/services?serviceId=${serviceId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to unassign service.');

      showToast('Service Removed', 'Service unassigned successfully.', 'success');
      setAssignedServices((prev) => prev.filter((s) => s.id !== serviceId && s.service_id !== serviceId));
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to unassign service', 'error');
    }
  };

  // Delete Porting
  const handleDeleteSubmit = async () => {
    if (!recordToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/porting?id=${recordToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed.');

      showToast('Deleted', `Porting for ${recordToDelete.property_name} removed.`, 'success');
      setShowDeleteModal(false);
      setRecordToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    showCreateModal,
    setShowCreateModal,
    showImportModal,
    setShowImportModal,
    createForm,
    setCreateForm,
    createFiles,
    setCreateFiles,
    createLoading,
    createError,
    handleCreateSubmit,
    showDeleteModal,
    setShowDeleteModal,
    recordToDelete,
    setRecordToDelete,
    deleteLoading,
    handleDeleteSubmit,
    showAssignServiceModal,
    setShowAssignServiceModal,
    selectedRecordForAssign,
    setSelectedRecordForAssign,
    assignedServices,
    availableServices,
    selectedServiceToAssign,
    setSelectedServiceToAssign,
    loadingServices,
    assigningService,
    handleOpenAssignServices,
    handleConfirmAssignService,
    handleUnassignService,
  };
}
