'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Plus,
  Layers,
  X,
  Edit2,
  Loader2,
  Check,
  Upload,
} from 'lucide-react';
import { type OrgRecord } from '@/store/slices/organizationsSlice';
import { type EditOrgFormData, type PropertyItem } from './types';

interface EditAndPropertiesDrawersProps {
  showEditDrawer: boolean;
  setShowEditDrawer: (v: boolean) => void;
  selectedOrgForEdit: OrgRecord | null;
  handleSaveEdit: (e: React.FormEvent) => void;
  editLogoPreview: string | null;
  setEditLogoPreview: (v: string | null) => void;
  editLogoFile: File | null;
  setEditLogoFile: (v: File | null) => void;
  editLogoInputRef: React.RefObject<HTMLInputElement | null>;
  editFormData: EditOrgFormData;
  setEditFormData: React.Dispatch<React.SetStateAction<EditOrgFormData>>;
  editSaving: boolean;
  showToast: (text: string, type?: 'success' | 'error') => void;
  showPropertiesDrawer: boolean;
  setShowPropertiesDrawer: (v: boolean) => void;
  selectedOrgForProps: OrgRecord | null;
  orgPropertiesList: PropertyItem[];
  loadingOrgProps: boolean;
  handleOpenAssignModal: () => void;
  showAssignPropModal: boolean;
  setShowAssignPropModal: (v: boolean) => void;
  handleAssignPropertySubmit: (e: React.FormEvent) => void;
  loadingAvailableProps: boolean;
  selectedPropToAssign: string;
  setSelectedPropToAssign: (v: string) => void;
  allAvailableProps: PropertyItem[];
  assigningLoading: boolean;
}

export function EditAndPropertiesDrawers({
  showEditDrawer,
  setShowEditDrawer,
  selectedOrgForEdit,
  handleSaveEdit,
  editLogoPreview,
  setEditLogoPreview,
  editLogoFile,
  setEditLogoFile,
  editLogoInputRef,
  editFormData,
  setEditFormData,
  editSaving,
  showToast,
  showPropertiesDrawer,
  setShowPropertiesDrawer,
  selectedOrgForProps,
  orgPropertiesList,
  loadingOrgProps,
  handleOpenAssignModal,
  showAssignPropModal,
  setShowAssignPropModal,
  handleAssignPropertySubmit,
  loadingAvailableProps,
  selectedPropToAssign,
  setSelectedPropToAssign,
  allAvailableProps,
  assigningLoading,
}: EditAndPropertiesDrawersProps) {
  return (
    <>
      {/* Edit Organization Drawer */}
      <AnimatePresence>
        {showEditDrawer && selectedOrgForEdit && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowEditDrawer(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Organization</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedOrgForEdit.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {/* Organization Logo */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Organization Logo
                  </label>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/60">
                    {editLogoPreview ? (
                      <div className="relative w-12 h-12 rounded-xl border border-slate-200 dark:border-[#282a36] overflow-hidden bg-white dark:bg-[#1a1b24] shrink-0">
                        <img src={editLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditLogoFile(null);
                            setEditLogoPreview(null);
                            setEditFormData((prev) => ({ ...prev, logo_url: '' }));
                            if (editLogoInputRef.current) editLogoInputRef.current.value = '';
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 cursor-pointer shadow-xs"
                          title="Remove logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 dark:border-[#2f3242] flex items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-[#15161c] shrink-0">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1">
                      <input
                        ref={editLogoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 5 * 1024 * 1024) {
                              showToast('Logo file size must be 5MB or less.', 'error');
                              return;
                            }
                            setEditLogoFile(file);
                            setEditLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => editLogoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#252733] hover:bg-slate-100 dark:hover:bg-[#1d1f28] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>{editLogoFile || editLogoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                      </button>
                      <p className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP up to 5MB.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.contact_name}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                    placeholder="e.g., Jane Doe"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">ZIP</label>
                    <input
                      type="text"
                      value={editFormData.zip_code}
                      onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Type</label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="GROUP">Group</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="PENDING_ONBOARDING">Pending Onboarding</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditDrawer(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={editSaving}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Properties Drawer */}
      <AnimatePresence>
        {showPropertiesDrawer && selectedOrgForProps && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowPropertiesDrawer(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
                <div className="flex items-center gap-3">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Properties</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrgForProps.name} ({orgPropertiesList.length} Properties)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPropertiesDrawer(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Properties Managed
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleOpenAssignModal}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Property</span>
                  </motion.button>
                </div>

                {loadingOrgProps ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs text-slate-400">Loading properties...</span>
                  </div>
                ) : orgPropertiesList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-800 dark:text-white">No properties assigned</p>
                    <p className="text-slate-400 text-[11px]">
                      Click &quot;Assign Property&quot; to link properties to this organization portfolio.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orgPropertiesList.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {prop.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {prop.address || `${prop.city || ''}, ${prop.state || ''}`}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {prop.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex justify-end">
                <button
                  onClick={() => setShowPropertiesDrawer(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowAssignPropModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden z-10"
              >
                <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Assign Property to {selectedOrgForProps?.name}
                  </h3>
                  <button
                    onClick={() => setShowAssignPropModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignPropertySubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Select Property to Link
                    </label>
                    {loadingAvailableProps ? (
                      <div className="p-3 bg-slate-50 dark:bg-[#111217] rounded-lg text-slate-400">
                        Loading properties...
                      </div>
                    ) : (
                      <select
                        value={selectedPropToAssign}
                        onChange={(e) => setSelectedPropToAssign(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {allAvailableProps.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430] shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAssignPropModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={assigningLoading || !selectedPropToAssign}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
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
