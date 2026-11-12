'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  PhoneCall,
  X,
  Trash2,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { PortingItem } from '@/store/slices/portingSlice';
import { LifecycleStage } from './portingTypes';

interface PortingActionModalsProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  recordToDelete: PortingItem | null;
  deleteLoading: boolean;
  handleDeleteSubmit: () => Promise<void>;
  showAssignServiceModal: boolean;
  setShowAssignServiceModal: (show: boolean) => void;
  selectedRecordForAssign: PortingItem | null;
  assignedServices: any[];
  loadingServices: boolean;
  handleUnassignService: (serviceId: string) => Promise<void>;
  handleConfirmAssignService: (e: React.FormEvent) => Promise<void>;
  selectedServiceToAssign: string;
  setSelectedServiceToAssign: (id: string) => void;
  availableServices: any[];
  assigningService: boolean;
  showBillingConfirmModal: boolean;
  setShowBillingConfirmModal: (show: boolean) => void;
  selectedRecord: PortingItem | null;
  updatingStage: boolean;
  setEditStageStatus: (status: LifecycleStage) => void;
  handleUpdateStageSubmit: (e?: React.FormEvent, chosenBillingStatus?: 'BILLING_DONE' | 'BILLING_PENDING') => void;
}

export function PortingActionModals({
  showDeleteModal,
  setShowDeleteModal,
  recordToDelete,
  deleteLoading,
  handleDeleteSubmit,
  showAssignServiceModal,
  setShowAssignServiceModal,
  selectedRecordForAssign,
  assignedServices,
  loadingServices,
  handleUnassignService,
  handleConfirmAssignService,
  selectedServiceToAssign,
  setSelectedServiceToAssign,
  availableServices,
  assigningService,
  showBillingConfirmModal,
  setShowBillingConfirmModal,
  selectedRecord,
  updatingStage,
  setEditStageStatus,
  handleUpdateStageSubmit,
}: PortingActionModalsProps) {
  return (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && recordToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Delete Porting Request?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to delete the porting request for{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {recordToDelete.property_name}
                  </strong>
                  ? This will remove all associated porting attachments.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN SERVICES MODAL */}
      <AnimatePresence>
        {showAssignServiceModal && selectedRecordForAssign && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <PhoneCall className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign Services</h3>
                    <p className="text-xs text-slate-400">{selectedRecordForAssign.property_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignServiceModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs">
                {/* Section 1: Assigned Services */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10.5px]">
                      Currently Assigned Services ({assignedServices.length})
                    </label>
                  </div>

                  {loadingServices ? (
                    <div className="p-6 text-center text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5" />
                      Loading assigned services...
                    </div>
                  ) : assignedServices.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-[#222430] text-center text-slate-400 bg-slate-50/50 dark:bg-[#111217]/50">
                      No services currently assigned to this porting request.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {assignedServices.map((svc: any) => {
                        const sid = svc.service_id || svc.id;
                        const sNum = svc.phone_number || svc.service?.phone_number || 'No Number';
                        const sType = svc.service_type || svc.service?.service_type || 'Voice Trunk';
                        const sPrice = Number(svc.price ?? svc.service?.price ?? 0);

                        return (
                          <div
                            key={svc.id || sid}
                            className="p-3 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white font-mono text-xs">
                                  {sNum}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                                  {sType}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                ${sPrice.toFixed(2)}/mo
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnassignService(sid)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Unassign Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Assign New Service Form */}
                <form onSubmit={handleConfirmAssignService} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-3">
                  <div>
                    <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                      Assign New Service
                    </label>
                    <select
                      value={selectedServiceToAssign}
                      onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a service to link...</option>
                      {availableServices
                        .filter((s) => !assignedServices.some((as) => (as.service_id || as.id) === s.id))
                        .map((svc) => (
                          <option key={svc.id} value={svc.id}>
                            {svc.phone_number} ({svc.service_type}) — ${Number(svc.price || 0).toFixed(2)}/mo
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedServiceToAssign && (() => {
                    const chosen = availableServices.find((s) => s.id === selectedServiceToAssign);
                    const currentPrice = Number(selectedRecordForAssign?.monthly_price || 0);
                    const svcPrice = Number(chosen?.price || 0);
                    return (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                        <p className="font-semibold mb-1">Pricing Update Preview:</p>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span>Base: ${currentPrice.toFixed(2)}/mo</span>
                          <span>+ Service: ${svcPrice.toFixed(2)}/mo</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            = ${(currentPrice + svcPrice).toFixed(2)}/mo
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={assigningService || !selectedServiceToAssign}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {assigningService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Assign Service</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAssignServiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1f212c] dark:hover:bg-[#2a2c3a] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ONBOARDING BILLING STATUS CONFIRMATION POP-UP MODAL */}
      <AnimatePresence>
        {showBillingConfirmModal && selectedRecord && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-[60] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/50">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Onboarding &amp; Billing Status
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedRecord.property_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBillingConfirmModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This property is moving to <strong>Stage 8: Onboarding</strong> and will be moved to the <strong>Properties</strong> page. Please confirm whether billing is completed or pending for this property:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={updatingStage}
                  onClick={() => {
                    setEditStageStatus('COMPLETED');
                    handleUpdateStageSubmit(undefined, 'BILLING_DONE');
                  }}
                  className="p-3.5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-left transition cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Billing Done
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                      BILLED
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-snug">
                    Move to Properties page &amp; mark status as <strong>Billing Done</strong>.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={updatingStage}
                  onClick={() => {
                    setEditStageStatus('COMPLETED');
                    handleUpdateStageSubmit(undefined, 'BILLING_PENDING');
                  }}
                  className="p-3.5 rounded-xl border-2 border-amber-500/80 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-left transition cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Billing Pending
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-600 text-white">
                      PENDING
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-snug">
                    Move to Properties page &amp; mark status as <strong>Billing Pending</strong>.
                  </p>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#222430]">
                <span className="text-[10.5px] text-slate-400">
                  You can also change billing status anytime on the Properties page.
                </span>
                <button
                  type="button"
                  onClick={() => setShowBillingConfirmModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
