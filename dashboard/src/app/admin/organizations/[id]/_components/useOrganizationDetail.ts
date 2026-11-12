'use client';

import React, { useState, useEffect, useRef } from 'react';
import { type OrgDetail, type OrgDetailTab } from './types';
import { useOrgDetailProperties } from './useOrgDetailProperties';
import { useOrgDetailServicesAndOnboarding } from './useOrgDetailServicesAndOnboarding';

export function useOrganizationDetail(orgId: string) {
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrgDetailTab>('OVERVIEW');

  // Edit Organization Modal
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    phone: '',
    email: '',
    status: 'ACTIVE',
    logo_url: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Delete Contact Confirmation
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Copy state & toast
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOrgDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${orgId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrg(json.data);
        setEditFormData({
          name: json.data.name || '',
          address: json.data.street_address || '',
          city: json.data.city || '',
          state: json.data.state || '',
          zip_code: json.data.zip_code || '',
          country: json.data.country || 'USA',
          phone: json.data.phone !== '—' ? json.data.phone : '',
          email: json.data.email !== '—' ? json.data.email : '',
          status: json.data.status || 'ACTIVE',
          logo_url: json.data.logo_url || '',
        });
        setEditLogoPreview(json.data.logo_url || null);
        setEditLogoFile(null);
      } else {
        setError(json.error || 'Failed to load organization details');
      }
    } catch (err: any) {
      console.error('Error fetching org:', err);
      setError(err.message || 'Error loading organization workspace');
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned properties list with full rich fields
  const fetchOrgProperties = async () => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties`);
      const json = await res.json();
      if (json.success && json.data && org) {
        setOrg((prev) => (prev ? { ...prev, properties: json.data } : null));
      }
    } catch (err) {
      console.error('Error refreshing org properties:', err);
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, [orgId]);

  const handleCopy = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save Edit Org
  const handleSaveOrgEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      let finalLogoUrl = editFormData.logo_url;

      if (editLogoFile) {
        const logoData = new FormData();
        logoData.append('file', editLogoFile);
        logoData.append('organization_id', orgId);

        const uploadRes = await fetch('/api/admin/organizations/logo', {
          method: 'POST',
          body: logoData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.error || 'Failed to upload organization logo');
        }
        finalLogoUrl = uploadJson.url;
      } else if (!editLogoPreview) {
        finalLogoUrl = '';
      }

      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          logo_url: finalLogoUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update organization');

      showToast('Organization profile updated successfully.');
      setShowEditOrgModal(false);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating organization', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Add Contact
  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add contact');

      showToast('Contact added successfully.');
      setShowAddContactModal(false);

      if (json.data) {
        setOrg((prev: any) => {
          if (!prev) return null;
          const prevContacts = prev.contacts || [];
          return {
            ...prev,
            contacts: [
              json.data,
              ...prevContacts.filter((c: any) => c.id !== json.data.id && (!json.data.is_primary || !c.is_primary)),
            ],
          };
        });
      }

      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  // Confirm Delete Contact
  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;
    const targetId = contactToDelete.id;
    setDeletingContact(true);

    // Optimistically remove from state immediately
    setOrg((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        contacts: (prev.contacts || []).filter((c: any) => c.id !== targetId),
      };
    });
    setContactToDelete(null);

    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/contacts?member_id=${targetId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');

      showToast('Contact removed successfully.');
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
      fetchOrgDetails();
    } finally {
      setDeletingContact(false);
    }
  };

  const propState = useOrgDetailProperties({
    orgId,
    showToast,
    fetchOrgDetails,
    fetchOrgProperties,
  });

  const srvAndOnbState = useOrgDetailServicesAndOnboarding({
    orgId,
    org,
    showToast,
    fetchOrgDetails,
    fetchOrgProperties,
  });

  return {
    org,
    setOrg,
    loading,
    error,
    activeTab,
    setActiveTab,
    showEditOrgModal,
    setShowEditOrgModal,
    editFormData,
    setEditFormData,
    editSaving,
    editLogoFile,
    setEditLogoFile,
    editLogoPreview,
    setEditLogoPreview,
    editLogoInputRef,
    showAddContactModal,
    setShowAddContactModal,
    contactFormData,
    setContactFormData,
    savingContact,
    contactToDelete,
    setContactToDelete,
    deletingContact,
    copiedId,
    toastMsg,
    showToast,
    fetchOrgDetails,
    fetchOrgProperties,
    handleCopy,
    handleSaveOrgEdit,
    handleAddContactSubmit,
    handleConfirmDeleteContact,
    ...propState,
    ...srvAndOnbState,
  };
}
