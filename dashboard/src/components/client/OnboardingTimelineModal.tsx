'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  GitBranch,
  Check,
  MapPin,
  Calendar,
  Building2,
  Clock,
  User,
  Phone,
  Mail,
} from 'lucide-react';

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

export const STAGES_ROAD: { key: OnboardingStatus; label: string; step: number; desc: string; dateField: string }[] = [
  { key: 'DRAFT', label: 'Draft Initialized', step: 1, desc: 'Property draft initialized with inactive status', dateField: 'draft_date' },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', step: 2, desc: 'Service agreement dispatched to GM', dateField: 'contract_sent_date' },
  { key: 'SIGNED', label: 'Contract Signed', step: 3, desc: 'Agreement executed and verified', dateField: 'signed_date' },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', step: 4, desc: 'LSR submitted to winning carrier', dateField: 'porting_submitted_date' },
  { key: 'SOF_WAITING', label: 'SOF Review', step: 5, desc: 'Service Order Form technical review', dateField: 'sof_review_date' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 6, desc: 'Firm Order Confirmation date locked', dateField: 'foc_confirmed_date' },
  { key: 'COMPLETED', label: 'Live Cutover', step: 7, desc: 'Traffic migrated & property activated', dateField: 'live_cutover_date' },
];

export function getStageBadge(status: string): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]', pct: 14 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', pct: 28 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', pct: 42 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', pct: 57 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 71 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50', pct: 85 };
    case 'COMPLETED':
      return { label: 'Live Cutover', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', pct: 100 };
    default:
      return { label: status || 'Draft', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700', pct: 10 };
  }
}

interface OnboardingTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    property_name?: string;
    name?: string;
    organization_name?: string;
    property_address?: string;
    address?: string;
    status?: string;
    stage?: string;
    target_date?: string | null;
    general_manager_name?: string | null;
    general_manager_phone?: string | null;
    general_manager_email?: string | null;
    draft_date?: string | null;
    contract_sent_date?: string | null;
    signed_date?: string | null;
    porting_submitted_date?: string | null;
    sof_review_date?: string | null;
    foc_confirmed_date?: string | null;
    live_cutover_date?: string | null;
    [key: string]: any;
  } | null;
}

export const OnboardingTimelineModal: React.FC<OnboardingTimelineModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  const currentStatus = (record.stage || record.status || 'DRAFT') as OnboardingStatus;
  const currentBadge = getStageBadge(currentStatus);
  const currentStepIndex = STAGES_ROAD.findIndex((s) => s.key === currentStatus);
  const propertyName = record.property_name || record.name || 'Property';
  const propertyAddress = record.property_address || record.address || 'Address pending';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-4xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]/50 shrink-0">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                <GitBranch className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {propertyName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{propertyAddress}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${currentBadge.bg} ${currentBadge.text} border ${currentBadge.border}`}>
                {currentBadge.label} ({Math.round(currentBadge.pct)}%)
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
            {/* Roadmap Header & Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  Onboarding Progress Roadmap (7 Stages)
                </h4>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(currentBadge.pct)}% Complete
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentBadge.pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
                />
              </div>

              {/* 7 Milestone Road Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3">
                {STAGES_ROAD.map((st, idx) => {
                  const isDone = currentStepIndex !== -1 && idx < currentStepIndex;
                  const isCurrent = currentStepIndex !== -1 ? idx === currentStepIndex : idx === 0;
                  const stageDate = record[st.dateField];

                  return (
                    <motion.div
                      key={st.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                          : isDone
                          ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-[#222430] opacity-50 bg-slate-50/30 dark:bg-[#181920]/50'
                      }`}
                    >
                      <div>
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

                        <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                          {st.label}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                          {st.desc}
                        </p>
                      </div>

                      {/* Display milestone date ONLY if entered by admin */}
                      {stageDate && (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-[#222430] flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span>
                            {new Date(stageDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Property & Timeline Meta Info */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                  Target Cutover Date
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 dark:text-white">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    {record.target_date
                      ? new Date(record.target_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Scheduled on FOC'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                  Assigned Organization
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 dark:text-white">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{record.organization_name || 'Organization Portfolio'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                  General Manager Contact
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-900 dark:text-white">
                  <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{record.general_manager_name || 'Not Designated'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]/50 shrink-0">
            <span className="text-xs text-slate-400">
              Live lifecycle status tracked with winning carrier network.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#1f212a] hover:bg-slate-200 dark:hover:bg-[#252733] text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              Close Roadmap
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
