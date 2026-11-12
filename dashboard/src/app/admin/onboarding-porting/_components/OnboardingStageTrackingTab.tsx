'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  CheckCircle2,
  X,
  Loader2,
  Check,
  UserCheck,
  User,
  Paperclip,
  FileText,
  Trash2,
  UploadCloud,
  Lock,
} from 'lucide-react';
import { OnboardingAttachment } from '@/store/slices/onboardingSlice';
import {
  formatFileSize,
  getStageBadge,
  OnboardingStatus,
  STAGES_ROAD,
  Teammate,
} from './onboardingTypes';

interface OnboardingStageTrackingTabProps {
  editStageStatus: OnboardingStatus;
  setEditStageStatus: React.Dispatch<React.SetStateAction<OnboardingStatus>>;
  editTargetDate: string;
  setEditTargetDate: React.Dispatch<React.SetStateAction<string>>;
  stageDates: Record<string, string>;
  setStageDates: React.Dispatch<React.SetStateAction<any>>;
  isStage3OrAbove: boolean;
  assignmentMode: 'TEAMMATE' | 'CUSTOM';
  setAssignmentMode: React.Dispatch<React.SetStateAction<'TEAMMATE' | 'CUSTOM'>>;
  assignedTo: string;
  setAssignedTo: React.Dispatch<React.SetStateAction<string>>;
  assignedToName: string;
  setAssignedToName: React.Dispatch<React.SetStateAction<string>>;
  teammates: Teammate[];
  internalNotes: string;
  setInternalNotes: React.Dispatch<React.SetStateAction<string>>;
  newFiles: File[];
  setNewFiles: React.Dispatch<React.SetStateAction<File[]>>;
  existingAttachments: OnboardingAttachment[];
  deletingAttId: string | null;
  handleDownloadAttachment: (att: OnboardingAttachment) => void;
  handleRemoveExistingAttachment: (attId?: string, storagePath?: string) => void;
  updatingStage: boolean;
  uploadingFiles: boolean;
  onClose: () => void;
  handleUpdateStageSubmit: (e: React.FormEvent) => void;
}

export function OnboardingStageTrackingTab({
  editStageStatus,
  setEditStageStatus,
  editTargetDate,
  setEditTargetDate,
  stageDates,
  setStageDates,
  isStage3OrAbove,
  assignmentMode,
  setAssignmentMode,
  assignedTo,
  setAssignedTo,
  assignedToName,
  setAssignedToName,
  teammates,
  internalNotes,
  setInternalNotes,
  newFiles,
  setNewFiles,
  existingAttachments,
  deletingAttId,
  handleDownloadAttachment,
  handleRemoveExistingAttachment,
  updatingStage,
  uploadingFiles,
  onClose,
  handleUpdateStageSubmit,
}: OnboardingStageTrackingTabProps) {
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

        {/* Progress Bar with Fill Animation */}
        <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getStageBadge(editStageStatus).pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
          />
        </div>

        {/* Curved Road Timeline Visualizer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          {STAGES_ROAD.map((st, idx) => {
            const currentStepIndex = STAGES_ROAD.findIndex((s) => s.key === editStageStatus);
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <motion.div
                key={st.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setEditStageStatus(st.key)}
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
      <form onSubmit={handleUpdateStageSubmit} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-black dark:text-white block mb-1">Set Next Lifecycle Stage</label>
            <select
              value={editStageStatus}
              onChange={(e) => setEditStageStatus(e.target.value as OnboardingStatus)}
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
              value={editTargetDate ? editTargetDate.split('T')[0] : ''}
              onChange={(e) => setEditTargetDate(e.target.value)}
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
                  value={(stageDates as any)[s.dateField] || ''}
                  onChange={(e) =>
                    setStageDates((prev: any) => ({ ...prev, [s.dateField]: e.target.value }))
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* STAGE 3+: INTERNAL TASK ASSIGNMENT, ATTACHMENTS & NOTES (ADMIN ONLY) */}
        {isStage3OrAbove ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/50 dark:from-[#171827] dark:via-[#13141a] dark:to-[#1a1728] border border-indigo-200/80 dark:border-indigo-800/50 rounded-xl space-y-4 shadow-sm"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-950/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                    Internal Task Assignment &amp; Operations
                  </h4>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                    Active at Stage 3 (Contract Signed) &bull; Visible strictly on Admin Side
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800">
                <Lock className="w-3 h-3" /> Admin Only
              </span>
            </div>

            {/* 1. Task Assignee Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-white block text-xs">
                  Assign Onboarding Task To:
                </label>
                <div className="flex items-center p-0.5 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('TEAMMATE')}
                    className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      assignmentMode === 'TEAMMATE'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Admin Teammates
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignmentMode('CUSTOM')}
                    className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      assignmentMode === 'CUSTOM'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Custom Name
                  </button>
                </div>
              </div>

              {assignmentMode === 'TEAMMATE' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={assignedTo}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setAssignedTo(selectedId);
                      const tm = teammates.find((t) => t.id === selectedId);
                      if (tm) {
                        setAssignedToName(tm.full_name || tm.email);
                      } else {
                        setAssignedToName('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select an Admin Teammate...</option>
                    {teammates.map((tm) => (
                      <option key={tm.id} value={tm.id}>
                        {tm.full_name || tm.email} ({tm.role || 'Admin'})
                      </option>
                    ))}
                  </select>

                  {assignedToName && (
                    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-[#15161c] border border-indigo-200 dark:border-indigo-900/60 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {assignedToName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white truncate">{assignedToName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAssignedTo('');
                          setAssignedToName('');
                        }}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={assignedToName}
                    onChange={(e) => {
                      setAssignedToName(e.target.value);
                      setAssignedTo('');
                    }}
                    placeholder="Enter engineer or teammate full name (e.g., Alex Johnson)"
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 2. Internal Operational Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 dark:text-white block text-xs">
                Internal Operational Notes (LOA Status, PINs, Cutover Rules)
              </label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add private engineering notes, carrier account PINs, routing rules, or cutover instructions..."
                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* 3. Internal Attachments (Upload & Management) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-white block text-xs">
                  Internal Attachments (LOA, CSR, Signed Agreement, Floorplans)
                </label>
                <span className="text-[10px] text-slate-400">PDF, DOCX, PNG, JPG (Max 25MB)</span>
              </div>

              {/* File Upload Drop Area */}
              <div className="p-3 bg-white dark:bg-[#15161c] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Upload documents or contracts
                    </p>
                    <p className="text-[10px] text-slate-400">Files are stored securely in Supabase storage</p>
                  </div>
                </div>

                <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Files</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const selected = Array.from(e.target.files);
                        setNewFiles((prev) => [...prev, ...selected]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Pending New Files Queue */}
              {newFiles.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Ready to Upload ({newFiles.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {newFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-lg text-xs flex items-center gap-2 text-indigo-900 dark:text-indigo-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                        <span className="text-[10px] text-indigo-500">({formatFileSize(file.size)})</span>
                        <button
                          type="button"
                          onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-indigo-400 hover:text-rose-500 cursor-pointer p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Uploaded Attachments List */}
              {existingAttachments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Existing Internal Attachments ({existingAttachments.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingAttachments.map((att) => {
                      const attKey = att.id || att.storage_path;
                      const isDeleting = deletingAttId === attKey;
                      return (
                        <div
                          key={attKey}
                          className="px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs flex items-center gap-2 text-slate-800 dark:text-slate-200 shadow-xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att)}
                            className="font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[140px] text-left cursor-pointer"
                            title="Click to download/preview"
                          >
                            {att.file_name}
                          </button>
                          <span className="text-[10px] text-slate-400">({formatFileSize(att.file_size)})</span>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleRemoveExistingAttachment(att.id, att.storage_path)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 disabled:opacity-40"
                            title="Delete attachment"
                          >
                            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong>Task Assignment &amp; Internal Handoff</strong> unlocks at <strong>Stage 3 (Contract Signed)</strong>. Once contract is signed, you can assign teammates, attach LOA/CSR files, and log private operational notes.
            </span>
          </div>
        )}

        {editStageStatus === 'COMPLETED' && (
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
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updatingStage || uploadingFiles}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {updatingStage || uploadingFiles ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving &amp; Uploading...</span>
              </>
            ) : (
              'Save & Update Stage'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
