'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Edit2, X, Loader2 } from 'lucide-react';
import type { ServiceItem } from '@/store/slices/servicesSlice';
import type { ServiceFormData, PropertyOption } from './types';
import { INITIAL_SERVICE_FORM_DATA } from './types';

interface EditServiceModalProps {
  showEditModal: boolean;
  selectedServiceForEdit: ServiceItem | null;
  onClose: () => void;
  onSuccess: (title: string, message: string) => void;
  availableServiceTypes: string[];
  propertyOptions: PropertyOption[];
}

export default function EditServiceModal({
  showEditModal,
  selectedServiceForEdit,
  onClose,
  onSuccess,
  availableServiceTypes,
  propertyOptions,
}: EditServiceModalProps) {
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_SERVICE_FORM_DATA);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedServiceForEdit) {
      setFormData({
        custom_service_id: selectedServiceForEdit.custom_service_id || '',
        service_name: selectedServiceForEdit.service_name || '',
        phone_number: selectedServiceForEdit.phone_number || '',
        service_type_name: selectedServiceForEdit.service_type || 'Direct Inward Dial (DID)',
        custom_type_input: '',
        is_custom_type: false,
        property_id: selectedServiceForEdit.property_id || '',
        description: selectedServiceForEdit.description || '',
        price: selectedServiceForEdit.price !== undefined && selectedServiceForEdit.price !== null ? String(selectedServiceForEdit.price) : '0.00',
        status: (selectedServiceForEdit.status as any) || 'ACTIVE',
        device_type: '',
        serial_number: '',
        extension: '',
        pbx_server_id: Number((selectedServiceForEdit as any).pbx_server_id) || 1,
      });
      setFormError(null);
    }
  }, [selectedServiceForEdit]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForEdit) return;

    const serviceId = formData.custom_service_id.trim();
    if (!serviceId || serviceId.length < 6) {
      setFormError('Service ID is mandatory and must be at least 6 characters.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      const typeName = formData.is_custom_type ? formData.custom_type_input.trim() : formData.service_type_name;

      const res = await fetch(`/api/admin/services/${selectedServiceForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_service_id: serviceId,
          service_name: formData.service_name.trim(),
          phone_number: formData.phone_number.trim(),
          service_type_name: typeName,
          property_id: formData.property_id || null,
          description: formData.description.trim() || null,
          price: formData.price ? Math.max(0, parseFloat(formData.price)) : 0,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update service.');

      onClose();
      onSuccess('Service Updated', `Updated service ${serviceId}.`);
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showEditModal && selectedServiceForEdit && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Service Details</h3>
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

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-black dark:text-white block mb-1">Service Type</label>
                <select
                  value={formData.service_type_name}
                  onChange={(e) => setFormData({ ...formData, service_type_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  {availableServiceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
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
                        {p.name} ({p.organization_name})
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
                <label className="font-bold text-black dark:text-white block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

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
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
