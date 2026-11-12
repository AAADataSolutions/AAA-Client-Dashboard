'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Flame, ArrowUpDown } from 'lucide-react';
import type { PropertyOption } from './types';
import {
  isFireLineType,
  isElevatorLineType,
  INITIAL_SERVICE_FORM_DATA,
  type ServiceFormData,
} from './types';
import ProvisionLineFields from './ProvisionLineFields';

interface ProvisionServiceModalProps {
  showCreateModal: boolean;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
  availableServiceTypes: string[];
  propertyOptions: PropertyOption[];
}

export default function ProvisionServiceModal({
  showCreateModal,
  onClose,
  onSuccess,
  availableServiceTypes,
  propertyOptions,
}: ProvisionServiceModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_SERVICE_FORM_DATA);
  const [showCustomServiceId, setShowCustomServiceId] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const currentType = formData.is_custom_type
    ? formData.custom_type_input.trim()
    : formData.service_type_name;
  const isFire = isFireLineType(currentType);
  const isElevator = isElevatorLineType(currentType);

  const handleTypeSelect = (newType: string) => {
    const isFL = isFireLineType(newType);
    const isEL = isElevatorLineType(newType);
    let newId = formData.custom_service_id;
    if (!newId || newId.startsWith('SVC-') || newId.startsWith('FL-') || newId.startsWith('EL-')) {
      if (isFL) newId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
      else if (isEL) newId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
      else newId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    setFormData((prev) => ({
      ...prev,
      service_type_name: newType,
      custom_service_id: newId,
    }));
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeType = formData.is_custom_type ? formData.custom_type_input.trim() : formData.service_type_name;
    const isFL = isFireLineType(activeType);
    const isEL = isElevatorLineType(activeType);

    let serviceId = formData.custom_service_id.trim();
    if (!serviceId) {
      if (isFL) serviceId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
      else if (isEL) serviceId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
      else serviceId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
    } else if (serviceId.length < 6) {
      if (isFL || isEL) {
        serviceId = `${isFL ? 'FL' : 'EL'}-${Math.floor(100000 + Math.random() * 900000)}`;
      } else {
        setFormError('Service ID is mandatory and must be at least 6 characters.');
        return;
      }
    }

    if (!formData.phone_number.trim()) {
      setFormError('Phone number is required.');
      return;
    }
    if (isFL && !formData.device_type.trim()) {
      setFormError('Device Type is required for Fire Lines.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      let serviceName = formData.service_name.trim();
      if (!serviceName) {
        if (isFL) serviceName = formData.device_type.trim() || `Fire Line ${formData.phone_number.trim()}`;
        else if (isEL) serviceName = formData.extension.trim() ? `Elevator - ${formData.extension.trim()}` : `Elevator Line ${formData.phone_number.trim()}`;
        else serviceName = `Service ${formData.phone_number.trim()}`;
      }

      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_service_id: serviceId,
          service_name: serviceName,
          phone_number: formData.phone_number.trim(),
          service_type_name: isFL ? 'Fire Lines' : isEL ? 'Elevator Lines' : activeType,
          property_id: formData.property_id || null,
          description: formData.description.trim() || null,
          price: formData.price ? Math.max(0, parseFloat(formData.price)) : 0,
          status: formData.status,
          pbx_server_id: Number(formData.pbx_server_id) || 1,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create service.');
      const createdService = result.data;

      if (isFL) {
        try {
          await fetch('/api/admin/fire-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_type: formData.device_type.trim(),
              phone_number: formData.phone_number.trim(),
              serial_number: formData.serial_number.trim() || null,
              description: formData.description.trim() || null,
              property_id: formData.property_id || null,
              service_id: createdService?.id || null,
              price: formData.price ? Math.max(0, parseFloat(formData.price)) : 0,
            }),
          });
        } catch (fErr) {
          console.warn('Could not mirror to fire_lines:', fErr);
        }
      }

      if (isEL) {
        try {
          await fetch('/api/admin/elevator-lines', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: formData.phone_number.trim(),
              extension: formData.extension.trim() || null,
              description: formData.description.trim() || null,
              status: 'ACTIVE',
              property_id: formData.property_id || null,
              service_id: createdService?.id || null,
              price: formData.price ? Math.max(0, parseFloat(formData.price)) : 0,
            }),
          });
        } catch (eErr) {
          console.warn('Could not mirror to elevator_lines:', eErr);
        }
      }

      const successTitle = isFL ? 'Fire Line Created' : isEL ? 'Elevator Line Created' : 'Service Provisioned';
      const successMsg = isFL
        ? `Fire line ${formData.phone_number} created in Services & Fire Lines.`
        : isEL
        ? `Elevator line ${formData.phone_number} created in Services & Elevator Lines.`
        : `${serviceId} (${formData.phone_number}) created successfully.`;

      setFormData(INITIAL_SERVICE_FORM_DATA);
      setShowCustomServiceId(false);
      onClose();
      onSuccess(successTitle, successMsg);
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {isFire ? (
                  <Flame className="w-5 h-5 text-orange-500" />
                ) : isElevator ? (
                  <ArrowUpDown className="w-5 h-5 text-purple-600" />
                ) : (
                  <Plus className="w-4 h-4 text-blue-600" />
                )}
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isFire
                    ? 'Add Fire Line'
                    : isElevator
                    ? 'Add Elevator Line'
                    : 'Provision New Service'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {isFire || isElevator ? (
                <ProvisionLineFields
                  isFire={isFire}
                  isElevator={isElevator}
                  formData={formData}
                  setFormData={setFormData}
                  availableServiceTypes={availableServiceTypes}
                  propertyOptions={propertyOptions}
                  showCustomServiceId={showCustomServiceId}
                  setShowCustomServiceId={setShowCustomServiceId}
                  onTypeSelect={handleTypeSelect}
                />
              ) : (
                /* Standard Provision New Service */
                <>
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">
                      Service ID <span className="text-rose-500">* (Min 6 chars)</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={6}
                      value={formData.custom_service_id}
                      onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
                      placeholder="e.g. SVC-MIA-001"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">Service Name</label>
                      <input
                        type="text"
                        value={formData.service_name}
                        onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                        placeholder="e.g. Main Lobby Line"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">
                        Phone Number / DID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-black dark:text-white block">Service Type</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_custom_type: !formData.is_custom_type })}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        {formData.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
                      </button>
                    </div>

                    {formData.is_custom_type ? (
                      <input
                        type="text"
                        required
                        value={formData.custom_type_input}
                        onChange={(e) => setFormData({ ...formData, custom_type_input: e.target.value })}
                        placeholder="Enter new custom service type..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <select
                        value={formData.service_type_name}
                        onChange={(e) => handleTypeSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        {availableServiceTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">Attach to Property</label>
                      <select
                        value={formData.property_id}
                        onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {propertyOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.organization_name ? `(${p.organization_name})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">Monthly Price ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400 font-semibold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">
                      FreePBX Cluster Server (`server_id` for DID &amp; Call Forwarding)
                    </label>
                    <select
                      value={formData.pbx_server_id}
                      onChange={(e) => setFormData({ ...formData, pbx_server_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value={1}>Server 1 — PBX 115 (Primary)</option>
                      <option value={2}>Server 2 — PBX 142 (Secondary)</option>
                      <option value={3}>Server 3 — PBX 240 (Tertiary)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. Primary inbound DID for front desk operations"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {formLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isFire ? (
                    'Save Fire Line'
                  ) : isElevator ? (
                    'Save Elevator Line'
                  ) : (
                    'Provision Service'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
