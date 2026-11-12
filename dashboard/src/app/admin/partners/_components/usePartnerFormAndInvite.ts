'use client';

import { useState } from 'react';
import { Partner, PartnerFormData } from './types';

interface UsePartnerFormAndInviteParams {
  loadData: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  selectedPartner: Partner | null;
  setSelectedPartner: React.Dispatch<React.SetStateAction<Partner | null>>;
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  setPartnerMetrics: React.Dispatch<React.SetStateAction<any>>;
  assignForm: { property_id: string; commission_override: string };
  setShowAssignModal: (show: boolean) => void;
}

export function usePartnerFormAndInvite({
  loadData,
  showToast,
  selectedPartner,
  setSelectedPartner,
  setPartners,
  setPartnerMetrics,
  assignForm,
  setShowAssignModal,
}: UsePartnerFormAndInviteParams) {
  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingPartnerStatusId, setUpdatingPartnerStatusId] = useState<string | null>(null);

  // Partner Invite Modal
  const [inviteModalData, setInviteModalData] = useState<{
    partnerName: string;
    partnerEmail: string;
    inviteUrl: string | null;
    loading?: boolean;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [, setGeneratingInviteId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    default_commission_rate: 10,
    status: 'ACTIVE',
    notes: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Partner name and email are required.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create partner.');

      setShowCreateModal(false);
      loadData();

      if (result.inviteUrl) {
        setInviteModalData({
          partnerName: formData.name,
          partnerEmail: formData.email,
          inviteUrl: result.inviteUrl,
        });
      } else {
        showToast('Success', `${formData.name} added as partner.`);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create partner.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update partner.');

      showToast('Updated', `${formData.name} updated successfully.`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update partner.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartner) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete partner.');

      showToast('Deleted', `${selectedPartner.name} removed.`);
      setShowDeleteModal(false);
      setSelectedPartner(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Delete failed.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTogglePartnerStatus = async (partnerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setUpdatingPartnerStatusId(partnerId);
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update partner status.');

      showToast('Status Updated', `Partner set to ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}.`, 'success');
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus as any } : p))
      );
      setPartnerMetrics((prev: any) => ({
        ...prev,
        activePartners: newStatus === 'ACTIVE' ? prev.activePartners + 1 : Math.max(0, prev.activePartners - 1),
      }));
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update partner status.', 'error');
    } finally {
      setUpdatingPartnerStatusId(null);
    }
  };

  const handleGenerateInviteLink = async (partner: Partner) => {
    setInviteModalData({
      partnerName: partner.name,
      partnerEmail: partner.email,
      inviteUrl: null,
      loading: true,
    });
    setGeneratingInviteId(partner.id);

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/invite`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate invite link.');

      setInviteModalData({
        partnerName: partner.name,
        partnerEmail: partner.email,
        inviteUrl: json.inviteUrl,
        loading: false,
      });
    } catch (err: any) {
      setInviteModalData(null);
      showToast('Error', err.message || 'Failed to generate invite link.', 'error');
    } finally {
      setGeneratingInviteId(null);
    }
  };

  const handleCopyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    showToast('Copied', 'Partner invite link copied to clipboard.');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !assignForm.property_id) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: assignForm.property_id,
          commission_override: assignForm.commission_override || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign property.');

      showToast('Assigned', 'Property assigned to partner with revenue share.');
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Assignment failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    updatingPartnerStatusId,
    inviteModalData,
    setInviteModalData,
    copiedInvite,
    formData,
    setFormData,
    formLoading,
    formError,
    handleCreatePartner,
    handleUpdatePartner,
    handleDeletePartner,
    handleTogglePartnerStatus,
    handleGenerateInviteLink,
    handleCopyInviteUrl,
    handleAssignPropertySubmit,
  };
}

