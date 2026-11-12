'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  X,
  UploadCloud,
  Check,
  Loader2,
} from 'lucide-react';

interface OrgEditModalProps {
  showEditOrgModal: boolean;
  setShowEditOrgModal: (show: boolean) => void;
  editFormData: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
    status: string;
    logo_url: string;
  };
  setEditFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone: string;
    email: string;
    status: string;
    logo_url: string;
  }>>;
  editSaving: boolean;
  editLogoPreview: string | null;
  setEditLogoPreview: (val: string | null) => void;
  setEditLogoFile: (file: File | null) => void;
  editLogoInputRef: React.RefObject<HTMLInputElement | null>;
  showToast: (text: string, type?: 'success' | 'error') => void;
  handleSaveOrgEdit: (e: React.FormEvent) => Promise<void>;
}

export function OrgEditModal({
  showEditOrgModal,
  setShowEditOrgModal,
  editFormData,
  setEditFormData,
  editSaving,
  editLogoPreview,
  setEditLogoPreview,
  setEditLogoFile,
  editLogoInputRef,
  showToast,
  handleSaveOrgEdit,
}: OrgEditModalProps) {
  return (
    <AnimatePresence>
      {showEditOrgModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditOrgModal(false)}
            className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden z-10"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Organization Profile</h3>
                <button onClick={() => setShowEditOrgModal(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOrgEdit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
                {/* Organization Logo */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                    Organization Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-[#2a2d3d] bg-slate-50 dark:bg-[#111217] flex items-center justify-center overflow-hidden shrink-0">
                      {editLogoPreview ? (
                        <img src={editLogoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          ref={editLogoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                showToast('Image size should be less than 5MB', 'error');
                                return;
                              }
                              setEditLogoFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditLogoPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => editLogoInputRef.current?.click()}
                          className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-[#1e2029] border border-slate-200 dark:border-[#2a2d3d] hover:bg-slate-50 dark:hover:bg-[#252836] text-slate-700 dark:text-slate-300 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{editLogoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                        </button>
                        {editLogoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditLogoFile(null);
                              setEditLogoPreview(null);
                              setEditFormData((prev) => ({ ...prev, logo_url: '' }));
                              if (editLogoInputRef.current) editLogoInputRef.current.value = '';
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40 rounded-lg transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG, JPG, SVG, WebP up to 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
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
                  <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
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
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">ZIP Code</label>
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
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Organization Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="PENDING_ONBOARDING">PENDING_ONBOARDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEditOrgModal(false)}
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
