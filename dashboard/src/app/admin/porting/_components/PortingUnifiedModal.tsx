'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X } from 'lucide-react';
import { PortingItem } from '@/store/slices/portingSlice';
import {
  LifecycleStage,
  OrgOption,
  PartnerOption,
  Teammate,
} from './portingTypes';
import { PortingDetailsTab } from './PortingDetailsTab';
import { PortingStageTrackingTab } from './PortingStageTrackingTab';
import { PortingMediaTab } from './PortingMediaTab';

interface PortingUnifiedModalProps {
  showUnifiedModal: boolean;
  setShowUnifiedModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRecord: PortingItem | null;
  activeTab: 'DETAILS' | 'STAGE' | 'MEDIA';
  setActiveTab: React.Dispatch<React.SetStateAction<'DETAILS' | 'STAGE' | 'MEDIA'>>;
  detailForm: any;
  setDetailForm: React.Dispatch<React.SetStateAction<any>>;
  orgOptions: OrgOption[];
  partnerOptions: PartnerOption[];
  isSuperAdmin: boolean;
  savingDetails: boolean;
  handleSaveDetailsSubmit: (e: React.FormEvent) => void;
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
  handleUpdateStageSubmit: (e?: React.FormEvent, chosenBillingStatus?: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  existingAttachments: any[];
  modalNewFiles: File[];
  setModalNewFiles: React.Dispatch<React.SetStateAction<File[]>>;
  handleDownloadAttachment: (att: any) => void;
  handleDeleteAttachment: (storagePath: string) => void;
  handleSaveMediaSubmit: () => void;
}

export function PortingUnifiedModal({
  showUnifiedModal,
  setShowUnifiedModal,
  selectedRecord,
  activeTab,
  setActiveTab,
  detailForm,
  setDetailForm,
  orgOptions,
  partnerOptions,
  isSuperAdmin,
  savingDetails,
  handleSaveDetailsSubmit,
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
  handleUpdateStageSubmit,
  existingAttachments,
  modalNewFiles,
  setModalNewFiles,
  handleDownloadAttachment,
  handleDeleteAttachment,
  handleSaveMediaSubmit,
}: PortingUnifiedModalProps) {
  return (
    <AnimatePresence>
      {showUnifiedModal && selectedRecord && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedRecord.property_name}
                  </h3>
                  <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Tab Navigation: Details, Stage Tracking, PDFs & Images */}
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
                  <button
                    type="button"
                    onClick={() => setActiveTab('MEDIA')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'MEDIA'
                        ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>PDFs &amp; Images</span>
                    {existingAttachments.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                        {existingAttachments.length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowUnifiedModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TAB 1: DETAILS (COMPLETELY VIEWABLE & EDITABLE) */}
            {activeTab === 'DETAILS' && (
              <PortingDetailsTab
                detailForm={detailForm}
                setDetailForm={setDetailForm}
                orgOptions={orgOptions}
                partnerOptions={partnerOptions}
                isSuperAdmin={isSuperAdmin}
                savingDetails={savingDetails}
                handleSaveDetailsSubmit={handleSaveDetailsSubmit}
              />
            )}

            {/* TAB 2: STAGE TRACKING (ROADMAP CURVED ROAD - EXACT SCREENSHOT MATCH) */}
            {activeTab === 'STAGE' && (
              <PortingStageTrackingTab
                editStageStatus={editStageStatus}
                setEditStageStatus={setEditStageStatus}
                handleStageSelect={handleStageSelect}
                editTargetDate={editTargetDate}
                setEditTargetDate={setEditTargetDate}
                stageDates={stageDates}
                setStageDates={setStageDates}
                stageAssignments={stageAssignments}
                setStageAssignments={setStageAssignments}
                teammates={teammates}
                updatingStage={updatingStage}
                uploadingFiles={uploadingFiles}
                onClose={() => setShowUnifiedModal(false)}
                handleUpdateStageSubmit={handleUpdateStageSubmit}
              />
            )}

            {/* TAB 3: PDFS & IMAGES GALLERY / UPLOADER */}
            {activeTab === 'MEDIA' && (
              <PortingMediaTab
                existingAttachments={existingAttachments}
                modalNewFiles={modalNewFiles}
                setModalNewFiles={setModalNewFiles}
                handleDownloadAttachment={handleDownloadAttachment}
                handleDeleteAttachment={handleDeleteAttachment}
                uploadingFiles={uploadingFiles}
                handleSaveMediaSubmit={handleSaveMediaSubmit}
              />
            )}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
