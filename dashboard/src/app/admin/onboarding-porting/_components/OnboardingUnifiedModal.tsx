'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  X,
  UserCheck,
  Paperclip,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { OnboardingItem, OnboardingAttachment } from '@/store/slices/onboardingSlice';
import {
  formatFileSize,
  getStageBadge,
  OnboardingStatus,
  Teammate,
} from './onboardingTypes';
import { OnboardingStageTrackingTab } from './OnboardingStageTrackingTab';

interface OnboardingUnifiedModalProps {
  showUnifiedModal: boolean;
  setShowUnifiedModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRecord: OnboardingItem | null;
  activeTab: 'DETAILS' | 'STAGE';
  setActiveTab: React.Dispatch<React.SetStateAction<'DETAILS' | 'STAGE'>>;
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
  handleUpdateStageSubmit: (e: React.FormEvent) => void;
}

export function OnboardingUnifiedModal({
  showUnifiedModal,
  setShowUnifiedModal,
  selectedRecord,
  activeTab,
  setActiveTab,
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
  handleUpdateStageSubmit,
}: OnboardingUnifiedModalProps) {
  return (
    <AnimatePresence>
      {showUnifiedModal && selectedRecord && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedRecord.property_name}</h3>
                  <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab Navigation */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('DETAILS')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      activeTab === 'DETAILS'
                        ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('STAGE')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                      activeTab === 'STAGE'
                        ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Stage Tracking
                  </button>
                </div>

                <button
                  onClick={() => setShowUnifiedModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab 1: Details */}
            {activeTab === 'DETAILS' && (
              <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                      {selectedRecord.property_name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                      {selectedRecord.organization_name || 'Direct Portfolio'}
                    </p>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Property Address</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedRecord.property_address || 'Pending Address'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedRecord.general_manager_name || 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedRecord.general_manager_phone || 'N/A'}
                    </p>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedRecord.general_manager_email || 'N/A'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Target Cutover Date</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedRecord.target_date
                        ? new Date(selectedRecord.target_date).toLocaleDateString()
                        : 'Not Scheduled'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Current Lifecycle Stage</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-blue-600 dark:text-blue-400">
                      {getStageBadge(((selectedRecord as any).stage || selectedRecord.status) as OnboardingStatus).label} ({selectedRecord.progress_pct ?? 0}%)
                    </p>
                  </div>
                </div>

                {/* Internal Admin Handoff Summary (Private) */}
                <div className="p-4 bg-slate-50 dark:bg-[#111217] border border-indigo-200/50 dark:border-indigo-900/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                        Internal Assignment &amp; Operations (Admin Only)
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('STAGE')}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Edit in Stage Tab &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Assigned Teammate</span>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedRecord.assigned_to_name ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                            <UserCheck className="w-3.5 h-3.5" /> {selectedRecord.assigned_to_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not yet assigned</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Internal Attachments</span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                        {selectedRecord.attachments && selectedRecord.attachments.length > 0 ? (
                          <span>{selectedRecord.attachments.length} file(s) attached</span>
                        ) : (
                          <span className="text-slate-400 italic">No attachments uploaded</span>
                        )}
                      </p>
                    </div>

                    {selectedRecord.internal_notes && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Internal Notes</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap bg-white dark:bg-[#15161c] p-2.5 rounded-lg border border-slate-200/80 dark:border-[#222430]">
                          {selectedRecord.internal_notes}
                        </p>
                      </div>
                    )}

                    {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                      <div className="col-span-2 space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Attached Files</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecord.attachments.map((att, i) => (
                            <button
                              key={att.id || att.storage_path || i}
                              onClick={() => handleDownloadAttachment(att)}
                              className="px-2.5 py-1.5 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:text-blue-600 flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                            >
                              <Paperclip className="w-3 h-3 text-indigo-500" />
                              <span className="font-medium truncate max-w-[150px]">{att.file_name}</span>
                              <span className="text-[10px] text-slate-400">({formatFileSize(att.file_size)})</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Stage Tracking */}
            {activeTab === 'STAGE' && (
              <OnboardingStageTrackingTab
                editStageStatus={editStageStatus}
                setEditStageStatus={setEditStageStatus}
                editTargetDate={editTargetDate}
                setEditTargetDate={setEditTargetDate}
                stageDates={stageDates}
                setStageDates={setStageDates}
                isStage3OrAbove={isStage3OrAbove}
                assignmentMode={assignmentMode}
                setAssignmentMode={setAssignmentMode}
                assignedTo={assignedTo}
                setAssignedTo={setAssignedTo}
                assignedToName={assignedToName}
                setAssignedToName={setAssignedToName}
                teammates={teammates}
                internalNotes={internalNotes}
                setInternalNotes={setInternalNotes}
                newFiles={newFiles}
                setNewFiles={setNewFiles}
                existingAttachments={existingAttachments}
                deletingAttId={deletingAttId}
                handleDownloadAttachment={handleDownloadAttachment}
                handleRemoveExistingAttachment={handleRemoveExistingAttachment}
                updatingStage={updatingStage}
                uploadingFiles={uploadingFiles}
                onClose={() => setShowUnifiedModal(false)}
                handleUpdateStageSubmit={handleUpdateStageSubmit}
              />
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
