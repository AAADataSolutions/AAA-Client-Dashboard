'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgAssignServiceModalProps {
  org: OrgDetail;
  showAssignServiceModal: boolean;
  setShowAssignServiceModal: (show: boolean) => void;
  assignServiceTab: 'EXISTING' | 'NEW';
  setAssignServiceTab: (tab: 'EXISTING' | 'NEW') => void;
  loadingUnassignedServices: boolean;
  availableUnassignedServices: any[];
  selectedServiceToAssign: string;
  setSelectedServiceToAssign: (id: string) => void;
  targetPropertyForService: string;
  setTargetPropertyForService: (id: string) => void;
  savingService: boolean;
  handleAssignExistingServiceSubmit: (e: React.FormEvent) => Promise<void>;
  handleCreateNewServiceSubmit: (e: React.FormEvent) => Promise<void>;
  serviceTypesList: any[];
  newServiceForm: {
    service_name: string;
    phone_number: string;
    service_type: string;
    description: string;
    status: string;
  };
  setNewServiceForm: React.Dispatch<React.SetStateAction<{
    service_name: string;
    phone_number: string;
    service_type: string;
    description: string;
    status: string;
  }>>;
}

export function OrgAssignServiceModal({
  org,
  showAssignServiceModal,
  setShowAssignServiceModal,
  assignServiceTab,
  setAssignServiceTab,
  loadingUnassignedServices,
  availableUnassignedServices,
  selectedServiceToAssign,
  setSelectedServiceToAssign,
  targetPropertyForService,
  setTargetPropertyForService,
  savingService,
  handleAssignExistingServiceSubmit,
  handleCreateNewServiceSubmit,
  serviceTypesList,
  newServiceForm,
  setNewServiceForm,
}: OrgAssignServiceModalProps) {
  return (
    <AnimatePresence>
      {showAssignServiceModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAssignServiceModal(false)}
            className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden z-10"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Service to Property</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Organization: {org.name}</p>
                </div>
                <button onClick={() => setShowAssignServiceModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-[#222430] gap-4 text-xs font-semibold px-5 pt-3 shrink-0">
                <button
                  onClick={() => setAssignServiceTab('EXISTING')}
                  className={`pb-2 transition cursor-pointer border-b-2 ${
                    assignServiceTab === 'EXISTING'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Assign Existing Service
                </button>
              </div>

              {/* Tab 1: Existing Service */}
              {assignServiceTab === 'EXISTING' ? (
                <form onSubmit={handleAssignExistingServiceSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Select Unassigned Service <span className="text-rose-500">*</span>
                      </label>
                      {loadingUnassignedServices ? (
                        <div className="py-2 text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading unassigned catalog...
                        </div>
                      ) : availableUnassignedServices.length === 0 ? (
                        <p className="text-amber-600 dark:text-amber-400 text-xs py-2">
                          No unassigned services available. Go to Services & Lines section to create new service.
                        </p>
                      ) : (
                        <select
                          required
                          value={selectedServiceToAssign}
                          onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                        >
                          {availableUnassignedServices.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.phone_number} — {srv.service_type || 'Voice DID'} ({srv.service_name || 'Line'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Assign to Property in {org.name} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={targetPropertyForService}
                        onChange={(e) => setTargetPropertyForService(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {(org.properties || []).map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAssignServiceModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={savingService || !selectedServiceToAssign || !targetPropertyForService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Assign Service</span>
                    </motion.button>
                  </div>
                </form>
              ) : (
                /* Tab 2: Create New Service */
                <form onSubmit={handleCreateNewServiceSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-900 dark:text-slate-100 block">
                          Service Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newServiceForm.service_type}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, service_type: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                        >
                          {serviceTypesList.map((st: any) => (
                            <option key={st.id || st.name} value={st.name}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-900 dark:text-slate-100 block">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newServiceForm.phone_number}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, phone_number: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Service Name / Label</label>
                      <input
                        type="text"
                        value={newServiceForm.service_name}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, service_name: e.target.value })}
                        placeholder="e.g. Front Desk Direct Line"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Description</label>
                      <textarea
                        rows={2}
                        value={newServiceForm.description}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                        placeholder="Circuit routing notes, equipment location, etc."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Assign to Property in {org.name} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={targetPropertyForService}
                        onChange={(e) => setTargetPropertyForService(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {(org.properties || []).map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAssignServiceModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={savingService || !newServiceForm.phone_number || !targetPropertyForService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Create &amp; Assign</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
