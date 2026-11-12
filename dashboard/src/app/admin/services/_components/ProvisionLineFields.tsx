'use client';

import React from 'react';
import type { ServiceFormData, PropertyOption } from './types';

interface ProvisionLineFieldsProps {
  isFire: boolean;
  isElevator: boolean;
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  availableServiceTypes: string[];
  propertyOptions: PropertyOption[];
  showCustomServiceId: boolean;
  setShowCustomServiceId: (show: boolean) => void;
  onTypeSelect: (type: string) => void;
}

export default function ProvisionLineFields({
  isFire,
  isElevator,
  formData,
  setFormData,
  availableServiceTypes,
  propertyOptions,
  showCustomServiceId,
  setShowCustomServiceId,
  onTypeSelect,
}: ProvisionLineFieldsProps) {
  if (isFire) {
    return (
      <>
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
              onChange={(e) => onTypeSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-medium"
            >
              {availableServiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Device Type * */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Device Type <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.device_type}
            onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
            placeholder="e.g. Fire Communicator DACT, Fire Alarm Panel"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Phone Number * */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="e.g. +1 555-019-2831"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Serial Number & Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block mb-1">Serial Number</label>
            <input
              type="text"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="e.g. SN-9812-FL-01"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
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

        {/* Description (Shown in Table UI) */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Description (Shown in Table UI)
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Primary life-safety monitoring dialer line for Main Building Fire Riser Room"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Assigned Property */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Assigned Property</label>
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

        {/* Subtle Service ID display / customize */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Service ID:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {formData.custom_service_id || 'Auto-generated (FL-XXXXXX)'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomServiceId(!showCustomServiceId)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {showCustomServiceId ? 'Hide Custom ID' : 'Customize ID'}
            </button>
          </div>
          {showCustomServiceId && (
            <input
              type="text"
              value={formData.custom_service_id}
              onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
              placeholder="e.g. FL-MIA-001"
              className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          )}
        </div>
      </>
    );
  }

  if (isElevator) {
    return (
      <>
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
              onChange={(e) => onTypeSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-medium"
            >
              {availableServiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Phone Number * */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="e.g. +1 555-019-2844"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Extension / Cab ID & Monthly Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block mb-1">Extension / Cab ID</label>
            <input
              type="text"
              value={formData.extension}
              onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
              placeholder="e.g. Cab #1 - North Tower"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
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

        {/* Description (Shown in Table UI) */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Description (Shown in Table UI)
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Freight elevator cab emergency auto-dialer direct to security desk"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Assigned Property */}
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Assigned Property</label>
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

        {/* Subtle Service ID display / customize */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Service ID:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {formData.custom_service_id || 'Auto-generated (EL-XXXXXX)'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomServiceId(!showCustomServiceId)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {showCustomServiceId ? 'Hide Custom ID' : 'Customize ID'}
            </button>
          </div>
          {showCustomServiceId && (
            <input
              type="text"
              value={formData.custom_service_id}
              onChange={(e) => setFormData({ ...formData, custom_service_id: e.target.value })}
              placeholder="e.g. EL-MIA-001"
              className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
            />
          )}
        </div>
      </>
    );
  }

  return null;
}
