'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  X,
  Check,
  Eye,
  PhoneCall,
  Link2,
} from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgPropertyModalsProps {
  org: OrgDetail;
  unassignTarget: { propertyId: string; name: string } | null;
  setUnassignTarget: (target: { propertyId: string; name: string } | null) => void;
  unassigningLoading: boolean;
  handleConfirmUnassign: () => Promise<void>;
  showAssignPropModal: boolean;
  setShowAssignPropModal: (show: boolean) => void;
  selectedPropToAssign: string;
  setSelectedPropToAssign: (id: string) => void;
  availableProps: any[];
  assigningLoading: boolean;
  handleAssignPropertySubmit: (e: React.FormEvent) => Promise<void>;
  viewingPropDetails: any | null;
  setViewingPropDetails: (prop: any | null) => void;
  viewingPropServices: { propName: string; services: any[] } | null;
  setViewingPropServices: (val: { propName: string; services: any[] } | null) => void;
  loadingPropServices: boolean;
  statusPropTarget: any | null;
  setStatusPropTarget: (prop: any | null) => void;
  savingPropStatus: boolean;
  handleSavePropertyStatus: (newStatus: string) => Promise<void>;
}

export function OrgPropertyModals({
  org,
  unassignTarget,
  setUnassignTarget,
  unassigningLoading,
  handleConfirmUnassign,
  showAssignPropModal,
  setShowAssignPropModal,
  selectedPropToAssign,
  setSelectedPropToAssign,
  availableProps,
  assigningLoading,
  handleAssignPropertySubmit,
  viewingPropDetails,
  setViewingPropDetails,
  viewingPropServices,
  setViewingPropServices,
  loadingPropServices,
  statusPropTarget,
  setStatusPropTarget,
  savingPropStatus,
  handleSavePropertyStatus,
}: OrgPropertyModalsProps) {
  return (
    <>
      {/* Unassign Property Confirmation Modal */}
      <AnimatePresence>
        {unassignTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnassignTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Unassign Property</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to unassign <strong className="text-slate-900 dark:text-white">"{unassignTarget.name}"</strong> from <strong className="text-slate-900 dark:text-white">{org.name}</strong>? It will remain available in the master properties inventory.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnassignTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#181920] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUnassign}
                    disabled={unassigningLoading}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {unassigningLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Unassign Property</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Existing Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignPropModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Assign Property to {org.name}
                      </h3>
                      <p className="text-xs text-slate-400">Select an unassigned property</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignPropModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignPropertySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                      Select Property *
                    </label>
                    <select
                      value={selectedPropToAssign}
                      onChange={(e) => setSelectedPropToAssign(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose an available property --</option>
                      {availableProps.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.address ? `(${p.address})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setShowAssignPropModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#181920] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assigningLoading || !selectedPropToAssign}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {assigningLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Assign Property</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Property Details Modal */}
      <AnimatePresence>
        {viewingPropDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPropDetails(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {viewingPropDetails.name}
                      </h3>
                      <p className="text-xs text-slate-400">Property Overview</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingPropDetails(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{viewingPropDetails.status || 'ACTIVE'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Main Phone</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{viewingPropDetails.main_phone || '—'}</span>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Physical Address</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {[viewingPropDetails.address, viewingPropDetails.city, viewingPropDetails.state, viewingPropDetails.zip_code].filter(Boolean).join(', ') || 'No address provided'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">GM Contact</span>
                    <span className="font-medium text-slate-900 dark:text-white">{viewingPropDetails.general_manager_name || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Ray Baum Status</span>
                    <span className="font-medium text-slate-900 dark:text-white">{viewingPropDetails.ray_baum_status || 'ACTIVE'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setViewingPropDetails(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Property Services Modal */}
      <AnimatePresence>
        {viewingPropServices && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPropServices(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Services: {viewingPropServices.propName}
                      </h3>
                      <p className="text-xs text-slate-400">Telecom &amp; voice lines</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingPropServices(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {loadingPropServices ? (
                    <div className="py-8 flex justify-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : viewingPropServices.services.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No services assigned to this property yet.
                    </div>
                  ) : (
                    viewingPropServices.services.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{s.phone_number || s.name || 'Unnamed Line'}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{s.service_type || 'Voice Line'} {s.carrier ? `· ${s.carrier}` : ''}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          {s.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    onClick={() => setViewingPropServices(null)}
                    className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Change Property Status Modal */}
      <AnimatePresence>
        {statusPropTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusPropTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Change Property Status
                    </h3>
                    <p className="text-xs text-slate-400">{statusPropTarget.name}</p>
                  </div>
                  <button
                    onClick={() => setStatusPropTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {['ACTIVE', 'PENDING', 'INACTIVE'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleSavePropertyStatus(st)}
                      disabled={savingPropStatus}
                      className={`w-full p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center justify-between ${
                        statusPropTarget.status === st
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#1a1b22] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{st}</span>
                      {statusPropTarget.status === st && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
