'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Loader2,
  Trash2,
  Settings,
  Check,
} from 'lucide-react';

interface OrgPropertySettingsModalProps {
  isSuperAdmin: boolean;
  propContactsTarget: any | null;
  setPropContactsTarget: (val: any | null) => void;
  loadingPropContacts: boolean;
  showAddPropContactForm: boolean;
  setShowAddPropContactForm: (val: boolean) => void;
  newPropContact: { name: string; email: string; phone: string; role: string };
  setNewPropContact: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; role: string }>>;
  savingPropContact: boolean;
  propContactsList: any[];
  handleAddPropContact: (e: React.FormEvent) => Promise<void>;
  handleDeletePropContact: (id: string) => Promise<void>;
  editingPropSettingsTarget: any | null;
  setEditingPropSettingsTarget: (val: any | null) => void;
  editPropSettingsForm: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    monthly_price: string | number;
    main_phone: string;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    ray_baum_status: string;
    status: string;
  };
  setEditPropSettingsForm: React.Dispatch<React.SetStateAction<{
    name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    monthly_price: string | number;
    main_phone: string;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    ray_baum_status: string;
    status: string;
  }>>;
  savingPropSettings: boolean;
  handleSavePropertySettings: (e: React.FormEvent) => Promise<void>;
}

export function OrgPropertySettingsModal({
  isSuperAdmin,
  propContactsTarget,
  setPropContactsTarget,
  loadingPropContacts,
  showAddPropContactForm,
  setShowAddPropContactForm,
  newPropContact,
  setNewPropContact,
  savingPropContact,
  propContactsList,
  handleAddPropContact,
  handleDeletePropContact,
  editingPropSettingsTarget,
  setEditingPropSettingsTarget,
  editPropSettingsForm,
  setEditPropSettingsForm,
  savingPropSettings,
  handleSavePropertySettings,
}: OrgPropertySettingsModalProps) {
  return (
    <>
      {/* Property Contacts Management Modal */}
      <AnimatePresence>
        {propContactsTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPropContactsTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[88vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] shrink-0">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Property Contacts
                    </h3>
                    <p className="text-xs text-slate-400">
                      Managing contacts for {propContactsTarget.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setPropContactsTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {/* Contact List */}
                  {loadingPropContacts ? (
                    <div className="py-8 flex justify-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : propContactsList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No property-specific contacts added yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {propContactsList.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                                {c.role || 'Contact'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                              {c.email && <span>{c.email}</span>}
                              {c.phone && <span>{c.phone}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePropContact(c.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Contact Accordion Form */}
                  {showAddPropContactForm ? (
                    <form onSubmit={handleAddPropContact} className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3 text-xs">
                      <div className="font-bold text-blue-700 dark:text-blue-300">New Contact</div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                          <input
                            type="text"
                            required
                            value={newPropContact.name}
                            onChange={(e) => setNewPropContact({ ...newPropContact, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                          <input
                            type="text"
                            placeholder="e.g. GM, Chief Eng."
                            value={newPropContact.role}
                            onChange={(e) => setNewPropContact({ ...newPropContact, role: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                          <input
                            type="email"
                            value={newPropContact.email}
                            onChange={(e) => setNewPropContact({ ...newPropContact, email: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                          <input
                            type="tel"
                            value={newPropContact.phone}
                            onChange={(e) => setNewPropContact({ ...newPropContact, phone: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddPropContactForm(false)}
                          className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingPropContact}
                          className="px-3.5 py-1 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {savingPropContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Save Contact
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddPropContactForm(true)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-[#2a2c3a] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Property Contact</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Property Settings Modal */}
      <AnimatePresence>
        {editingPropSettingsTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPropSettingsTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Edit Property Settings
                      </h3>
                      <p className="text-xs text-slate-400">
                        {editingPropSettingsTarget.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingPropSettingsTarget(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212c] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePropertySettings} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Property Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editPropSettingsForm.name}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Main Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={editPropSettingsForm.main_phone}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, main_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {isSuperAdmin && (
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Monthly Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 299.00"
                          value={editPropSettingsForm.monthly_price}
                          onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, monthly_price: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={editPropSettingsForm.address}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">City</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.city}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State</label>
                        <input
                          type="text"
                          value={editPropSettingsForm.state}
                          onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, state: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={editPropSettingsForm.zip_code}
                          onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, zip_code: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GM Name</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.general_manager_name}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GM Phone</label>
                      <input
                        type="tel"
                        value={editPropSettingsForm.general_manager_phone}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">GM Email</label>
                      <input
                        type="email"
                        value={editPropSettingsForm.general_manager_email}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ray Baum Compliance</label>
                      <select
                        value={editPropSettingsForm.ray_baum_status}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, ray_baum_status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE (Compliant)</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Property Status</label>
                      <select
                        value={editPropSettingsForm.status}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingPropSettingsTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingPropSettings}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingPropSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Settings</span>
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
