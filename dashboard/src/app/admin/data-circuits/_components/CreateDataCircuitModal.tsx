'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, X, Loader2 } from 'lucide-react';
import type { CircuitStatus } from './types';

interface CreateDataCircuitModalProps {
  showCreateModal: boolean;
  onClose: () => void;
  properties: any[];
  onSuccess: (circuit: any) => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CreateDataCircuitModal({
  showCreateModal,
  onClose,
  properties,
  onSuccess,
  onToast,
}: CreateDataCircuitModalProps) {
  const [createForm, setCreateForm] = useState({
    property_id: '',
    connectivity_type: 'BOTH' as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
    status: 'STARTED' as CircuitStatus,
    technical_details: '',
    internal_admin_notes: '',
  });
  const [creating, setCreating] = useState(false);

  const handleCreateCircuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_id) {
      onToast('Property is required', undefined, 'error');
      return;
    }
    try {
      setCreating(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (json.success) {
        onToast('Circuit Created', 'New data circuit initialized at Started stage.');
        setCreateForm({
          property_id: '',
          connectivity_type: 'BOTH',
          status: 'STARTED',
          technical_details: '',
          internal_admin_notes: '',
        });
        onClose();
        onSuccess(json.data);
      } else {
        onToast('Failed to create circuit', json.error, 'error');
      }
    } catch (err: any) {
      onToast('Error creating circuit', err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8"
          >
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]">
              <div className="flex items-center gap-2.5">
                <Network className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    New Data Circuit Request
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select a property to start a data circuit (Stage: 1. Started). Wholesaler pricing can be added via Manage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCircuit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Select Property *
                  </label>
                  <select
                    required
                    value={createForm.property_id}
                    onChange={(e) => setCreateForm((p) => ({ ...p, property_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="">-- Choose Property --</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name} ({prop.city}, {prop.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Property Connectivity Mode
                  </label>
                  <select
                    value={createForm.connectivity_type}
                    onChange={(e) =>
                      setCreateForm((p) => ({
                        ...p,
                        connectivity_type: e.target.value as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="BOTH">Both (Ported &amp; Data Circuited)</option>
                    <option value="DATA_CIRCUITED">Data Circuited Only</option>
                    <option value="PORTED">Ported Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Start Data Circuit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
