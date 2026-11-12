'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

interface OrgPropertyDeleteModalProps {
  deletePropTarget: any | null;
  setDeletePropTarget: (val: any | null) => void;
  deletingProp: boolean;
  handleDeletePropertySubmit: () => Promise<void>;
}

export function OrgPropertyDeleteModal({
  deletePropTarget,
  setDeletePropTarget,
  deletingProp,
  handleDeletePropertySubmit,
}: OrgPropertyDeleteModalProps) {
  return (
    <AnimatePresence>
      {deletePropTarget && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeletePropTarget(null)}
            className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-rose-200 dark:border-rose-900/40 rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Property</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete <strong className="text-slate-900 dark:text-white">&quot;{deletePropTarget.name}&quot;</strong>? This will detach its services, E911 records, and onboarding pipelines.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletePropTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#181920] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePropertySubmit}
                  disabled={deletingProp}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {deletingProp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete Property</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
