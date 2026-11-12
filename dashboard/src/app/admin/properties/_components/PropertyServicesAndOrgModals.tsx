'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  PhoneCall,
  X,
  Loader2,
  Check,
  Info,
  Trash2,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { PropertyItem } from '@/store/slices/propertiesSlice';
import { AssignedServiceItem, AvailableServiceOption, OrgOption } from './types';
import { PropertyDeleteModal } from './PropertyDeleteModal';

interface PropertyServicesAndOrgModalsProps {
  showServicesModal: boolean;
  setShowServicesModal: (show: boolean) => void;
  selectedPropForServices: PropertyItem | null;
  loadingServices: boolean;
  propServicesList: AssignedServiceItem[];
  handleUnassignService: (serviceId: string) => void;
  handleOpenAssignServiceModal: (prop: PropertyItem) => void;

  showAssignServiceModal: boolean;
  setShowAssignServiceModal: (show: boolean) => void;
  selectedPropForAssign: PropertyItem | null;
  selectedServiceToAssign: string;
  setSelectedServiceToAssign: (id: string) => void;
  availableServices: AvailableServiceOption[];
  assigningService: boolean;
  handleConfirmAssignService: (e: React.FormEvent) => void;

  showStatusModal: boolean;
  setShowStatusModal: (show: boolean) => void;
  selectedPropForStatus: PropertyItem | null;
  targetStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  setTargetStatus: (st: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED') => void;
  statusChangeLoading: boolean;
  handleConfirmStatusChange: () => void;

  showAssignOrgModal: boolean;
  setShowAssignOrgModal: (show: boolean) => void;
  selectedPropForAssignOrg: PropertyItem | null;
  targetOrgId: string;
  setTargetOrgId: (id: string) => void;
  orgOptions: OrgOption[];
  assigningOrgLoading: boolean;
  handleAssignOrgSubmit: (e: React.FormEvent) => void;

  propertyToDelete: PropertyItem | null;
  setPropertyToDelete: (prop: PropertyItem | null) => void;
  deletePropertyLoading: boolean;
  handleConfirmDeleteProperty: () => void;
}

export function PropertyServicesAndOrgModals({
  showServicesModal,
  setShowServicesModal,
  selectedPropForServices,
  loadingServices,
  propServicesList,
  handleUnassignService,
  handleOpenAssignServiceModal,
  showAssignServiceModal,
  setShowAssignServiceModal,
  selectedPropForAssign,
  selectedServiceToAssign,
  setSelectedServiceToAssign,
  availableServices,
  assigningService,
  handleConfirmAssignService,
  showStatusModal,
  setShowStatusModal,
  selectedPropForStatus,
  targetStatus,
  setTargetStatus,
  statusChangeLoading,
  handleConfirmStatusChange,
  showAssignOrgModal,
  setShowAssignOrgModal,
  selectedPropForAssignOrg,
  targetOrgId,
  setTargetOrgId,
  orgOptions,
  assigningOrgLoading,
  handleAssignOrgSubmit,
  propertyToDelete,
  setPropertyToDelete,
  deletePropertyLoading,
  handleConfirmDeleteProperty,
}: PropertyServicesAndOrgModalsProps) {
  return (
    <>
      {/* 2. VIEW SERVICES MODAL */}
      <AnimatePresence>
        {showServicesModal && selectedPropForServices && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <PhoneCall className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Assigned Services</h3>
                    <p className="text-xs text-slate-500">{selectedPropForServices.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                {loadingServices ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading assigned services...
                  </div>
                ) : propServicesList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-400">
                    <PhoneCall className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    No services currently assigned to this property.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#222430]">
                    {propServicesList.map((svc) => (
                      <div key={svc.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{svc.phone_number}</p>
                          <p className="text-slate-400 text-[11px]">
                            {svc.service_type} {svc.description ? `• ${svc.description}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                            +${Number(svc.price || 0).toFixed(2)}/mo
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              svc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {svc.status}
                          </span>
                          <button
                            onClick={() => handleUnassignService(svc.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                            title="Unassign Service"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Summary Total Calculation */}
                    <div className="mt-4 p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[11px] block">
                          Property Base Rate: $
                          {Number(selectedPropForServices?.base_price ?? selectedPropForServices?.monthly_price ?? 0).toFixed(
                            2
                          )}
                          /mo
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          Services Add-on ({propServicesList.length}): +$
                          {propServicesList.reduce((sum, s) => sum + Number(s.price || 0), 0).toFixed(2)}/mo
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Monthly Rate</span>
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          $
                          {(
                            Number(
                              selectedPropForServices?.base_price ?? selectedPropForServices?.monthly_price ?? 0
                            ) + propServicesList.reduce((sum, s) => sum + Number(s.price || 0), 0)
                          ).toFixed(2)}
                          /mo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                <button
                  onClick={() => {
                    setShowServicesModal(false);
                    handleOpenAssignServiceModal(selectedPropForServices);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Another Service
                </button>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ASSIGN SERVICE MODAL */}
      <AnimatePresence>
        {showAssignServiceModal && selectedPropForAssign && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign Service</h3>
                </div>
                <button
                  onClick={() => setShowAssignServiceModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAssignService} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Target Property</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                    {selectedPropForAssign.name}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Select Service to Assign</label>
                  <select
                    value={selectedServiceToAssign}
                    onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a service to link...</option>
                    {availableServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.phone_number} ({svc.service_type}) — ${Number(svc.price || 0).toFixed(2)}/mo
                      </option>
                    ))}
                  </select>
                </div>

                {selectedServiceToAssign &&
                  (() => {
                    const chosen = availableServices.find((s) => s.id === selectedServiceToAssign);
                    const currentPropPrice = Number(
                      selectedPropForAssign?.monthly_price ?? selectedPropForAssign?.base_price ?? 0
                    );
                    const svcPrice = Number(chosen?.price || 0);
                    const newTotal = currentPropPrice + svcPrice;
                    return (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                        <p className="font-semibold mb-1">Pricing Update Live Preview:</p>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span>Current: ${currentPropPrice.toFixed(2)}/mo</span>
                          <span>+ Service: ${svcPrice.toFixed(2)}/mo</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            = New Total: ${newTotal.toFixed(2)}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  Rule: A service can only be assigned to one property. Assigning this service will associate it with this property.
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAssignServiceModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningService || !selectedServiceToAssign}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {assigningService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CHANGE STATUS MODAL */}
      <AnimatePresence>
        {showStatusModal && selectedPropForStatus && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Change Property Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Select new operational status for{' '}
                  <span className="font-bold text-black dark:text-white">{selectedPropForStatus.name}</span>:
                </p>

                <div className="space-y-2">
                  {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                        targetStatus === st
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#181920]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            st === 'ACTIVE' ? 'bg-emerald-500' : st === 'ARCHIVED' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-bold uppercase text-[11px]">{st}</span>
                      </div>
                      {targetStatus === st && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  disabled={statusChangeLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {statusChangeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN TO ORGANIZATION MODAL */}
      <AnimatePresence>
        {showAssignOrgModal && selectedPropForAssignOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign to Organization</h3>
                    <p className="text-xs text-slate-400">{selectedPropForAssignOrg.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowAssignOrgModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignOrgSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Select Organization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  >
                    <option value="">Choose an organization...</option>
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  Assigning this property will set its status to <strong>ONBOARDING</strong> and initialize its 7-stage onboarding tracker at <strong>Draft Initialized</strong>.
                </p>

                <div className="pt-2 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAssignOrgModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigningOrgLoading || !targetOrgId}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {assigningOrgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Assign Property</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROPERTY CONFIRMATION MODAL */}
      <PropertyDeleteModal
        propertyToDelete={propertyToDelete}
        setPropertyToDelete={setPropertyToDelete}
        deletePropertyLoading={deletePropertyLoading}
        handleConfirmDeleteProperty={handleConfirmDeleteProperty}
      />
    </>
  );
}

