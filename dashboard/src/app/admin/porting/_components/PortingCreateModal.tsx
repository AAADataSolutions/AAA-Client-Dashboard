'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { OrgOption, PartnerOption } from './portingTypes';
import { PortingCreateFormFields } from './PortingCreateFormFields';

interface PortingCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  createForm: any;
  setCreateForm: React.Dispatch<React.SetStateAction<any>>;
  createFiles: File[];
  setCreateFiles: React.Dispatch<React.SetStateAction<File[]>>;
  createLoading: boolean;
  createError: string | null;
  handleCreateSubmit: (e: React.FormEvent) => Promise<void>;
  orgOptions: OrgOption[];
  partnerOptions: PartnerOption[];
  isSuperAdmin: boolean;
}

export function PortingCreateModal({
  showCreateModal,
  setShowCreateModal,
  createForm,
  setCreateForm,
  createFiles,
  setCreateFiles,
  createLoading,
  createError,
  handleCreateSubmit,
  orgOptions,
  partnerOptions,
  isSuperAdmin,
}: PortingCreateModalProps) {
  return (
    <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Initialize Porting &amp; Property Record
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter full property details, telecom information, and initial lifecycle stage.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <PortingCreateFormFields
                createForm={createForm}
                setCreateForm={setCreateForm}
                createFiles={createFiles}
                setCreateFiles={setCreateFiles}
                orgOptions={orgOptions}
                partnerOptions={partnerOptions}
                isSuperAdmin={isSuperAdmin}
              />

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Initializing...
                    </>
                  ) : (
                    'Initialize Porting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
