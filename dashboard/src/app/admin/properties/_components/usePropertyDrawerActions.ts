'use client';

import { useState, useEffect, useMemo } from 'react';
import { PropertyItem, PropertyRecord } from '@/store/slices/propertiesSlice';
import {
  DrawerTabType,
  ServiceCreateFormData,
  isFireLineSvcType,
  isElevatorLineSvcType,
} from './types';

interface UsePropertyDrawerActionsProps {
  loadData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePropertyDrawerActions({
  loadData,
  showToast,
}: UsePropertyDrawerActionsProps) {
  // Comprehensive Property Side Modal (Drawer)
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<PropertyRecord | null>(null);
  const [propertyDrawerData, setPropertyDrawerData] = useState<any>(null);
  const [loadingDrawerData, setLoadingDrawerData] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTabType>('OVERVIEW');
  const [drawerAssignServiceId, setDrawerAssignServiceId] = useState('');
  const [assigningServiceInDrawer, setAssigningServiceInDrawer] = useState(false);
  const [unassigningServiceId, setUnassigningServiceId] = useState<string | null>(null);

  // Create New Service Directly From Property Drawer
  const [showCreateServiceInDrawerModal, setShowCreateServiceInDrawerModal] = useState(false);
  const [creatingServiceInDrawer, setCreatingServiceInDrawer] = useState(false);
  const [serviceCreateError, setServiceCreateError] = useState<string | null>(null);
  const [showCustomSvcIdInDrawer, setShowCustomSvcIdInDrawer] = useState(false);
  const [dynamicServiceTypes, setDynamicServiceTypes] = useState<string[]>([]);
  const [serviceCreateForm, setServiceCreateForm] = useState<ServiceCreateFormData>({
    custom_service_id: '',
    service_name: '',
    phone_number: '',
    service_type_name: 'Direct Inward Dial (DID)',
    custom_type_input: '',
    is_custom_type: false,
    property_id: '',
    description: '',
    price: '',
    status: 'ACTIVE',
    device_type: '',
    serial_number: '',
    extension: '',
    pbx_server_id: 1,
  });

  // Load dynamic service types for Drawer Service Creation Modal
  useEffect(() => {
    async function loadSvcTypes() {
      try {
        const res = await fetch('/api/admin/service-types');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDynamicServiceTypes(json.data.map((t: any) => t.name).filter(Boolean));
        }
      } catch {
        // ignore
      }
    }
    loadSvcTypes();
  }, []);

  const availableDrawerServiceTypes = useMemo(() => {
    const defaults = [
      'Direct Inward Dial (DID)',
      'Fire Lines',
      'Elevator Lines',
      'SIP Trunk - 100 Channels',
      'Toll-Free 800 Route',
      'Analog Emergency FXS',
      'Cloud PBX Extension',
      'Ray Baum Dedicated E911',
    ];
    const set = new Set<string>(defaults);
    dynamicServiceTypes.forEach((d) => {
      if (d && d.trim()) set.add(d.trim());
    });
    return Array.from(set);
  }, [dynamicServiceTypes]);

  const handleOpenPropertyDrawer = async (prop: PropertyRecord | PropertyItem) => {
    setSelectedPropForDrawer(prop as PropertyRecord);
    setShowPropertyDrawer(true);
    setDrawerTab('OVERVIEW');
    setLoadingDrawerData(true);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/details`);
      const result = await res.json();
      if (result.success && result.data) {
        setPropertyDrawerData(result.data);
      } else {
        setPropertyDrawerData(null);
      }
    } catch (err) {
      console.error('Failed to load property details', err);
      setPropertyDrawerData(null);
    } finally {
      setLoadingDrawerData(false);
    }
  };

  const refreshDrawerData = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/details`);
      const result = await res.json();
      if (result.success && result.data) {
        setPropertyDrawerData(result.data);
      }
    } catch (err) {
      console.error('Failed to refresh drawer data', err);
    }
  };

  const handleDrawerAssignService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForDrawer || !drawerAssignServiceId) return;

    try {
      setAssigningServiceInDrawer(true);
      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: drawerAssignServiceId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign service');

      showToast('Service Assigned', 'Service linked to property successfully.', 'success');
      setDrawerAssignServiceId('');
      await refreshDrawerData(selectedPropForDrawer.id);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAssigningServiceInDrawer(false);
    }
  };

  const handleDrawerUnassignService = async (serviceId: string, serviceName: string) => {
    if (!selectedPropForDrawer) return;

    try {
      setUnassigningServiceId(serviceId);
      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/services?serviceId=${serviceId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to unassign service');

      showToast('Service Unassigned', `${serviceName || 'Service'} removed from property.`, 'success');
      await refreshDrawerData(selectedPropForDrawer.id);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setUnassigningServiceId(null);
    }
  };

  const handleOpenCreateServiceInDrawer = () => {
    if (!selectedPropForDrawer) return;
    setServiceCreateError(null);
    setShowCustomSvcIdInDrawer(false);
    setServiceCreateForm({
      custom_service_id: `SVC-${Math.floor(100000 + Math.random() * 900000)}`,
      service_name: '',
      phone_number: '',
      service_type_name: 'Direct Inward Dial (DID)',
      custom_type_input: '',
      is_custom_type: false,
      property_id: selectedPropForDrawer.id,
      description: '',
      price: '',
      status: 'ACTIVE',
      device_type: '',
      serial_number: '',
      extension: '',
      pbx_server_id: (selectedPropForDrawer as any).default_pbx_server_id || 1,
    });
    setShowCreateServiceInDrawerModal(true);
  };

  const handleCreateServiceInDrawerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropForDrawer) return;

    const activeType = serviceCreateForm.is_custom_type
      ? serviceCreateForm.custom_type_input.trim()
      : serviceCreateForm.service_type_name;

    const isFire = isFireLineSvcType(activeType);
    const isElevator = isElevatorLineSvcType(activeType);

    let serviceId = serviceCreateForm.custom_service_id.trim();
    if (!serviceId) {
      if (isFire) serviceId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
      else if (isElevator) serviceId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
      else serviceId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (serviceId.length < 6) {
      if (isFire || isElevator) {
        serviceId = `${isFire ? 'FL' : 'EL'}-${Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        setServiceCreateError('Service ID is mandatory and must be at least 6 characters.');
        return;
      }
    }

    if (!serviceCreateForm.phone_number.trim()) {
      setServiceCreateError('Phone number is required.');
      return;
    }

    if (isFire && !serviceCreateForm.device_type.trim()) {
      setServiceCreateError('Device Type is required for Fire Lines.');
      return;
    }

    try {
      setCreatingServiceInDrawer(true);
      setServiceCreateError(null);

      let serviceName = serviceCreateForm.service_name.trim();
      if (!serviceName) {
        if (isFire) {
          serviceName = serviceCreateForm.device_type.trim() || `Fire Line ${serviceCreateForm.phone_number.trim()}`;
        } else if (isElevator) {
          serviceName = serviceCreateForm.extension.trim()
            ? `Elevator - ${serviceCreateForm.extension.trim()}`
            : `Elevator Line ${serviceCreateForm.phone_number.trim()}`;
        } else {
          serviceName = `Service ${serviceCreateForm.phone_number.trim()}`;
        }
      }

      const targetPropId = serviceCreateForm.property_id || selectedPropForDrawer.id;

      // 1. Provision standard service via /api/admin/services
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_service_id: serviceId,
          service_name: serviceName,
          phone_number: serviceCreateForm.phone_number.trim(),
          service_type_name: isFire ? 'Fire Lines' : isElevator ? 'Elevator Lines' : activeType,
          property_id: targetPropId,
          description: serviceCreateForm.description.trim() || null,
          price: serviceCreateForm.price ? Math.max(0, parseFloat(serviceCreateForm.price)) : 0,
          status: serviceCreateForm.status,
          pbx_server_id: Number(serviceCreateForm.pbx_server_id) || 1,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create service.');

      const createdService = result.data;

      // 2. If Fire Line, also mirror to /api/admin/fire-lines
      if (isFire) {
        try {
          await fetch('/api/admin/fire-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_type: serviceCreateForm.device_type.trim(),
              phone_number: serviceCreateForm.phone_number.trim(),
              serial_number: serviceCreateForm.serial_number.trim() || null,
              description: serviceCreateForm.description.trim() || null,
              property_id: targetPropId,
              service_id: createdService?.id || null,
              price: serviceCreateForm.price ? Math.max(0, parseFloat(serviceCreateForm.price)) : 0,
            }),
          });
        } catch {
          // ignore mirror warning
        }
      }

      // 3. If Elevator Line, also mirror to /api/admin/elevator-lines
      if (isElevator) {
        try {
          await fetch('/api/admin/elevator-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: serviceCreateForm.phone_number.trim(),
              extension: serviceCreateForm.extension.trim() || null,
              description: serviceCreateForm.description.trim() || null,
              status: 'ACTIVE',
              property_id: targetPropId,
              service_id: createdService?.id || null,
              price: serviceCreateForm.price ? Math.max(0, parseFloat(serviceCreateForm.price)) : 0,
            }),
          });
        } catch {
          // ignore mirror warning
        }
      }

      showToast(
        isFire ? 'Fire Line Created' : isElevator ? 'Elevator Line Created' : 'Service Provisioned',
        `${serviceId} (${serviceCreateForm.phone_number}) created and linked to ${selectedPropForDrawer.name}.`,
        'success'
      );

      setShowCreateServiceInDrawerModal(false);
      await refreshDrawerData(selectedPropForDrawer.id);
      loadData();
    } catch (err: any) {
      setServiceCreateError(err.message || 'Failed to create service.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreatingServiceInDrawer(false);
    }
  };

  return {
    showPropertyDrawer,
    setShowPropertyDrawer,
    selectedPropForDrawer,
    setSelectedPropForDrawer,
    propertyDrawerData,
    setPropertyDrawerData,
    loadingDrawerData,
    drawerTab,
    setDrawerTab,
    drawerAssignServiceId,
    setDrawerAssignServiceId,
    assigningServiceInDrawer,
    unassigningServiceId,
    showCreateServiceInDrawerModal,
    setShowCreateServiceInDrawerModal,
    creatingServiceInDrawer,
    serviceCreateError,
    showCustomSvcIdInDrawer,
    setShowCustomSvcIdInDrawer,
    serviceCreateForm,
    setServiceCreateForm,
    availableDrawerServiceTypes,
    handleOpenPropertyDrawer,
    refreshDrawerData,
    handleDrawerAssignService,
    handleDrawerUnassignService,
    handleOpenCreateServiceInDrawer,
    handleCreateServiceInDrawerSubmit,
  };
}

