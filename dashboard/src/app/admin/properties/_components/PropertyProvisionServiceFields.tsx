'use client';

import React from 'react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { ServiceCreateFormData } from './types';

export interface PropertyProvisionServiceFieldsProps {
  isFire: boolean;
  isElevator: boolean;
  selectedPropForDrawer: PropertyRecord;
  serviceCreateForm: ServiceCreateFormData;
  setServiceCreateForm: React.Dispatch<React.SetStateAction<ServiceCreateFormData>>;
  handleTypeSelect: (newType: string) => void;
  availableDrawerServiceTypes: string[];
  showCustomSvcIdInDrawer: boolean;
  setShowCustomSvcIdInDrawer: (show: boolean) => void;
}

export function PropertyProvisionServiceFields({
  isFire,
  isElevator,
  selectedPropForDrawer,
  serviceCreateForm,
  setServiceCreateForm,
  handleTypeSelect,
  availableDrawerServiceTypes,
  showCustomSvcIdInDrawer,
  setShowCustomSvcIdInDrawer,
}: PropertyProvisionServiceFieldsProps) {
  if (isFire) {
    return (
      <>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-black dark:text-white block">Service Type</label>
            <button
              type="button"
              onClick={() =>
                setServiceCreateForm({
                  ...serviceCreateForm,
                  is_custom_type: !serviceCreateForm.is_custom_type,
                })
              }
              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
            >
              {serviceCreateForm.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
            </button>
          </div>

          {serviceCreateForm.is_custom_type ? (
            <input
              type="text"
              required
              value={serviceCreateForm.custom_type_input}
              onChange={(e) =>
                setServiceCreateForm({ ...serviceCreateForm, custom_type_input: e.target.value })
              }
              placeholder="Enter new custom service type..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
            />
          ) : (
            <select
              value={serviceCreateForm.service_type_name}
              onChange={(e) => handleTypeSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-medium"
            >
              {availableDrawerServiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Device Type <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={serviceCreateForm.device_type}
            onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, device_type: e.target.value })}
            placeholder="e.g. Fire Communicator DACT, Fire Alarm Panel"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={serviceCreateForm.phone_number}
            onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, phone_number: e.target.value })}
            placeholder="e.g. +1 555-019-2831"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block mb-1">Serial Number</label>
            <input
              type="text"
              value={serviceCreateForm.serial_number}
              onChange={(e) =>
                setServiceCreateForm({ ...serviceCreateForm, serial_number: e.target.value })
              }
              placeholder="e.g. SN-9812-FL-01"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
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
                value={serviceCreateForm.price}
                onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, price: e.target.value })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Description</label>
          <textarea
            rows={2}
            value={serviceCreateForm.description}
            onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, description: e.target.value })}
            placeholder="e.g. Primary life-safety monitoring dialer line"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
          />
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Service ID:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {serviceCreateForm.custom_service_id || 'Auto-generated (FL-XXXXXX)'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomSvcIdInDrawer(!showCustomSvcIdInDrawer)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {showCustomSvcIdInDrawer ? 'Hide Custom ID' : 'Customize ID'}
            </button>
          </div>
          {showCustomSvcIdInDrawer && (
            <input
              type="text"
              value={serviceCreateForm.custom_service_id}
              onChange={(e) =>
                setServiceCreateForm({ ...serviceCreateForm, custom_service_id: e.target.value })
              }
              placeholder="e.g. FL-MIA-001"
              className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
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
              onClick={() =>
                setServiceCreateForm({
                  ...serviceCreateForm,
                  is_custom_type: !serviceCreateForm.is_custom_type,
                })
              }
              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
            >
              {serviceCreateForm.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
            </button>
          </div>

          {serviceCreateForm.is_custom_type ? (
            <input
              type="text"
              required
              value={serviceCreateForm.custom_type_input}
              onChange={(e) =>
                setServiceCreateForm({ ...serviceCreateForm, custom_type_input: e.target.value })
              }
              placeholder="Enter new custom service type..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
            />
          ) : (
            <select
              value={serviceCreateForm.service_type_name}
              onChange={(e) => handleTypeSelect(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-medium"
            >
              {availableDrawerServiceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={serviceCreateForm.phone_number}
            onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, phone_number: e.target.value })}
            placeholder="e.g. +1 555-019-2844"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block mb-1">Extension / Cab ID</label>
            <input
              type="text"
              value={serviceCreateForm.extension}
              onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, extension: e.target.value })}
              placeholder="e.g. Cab #1 - North Tower"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
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
                value={serviceCreateForm.price}
                onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, price: e.target.value })}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Description</label>
          <textarea
            rows={2}
            value={serviceCreateForm.description}
            onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, description: e.target.value })}
            placeholder="e.g. Elevator cab emergency auto-dialer"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
          />
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Service ID:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {serviceCreateForm.custom_service_id || 'Auto-generated (EL-XXXXXX)'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowCustomSvcIdInDrawer(!showCustomSvcIdInDrawer)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {showCustomSvcIdInDrawer ? 'Hide Custom ID' : 'Customize ID'}
            </button>
          </div>
          {showCustomSvcIdInDrawer && (
            <input
              type="text"
              value={serviceCreateForm.custom_service_id}
              onChange={(e) =>
                setServiceCreateForm({ ...serviceCreateForm, custom_service_id: e.target.value })
              }
              placeholder="e.g. EL-MIA-001"
              className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
            />
          )}
        </div>
      </>
    );
  }

  // Standard service fields
  return (
    <>
      <div>
        <label className="font-bold text-black dark:text-white block mb-1">
          Service ID <span className="text-rose-500">* (Min 6 chars)</span>
        </label>
        <input
          type="text"
          required
          minLength={6}
          value={serviceCreateForm.custom_service_id}
          onChange={(e) =>
            setServiceCreateForm({ ...serviceCreateForm, custom_service_id: e.target.value })
          }
          placeholder="e.g. SVC-MIA-001"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Service Name</label>
          <input
            type="text"
            value={serviceCreateForm.service_name}
            onChange={(e) =>
              setServiceCreateForm({ ...serviceCreateForm, service_name: e.target.value })
            }
            placeholder="e.g. Main Lobby Line"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        </div>

        <div>
          <label className="font-bold text-black dark:text-white block mb-1">
            Phone Number / DID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={serviceCreateForm.phone_number}
            onChange={(e) =>
              setServiceCreateForm({ ...serviceCreateForm, phone_number: e.target.value })
            }
            placeholder="+1 (555) 019-2834"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-bold text-black dark:text-white block">Service Type</label>
          <button
            type="button"
            onClick={() =>
              setServiceCreateForm({
                ...serviceCreateForm,
                is_custom_type: !serviceCreateForm.is_custom_type,
              })
            }
            className="text-[11px] text-blue-600 hover:underline cursor-pointer"
          >
            {serviceCreateForm.is_custom_type ? 'Choose Preset Type' : '+ Add New Custom Type'}
          </button>
        </div>

        {serviceCreateForm.is_custom_type ? (
          <input
            type="text"
            required
            value={serviceCreateForm.custom_type_input}
            onChange={(e) =>
              setServiceCreateForm({ ...serviceCreateForm, custom_type_input: e.target.value })
            }
            placeholder="Enter new custom service type..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
          />
        ) : (
          <select
            value={serviceCreateForm.service_type_name}
            onChange={(e) => handleTypeSelect(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-medium"
          >
            {availableDrawerServiceTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-bold text-black dark:text-white block mb-1">Attached Property</label>
          <input
            type="text"
            disabled
            value={selectedPropForDrawer.name}
            className="w-full px-3 py-2 bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-not-allowed"
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
              value={serviceCreateForm.price}
              onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, price: e.target.value })}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="font-bold text-black dark:text-white block mb-1">
          FreePBX Cluster Server (`server_id` for DID &amp; Call Forwarding)
        </label>
        <select
          value={serviceCreateForm.pbx_server_id}
          onChange={(e) =>
            setServiceCreateForm({ ...serviceCreateForm, pbx_server_id: Number(e.target.value) })
          }
          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
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
          value={serviceCreateForm.description}
          onChange={(e) => setServiceCreateForm({ ...serviceCreateForm, description: e.target.value })}
          placeholder="e.g. Primary inbound DID for front desk operations"
          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
        />
      </div>
    </>
  );
}

