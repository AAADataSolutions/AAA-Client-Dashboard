'use client';

import React from 'react';
import {
  Plus,
  PhoneCall,
  Loader2,
  Check,
  Trash2,
  Copy,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';
import { PropertyMasterDrawerTab3E911 } from './PropertyMasterDrawerTab3E911';

interface PropertyMasterDrawerTab2And3Props {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  handleOpenCreateServiceInDrawer: () => void;
  handleDrawerAssignService: (e: React.FormEvent) => void;
  drawerAssignServiceId: string;
  setDrawerAssignServiceId: (id: string) => void;
  assigningServiceInDrawer: boolean;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleDrawerUnassignService: (serviceId: string, serviceName: string) => void;
  unassigningServiceId: string | null;
  onDataChanged?: () => void;
}

export function PropertyMasterDrawerTab2And3({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  handleOpenCreateServiceInDrawer,
  handleDrawerAssignService,
  drawerAssignServiceId,
  setDrawerAssignServiceId,
  assigningServiceInDrawer,
  copiedField,
  handleCopy,
  handleDrawerUnassignService,
  unassigningServiceId,
  onDataChanged,
}: PropertyMasterDrawerTab2And3Props) {
  return (
    <>
      {/* TAB 2: SERVICES (LIST + ADD + DELETE SERVICES DIRECTLY) */}
      {drawerTab === 'SERVICES' && (
        <div className="space-y-4">
          {/* Summary & Quick Stats */}
          <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {propertyDrawerData?.services?.length || 0} Attached Services
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                  Total Service Charges: ${Number(propertyDrawerData?.stats?.services_monthly_total || 0).toFixed(2)}/mo
                </p>
              </div>
            </div>
          </div>

          {/* Assign / Add Service Directly Form */}
          <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block">
                + Add or Create Service for this Property
              </span>
              <button
                type="button"
                onClick={handleOpenCreateServiceInDrawer}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Service</span>
              </button>
            </div>
            <form onSubmit={handleDrawerAssignService} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <select
                value={drawerAssignServiceId}
                onChange={(e) => setDrawerAssignServiceId(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose an Available Service to Link --</option>
                {(propertyDrawerData?.available_services || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.phone_number} — {s.service_type || 'Voice Trunk'} (${Number(s.price || 0).toFixed(2)}/mo)
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!drawerAssignServiceId || assigningServiceInDrawer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                {assigningServiceInDrawer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Link Service
              </button>
            </form>
            {(!propertyDrawerData?.available_services || propertyDrawerData.available_services.length === 0) && (
              <p className="text-[10.5px] text-slate-400 italic">
                All available numbers in the system are currently assigned.
              </p>
            )}
          </div>

          {/* List of Attached Services */}
          <div className="space-y-2.5">
            <label className="font-bold text-black dark:text-white block text-xs">
              Active Services Assigned to {selectedPropForDrawer.name}
            </label>

            {!propertyDrawerData?.services || propertyDrawerData.services.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
                <PhoneCall className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="font-semibold">No services attached to this property yet.</p>
                <p className="text-[11px] mt-0.5">Use the selector above to assign a telephone number or trunk.</p>
              </div>
            ) : (
              propertyDrawerData.services.map((svc: any) => (
                <div
                  key={svc.id}
                  className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-[#2e3140] transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {svc.phone_number}
                      </span>
                      <button
                        onClick={() => handleCopy(svc.phone_number, `svc-copy-${svc.id}`)}
                        className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                        title="Copy Number"
                      >
                        {copiedField === `svc-copy-${svc.id}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                        {svc.service_type || 'Voice Trunk'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {svc.status || 'ACTIVE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      {svc.service_name && (
                        <span>
                          Name: <strong>{svc.service_name}</strong>
                        </span>
                      )}
                      {svc.custom_service_id && (
                        <span>
                          ID: <strong className="font-mono">{svc.custom_service_id}</strong>
                        </span>
                      )}
                      {svc.description && <span>{svc.description}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      ${Number(svc.price || 0).toFixed(2)}/mo
                    </span>
                    <button
                      onClick={() => handleDrawerUnassignService(svc.id, svc.phone_number)}
                      disabled={unassigningServiceId === svc.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Unassign / Remove Service"
                    >
                      {unassigningServiceId === svc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: E911 STATE (INLINE EDITING + AUDIT MANAGEMENT) */}
      <PropertyMasterDrawerTab3E911
        drawerTab={drawerTab}
        selectedPropForDrawer={selectedPropForDrawer}
        propertyDrawerData={propertyDrawerData}
        onDataChanged={onDataChanged}
      />
    </>
  );
}
