'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Trash2 } from 'lucide-react';

export interface VendorFormData {
  name: string;
  category: string;
  monthly_cost: string;
  monthly_billed: string;
  status: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
}

interface VendorModalsProps {
  showAddModal: boolean;
  setShowAddModal: (val: boolean) => void;
  editingVendor: any;
  vendorForm: VendorFormData;
  setVendorForm: React.Dispatch<React.SetStateAction<VendorFormData>>;
  formSubmitting: boolean;
  handleSaveVendor: (e: React.FormEvent) => void;
  vendorToDelete: any | null;
  setVendorToDelete: (val: any | null) => void;
  deleteLoading: boolean;
  handleConfirmDeleteVendor: () => void;
}

export function VendorModals({
  showAddModal,
  setShowAddModal,
  editingVendor,
  vendorForm,
  setVendorForm,
  formSubmitting,
  handleSaveVendor,
  vendorToDelete,
  setVendorToDelete,
  deleteLoading,
  handleConfirmDeleteVendor,
}: VendorModalsProps) {
  return (
    <>
      {/* Add / Edit Vendor Modal */}
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
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VOLA, Bandwidth.com"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={vendorForm.category}
                      onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Telecom">Telecom</option>
                      <option value="Software">Software</option>
                      <option value="Fireline Equipment">Fireline Equipment</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Logistics">Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={vendorForm.status}
                      onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Cost Paid ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={vendorForm.monthly_cost}
                      onChange={(e) => setVendorForm({ ...vendorForm, monthly_cost: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Billed ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={vendorForm.monthly_billed}
                      onChange={(e) => setVendorForm({ ...vendorForm, monthly_billed: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={vendorForm.contact_person}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="rep@vendor.com"
                      value={vendorForm.contact_email}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (800)..."
                      value={vendorForm.contact_phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Contract terms, renewal rules, etc."
                    value={vendorForm.notes}
                    onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Vendor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Vendor Confirmation Modal */}
      <AnimatePresence>
        {vendorToDelete && (
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Vendor</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <b className="text-slate-800 dark:text-slate-200">{vendorToDelete.name}</b>? This will permanently delete the vendor record and remove all associated equipment and allocations. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#20222a]">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setVendorToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#282a36] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteVendor}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Vendor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

