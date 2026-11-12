'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit2,
  Eye,
  Link2,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgServiceActionModalsProps {
  org: OrgDetail;
  activeServiceMenu: { srv: any; bottom: number; left: number } | null;
  setActiveServiceMenu: (menu: { srv: any; bottom: number; left: number } | null) => void;
  handleOpenEditService: (srv: any) => void;
  setViewingServiceDetails: (srv: any) => void;
  handleOpenAssignServiceToProp: (srv: any) => void;
  setDeleteServiceTarget: (srv: any) => void;
  editingServiceTarget: any | null;
  setEditingServiceTarget: (srv: any | null) => void;
  editServiceForm: {
    phone_number: string;
    service_type: string;
    status: string;
    description: string;
  };
  setEditServiceForm: React.Dispatch<React.SetStateAction<{
    phone_number: string;
    service_type: string;
    status: string;
    description: string;
  }>>;
  savingEditService: boolean;
  handleSaveEditService: (e: React.FormEvent) => Promise<void>;
  viewingServiceDetails: any | null;
  assignServiceToPropTarget: any | null;
  setAssignServiceToPropTarget: (srv: any | null) => void;
  selectedPropForService: string;
  setSelectedPropForService: (id: string) => void;
  savingAssignServiceToProp: boolean;
  handleSaveAssignServiceToProp: (e: React.FormEvent) => Promise<void>;
}

export function OrgServiceActionModals({
  org,
  activeServiceMenu,
  setActiveServiceMenu,
  handleOpenEditService,
  setViewingServiceDetails,
  handleOpenAssignServiceToProp,
  setDeleteServiceTarget,
  editingServiceTarget,
  setEditingServiceTarget,
  editServiceForm,
  setEditServiceForm,
  savingEditService,
  handleSaveEditService,
  viewingServiceDetails,
  assignServiceToPropTarget,
  setAssignServiceToPropTarget,
  selectedPropForService,
  setSelectedPropForService,
  savingAssignServiceToProp,
  handleSaveAssignServiceToProp,
}: OrgServiceActionModalsProps) {
  return (
    <>
      {/* 3-Dots Action Popover Menu for Services (Opens strictly ABOVE) */}
      <AnimatePresence>
        {activeServiceMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActiveServiceMenu(null)}
            />
            <div
              style={{
                position: 'fixed',
                bottom: `${activeServiceMenu.bottom}px`,
                left: `${activeServiceMenu.left}px`,
              }}
              className="z-50 w-56 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            >
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#2b2d3b] bg-slate-50/50 dark:bg-[#15161c]/50">
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {activeServiceMenu.srv.phone_number || activeServiceMenu.srv.name || 'Service'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Service Actions</div>
              </div>

              {/* 1. Edit Service */}
              <button
                onClick={() => {
                  handleOpenEditService(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Edit Service Details</span>
              </button>

              {/* 2. View Service Info */}
              <button
                onClick={() => {
                  setViewingServiceDetails(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-purple-500" />
                <span>View Full Info</span>
              </button>

              {/* 3. Assign / Move to Property */}
              <button
                onClick={() => {
                  handleOpenAssignServiceToProp(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assign to Property</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-[#2b2d3b]" />

              {/* 4. Delete Service */}
              <button
                onClick={() => {
                  setDeleteServiceTarget(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Service</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingServiceTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingServiceTarget(null)}
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
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Edit Service Details
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {editingServiceTarget.phone_number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingServiceTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditService} className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={editServiceForm.phone_number}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, phone_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Service Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={editServiceForm.service_type}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, service_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Status
                    </label>
                    <select
                      value={editServiceForm.status}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Description / Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editServiceForm.description}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingServiceTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingEditService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingEditService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Service</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Service Details Modal */}
      <AnimatePresence>
        {viewingServiceDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingServiceDetails(null)}
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
                      <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {viewingServiceDetails.phone_number}
                      </h3>
                      <p className="text-xs text-slate-400">Service Information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingServiceDetails(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Type</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{viewingServiceDetails.service_type || 'Voice Line'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Status</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{viewingServiceDetails.status || 'ACTIVE'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Assigned Property</span>
                    <span className="font-medium text-slate-900 dark:text-white">{viewingServiceDetails.property?.name || viewingServiceDetails.property_name || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Carrier</span>
                    <span className="font-medium text-slate-900 dark:text-white">{viewingServiceDetails.carrier || 'Standard'}</span>
                  </div>
                  <div className="col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Notes</span>
                    <span className="font-medium text-slate-900 dark:text-white">{viewingServiceDetails.description || 'No description provided.'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setViewingServiceDetails(null)}
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

      {/* Assign Service to Property Modal */}
      <AnimatePresence>
        {assignServiceToPropTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignServiceToPropTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Assign to Property
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {assignServiceToPropTarget.phone_number}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssignServiceToPropTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAssignServiceToProp} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                      Select Property in {org.name} *
                    </label>
                    <select
                      value={selectedPropForService}
                      onChange={(e) => setSelectedPropForService(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose property --</option>
                      {(org.properties || []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                    <button
                      type="button"
                      onClick={() => setAssignServiceToPropTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingAssignServiceToProp || !selectedPropForService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingAssignServiceToProp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Assign Service</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
