'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import {
  optimisticUpdatePropertyStatus,
  updatePropertyOptimistic,
  PropertyItem,
} from '@/store/slices/propertiesSlice';
import { PropertyFormData, getDefaultPropertyFormData } from './types';

interface UsePropertyFormModalsProps {
  loadData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onBillingStatusUpdate?: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
}

export function usePropertyFormModals({
  loadData,
  showToast,
  onBillingStatusUpdate,
}: UsePropertyFormModalsProps) {
  const dispatch = useAppDispatch();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPropForEdit, setSelectedPropForEdit] = useState<PropertyItem | null>(null);

  // View Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPropForDetails, setSelectedPropForDetails] = useState<PropertyItem | null>(null);

  // Change Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedPropForStatus, setSelectedPropForStatus] = useState<PropertyItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Delete Property State
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyItem | null>(null);
  const [deletePropertyLoading, setDeletePropertyLoading] = useState(false);

  // Form State for Create & Edit Property
  const [formData, setFormData] = useState<PropertyFormData>(getDefaultPropertyFormData());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Handlers: Create Property
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

  // Handlers: Edit Property
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

  // Handlers: Change Status
  const handleOpenStatusModal = (prop: PropertyItem) => {
    setSelectedPropForStatus(prop);
    setTargetStatus((prop.status as any) || 'ACTIVE');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedPropForStatus) return;

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
    if (onBillingStatusUpdate) {
      onBillingStatusUpdate(propId, newBillingStatus);
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

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    selectedPropForEdit,
    setSelectedPropForEdit,
    showDetailsModal,
    setShowDetailsModal,
    selectedPropForDetails,
    setSelectedPropForDetails,
    showStatusModal,
    setShowStatusModal,
    selectedPropForStatus,
    targetStatus,
    setTargetStatus,
    statusChangeLoading,
    propertyToDelete,
    setPropertyToDelete,
    deletePropertyLoading,
    formData,
    setFormData,
    formLoading,
    formError,
    setFormError,
    handleSaveCreate,
    handleOpenEdit,
    handleSaveEdit,
    handleOpenStatusModal,
    handleConfirmStatusChange,
    handleQuickUpdateStatus,
    handleQuickUpdateStage,
    handleQuickUpdateBillingStatus,
    handleConfirmDeleteProperty,
  };
}

