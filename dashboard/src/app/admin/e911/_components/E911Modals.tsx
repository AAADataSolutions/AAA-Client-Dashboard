'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X, Loader2 } from 'lucide-react';
import { E911Item } from '@/store/slices/e911Slice';
import { E911Status, PropertyOption } from './types';

interface E911ModalsProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  createForm: {
    property_id: string;
    emergency_address: string;
    status: E911Status;
  };
  setCreateForm: React.Dispatch<
    React.SetStateAction<{
      property_id: string;
      emergency_address: string;
      status: E911Status;
    }>
  >;
  createLoading: boolean;
  createError: string | null;
  propertyList: PropertyOption[];
  onPropertySelectInAdd: (propId: string) => void;
  onCreateSubmit: (e: React.FormEvent) => void;

  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  selectedRecordForEdit: E911Item | null;
  editForm: {
    emergency_address: string;
    status: E911Status;
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      emergency_address: string;
      status: E911Status;
    }>
  >;
  editLoading: boolean;
  editError: string | null;
  onEditSubmit: (e: React.FormEvent) => void;
}

export default function E911Modals({
  showCreateModal,
  setShowCreateModal,
  createForm,
  setCreateForm,
  createLoading,
  createError,
  propertyList,
  onPropertySelectInAdd,
  onCreateSubmit,
  showEditModal,
  setShowEditModal,
  selectedRecordForEdit,
  editForm,
  setEditForm,
  editLoading,
  editError,
  onEditSubmit,
}: E911ModalsProps) {
  return (
    <>
      {/* 1. ADD E911 MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Add Emergency Dispatch Location</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                  {createError}
                </div>
              )}

              <form onSubmit={onCreateSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                  {/* 1. Choose Property */}
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">
                      Choose Property <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={createForm.property_id}
                      onChange={(e) => onPropertySelectInAdd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Property...</option>
                      {propertyList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.organization_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Emergency Dispatch Address */}
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">
                      Emergency Dispatch Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={createForm.emergency_address}
                      onChange={(e) => setCreateForm({ ...createForm, emergency_address: e.target.value })}
                      placeholder="Enter full MSAG-compliant street address, suite/floor, city, state & zip..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 3. Validation Status */}
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Validation Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as E911Status })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="VERIFIED">Active / PSAP Verified</option>
                      <option value="PENDING">Pending Validation</option>
                      <option value="CORRECTION_REQUIRED">Correction Required</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Register Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. EDIT E911 MODAL */}
      <AnimatePresence>
        {showEditModal && selectedRecordForEdit && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit E911 Record</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                  {editError}
                </div>
              )}

              <form onSubmit={onEditSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Property</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecordForEdit.property_name} ({selectedRecordForEdit.organization_name})
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">
                      Emergency Dispatch Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={editForm.emergency_address}
                      onChange={(e) => setEditForm({ ...editForm, emergency_address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-black dark:text-white block mb-1">Validation Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as E911Status })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="VERIFIED">Active / PSAP Verified</option>
                      <option value="PENDING">Pending Validation</option>
                      <option value="CORRECTION_REQUIRED">Correction Required</option>
                      <option value="FAILED">Routing Failed</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
