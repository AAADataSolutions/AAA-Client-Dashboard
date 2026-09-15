'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  Hotel,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowUpRight,
  LifeBuoy,
  Edit2,
  Activity,
  FileText,
} from 'lucide-react';
import { useToast } from './ClientToast';

interface E911DetailDrawerProps {
  record: any | null;
  onClose: () => void;
  isClientAdmin: boolean;
  onOpenEdit?: (record: any) => void;
  onOpenProperty?: (propId: string) => void;
  onCreateTicket?: (propId: string) => void;
}

export const E911DetailDrawer: React.FC<E911DetailDrawerProps> = ({
  record,
  onClose,
  isClientAdmin,
  onOpenEdit,
  onOpenProperty,
  onCreateTicket,
}) => {
  const toast = useToast();

  if (!record) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const isVerified = record.status === 'VERIFIED';
  const isActionRequired = record.status === 'CORRECTION_REQUIRED' || record.status === 'FAILED';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isVerified
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                  : isActionRequired
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/40'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {record.property_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                E911 PSAP Dispatch Compliance Record
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
          {/* Status & Compliance Banner */}
          <div
            className={`p-4 rounded-xl border ${
              isVerified
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                : isActionRequired
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : isActionRequired ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span className="font-bold text-xs uppercase tracking-wide">
                  PSAP Status: {record.status}
                </span>
              </div>
              <span className="text-[10.5px]">
                {record.verified_at
                  ? `Verified: ${new Date(record.verified_at).toLocaleDateString()}`
                  : 'Pending Validation'}
              </span>
            </div>
            <p className="text-[11px] mt-2 opacity-90 leading-relaxed">
              {isVerified
                ? 'This property is fully registered in the Master Street Address Guide (MSAG) and local Public Safety Answering Point (PSAP) database for emergency 911 calling.'
                : isActionRequired
                ? 'Emergency dispatch routing requires correction. The registered address does not match MSAG carrier database validation.'
                : 'Emergency address is queued with carrier operations for PSAP database provisioning.'}
            </p>
          </div>

          {/* Emergency Dispatch Civic Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Registered Emergency Civic Address
              </span>
              <button
                onClick={() => handleCopy(record.emergency_address, 'Emergency address')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Address</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="font-semibold text-slate-900 dark:text-white text-xs leading-relaxed">
                  {record.emergency_address}
                </p>
              </div>
              {isClientAdmin && onOpenEdit && (
                <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex justify-end">
                  <button
                    onClick={() => onOpenEdit(record)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Civic Address</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Correction / Issue Notes if present */}
          {record.correction_notes && (
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                Carrier Notes &amp; Issue Details
              </span>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {record.correction_notes}
                </p>
              </div>
            </div>
          )}

          {/* Ray Baum Act Compliance */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Federal Compliance &amp; Dispatch Standards
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Ray Baum Dispatchable Location:</span>
                <span
                  className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                    record.ray_baud_and_logs_enabled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {record.ray_baud_and_logs_enabled ? 'ENABLED & LOGGED' : 'STANDARD'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Kari\'s Law Notification:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Compliant (Direct 911 Dialing)
                </span>
              </div>
            </div>
          </div>

          {/* Associated Property Location */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
              Property Location Record
            </span>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {record.property_name}
                  </span>
                </div>
                {onOpenProperty && record.property_id && (
                  <button
                    onClick={() => onOpenProperty(record.property_id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View 360°</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {record.property_address && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {record.property_address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          {onCreateTicket && (
            <button
              onClick={() => onCreateTicket(record.property_id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Raise E911 Ticket</span>
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
