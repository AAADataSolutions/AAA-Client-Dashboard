'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import {
  getStageBadge,
  LifecycleStage,
  STAGES_ROAD,
  Teammate,
} from './portingTypes';

interface PortingStageTrackingTabProps {
  editStageStatus: LifecycleStage;
  setEditStageStatus: React.Dispatch<React.SetStateAction<LifecycleStage>>;
  handleStageSelect: (stageKey: LifecycleStage) => void;
  editTargetDate: string;
  setEditTargetDate: React.Dispatch<React.SetStateAction<string>>;
  stageDates: Record<string, string>;
  setStageDates: React.Dispatch<React.SetStateAction<any>>;
  stageAssignments: Record<string, { assigned_to: string; assigned_to_name: string; mode: 'TEAMMATE' | 'CUSTOM'; notes: string }>;
  setStageAssignments: React.Dispatch<React.SetStateAction<Record<string, { assigned_to: string; assigned_to_name: string; mode: 'TEAMMATE' | 'CUSTOM'; notes: string }>>>;
  teammates: Teammate[];
  updatingStage: boolean;
  uploadingFiles: boolean;
  onClose: () => void;
  handleUpdateStageSubmit: (e?: React.FormEvent, chosenBillingStatus?: 'BILLING_DONE' | 'BILLING_PENDING') => void;
}

export function PortingStageTrackingTab({
  editStageStatus,
  setEditStageStatus,
  handleStageSelect,
  editTargetDate,
  setEditTargetDate,
  stageDates,
  setStageDates,
  stageAssignments,
  setStageAssignments,
  teammates,
  updatingStage,
  uploadingFiles,
  onClose,
  handleUpdateStageSubmit,
}: PortingStageTrackingTabProps) {
  return (
    <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
      {/* Stage Road Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
            Onboarding Progress Roadmap
          </h4>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {getStageBadge(editStageStatus).pct}% Complete
          </span>
        </div>

        {/* Progress Bar with Gradient Fill Animation */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getStageBadge(editStageStatus).pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
          />
        </div>

        {/* 7 Stage Cards Grid (Exact Screenshot Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          {STAGES_ROAD.map((st, idx) => {
            const currentStepIndex = STAGES_ROAD.findIndex(
              (s) => s.key === editStageStatus
            );
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <motion.div
                key={st.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => handleStageSelect(st.key)}
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
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Stage {st.step}
                  </span>
                </div>

                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {st.label}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                  {st.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stage Update Form */}
      <form
        onSubmit={handleUpdateStageSubmit}
        className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-900 dark:text-white block mb-1">
              Set Next Lifecycle Stage
            </label>
            <select
              value={editStageStatus}
              onChange={(e) =>
                handleStageSelect(e.target.value as LifecycleStage)
              }
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
            <label className="font-bold text-slate-900 dark:text-white block mb-1">
              Target Cutover Date
            </label>
            <input
              type="date"
              value={editTargetDate ? editTargetDate.split('T')[0] : ''}
              onChange={(e) => setEditTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Milestone Expected Completion Dates (All 8 Stages) */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-900 dark:text-white block text-xs">
              Milestone Expected Dates (All 8 Stages)
            </label>
            <span className="text-[10px] text-slate-400">
              Synced with client tracking view
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {STAGES_ROAD.map((s) => (
              <div key={s.dateField} className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                  Stage {s.step}: {s.label}
                </label>
                <input
                  type="date"
                  value={(stageDates as any)[s.dateField] || ''}
                  onChange={(e) =>
                    setStageDates((prev: any) => ({
                      ...prev,
                      [s.dateField]: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* PER-STAGE TEAM MEMBER ASSIGNMENT & NOTES (ALL 8 STAGES) */}
        {(() => {
          const activeStageObj = STAGES_ROAD.find((s) => s.key === editStageStatus) || STAGES_ROAD[0];
          const curStageData = stageAssignments[editStageStatus] || {
            assigned_to: '',
            assigned_to_name: '',
            mode: 'TEAMMATE' as const,
            notes: '',
          };
          const updateCurStageData = (patch: Partial<typeof curStageData>) => {
            setStageAssignments((prev) => ({
              ...prev,
              [editStageStatus]: {
                ...(prev[editStageStatus] || { assigned_to: '', assigned_to_name: '', mode: 'TEAMMATE', notes: '' }),
                ...patch,
              },
            }));
          };
          return (
            <div className="space-y-3">
              <motion.div
                key={editStageStatus}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 dark:from-[#131728] dark:via-[#13141a] dark:to-[#171a2a] border border-blue-200/80 dark:border-blue-800/50 rounded-xl space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-950/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {activeStageObj.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        Stage {activeStageObj.step}: {activeStageObj.label} — Team Member Assignment &amp; Notes
                      </h4>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        Assign a team member from dropdown or enter a custom name for Stage {activeStageObj.step} ({activeStageObj.label})
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                    Stage {activeStageObj.step} Assignee
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-900 dark:text-white block text-xs">
                      Assigned Team Member (Stage {activeStageObj.step}):
                    </label>
                    <div className="flex items-center p-0.5 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => updateCurStageData({ mode: 'TEAMMATE' })}
                        className={`px-2.5 py-0.5 rounded font-semibold cursor-pointer ${
                          curStageData.mode === 'TEAMMATE'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        Select from Dropdown
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurStageData({ mode: 'CUSTOM' })}
                        className={`px-2.5 py-0.5 rounded font-semibold cursor-pointer ${
                          curStageData.mode === 'CUSTOM'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        Enter New / Custom Name
                      </button>
                    </div>
                  </div>

                  {curStageData.mode === 'TEAMMATE' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <select
                        value={curStageData.assigned_to}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = teammates.find((t) => t.id === val);
                          updateCurStageData({
                            assigned_to: val,
                            assigned_to_name: found ? found.full_name || found.email : '',
                          });
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="">-- Select Team Member from Dropdown --</option>
                        {teammates.map((tm) => (
                          <option key={tm.id} value={tm.id}>
                            {tm.full_name || tm.email} ({tm.role || 'Team Member'})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or type a new team member name directly..."
                        value={curStageData.assigned_to_name}
                        onChange={(e) =>
                          updateCurStageData({
                            assigned_to_name: e.target.value,
                            assigned_to: '',
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Enter team member name for Stage ${activeStageObj.step} (${activeStageObj.label})...`}
                      value={curStageData.assigned_to_name}
                      onChange={(e) =>
                        updateCurStageData({
                          assigned_to_name: e.target.value,
                          assigned_to: '',
                        })
                      }
                      className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-900 dark:text-white block text-xs">
                    Stage {activeStageObj.step} Operational Notes:
                  </label>
                  <textarea
                    rows={2}
                    placeholder={`Add operational notes or handoff instructions for Stage ${activeStageObj.step} (${activeStageObj.label})...`}
                    value={curStageData.notes}
                    onChange={(e) => updateCurStageData({ notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quick overview of all stages with assignees */}
                {Object.entries(stageAssignments).some(([, v]) => v?.assigned_to_name) && (
                  <div className="pt-2 border-t border-blue-100 dark:border-blue-950/60">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Assigned Team Members Across Stages (Click any stage to edit):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {STAGES_ROAD.map((st) => {
                        const stAssign = stageAssignments[st.key];
                        if (!stAssign?.assigned_to_name) return null;
                        return (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setEditStageStatus(st.key)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition cursor-pointer ${
                              editStageStatus === st.key
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#222430] hover:border-blue-400'
                            }`}
                          >
                            <span>Stage {st.step}:</span>
                            <span className="font-bold">{stAssign.assigned_to_name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
        {/* Legacy Stage 3/4 block removed - replaced by dynamic all-stage assignment above */}

        {/* Modal Submit Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updatingStage || uploadingFiles}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {updatingStage || uploadingFiles ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              'Save & Apply Updates'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
