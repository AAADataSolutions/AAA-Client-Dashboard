'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, X, Plus, Edit2, Trash2, Check, Loader2 } from 'lucide-react';
import type { WholesalerItem } from './types';

interface WholesalersDirectoryModalProps {
  showWholesalersModal: boolean;
  onClose: () => void;
  wholesalers: WholesalerItem[];
  fetchWholesalers: () => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function WholesalersDirectoryModal({
  showWholesalersModal,
  onClose,
  wholesalers,
  fetchWholesalers,
  onToast,
}: WholesalersDirectoryModalProps) {
  const [wholesalerForm, setWholesalerForm] = useState({ id: '', name: '', phone: '' });
  const [editingWholesalerId, setEditingWholesalerId] = useState<string | null>(null);
  const [savingWholesaler, setSavingWholesaler] = useState(false);
  const [deletingWholesalerId, setDeletingWholesalerId] = useState<string | null>(null);

  const handleSaveWholesaler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesalerForm.name.trim()) {
      onToast('Name required', 'Wholesaler name cannot be empty.', 'error');
      return;
    }
    try {
      setSavingWholesaler(true);
      const isEdit = Boolean(editingWholesalerId);
      const res = await fetch('/api/admin/data-circuits/wholesalers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWholesalerId,
          name: wholesalerForm.name.trim(),
          phone: wholesalerForm.phone?.trim() || '',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save wholesaler');
      }
      onToast(isEdit ? 'Wholesaler Updated' : 'Wholesaler Added', `${wholesalerForm.name} saved.`);
      setWholesalerForm({ id: '', name: '', phone: '' });
      setEditingWholesalerId(null);
      fetchWholesalers();
    } catch (err: any) {
      onToast('Save failed', err.message, 'error');
    } finally {
      setSavingWholesaler(false);
    }
  };

  const handleDeleteWholesaler = async (id: string, name: string) => {
    try {
      setDeletingWholesalerId(id);
      const res = await fetch(`/api/admin/data-circuits/wholesalers?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete wholesaler');
      }
      onToast('Wholesaler Removed', `${name} deleted.`);
      if (editingWholesalerId === id) {
        setEditingWholesalerId(null);
        setWholesalerForm({ id: '', name: '', phone: '' });
      }
      fetchWholesalers();
    } catch (err: any) {
      onToast('Delete failed', err.message, 'error');
    } finally {
      setDeletingWholesalerId(null);
    }
  };

  return (
    <AnimatePresence>
      {showWholesalersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8"
          >
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Wholesalers Directory
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add, edit, or delete wholesalers (strictly hidden from clients).
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setEditingWholesalerId(null);
                  setWholesalerForm({ id: '', name: '', phone: '' });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs">
              {/* Form to Add / Edit Wholesaler */}
              <form onSubmit={handleSaveWholesaler} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{editingWholesalerId ? 'Edit Wholesaler' : 'Add New Wholesaler'}</span>
                  {editingWholesalerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWholesalerId(null);
                        setWholesalerForm({ id: '', name: '', phone: '' });
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] font-normal cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Wholesaler Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Airtel Wholesale / Jio"
                      value={wholesalerForm.name}
                      onChange={(e) => setWholesalerForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={wholesalerForm.phone}
                      onChange={(e) => setWholesalerForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingWholesaler}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {savingWholesaler ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingWholesalerId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {editingWholesalerId ? 'Update Wholesaler' : 'Save Wholesaler'}
                  </button>
                </div>
              </form>

              {/* Wholesalers Directory List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Saved Wholesalers ({wholesalers.length})</span>
                </h4>

                {wholesalers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-[#282a36] rounded-xl">
                    <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No Wholesalers Added Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use the form above to add your telecom wholesalers.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#282a36] border border-slate-200 dark:border-[#282a36] rounded-xl overflow-hidden bg-white dark:bg-[#15161c]">
                    {wholesalers.map((w) => (
                      <div key={w.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#1a1c24]/50">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{w.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {w.phone ? (
                              <span className="flex items-center gap-1">
                                📞 {w.phone}
                              </span>
                            ) : (
                              <span className="italic text-slate-400">No phone number</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWholesalerId(w.id);
                              setWholesalerForm({ id: w.id, name: w.name, phone: w.phone || '' });
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                            title="Edit Wholesaler"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingWholesalerId === w.id}
                            onClick={() => handleDeleteWholesaler(w.id, w.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Wholesaler"
                          >
                            {deletingWholesalerId === w.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
