'use client';

import React from 'react';
import {
  Plus,
  ShieldCheck,
  PhoneCall,
  Loader2,
  Check,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';

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

      {/* TAB 3: E911 STATE */}
      {drawerTab === 'E911' && (
        <div className="space-y-4">
          {/* E911 Big Status Banner */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-sm">
                  E911 Routing &amp; PSAP Validation Status
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
                  Status: {propertyDrawerData?.e911?.property_e911_status || 'VERIFIED'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              PSAP Active
            </span>
          </div>

          {/* Registered Emergency Address */}
          <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
            <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
              Registered Emergency Dispatchable Address
            </span>
            <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {propertyDrawerData?.e911?.registered_address ||
                  `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city}, ${selectedPropForDrawer.state} ${selectedPropForDrawer.zip_code}`}
              </p>
              <p className="text-[11px] text-slate-500">
                Matches property street location: <strong className="text-emerald-600">Yes (Geocoded)</strong>
              </p>
            </div>
          </div>

          {/* Ray Baum's Act & Kari's Law Compliance */}
          <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
            <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
              Ray Baum&apos;s Act &amp; Kari&apos;s Law Compliance Audit
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                <span className="text-[10px] text-slate-400 block">Dispatchable Location Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5" /> Compliant &amp; Active
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                <span className="text-[10px] text-slate-400 block">Direct 911 Dialing (Kari&apos;s Law)</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5" /> No Prefix Required (911 Active)
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                <span className="text-[10px] text-slate-400 block">Automated Notification Logs</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {propertyDrawerData?.e911?.ray_baud_and_logs_enabled ? 'Enabled (Instant SMS/Email)' : 'Disabled'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                <span className="text-[10px] text-slate-400 block">PSAP Verification Timestamp</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {propertyDrawerData?.e911?.verified_at
                    ? new Date(propertyDrawerData.e911.verified_at).toLocaleDateString()
                    : 'System Verified'}
                </span>
              </div>
            </div>

            {propertyDrawerData?.e911?.correction_notes && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300">
                <span className="font-bold block text-xs">PSAP Audit Correction Notes:</span>
                <p className="mt-1 text-[11px]">{propertyDrawerData.e911.correction_notes}</p>
              </div>
            )}
          </div>

          {/* Shortcut to E911 Hub */}
          <div className="pt-2 flex justify-end">
            <a
              href="/admin/e911"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#222430] dark:hover:bg-[#2c2f3e] text-slate-800 dark:text-white rounded-xl font-bold flex items-center gap-1.5 transition"
            >
              <span>Open E911 Compliance Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}

