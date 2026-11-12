'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Trash2 } from 'lucide-react';

export interface ServerFormData {
  name: string;
  provider: string;
  purpose: string;
  ip_address: string;
  monthly_cost: string;
  status: string;
  renewal_date: string;
  notes: string;
}

interface ServerModalsProps {
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  editingServer: any;
  serverForm: ServerFormData;
  setServerForm: React.Dispatch<React.SetStateAction<ServerFormData>>;
  formSubmitting: boolean;
  handleSaveServer: (e: React.FormEvent) => void;
  serverToDelete: any | null;
  setServerToDelete: (val: any | null) => void;
  deleteLoading: boolean;
  handleConfirmDeleteServer: () => void;
}

export function ServerModals({
  showAddModal,
  setShowAddModal,
  editingServer,
  serverForm,
  setServerForm,
  formSubmitting,
  handleSaveServer,
  serverToDelete,
  setServerToDelete,
  deleteLoading,
  handleConfirmDeleteServer,
}: ServerModalsProps) {
  return (
    <>
      {/* Add / Edit Server Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingServer ? 'Edit Server Instance' : 'Add New Server Instance'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveServer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Server Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PBX Master Node 01, Database Cluster"
                    value={serverForm.name}
                    onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={serverForm.status}
                      onChange={(e) => setServerForm({ ...serverForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="ACTIVE">ACTIVE (Included in Expenses)</option>
                      <option value="DECOMMISSIONED">DECOMMISSIONED (Excluded)</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Cost ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="100.00"
                      value={serverForm.monthly_cost}
                      onChange={(e) => setServerForm({ ...serverForm, monthly_cost: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Renewal Date</label>
                    <input
                      type="date"
                      value={serverForm.renewal_date}
                      onChange={(e) => setServerForm({ ...serverForm, renewal_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IP Address / Host</label>
                    <input
                      type="text"
                      placeholder="54.210.88.12"
                      value={serverForm.ip_address}
                      onChange={(e) => setServerForm({ ...serverForm, ip_address: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose / Role</label>
                  <input
                    type="text"
                    placeholder="Core PBX router, Postgres DB, etc."
                    value={serverForm.purpose}
                    onChange={(e) => setServerForm({ ...serverForm, purpose: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="SSH keys, provider credentials reference, SLA..."
                    value={serverForm.notes}
                    onChange={(e) => setServerForm({ ...serverForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Server
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Server Confirmation Modal */}
      <AnimatePresence>
        {serverToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/40 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Server</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <b className="text-slate-800 dark:text-slate-200">{serverToDelete.name}</b>? This will permanently remove this instance from your infrastructure records. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#20222a]">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setServerToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#282a36] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteServer}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Server
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

