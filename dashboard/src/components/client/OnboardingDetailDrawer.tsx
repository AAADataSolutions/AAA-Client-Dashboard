'use client';

import React, { useState } from 'react';
import {
  X,
  GitBranch,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  LifeBuoy,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
} from 'lucide-react';

interface OnboardingDetailDrawerProps {
  onboarding: any;
  onClose: () => void;
  onCreateTicket?: (propertyId: string) => void;
  onRefresh?: () => void;
}

const MILESTONES_CONFIG = [
  {
    key: 'DRAFT',
    label: '1. Intake & Project Scope',
    desc: 'Property requirements analyzed and telecom deployment planned',
    timestampKey: 'created_at',
  },
  {
    key: 'CONTRACT_SENT',
    label: '2. Contract Dispatched',
    desc: 'Service agreement sent to client for legal review and execution',
    timestampKey: 'contract_sent_at',
    clientAction: 'Client sign-off required on master agreement',
  },
  {
    key: 'SIGNED',
    label: '3. Agreements Signed',
    desc: 'Contract signed and Letter of Authorization (LOA) received',
    timestampKey: 'signed_at',
  },
  {
    key: 'PORTING_WAITING',
    label: '4. Porting Documentation',
    desc: 'Carrier CSR and latest billing invoice validated',
    timestampKey: 'porting_waiting_at',
  },
  {
    key: 'PORTING_SUBMITTED',
    label: '5. Porting Submitted to Carrier',
    desc: 'Number porting requests submitted to losing carrier for FOC date',
    timestampKey: 'porting_submitted_at',
  },
  {
    key: 'SOF_WAITING',
    label: '6. Service Order Form (SOF) Sign-off',
    desc: 'Verification of final DIDs, hunt groups, and E911 dispatch addresses',
    timestampKey: 'sof_waiting_at',
    clientAction: 'Client review and approval of Service Order Form needed',
  },
  {
    key: 'FOC_RECEIVED',
    label: '7. FOC Date Confirmed',
    desc: 'Firm Order Commitment cutover scheduled with carrier',
    timestampKey: 'foc_received_at',
  },
  {
    key: 'COMPLETED',
    label: '8. Go-Live & Completed',
    desc: 'Telecom services fully operational, voice routing verified',
    timestampKey: 'completed_at',
  },
];

export const OnboardingDetailDrawer: React.FC<OnboardingDetailDrawerProps> = ({
  onboarding,
  onClose,
  onCreateTicket,
  onRefresh,
}) => {
  const [isSubmittingDoc, setIsSubmittingDoc] = useState(false);
  const [docNotes, setDocNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!onboarding) return null;

  const currentStepIndex = onboarding.step_index || 1;
  const isWaitingOnClient = onboarding.is_waiting_on_client;
  const services = onboarding.services || [];

  const handleClientSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDoc(true);
    setTimeout(() => {
      setIsSubmittingDoc(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        if (onRefresh) onRefresh();
      }, 3000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {onboarding.property_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{onboarding.property_location || onboarding.property_address}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Summary Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#181920] border-b border-slate-200/80 dark:border-[#222430]">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                Stage {currentStepIndex} of 8:
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {onboarding.stage_label}
              </span>
            </div>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {Math.round(onboarding.progress_percentage)}% Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                onboarding.status === 'COMPLETED'
                  ? 'bg-emerald-500'
                  : isWaitingOnClient
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${onboarding.progress_percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Go-Live:</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {onboarding.target_date
                  ? new Date(onboarding.target_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Pending Scheduling'}
              </strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Updated:</span>
              <span>
                {new Date(onboarding.updated_at || onboarding.created_at).toLocaleDateString()}
              </span>
            </span>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Action Required Alert Banner */}
          {isWaitingOnClient && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-100">
                    Action Required by Client
                  </h4>
                  <p className="text-[11.5px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                    {onboarding.status === 'CONTRACT_SENT'
                      ? 'Please review and execute the telecom service agreement or upload signed Letter of Authorization (LOA).'
                      : onboarding.status === 'SOF_WAITING'
                      ? 'Please review the Service Order Form (SOF) and verify that all DIDs, trunk settings, and dispatchable E911 civic addresses are correct.'
                      : 'Client documentation or authorization is pending.'}
                  </p>

                  {/* Submission Form */}
                  {!submittedSuccess ? (
                    <form onSubmit={handleClientSubmitInfo} className="mt-3.5 space-y-2.5">
                      <textarea
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        placeholder="Provide confirmation notes, authorization reference, or upload comments..."
                        rows={2}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-[#181920] border border-amber-300 dark:border-amber-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSubmittingDoc}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmittingDoc ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Submit Approval / Notes</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onCreateTicket?.(onboarding.property_id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1f2029] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#252733] cursor-pointer"
                        >
                          <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ask a Question</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Information submitted to AAA operations team successfully!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 8-Stage Milestone Timeline */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              8-Stage Onboarding Milestone Roadmap
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {MILESTONES_CONFIG.map((step, idx) => {
                const stepNum = idx + 1;
                const isPassed = stepNum < currentStepIndex || onboarding.status === 'COMPLETED';
                const isCurrent = stepNum === currentStepIndex && onboarding.status !== 'COMPLETED';
                const isFuture = stepNum > currentStepIndex && onboarding.status !== 'COMPLETED';
                const milestoneTimestamp = onboarding.milestones?.[step.timestampKey];

                return (
                  <div key={step.key} className="relative group">
                    {/* Node Icon Indicator */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isCurrent
                          ? isWaitingOnClient
                            ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 animate-pulse'
                            : 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] font-bold">{stepNum}</span>
                      )}
                    </div>

                    {/* Step Card Content */}
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                          : isPassed
                          ? 'bg-white dark:bg-[#181920] border-slate-200/80 dark:border-[#222430]'
                          : 'bg-slate-50/50 dark:bg-[#14151a] border-slate-200/40 dark:border-slate-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-xs ${
                            isCurrent
                              ? 'text-indigo-900 dark:text-indigo-300'
                              : isPassed
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {isCurrent && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isWaitingOnClient
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}
                          >
                            {isWaitingOnClient ? 'Action Needed' : 'In Progress'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {step.desc}
                      </p>

                      {milestoneTimestamp && (
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-[#252733] text-[10.5px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            Logged on:{' '}
                            <strong className="text-slate-600 dark:text-slate-300">
                              {new Date(milestoneTimestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property Summary Card */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Property Location &amp; Contact
            </h4>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {onboarding.property_address || onboarding.property_location}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Main Phone: {onboarding.property_phone || '—'}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Contact Person / GM:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {onboarding.contact_person_name || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Telecom Services associated with Onboarding */}
          {services.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                Assigned Telecom Services ({services.length})
              </h4>
              <div className="space-y-2">
                {services.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {s.phone_number}
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        ({s.service_type?.name || 'Voice Line'})
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <button
            onClick={() => onCreateTicket?.(onboarding.property_id)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Raise Onboarding Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
