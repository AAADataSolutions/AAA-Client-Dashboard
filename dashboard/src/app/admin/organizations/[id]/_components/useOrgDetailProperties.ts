'use client';

import React, { useState } from 'react';

interface UseOrgDetailPropertiesParams {
  orgId: string;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchOrgDetails: () => Promise<void>;
  fetchOrgProperties: () => Promise<void>;
}

export function useOrgDetailProperties({
  orgId,
  showToast,
  fetchOrgDetails,
  fetchOrgProperties,
}: UseOrgDetailPropertiesParams) {
  // Assign Property Modal
  const [showAssignPropModal, setShowAssignPropModal] = useState(false);
  const [availableProps, setAvailableProps] = useState<any[]>([]);
  const [selectedPropToAssign, setSelectedPropToAssign] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Unassign Property Confirmation Modal
  const [unassignTarget, setUnassignTarget] = useState<{ propertyId: string; name: string } | null>(null);
  const [unassigningLoading, setUnassigningLoading] = useState(false);

  // Property Actions: View Details, View Services, Change Status, Manage Contacts
  const [viewingPropDetails, setViewingPropDetails] = useState<any | null>(null);
  const [viewingPropServices, setViewingPropServices] = useState<{ propName: string; services: any[] } | null>(null);
  const [loadingPropServices, setLoadingPropServices] = useState(false);
  const [statusPropTarget, setStatusPropTarget] = useState<any | null>(null);
  const [savingPropStatus, setSavingPropStatus] = useState(false);

  // Property Action 7: Edit Property Settings
  const [editingPropSettingsTarget, setEditingPropSettingsTarget] = useState<any | null>(null);
  const [editPropSettingsForm, setEditPropSettingsForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    main_phone: '',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    monthly_price: '' as string | number,
    ray_baum_status: 'Active',
    status: 'ACTIVE',
  });
  const [savingPropSettings, setSavingPropSettings] = useState(false);

  // Property Action 8: Delete Property
  const [deletePropTarget, setDeletePropTarget] = useState<any | null>(null);
  const [deletingProp, setDeletingProp] = useState(false);

  // Property Three-Dots Action Menu (Opens ABOVE)
  const [activePropMenu, setActivePropMenu] = useState<{
    prop: any;
    bottom: number;
    left: number;
  } | null>(null);

  // Property Contacts Modal
  const [propContactsTarget, setPropContactsTarget] = useState<any | null>(null);
  const [propContactsList, setPropContactsList] = useState<any[]>([]);
  const [loadingPropContacts, setLoadingPropContacts] = useState(false);
  const [showAddPropContactForm, setShowAddPropContactForm] = useState(false);
  const [newPropContact, setNewPropContact] = useState({ name: '', email: '', phone: '', role: 'Property Manager' });
  const [savingPropContact, setSavingPropContact] = useState(false);

  // Open Assign Property Modal (Strictly Unassigned Properties Only per Rule 4)
  const handleOpenAssignModal = async () => {
    setShowAssignPropModal(true);
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const json = await res.json();
      if (json.success) {
        const unassigned = (json.data || []).filter(
          (p: any) => (!p.organizations || p.organizations.length === 0) && (!p.organizations_count || p.organizations_count === 0)
        );
        setAvailableProps(unassigned);
        if (unassigned.length > 0) setSelectedPropToAssign(unassigned[0].id);
      }
    } catch (err) {
      console.error('Error fetching available properties:', err);
    }
  };

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropToAssign) return;
    setAssigningLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign property');

      showToast('Property assigned successfully.');
      setShowAssignPropModal(false);
      fetchOrgProperties();
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error assigning property', 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  // Confirm Unassign Property
  const handleConfirmUnassign = async () => {
    if (!unassignTarget) return;
    setUnassigningLoading(true);
    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/properties?propertyId=${unassignTarget.propertyId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to unassign property');

      showToast('Property unassigned from organization.');
      setUnassignTarget(null);
      fetchOrgProperties();
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error unassigning property', 'error');
    } finally {
      setUnassigningLoading(false);
    }
  };

  // View Services for Property
  const handleViewPropertyServices = async (prop: any) => {
    setLoadingPropServices(true);
    setViewingPropServices({ propName: prop.name, services: [] });
    try {
      const res = await fetch(`/api/admin/services?limit=100`);
      const json = await res.json();
      if (json.success) {
        const matching = (json.data || []).filter(
          (s: any) => s.attached_property_name === prop.name || s.attached_property_id === prop.id
        );
        setViewingPropServices({ propName: prop.name, services: matching });
      }
    } catch (err) {
      console.error('Error fetching property services:', err);
    } finally {
      setLoadingPropServices(false);
    }
  };

  // Change Property Status
  const handleSavePropertyStatus = async (newStatus: string) => {
    if (!statusPropTarget) return;
    setSavingPropStatus(true);
    try {
      const res = await fetch(`/api/admin/properties/${statusPropTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update property status');

      showToast(`Property status updated to ${newStatus}.`);
      setStatusPropTarget(null);
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setSavingPropStatus(false);
    }
  };

  // Property Contacts Functions
  const handleOpenPropertyContacts = async (prop: any) => {
    setPropContactsTarget(prop);
    setLoadingPropContacts(true);
    setShowAddPropContactForm(false);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/contacts`);
      const json = await res.json();
      if (json.success) {
        setPropContactsList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching property contacts:', err);
    } finally {
      setLoadingPropContacts(false);
    }
  };

  const handleAddPropContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propContactsTarget || !newPropContact.name) return;
    setSavingPropContact(true);
    try {
      const res = await fetch(`/api/admin/properties/${propContactsTarget.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPropContact),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add contact');
      showToast('Contact added to property.');
      setShowAddPropContactForm(false);
      setNewPropContact({ name: '', email: '', phone: '', role: 'Property Manager' });
      handleOpenPropertyContacts(propContactsTarget);
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
    } finally {
      setSavingPropContact(false);
    }
  };

  const handleDeletePropContact = async (contactId: string) => {
    if (!propContactsTarget) return;
    try {
      const res = await fetch(`/api/admin/properties/${propContactsTarget.id}/contacts?contact_id=${contactId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
      showToast('Contact removed from property.');
      handleOpenPropertyContacts(propContactsTarget);
    } catch (err: any) {
      showToast(err.message || 'Error deleting contact', 'error');
    }
  };

  // Property Action 7 Handler: Open Edit Settings
  const handleOpenEditPropertySettings = (prop: any) => {
    setEditingPropSettingsTarget(prop);
    setEditPropSettingsForm({
      name: prop.name || '',
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      zip_code: prop.zip_code || '',
      main_phone: prop.main_phone && prop.main_phone !== '—' ? prop.main_phone : '',
      general_manager_name: prop.general_manager_name && prop.general_manager_name !== '—' ? prop.general_manager_name : '',
      general_manager_phone: prop.general_manager_phone && prop.general_manager_phone !== '—' ? prop.general_manager_phone : '',
      general_manager_email: prop.general_manager_email && prop.general_manager_email !== '—' ? prop.general_manager_email : '',
      monthly_price: prop.monthly_price ?? '',
      ray_baum_status: prop.ray_baum_status === 'Active' ? 'Active' : 'Inactive',
      status: prop.status || 'ACTIVE',
    });
  };

  // Property Action 7 Handler: Save Property Settings
  const handleSavePropertySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropSettingsTarget) return;
    setSavingPropSettings(true);
    try {
      const res = await fetch(`/api/admin/properties/${editingPropSettingsTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPropSettingsForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update property settings');
      showToast('Property settings saved successfully.');
      setEditingPropSettingsTarget(null);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error updating property', 'error');
    } finally {
      setSavingPropSettings(false);
    }
  };

  // Property Action 8 Handler: Delete Property
  const handleDeletePropertySubmit = async () => {
    if (!deletePropTarget) return;
    setDeletingProp(true);
    try {
      const res = await fetch(`/api/admin/properties/${deletePropTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete property');
      showToast(`Property "${deletePropTarget.name}" deleted.`);
      setDeletePropTarget(null);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error deleting property', 'error');
    } finally {
      setDeletingProp(false);
    }
  };

  return {
    showAssignPropModal,
    setShowAssignPropModal,
    availableProps,
    selectedPropToAssign,
    setSelectedPropToAssign,
    assigningLoading,
    unassignTarget,
    setUnassignTarget,
    unassigningLoading,
    viewingPropDetails,
    setViewingPropDetails,
    viewingPropServices,
    setViewingPropServices,
    loadingPropServices,
    statusPropTarget,
    setStatusPropTarget,
    savingPropStatus,
    editingPropSettingsTarget,
    setEditingPropSettingsTarget,
    editPropSettingsForm,
    setEditPropSettingsForm,
    savingPropSettings,
    deletePropTarget,
    setDeletePropTarget,
    deletingProp,
    activePropMenu,
    setActivePropMenu,
    propContactsTarget,
    setPropContactsTarget,
    propContactsList,
    loadingPropContacts,
    showAddPropContactForm,
    setShowAddPropContactForm,
    newPropContact,
    setNewPropContact,
    savingPropContact,
    handleOpenAssignModal,
    handleAssignPropertySubmit,
    handleConfirmUnassign,
    handleViewPropertyServices,
    handleSavePropertyStatus,
    handleOpenPropertyContacts,
    handleAddPropContact,
    handleDeletePropContact,
    handleOpenEditPropertySettings,
    handleSavePropertySettings,
    handleDeletePropertySubmit,
  };
}
