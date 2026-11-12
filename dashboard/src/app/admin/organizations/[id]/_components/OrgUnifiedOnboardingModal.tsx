'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  X,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { type OrgDetail, type OnboardingStatus, STAGES_ROAD, getStageBadge } from './types';

interface OrgUnifiedOnboardingModalProps {
  org: OrgDetail | null;
  unifiedOnboardingRecord: any | null;
  setUnifiedOnboardingRecord: (record: any | null) => void;
  unifiedOnboardingTab: 'DETAILS' | 'STAGE';
  setUnifiedOnboardingTab: (tab: 'DETAILS' | 'STAGE') => void;
  editOnbStageStatus: OnboardingStatus;
  setEditOnbStageStatus: (status: OnboardingStatus) => void;
  editOnbTargetDate: string;
  setEditOnbTargetDate: (date: string) => void;
  onbStageDates: {
    draft_date: string;
    contract_sent_date: string;
    signed_date: string;
    porting_submitted_date: string;
    sof_review_date: string;
    foc_confirmed_date: string;
    live_cutover_date: string;
  };
  setOnbStageDates: React.Dispatch<React.SetStateAction<{
    draft_date: string;
    contract_sent_date: string;
    signed_date: string;
    porting_submitted_date: string;
    sof_review_date: string;
    foc_confirmed_date: string;
    live_cutover_date: string;
  }>>;
  updatingOnbStage: boolean;
  handleUpdateOnbStageSubmit: (e: React.FormEvent) => Promise<void>;
}

export function OrgUnifiedOnboardingModal({
  org,
  unifiedOnboardingRecord,
  setUnifiedOnboardingRecord,
  unifiedOnboardingTab,
  setUnifiedOnboardingTab,
  editOnbStageStatus,
  setEditOnbStageStatus,
  editOnbTargetDate,
  setEditOnbTargetDate,
  onbStageDates,
  setOnbStageDates,
  updatingOnbStage,
  handleUpdateOnbStageSubmit,
}: OrgUnifiedOnboardingModalProps) {
  return (
    <AnimatePresence>
      {unifiedOnboardingRecord && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{unifiedOnboardingRecord.property_name}</h3>
                  <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab Navigation */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                  <button
                    type="button"
                    onClick={() => setUnifiedOnboardingTab('DETAILS')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      unifiedOnboardingTab === 'DETAILS'
                        ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnifiedOnboardingTab('STAGE')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      unifiedOnboardingTab === 'STAGE'
                        ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Stage Tracking
                  </button>
                </div>

                <button
                  onClick={() => setUnifiedOnboardingRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab 1: Details */}
            {unifiedOnboardingTab === 'DETAILS' && (
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                      {unifiedOnboardingRecord.property_name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                      {org?.name || 'Direct Portfolio'}
                    </p>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Address</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {unifiedOnboardingRecord.property_address || unifiedOnboardingRecord.address || 'Pending Address'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {unifiedOnboardingRecord.general_manager_name || 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {unifiedOnboardingRecord.general_manager_phone || 'N/A'}
                    </p>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {unifiedOnboardingRecord.general_manager_email || 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Target Cutover Date</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {unifiedOnboardingRecord.target_date
                        ? new Date(unifiedOnboardingRecord.target_date).toLocaleDateString()
                        : 'Not Scheduled'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Current Lifecycle Stage</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-blue-600 dark:text-blue-400">
                      {getStageBadge(((unifiedOnboardingRecord as any).stage || unifiedOnboardingRecord.status) as OnboardingStatus).label} ({getStageBadge(((unifiedOnboardingRecord as any).stage || unifiedOnboardingRecord.status) as OnboardingStatus).pct}%)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Stage Tracking (Curved Road with Animated Fill) */}
            {unifiedOnboardingTab === 'STAGE' && (
              <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 text-xs">
                {/* Stage Road Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Onboarding Progress Roadmap
                    </h4>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {getStageBadge(editOnbStageStatus).pct}% Complete
                    </span>
                  </div>

                  {/* Progress Bar with Fill Animation */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getStageBadge(editOnbStageStatus).pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
                    />
                  </div>

                  {/* Curved Road Timeline Visualizer */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                    {STAGES_ROAD.map((st, idx) => {
                      const currentStepIndex = STAGES_ROAD.findIndex((s) => s.key === editOnbStageStatus);
                      const isDone = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <motion.div
                          key={st.key}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => setEditOnbStageStatus(st.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                              : isDone
                              ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-[#222430] opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#181920]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-200 dark:bg-[#222430] text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isDone ? <Check className="w-3 h-3" /> : st.step}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">Stage {st.step}</span>
                          </div>

                          <p className="font-bold text-slate-900 dark:text-white text-xs">{st.label}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{st.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Stage Update Form */}
                <form onSubmit={handleUpdateOnbStageSubmit} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">Set Next Lifecycle Stage</label>
                      <select
                        value={editOnbStageStatus}
                        onChange={(e) => setEditOnbStageStatus(e.target.value as OnboardingStatus)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        {STAGES_ROAD.map((s) => (
                          <option key={s.key} value={s.key}>
                            Stage {s.step}: {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-black dark:text-white block mb-1">Target Cutover Date</label>
                      <input
                        type="date"
                        value={editOnbTargetDate ? editOnbTargetDate.split('T')[0] : ''}
                        onChange={(e) => setEditOnbTargetDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Milestone Expected Completion Dates */}
                  <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900 dark:text-white block text-xs">
                        Milestone Expected Dates (All 7 Stages)
                      </label>
                      <span className="text-[10px] text-slate-400">Synced with client tracking view</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {STAGES_ROAD.map((s) => (
                        <div key={s.dateField} className="space-y-1">
                          <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                            Stage {s.step}: {s.label}
                          </label>
                          <input
                            type="date"
                            value={(onbStageDates as any)[s.dateField] || ''}
                            onChange={(e) =>
                              setOnbStageDates((prev) => ({ ...prev, [s.dateField]: e.target.value }))
                            }
                            className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {editOnbStageStatus === 'COMPLETED' && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Setting stage to <strong>Onboarded (COMPLETED)</strong> will automatically activate the property to <strong>ACTIVE</strong> in the database and audit trail.
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setUnifiedOnboardingRecord(null)}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingOnbStage}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {updatingOnbStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save & Update Stage'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
