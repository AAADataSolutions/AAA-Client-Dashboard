'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Edit2,
  GitBranch,
  X,
  Loader2,
} from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgInitOnboardingModalProps {
  org: OrgDetail | null;
  onboardingMenuPosition: { onb: any; bottom: number; left: number } | null;
  setOnboardingMenuPosition: (pos: { onb: any; bottom: number; left: number } | null) => void;
  openUnifiedOnboardingModal: (record: any, tab?: 'DETAILS' | 'STAGE') => void;
  showInitOnbModal: boolean;
  setShowInitOnbModal: (show: boolean) => void;
  initOnbForm: {
    property_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    target_date: string;
  };
  setInitOnbForm: React.Dispatch<React.SetStateAction<{
    property_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    target_date: string;
  }>>;
  initOnbLoading: boolean;
  initOnbError: string | null;
  handleCreateOnbSubmit: (e: React.FormEvent) => Promise<void>;
}

export function OrgInitOnboardingModal({
  org,
  onboardingMenuPosition,
  setOnboardingMenuPosition,
  openUnifiedOnboardingModal,
  showInitOnbModal,
  setShowInitOnbModal,
  initOnbForm,
  setInitOnbForm,
  initOnbLoading,
  initOnbError,
  handleCreateOnbSubmit,
}: OrgInitOnboardingModalProps) {
  return (
    <>
      {/* Fixed Popover for Onboarding Actions (Opens strictly ABOVE) - Matches Onboarding Page */}
      <AnimatePresence>
        {onboardingMenuPosition && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOnboardingMenuPosition(null)}
            />
            <div
              style={{
                position: 'fixed',
                bottom: `${onboardingMenuPosition.bottom}px`,
                left: `${onboardingMenuPosition.left}px`,
              }}
              className="z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{onboardingMenuPosition.onb.property_name}</p>
                <p className="text-[10px] text-slate-400">Pipeline Actions</p>
              </div>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'DETAILS');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'STAGE');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit Stage</span>
              </button>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'STAGE');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Stage Road</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Initialize Property Onboarding Modal */}
      <AnimatePresence>
        {showInitOnbModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Initialize Property Onboarding</h3>
                  <p className="text-xs text-slate-400">Scoped to organization: {org?.name}</p>
                </div>
                <button
                  onClick={() => setShowInitOnbModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOnbSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                  {initOnbError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
                      {initOnbError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Property Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hilton Garden Inn Downtown"
                      value={initOnbForm.property_name}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, property_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 100 Main St"
                      value={initOnbForm.address}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">City</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={initOnbForm.city}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={initOnbForm.state}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Zip Code</label>
                      <input
                        type="text"
                        placeholder="Zip"
                        value={initOnbForm.zip_code}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, zip_code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">GM Name</label>
                      <input
                        type="text"
                        placeholder="General Manager"
                        value={initOnbForm.general_manager_name}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">GM Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        value={initOnbForm.general_manager_phone}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">GM Email</label>
                      <input
                        type="email"
                        placeholder="gm@property.com"
                        value={initOnbForm.general_manager_email}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block">Target Cutover Date</label>
                      <input
                        type="date"
                        value={initOnbForm.target_date}
                        onChange={(e) => setInitOnbForm({ ...initOnbForm, target_date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 flex justify-end gap-2.5 border-t border-slate-100 dark:border-[#222430] shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowInitOnbModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={initOnbLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {initOnbLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Initialize Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
