'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layers, X, Edit2, Trash2, Plus, RefreshCw, Loader2 } from 'lucide-react';
import type { ServiceTypeItem } from './types';

interface ManageServiceTypesModalProps {
  showManageTypesModal: boolean;
  onClose: () => void;
  serviceTypes: ServiceTypeItem[];
  loadServiceTypes: () => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ManageServiceTypesModal({
  showManageTypesModal,
  onClose,
  serviceTypes,
  loadServiceTypes,
  onToast,
}: ManageServiceTypesModalProps) {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [typeActionLoading, setTypeActionLoading] = useState(false);
  const [editingType, setEditingType] = useState<ServiceTypeItem | null>(null);

  const handleCreateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch('/api/admin/service-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName.trim(), description: newTypeDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add service type');
      onToast('Service Type Added', `"${newTypeName}" is now available.`, 'success');
      setNewTypeName('');
      setNewTypeDescription('');
      loadServiceTypes();
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  const handleUpdateServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.name.trim()) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch('/api/admin/service-types', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingType.id, name: editingType.name.trim(), description: editingType.description?.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update service type');
      onToast('Updated', 'Service type updated.', 'success');
      setEditingType(null);
      loadServiceTypes();
    } catch (err: any) {
      onToast('Error', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  const handleDeleteServiceType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete service type "${name}"?`)) return;
    try {
      setTypeActionLoading(true);
      const res = await fetch(`/api/admin/service-types?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete service type');
      onToast('Deleted', `Service type "${name}" removed.`, 'success');
      loadServiceTypes();
    } catch (err: any) {
      onToast('Cannot Delete', err.message, 'error');
    } finally {
      setTypeActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showManageTypesModal && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Manage Service Types</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure telecom service categories</p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setEditingType(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs">
              {/* Form to add or edit a type */}
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-slate-50 dark:bg-[#111217]">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2.5">
                  {editingType ? 'Edit Service Type' : 'Add New Service Type'}
                </h4>
                {editingType ? (
                  <form onSubmit={handleUpdateServiceType} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={editingType.name}
                        onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={editingType.description || ''}
                        onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                        placeholder="e.g. Dedicated emergency phone line"
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingType(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={typeActionLoading}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {typeActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCreateServiceType} className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Service Type Name</label>
                      <input
                        type="text"
                        required
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="e.g. Dedicated Fiber Link"
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (optional)</label>
                      <input
                        type="text"
                        value={newTypeDescription}
                        onChange={(e) => setNewTypeDescription(e.target.value)}
                        placeholder="e.g. High throughput commercial fiber line"
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={typeActionLoading || !newTypeName.trim()}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        {typeActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5" /> Add Type</>}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* List of existing types */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center justify-between">
                  <span>Available Types ({serviceTypes.length})</span>
                  <button
                    type="button"
                    onClick={loadServiceTypes}
                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 cursor-pointer font-normal"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </h4>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {serviceTypes.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-lg border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{t.name}</p>
                        {t.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingType({ id: t.id, name: t.name, description: t.description })}
                          className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                          title="Edit Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteServiceType(t.id, t.name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete Type"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setEditingType(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
