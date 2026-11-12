'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';
import { PropertyItem } from '@/store/slices/propertiesSlice';

export interface PropertyDeleteModalProps {
  propertyToDelete: PropertyItem | null;
  setPropertyToDelete: (prop: PropertyItem | null) => void;
  deletePropertyLoading: boolean;
  handleConfirmDeleteProperty: () => void;
}

export function PropertyDeleteModal({
  propertyToDelete,
  setPropertyToDelete,
  deletePropertyLoading,
  handleConfirmDeleteProperty,
}: PropertyDeleteModalProps) {
  return (
    <AnimatePresence>
      {propertyToDelete && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Property</h3>
                <p className="text-xs text-slate-400 font-mono">{propertyToDelete.name}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
              Are you sure you want to permanently delete property{' '}
              <span className="font-semibold text-slate-900 dark:text-white">&quot;{propertyToDelete.name}&quot;</span>? This will unassign linked services, compliance records, and tenant assignments.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1c24]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProperty}
                disabled={deletePropertyLoading}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {deletePropertyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

