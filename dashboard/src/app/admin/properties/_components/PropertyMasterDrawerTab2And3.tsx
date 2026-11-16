'use client';

import React, { useState } from 'react';
import {
  Plus,
  PhoneCall,
  Loader2,
  Check,
  Trash2,
  Copy,
  Upload,
  Edit2,
  X,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';
import { PropertyMasterDrawerTab3E911 } from './PropertyMasterDrawerTab3E911';
import { ImportPropertyServicesModal } from './ImportPropertyServicesModal';

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
  const [showImportServicesModal, setShowImportServicesModal] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState<string | null>(null);
  const [editSvcForm, setEditSvcForm] = useState({
    phone_number: '',
    service_name: '',
    service_type_name: '',
    custom_service_id: '',
    price: '',
    status: 'ACTIVE',
    description: '',
  });
  const [savingSvc, setSavingSvc] = useState(false);
  const [editSvcError, setEditSvcError] = useState<string | null>(null);

  const startEditService = (svc: any) => {
    setEditingSvcId(svc.id);
    setEditSvcError(null);
    setEditSvcForm({
      phone_number: svc.phone_number || '',
      service_name: svc.service_name || '',
      service_type_name: svc.service_type || 'Voice Trunk / DID',
      custom_service_id: svc.custom_service_id || '',
      price: svc.price !== undefined && svc.price !== null ? String(svc.price) : '0',
      status: svc.status || 'ACTIVE',
      description: svc.description || '',
    });
  };

  const handleSaveServiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSvcId) return;
    try {
      setSavingSvc(true);
      setEditSvcError(null);
      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSvcId,
          phone_number: editSvcForm.phone_number.trim(),
          service_name: editSvcForm.service_name.trim(),
          service_type_name: editSvcForm.service_type_name.trim(),
          custom_service_id: editSvcForm.custom_service_id.trim(),
          price: editSvcForm.price === '' ? 0 : Number(editSvcForm.price),
          status: editSvcForm.status,
          description: editSvcForm.description.trim() || null,
          property_id: selectedPropForDrawer.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update service.');
      }
      setEditingSvcId(null);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setEditSvcError(err.message || 'Error updating service.');
    } finally {
      setSavingSvc(false);
    }
  };

  return (
    <>
      <ImportPropertyServicesModal
        isOpen={showImportServicesModal}
        onClose={() => setShowImportServicesModal(false)}
        propertyId={selectedPropForDrawer.id}
        propertyName={selectedPropForDrawer.name}
        existingServices={propertyDrawerData?.services || []}
        onSuccess={() => {
          if (onDataChanged) onDataChanged();
        }}
      />

      {/* TAB 2: SERVICES (LIST + ADD + EDIT + IMPORT + DELETE SERVICES DIRECTLY) */}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportServicesModal(true)}
                  className="px-3 py-1.5 bg-white dark:bg-[#181a24] hover:bg-slate-100 dark:hover:bg-[#222430] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#282a36] font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Import CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreateServiceInDrawer}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Service</span>
                </button>
              </div>
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
              propertyDrawerData.services.map((svc: any) =>
                editingSvcId === svc.id ? (
                  <form
                    key={svc.id}
                    onSubmit={handleSaveServiceEdit}
                    className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Edit Service</span>
                      <button
                        type="button"
                        onClick={() => setEditingSvcId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {editSvcError && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-600 text-[11px]">
                        {editSvcError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={editSvcForm.phone_number}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, phone_number: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={editSvcForm.service_name}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, service_name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Service Type
                        </label>
                        <input
                          type="text"
                          value={editSvcForm.service_type_name}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, service_type_name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Monthly Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editSvcForm.price}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, price: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Service ID
                        </label>
                        <input
                          type="text"
                          value={editSvcForm.custom_service_id}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, custom_service_id: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Status
                        </label>
                        <select
                          value={editSvcForm.status}
                          onChange={(e) => setEditSvcForm((p) => ({ ...p, status: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editSvcForm.description}
                        onChange={(e) => setEditSvcForm((p) => ({ ...p, description: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSvcId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] text-slate-600 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingSvc}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {savingSvc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Service</span>
                      </button>
                    </div>
                  </form>
                ) : (
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

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white text-xs mr-1">
                        ${Number(svc.price || 0).toFixed(2)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditService(svc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
                )
              )
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
