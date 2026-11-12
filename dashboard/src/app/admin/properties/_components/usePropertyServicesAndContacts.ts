'use client';

import { useState } from 'react';
import { PropertyItem } from '@/store/slices/propertiesSlice';
import {
  ContactItem,
  AssignedServiceItem,
  AvailableServiceOption,
} from './types';

interface UsePropertyServicesAndContactsProps {
  loadData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePropertyServicesAndContacts({
  loadData,
  showToast,
}: UsePropertyServicesAndContactsProps) {
  // View Services Modal
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedPropForServices, setSelectedPropForServices] = useState<PropertyItem | null>(null);
  const [propServicesList, setPropServicesList] = useState<AssignedServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Assign Service Modal
  const [showAssignServiceModal, setShowAssignServiceModal] = useState(false);
  const [selectedPropForAssign, setSelectedPropForAssign] = useState<PropertyItem | null>(null);
  const [availableServices, setAvailableServices] = useState<AvailableServiceOption[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState('');
  const [assigningService, setAssigningService] = useState(false);

  // Manage Contacts Drawer
  const [showContactsDrawer, setShowContactsDrawer] = useState(false);
  const [selectedPropForContacts, setSelectedPropForContacts] = useState<PropertyItem | null>(null);
  const [contactsList, setContactsList] = useState<ContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'Property Contact',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<ContactItem | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Assign to Organization Modal State
  const [showAssignOrgModal, setShowAssignOrgModal] = useState(false);
  const [selectedPropForAssignOrg, setSelectedPropForAssignOrg] = useState<PropertyItem | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [assigningOrgLoading, setAssigningOrgLoading] = useState(false);

  // Assign to Org Handler
  const handleAssignOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForAssignOrg || !targetOrgId) return;
    setAssigningOrgLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${targetOrgId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropForAssignOrg.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to assign property to organization');
      }
      showToast('Success', 'Property assigned to organization successfully.');
      setShowAssignOrgModal(false);
      setSelectedPropForAssignOrg(null);
      setTargetOrgId('');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to assign organization', 'error');
    } finally {
      setAssigningOrgLoading(false);
    }
  };

  // Unassign from Org Handler
  const handleUnassignFromOrg = async (prop: PropertyItem) => {
    const orgId = prop.primary_organization?.id || prop.organizations?.[0]?.id;
    if (!orgId) return;
    if (!confirm(`Are you sure you want to unassign "${prop.name}" from ${prop.primary_organization?.name || 'its organization'}?`)) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties?propertyId=${prop.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to unassign property');
      }
      showToast('Success', 'Property unassigned from organization.');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to unassign', 'error');
    }
  };

  // Contacts Handlers
  const handleOpenContactsDrawer = async (prop: PropertyItem) => {
    setSelectedPropForContacts(prop);
    setShowContactsDrawer(true);
    setLoadingContacts(true);

    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/contacts`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setContactsList(result.data);
      } else {
        setContactsList([]);
      }
    } catch {
      setContactsList([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForContacts) return;

    if (!contactFormData.full_name.trim() || !contactFormData.email.trim()) {
      showToast('Validation', 'Full Name and Email are required.', 'error');
      return;
    }

    try {
      setSavingContact(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForContacts.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to add contact.');

      showToast('Contact Saved', `${contactFormData.full_name} saved successfully.`, 'success');
      setShowAddContactModal(false);

      if (result.data) {
        setContactsList((prev) => [
          result.data,
          ...prev.filter((c) => c.id !== result.data.id && (!result.data.is_primary || !c.is_primary)),
        ]);
      }

      setContactFormData({
        full_name: '',
        email: '',
        phone_number: '',
        role: 'Property Contact',
        is_primary: false,
      });

      handleOpenContactsDrawer(selectedPropForContacts);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const handleConfirmDeleteContact = async () => {
    if (!selectedPropForContacts || !contactToDelete) return;

    try {
      setDeletingContact(true);
      const res = await fetch(
        `/api/admin/properties/${selectedPropForContacts.id}/contacts?contactId=${contactToDelete.id}`,
        { method: 'DELETE' }
      );

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to remove contact.');

      setContactsList((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      showToast('Contact Removed', `${contactToDelete.name} was removed.`, 'success');
      setContactToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeletingContact(false);
    }
  };

  // View Services Handlers
  const handleOpenServicesModal = async (prop: PropertyItem) => {
    setSelectedPropForServices(prop);
    setShowServicesModal(true);
    setLoadingServices(true);

    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/services`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setPropServicesList(result.data);
      } else {
        setPropServicesList([]);
      }
    } catch {
      setPropServicesList([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleUnassignService = async (serviceId: string) => {
    if (!selectedPropForServices) return;

    try {
      const res = await fetch(
        `/api/admin/properties/${selectedPropForServices.id}/services?serviceId=${serviceId}`,
        { method: 'DELETE' }
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign service.');

      const removedSvc = propServicesList.find((s) => s.id === serviceId);
      const svcPrice = Number(removedSvc?.price || 0);
      setPropServicesList((prev) => prev.filter((s) => s.id !== serviceId));
      showToast('Service Unassigned', `Service unassigned. Monthly price reduced by $${svcPrice.toFixed(2)}.`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // Assign Service Handlers
  const handleOpenAssignServiceModal = async (prop: PropertyItem) => {
    setSelectedPropForAssign(prop);
    setSelectedServiceToAssign('');
    setShowAssignServiceModal(true);

    try {
      const res = await fetch('/api/admin/services?limit=100');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setAvailableServices(
          result.data.map((s: any) => ({
            id: s.id,
            phone_number: s.phone_number,
            service_type: s.service_type || 'Voice Trunk',
            price: Number(s.price || 0),
          }))
        );
      }
    } catch {
      setAvailableServices([]);
    }
  };

  const handleConfirmAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForAssign || !selectedServiceToAssign) {
      showToast('Validation', 'Please select a service to assign.', 'error');
      return;
    }

    try {
      setAssigningService(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForAssign.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedServiceToAssign }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign service.');

      showToast('Service Assigned', 'Service linked to property successfully.', 'success');
      setShowAssignServiceModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssigningService(false);
    }
  };

  return {
    showServicesModal,
    setShowServicesModal,
    selectedPropForServices,
    setSelectedPropForServices,
    propServicesList,
    loadingServices,
    showAssignServiceModal,
    setShowAssignServiceModal,
    selectedPropForAssign,
    setSelectedPropForAssign,
    availableServices,
    selectedServiceToAssign,
    setSelectedServiceToAssign,
    assigningService,
    showContactsDrawer,
    setShowContactsDrawer,
    selectedPropForContacts,
    setSelectedPropForContacts,
    contactsList,
    loadingContacts,
    showAddContactModal,
    setShowAddContactModal,
    contactFormData,
    setContactFormData,
    savingContact,
    contactToDelete,
    setContactToDelete,
    deletingContact,
    showAssignOrgModal,
    setShowAssignOrgModal,
    selectedPropForAssignOrg,
    setSelectedPropForAssignOrg,
    targetOrgId,
    setTargetOrgId,
    assigningOrgLoading,
    handleAssignOrgSubmit,
    handleUnassignFromOrg,
    handleOpenContactsDrawer,
    handleAddContactSubmit,
    handleConfirmDeleteContact,
    handleOpenServicesModal,
    handleUnassignService,
    handleOpenAssignServiceModal,
    handleConfirmAssignService,
  };
}

