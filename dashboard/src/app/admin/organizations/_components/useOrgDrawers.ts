'use client';

import React, { useState } from 'react';
import {
  setOrgContacts,
  addOrgContactOptimistic,
  removeOrgContactOptimistic,
  setPrimaryContactOptimistic,
  type OrgRecord,
  type OrgContact,
} from '@/store/slices/organizationsSlice';
import { type PropertyItem, type ContactFormData } from './types';

interface UseOrgDrawersParams {
  dispatch: any;
  orgContacts: Record<string, OrgContact[]>;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchOrganizations: () => void;
  setMenuPosition: (pos: any) => void;
}

export function useOrgDrawers({
  dispatch,
  orgContacts,
  showToast,
  fetchOrganizations,
  setMenuPosition,
}: UseOrgDrawersParams) {
  // Properties Drawer & Assign Modal
  const [showPropertiesDrawer, setShowPropertiesDrawer] = useState(false);
  const [selectedOrgForProps, setSelectedOrgForProps] = useState<OrgRecord | null>(null);
  const [orgPropertiesList, setOrgPropertiesList] = useState<PropertyItem[]>([]);
  const [loadingOrgProps, setLoadingOrgProps] = useState(false);
  const [showAssignPropModal, setShowAssignPropModal] = useState(false);
  const [allAvailableProps, setAllAvailableProps] = useState<PropertyItem[]>([]);
  const [loadingAvailableProps, setLoadingAvailableProps] = useState(false);
  const [selectedPropToAssign, setSelectedPropToAssign] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Contacts Drawer & Add Contact Modal
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedOrgForContacts, setSelectedOrgForContacts] = useState<OrgRecord | null>(null);
  const [loadingOrgContacts, setLoadingOrgContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Delete Contact Confirmation Modal
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Properties Drawer
  const handleOpenProperties = async (org: OrgRecord) => {
    setSelectedOrgForProps(org);
    setShowPropertiesDrawer(true);
    setMenuPosition(null);
    setLoadingOrgProps(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/properties`);
      const json = await res.json();
      if (json.success) {
        setOrgPropertiesList(json.data || []);
      }
    } catch (err) {
      console.error('Error loading org properties:', err);
    } finally {
      setLoadingOrgProps(false);
    }
  };

  const handleOpenAssignModal = async () => {
    setShowAssignPropModal(true);
    setLoadingAvailableProps(true);
    try {
      const res = await fetch('/api/admin/properties?status=ACTIVE&limit=100');
      const json = await res.json();
      if (json.success) {
        const unassigned = (json.data || []).filter(
          (p: any) => !p.organization_id || p.organization_id === selectedOrgForProps?.id
        );
        setAllAvailableProps(unassigned);
        if (unassigned.length > 0) {
          setSelectedPropToAssign(unassigned[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching available properties:', err);
    } finally {
      setLoadingAvailableProps(false);
    }
  };

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForProps || !selectedPropToAssign) return;
    setAssigningLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForProps.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to assign property');
      }
      showToast('Property assigned to organization.');
      setShowAssignPropModal(false);
      handleOpenProperties(selectedOrgForProps);
      fetchOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Error assigning property', 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  // Contacts Drawer
  const handleOpenContacts = async (org: OrgRecord) => {
    setSelectedOrgForContacts(org);
    setShowContactsDrawer(true);
    setMenuPosition(null);
    setLoadingOrgContacts(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/contacts`);
      const json = await res.json();
      if (json.success) {
        dispatch(setOrgContacts({ orgId: org.id, contacts: json.data || [] }));
      }
    } catch (err) {
      console.error('Error loading org contacts:', err);
    } finally {
      setLoadingOrgContacts(false);
    }
  };

  const currentOrgContactsList = selectedOrgForContacts
    ? orgContacts[selectedOrgForContacts.id] || []
    : [];

  const handleConfirmDeleteContact = async () => {
    if (!selectedOrgForContacts || !contactToDelete) return;
    setDeletingContact(true);

    const contactId = contactToDelete.id;
    dispatch(removeOrgContactOptimistic({ orgId: selectedOrgForContacts.id, contactId }));
    setContactToDelete(null);
    showToast('Contact removed successfully.');

    try {
      const res = await fetch(
        `/api/admin/organizations/${selectedOrgForContacts.id}/contacts?member_id=${contactId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
      if (selectedOrgForContacts) handleOpenContacts(selectedOrgForContacts);
    } finally {
      setDeletingContact(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForContacts) return;
    setSavingContact(true);

    const newContact: OrgContact = {
      id: `temp-${Date.now()}`,
      name: contactFormData.full_name.trim(),
      email: contactFormData.email.trim(),
      phone: contactFormData.phone_number.trim() || '—',
      role: contactFormData.is_primary ? 'ADMIN' : 'USER',
      is_primary: contactFormData.is_primary,
      status: 'ACTIVE',
    };

    dispatch(addOrgContactOptimistic({ orgId: selectedOrgForContacts.id, contact: newContact }));
    if (contactFormData.is_primary) {
      dispatch(
        setPrimaryContactOptimistic({
          orgId: selectedOrgForContacts.id,
          contactId: newContact.id,
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone,
        })
      );
    }

    setShowAddContactModal(false);
    setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
    showToast('Contact added successfully.');

    try {
      const res = await fetch(`/api/admin/organizations/${selectedOrgForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add contact');
      }
      if (json.data && selectedOrgForContacts) {
        handleOpenContacts(selectedOrgForContacts);
      }
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
      if (selectedOrgForContacts) handleOpenContacts(selectedOrgForContacts);
    } finally {
      setSavingContact(false);
    }
  };

  return {
    showPropertiesDrawer,
    setShowPropertiesDrawer,
    selectedOrgForProps,
    orgPropertiesList,
    loadingOrgProps,
    showAssignPropModal,
    setShowAssignPropModal,
    allAvailableProps,
    loadingAvailableProps,
    selectedPropToAssign,
    setSelectedPropToAssign,
    assigningLoading,
    showContactsDrawer,
    setShowContactsDrawer,
    selectedOrgForContacts,
    loadingOrgContacts,
    showAddContactModal,
    setShowAddContactModal,
    contactFormData,
    setContactFormData,
    savingContact,
    contactToDelete,
    setContactToDelete,
    deletingContact,
    handleOpenProperties,
    handleOpenAssignModal,
    handleAssignPropertySubmit,
    handleOpenContacts,
    currentOrgContactsList,
    handleConfirmDeleteContact,
    handleAddContactSubmit,
  };
}
