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
  Download,
  Eye,
} from 'lucide-react';
import { useToast } from './ClientToast';

interface PortingDetailDrawerProps {
  porting: any | null;
  onClose: () => void;
  onOpenProperty?: (propId: string) => void;
  onCreateTicket?: (propId: string) => void;
}

const STAGES_ROAD = [
  { key: 'DRAFT', label: 'Draft Initialized', step: 1 },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', step: 2 },
  { key: 'SIGNED', label: 'Contract Signed', step: 3 },
  { key: 'CSR_DETAILS', label: 'CSR and Contract Details', step: 4 },
  { key: 'CUT_SHEET_REVIEW', label: 'Cut Sheet Review', step: 5 },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', step: 6 },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 7 },
  { key: 'COMPLETED', label: 'Onboarded', step: 8 },
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

  const normalizedStatus = (
    porting.status === 'CSR_DETAILS' || porting.status === 'CSR_AND_CONTRACT_DETAILS' || porting.stage === 'CSR_DETAILS' || porting.stage === 'CSR_AND_CONTRACT_DETAILS' ? 'CSR_DETAILS' :
    porting.status === 'SOF_WAITING' ? 'CUT_SHEET_REVIEW' :
    porting.status === 'SUBMITTED' ? 'PORTING_SUBMITTED' :
    porting.status === 'IN_PROGRESS' ? 'PORTING_SUBMITTED' :
    porting.stage || porting.status || 'DRAFT'
  );

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'CONTRACT_SENT': return 1;
      case 'SIGNED': return 2;
      case 'CSR_DETAILS':
      case 'CSR_AND_CONTRACT_DETAILS': return 3;
      case 'CUT_SHEET_REVIEW':
      case 'SOF_WAITING':
      case 'CUT_SHEET': return 4;
      case 'PORTING_SUBMITTED':
      case 'SUBMITTED':
      case 'IN_PROGRESS': return 5;
      case 'FOC_RECEIVED': return 6;
      case 'COMPLETED': return 7;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(normalizedStatus);
  const currentStageObj = STAGES_ROAD[currentStageIdx] || STAGES_ROAD[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
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
          {/* Status & Stepper Banner (All 8 Stages) */}
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
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Lifecycle &amp; Cutover Status
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    Stage {currentStageObj.step}: {currentStageObj.label}
                  </span>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Stage {currentStageObj.step} of 8
                </span>
              </div>

              {/* Visual 8-Stage Progress Stepper */}
              <div className="pt-2">
                <div className="grid grid-cols-8 gap-1 text-center">
                  {STAGES_ROAD.map((stage, idx) => {
                    const isPassed = idx < currentStageIdx;
                    const isCurrent = idx === currentStageIdx;
                    return (
                      <div key={stage.key} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-full h-1.5 rounded-full transition-all ${
                            isPassed
                              ? 'bg-emerald-500'
                              : isCurrent
                              ? 'bg-blue-600 dark:bg-blue-400 animate-pulse'
                              : 'bg-slate-200 dark:bg-[#222430]'
                          }`}
                        />
                        <span
                          className={`text-[8.5px] leading-tight block truncate w-full ${
                            isCurrent
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : isPassed
                              ? 'text-slate-700 dark:text-slate-300 font-medium'
                              : 'text-slate-400'
                          }`}
                          title={`Stage ${stage.step}: ${stage.label}`}
                        >
                          {stage.step}. {stage.label.split(' ')[0]}
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
              Property Information
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {porting.property_name}
                  </span>
                </div>
                {onOpenProperty && porting.property_id && (
                  <button
                    onClick={() => onOpenProperty(porting.property_id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View 360°</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Organization */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#222430]">
                <span className="text-slate-400">Organization:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {porting.organization_name && porting.organization_name !== 'Unassigned Organization' && porting.organization_name !== 'Direct Portfolio'
                    ? porting.organization_name
                    : '—'}
                </span>
              </div>

              {porting.property_address && (
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-400">Address:</span>
                  <span className="text-right text-slate-700 dark:text-slate-300 max-w-[240px]">
                    {porting.property_address}
                  </span>
                </div>
              )}

              {porting.property_phone && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Main Phone:</span>
                  <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200">
                    <span>{porting.property_phone}</span>
                    <button
                      onClick={() => handleCopy(porting.property_phone, 'Phone number')}
                      className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {porting.fax && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fax:</span>
                  <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200">
                    <span>{porting.fax}</span>
                    <button
                      onClick={() => handleCopy(porting.fax, 'Fax number')}
                      className="p-0.5 text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Ray Baum and Kary's Law Compliance */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#222430]">
                <span className="text-slate-400">Ray Baum Compliance:</span>
                {(porting.ray_baud_and_logs_enabled === true ||
                  porting.ray_baum_status === 'ACTIVE' ||
                  porting.ray_baum_status === 'Active' ||
                  porting.ray_baum_status === 'VERIFIED' ||
                  porting.is_ray_baum_active === true) ? (
                  <button
                    onClick={() => {
                      if (porting.property_id) {
                        window.open(`/dashboard/ray-baum/${porting.property_id}`, '_blank');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                    title="Click to view Ray Baum and Kary's Law dispatch records in a new tab"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>View Ray Baum&apos;s No.</span>
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Inactive</span>
                  </span>
                )}
              </div>
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
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                {porting.notes || 'No specific carrier account or authorization instructions attached.'}
              </p>
            </div>
          </div>

          {/* Carrier Details & Account Info */}
          {porting.carrier_details && (
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Carrier Details &amp; Account Info
              </span>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs whitespace-pre-wrap">
                  {porting.carrier_details}
                </p>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Attachments ({porting.attachments?.length || 0})
              </span>
            </div>
            {porting.attachments && porting.attachments.length > 0 ? (
              <div className="space-y-2">
                {porting.attachments.map((att: any, idx: number) => {
                  const fileUrl = `/api/client/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
                  return (
                    <div
                      key={att.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {att.file_name}
                          </p>
                          <p className="text-[10.5px] text-slate-400">
                            {(att.file_size / 1024 / 1024).toFixed(2)} MB &bull; {att.mime_type || 'Document'}
                          </p>
                        </div>
                      </div>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={att.file_name}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 font-semibold text-xs transition flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] text-slate-400 text-center text-xs">
                No attachments uploaded for this porting request.
              </div>
            )}
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
