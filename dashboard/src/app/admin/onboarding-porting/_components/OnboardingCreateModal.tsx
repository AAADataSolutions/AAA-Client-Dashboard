'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X, Info, Loader2 } from 'lucide-react';
import { OrgOption } from './onboardingTypes';

interface OnboardingCreateModalProps {
  showCreateModal: boolean;
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  createForm: {
    property_name: string;
    organization_id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    target_date: string;
    e911_status: string;
    ray_baum_status: string;
  };
  setCreateForm: React.Dispatch<React.SetStateAction<any>>;
  createError: string | null;
  createLoading: boolean;
  orgOptions: OrgOption[];
  handleCreateSubmit: (e: React.FormEvent) => void;
}

export function OnboardingCreateModal({
  showCreateModal,
  setShowCreateModal,
  createForm,
  setCreateForm,
  createError,
  createLoading,
  orgOptions,
  handleCreateSubmit,
}: OnboardingCreateModalProps) {
  return (
    <AnimatePresence>
      {showCreateModal && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Initialize Onboarding Pipeline</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
                {createError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Property Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.property_name}
                      onChange={(e) => setCreateForm({ ...createForm, property_name: e.target.value })}
                      placeholder="e.g. Hyatt Regency Miami"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">
                      Organization <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={createForm.organization_id}
                      onChange={(e) => setCreateForm({ ...createForm, organization_id: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Organization</option>
                      {orgOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block">Street Address</label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      placeholder="400 SE 2nd Ave"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="Miami"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">State &amp; ZIP</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={createForm.state}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                        placeholder="FL"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={createForm.zip_code}
                        onChange={(e) => setCreateForm({ ...createForm, zip_code: e.target.value })}
                        placeholder="33131"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">General Manager Name</label>
                    <input
                      type="text"
                      value={createForm.general_manager_name}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_name: e.target.value })}
                      placeholder="e.g. David Vance"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Phone</label>
                    <input
                      type="tel"
                      value={createForm.general_manager_phone}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_phone: e.target.value })}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Email</label>
                    <input
                      type="email"
                      value={createForm.general_manager_email}
                      onChange={(e) => setCreateForm({ ...createForm, general_manager_email: e.target.value })}
                      placeholder="david@hyattmiami.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Target Cutover Date</label>
                    <input
                      type="date"
                      value={createForm.target_date}
                      onChange={(e) => setCreateForm({ ...createForm, target_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">E911 Validation Status</label>
                    <select
                      value={createForm.e911_status}
                      onChange={(e) => setCreateForm({ ...createForm, e911_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="PENDING">Pending Verification</option>
                      <option value="VERIFIED">PSAP Verified</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Ray Baum Status</label>
                    <select
                      value={createForm.ray_baum_status}
                      onChange={(e) => setCreateForm({ ...createForm, ray_baum_status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                    >
                      <option value="AUDIT_REQUIRED">Audit Required</option>
                      <option value="VERIFIED">Ray Baum Verified</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  <Info className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                  Upon initialization, the property will automatically be created in <strong>INACTIVE</strong> status with initial stage <strong>Draft Initialized</strong>. It will automatically switch to <strong>ACTIVE</strong> upon onboarding completion.
                </div>
              </div>

              <div className="flex justify-end gap-2.5 p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Initialize Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
