'use client';

import React from 'react';
import {
  X,
  ArrowLeftRight,
  Hotel,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Copy,
  ArrowUpRight,
  LifeBuoy,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from './ClientToast';

interface PortingDetailDrawerProps {
  porting: any | null;
  onClose: () => void;
  onOpenProperty?: (propId: string) => void;
  onCreateTicket?: (propId: string) => void;
}

const PORTING_STAGES = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed' },
  { key: 'COMPLETED', label: 'Completed' },
];

export const PortingDetailDrawer: React.FC<PortingDetailDrawerProps> = ({
  porting,
  onClose,
  onOpenProperty,
  onCreateTicket,
}) => {
  const toast = useToast();

  if (!porting) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isRejected = porting.status === 'REJECTED';
  const isCancelled = porting.status === 'CANCELLED';

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'PENDING':
      case 'SUBMITTED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'FOC_RECEIVED':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 1;
    }
  };

  const currentStageIdx = getStageIndex(porting.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Porting #{porting.id?.slice(0, 8)}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {porting.property_name} • {porting.services_count || porting.services?.length || 0} Number(s)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Status & Stepper Banner */}
          {isRejected || isCancelled ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-xs uppercase tracking-wide">
                  Order {porting.status}
                </span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                {porting.notes || 'The carrier rejected or cancelled this migration request. Please review carrier notes below or raise a support ticket.'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Carrier Migration Status
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {porting.status === 'COMPLETED'
                      ? 'Porting Completed & Activated'
                      : porting.status === 'FOC_RECEIVED'
                      ? 'Firm Order Confirmed (FOC)'
                      : 'Carrier Processing In Progress'}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    porting.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                      : porting.status === 'FOC_RECEIVED'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {porting.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Visual Multi-Stage Progress Stepper */}
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {PORTING_STAGES.map((stage, idx) => {
                    const isPassed = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <div key={stage.key} className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-full h-1.5 rounded-full transition-all ${
                            isPassed
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-purple-600 dark:bg-purple-400 animate-pulse'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                        <span
                          className={`text-[9.5px] font-medium leading-tight ${
                            isCurrent
                              ? 'text-purple-600 dark:text-purple-400 font-bold'
                              : isPassed
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Property Section */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Associated Property Location
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {porting.property_name}
                  </span>
                </div>
                {onOpenProperty && porting.property_id && (
                  <button
                    onClick={() => onOpenProperty(porting.property_id)}
                    className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View 360°</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {porting.property_address && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {porting.property_address}
                </p>
              )}
            </div>
          </div>

          {/* Numbers in Batch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Numbers in Batch ({porting.services?.length || 0})
              </span>
              {porting.services?.length > 0 && (
                <button
                  onClick={() => {
                    const allNums = porting.services.map((s: any) => s.phone_number).join(', ');
                    handleCopy(allNums, 'All numbers');
                  }}
                  className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </button>
              )}
            </div>

            {porting.services && porting.services.length > 0 ? (
              <div className="p-3 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2 max-h-48 overflow-y-auto">
                {porting.services.map((s: any) => (
                  <div
                    key={s.id || s.phone_number}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#13141a] border border-slate-100 dark:border-[#222430]"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {s.phone_number}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {s.service_type || s.description || 'Voice Line'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(s.phone_number, s.phone_number)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#20222d] transition cursor-pointer"
                      title="Copy phone number"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] text-slate-400 text-center text-xs">
                No specific line items attached to this batch request.
              </div>
            )}
          </div>

          {/* Key Dates & Timeline */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Dates &amp; Carrier Timelines
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Target / FOC Cutover Date:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {porting.target_date ? new Date(porting.target_date).toLocaleDateString() : 'Awaiting FOC'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Order Submitted:
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(porting.created_at).toLocaleDateString()}
                </span>
              </div>
              {porting.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Completed Live Date:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {new Date(porting.completed_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Carrier Notes & LOA details */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Carrier Notes &amp; LOA Instructions
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {porting.notes || 'No specific carrier account or authorization instructions attached.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          {onCreateTicket && (
            <button
              onClick={() => onCreateTicket(porting.property_id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Raise Support Ticket</span>
            </button>
          )}
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
