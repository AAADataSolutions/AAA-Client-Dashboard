'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, Phone, X, Loader2, UserPlus, Trash2 } from 'lucide-react';
import { PropertyItem } from '@/store/slices/propertiesSlice';
import { ContactItem } from './types';

interface PropertyContactsDrawerProps {
  showContactsDrawer: boolean;
  setShowContactsDrawer: (show: boolean) => void;
  selectedPropForContacts: PropertyItem | null;
  contactsList: ContactItem[];
  loadingContacts: boolean;
  showAddContactModal: boolean;
  setShowAddContactModal: (show: boolean) => void;
  contactFormData: {
    full_name: string;
    email: string;
    phone_number: string;
    role: string;
    is_primary: boolean;
  };
  setContactFormData: React.Dispatch<
    React.SetStateAction<{
      full_name: string;
      email: string;
      phone_number: string;
      role: string;
      is_primary: boolean;
    }>
  >;
  savingContact: boolean;
  handleAddContactSubmit: (e: React.FormEvent) => void;
  contactToDelete: ContactItem | null;
  setContactToDelete: (contact: ContactItem | null) => void;
  deletingContact: boolean;
  handleConfirmDeleteContact: () => void;
}

export function PropertyContactsDrawer({
  showContactsDrawer,
  setShowContactsDrawer,
  selectedPropForContacts,
  contactsList,
  loadingContacts,
  showAddContactModal,
  setShowAddContactModal,
  contactFormData,
  setContactFormData,
  savingContact,
  handleAddContactSubmit,
  contactToDelete,
  setContactToDelete,
  deletingContact,
  handleConfirmDeleteContact,
}: PropertyContactsDrawerProps) {
  return (
    <>
      {/* 4. MANAGE CONTACTS DRAWER */}
      <AnimatePresence>
        {showContactsDrawer && selectedPropForContacts && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setShowContactsDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Property Contacts</h3>
                    <p className="text-xs text-slate-400">{selectedPropForContacts.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactsDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-slate-100 dark:border-[#222430] flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {contactsList.length} Contacts
                </span>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Contact
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingContacts ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading contacts...
                  </div>
                ) : contactsList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-400">
                    No contacts saved for this property yet.
                  </div>
                ) : (
                  contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{contact.name}</span>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </p>
                        {contact.phone && (
                          <p className="text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setContactToDelete(contact)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Remove Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ADD CONTACT MODAL */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-[#222430] shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Add Property Contact</h3>
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContactSubmit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 text-xs">
                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    placeholder="sarah@hotel.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-black dark:text-white block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={contactFormData.phone_number}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="prop_contact_primary"
                    checked={contactFormData.is_primary}
                    onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="prop_contact_primary" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Set as Primary Contact for this Property
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. DELETE CONTACT CONFIRMATION MODAL (Yes/No) */}
      <AnimatePresence>
        {contactToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Remove Contact</h3>
                  <p className="text-xs text-slate-500">Are you sure you want to delete this contact?</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{contactToDelete.name}</p>
                <p className="text-slate-500">{contactToDelete.email}</p>
              </div>

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  onClick={() => setContactToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteContact}
                  disabled={deletingContact}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {deletingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

