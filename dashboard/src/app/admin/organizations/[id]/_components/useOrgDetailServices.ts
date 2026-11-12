'use client';

import React, { useState } from 'react';
import { type OrgDetail } from './types';

interface UseOrgDetailServicesParams {
  orgId: string;
  org: OrgDetail | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchOrgDetails: () => Promise<void>;
  fetchOrgProperties: () => Promise<void>;
}

export function useOrgDetailServices({
  orgId,
  org,
  showToast,
  fetchOrgDetails,
  fetchOrgProperties,
}: UseOrgDetailServicesParams) {
  // 2-Tab Assign Service Modal
  const [showAssignServiceModal, setShowAssignServiceModal] = useState(false);
  const [assignServiceTab, setAssignServiceTab] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [targetPropertyForService, setTargetPropertyForService] = useState<string>('');
  const [availableUnassignedServices, setAvailableUnassignedServices] = useState<any[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState<string>('');
  const [loadingUnassignedServices, setLoadingUnassignedServices] = useState(false);
  const [serviceTypesList, setServiceTypesList] = useState<any[]>([]);
  const [newServiceForm, setNewServiceForm] = useState({
    service_name: '',
    phone_number: '',
    service_type: 'Voice Trunk / DID',
    description: '',
    status: 'ACTIVE',
  });
  const [savingService, setSavingService] = useState(false);

  // Services & Lines 3-Dots Action Menu
  const [activeServiceMenu, setActiveServiceMenu] = useState<{
    srv: any;
    bottom: number;
    left: number;
  } | null>(null);

  // Services Action 1: Edit Service
  const [editingServiceTarget, setEditingServiceTarget] = useState<any | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({
    phone_number: '',
    service_type: 'Voice Line',
    status: 'ACTIVE',
    description: '',
  });
  const [savingEditService, setSavingEditService] = useState(false);

  // Services Action 2: View Details
  const [viewingServiceDetails, setViewingServiceDetails] = useState<any | null>(null);

  // Services Action 3: Assign to Property
  const [assignServiceToPropTarget, setAssignServiceToPropTarget] = useState<any | null>(null);
  const [selectedPropForService, setSelectedPropForService] = useState<string>('');
  const [savingAssignServiceToProp, setSavingAssignServiceToProp] = useState(false);

  // Services Action 4: Delete Service
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<any | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  // 2-Tab Assign Service Modal Functions
  const handleOpenAssignServiceModal = async (defaultProp?: any) => {
    setShowAssignServiceModal(true);
    setAssignServiceTab('EXISTING');
    if (defaultProp?.id) {
      setTargetPropertyForService(defaultProp.id);
    } else if (org?.properties && org.properties.length > 0) {
      setTargetPropertyForService(org.properties[0].id);
    }
    setLoadingUnassignedServices(true);
    try {
      const [srvRes, typesRes] = await Promise.all([
        fetch('/api/admin/services?limit=200'),
        fetch('/api/admin/service-types'),
      ]);
      const srvJson = await srvRes.json();
      const typesJson = await typesRes.json();
      if (srvJson.success) {
        const unassigned = (srvJson.data || []).filter(
          (s: any) => s.is_unassigned || !s.attached_property_name || s.attached_property_name === 'Unassigned'
        );
        setAvailableUnassignedServices(unassigned);
        if (unassigned.length > 0) setSelectedServiceToAssign(unassigned[0].id);
      }
      if (typesJson.success) {
        setServiceTypesList(typesJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching data for assign service:', err);
    } finally {
      setLoadingUnassignedServices(false);
    }
  };

  const handleAssignExistingServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPropertyForService || !selectedServiceToAssign) return;
    setSavingService(true);
    try {
      const res = await fetch(`/api/admin/properties/${targetPropertyForService}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedServiceToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign service');
      showToast('Service assigned to property successfully.');
      setShowAssignServiceModal(false);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error assigning service', 'error');
    } finally {
      setSavingService(false);
    }
  };

  const handleCreateNewServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPropertyForService || !newServiceForm.phone_number) return;
    setSavingService(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newServiceForm,
          property_id: targetPropertyForService,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create service');
      showToast('Service created and assigned to property.');
      setShowAssignServiceModal(false);
      setNewServiceForm({
        service_name: '',
        phone_number: '',
        service_type: 'Voice Trunk / DID',
        description: '',
        status: 'ACTIVE',
      });
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error creating service', 'error');
    } finally {
      setSavingService(false);
    }
  };

  // Service Action 1 Handler: Open Edit Service
  const handleOpenEditService = (srv: any) => {
    setEditingServiceTarget(srv);
    setEditServiceForm({
      phone_number: srv.phone_number || '',
      service_type: srv.service_type || 'Voice Line',
      status: srv.status || 'ACTIVE',
      description: srv.description || '',
    });
  };

  // Service Action 1 Handler: Save Edit Service
  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceTarget) return;
    setSavingEditService(true);
    try {
      const res = await fetch(`/api/admin/services/${editingServiceTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editServiceForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update service');
      showToast('Service details updated successfully.');
      setEditingServiceTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating service', 'error');
    } finally {
      setSavingEditService(false);
    }
  };

  // Service Action 3 Handler: Open Assign to Property
  const handleOpenAssignServiceToProp = (srv: any) => {
    setAssignServiceToPropTarget(srv);
    const initialPropId = srv.property_id || (org?.properties && org.properties[0]?.id) || '';
    setSelectedPropForService(initialPropId);
  };

  // Service Action 3 Handler: Save Assign to Property
  const handleSaveAssignServiceToProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignServiceToPropTarget || !selectedPropForService) return;
    setSavingAssignServiceToProp(true);
    try {
      const res = await fetch(`/api/admin/services/${assignServiceToPropTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropForService }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to reassign service');
      showToast('Service assigned to property successfully.');
      setAssignServiceToPropTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error assigning service', 'error');
    } finally {
      setSavingAssignServiceToProp(false);
    }
  };

  // Service Action 4 Handler: Delete Service
  const handleDeleteServiceSubmit = async () => {
    if (!deleteServiceTarget) return;
    setDeletingService(true);
    try {
      const res = await fetch(`/api/admin/services/${deleteServiceTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete service');
      showToast(`Service "${deleteServiceTarget.phone_number}" deleted.`);
      setDeleteServiceTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error deleting service', 'error');
    } finally {
      setDeletingService(false);
    }
  };

  return {
    showAssignServiceModal,
    setShowAssignServiceModal,
    assignServiceTab,
    setAssignServiceTab,
    targetPropertyForService,
    setTargetPropertyForService,
    availableUnassignedServices,
    selectedServiceToAssign,
    setSelectedServiceToAssign,
    loadingUnassignedServices,
    serviceTypesList,
    newServiceForm,
    setNewServiceForm,
    savingService,
    activeServiceMenu,
    setActiveServiceMenu,
    editingServiceTarget,
    setEditingServiceTarget,
    editServiceForm,
    setEditServiceForm,
    savingEditService,
    viewingServiceDetails,
    setViewingServiceDetails,
    assignServiceToPropTarget,
    setAssignServiceToPropTarget,
    selectedPropForService,
    setSelectedPropForService,
    savingAssignServiceToProp,
    deleteServiceTarget,
    setDeleteServiceTarget,
    deletingService,
    handleOpenAssignServiceModal,
    handleAssignExistingServiceSubmit,
    handleCreateNewServiceSubmit,
    handleOpenEditService,
    handleSaveEditService,
    handleOpenAssignServiceToProp,
    handleSaveAssignServiceToProp,
    handleDeleteServiceSubmit,
  };
}
