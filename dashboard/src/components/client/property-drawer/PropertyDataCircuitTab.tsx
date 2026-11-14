'use client';

import React from 'react';
import { Wifi, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

interface PropertyDataCircuitTabProps {
  dataCircuit?: any;
  property?: any;
}

export function PropertyDataCircuitTab({ dataCircuit }: PropertyDataCircuitTabProps) {
  if (!dataCircuit) {
    return (
      <div className="space-y-4">
        <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/40">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-xs">
              Ported Voice Only — No Enterprise Data Circuit
            </h4>
            <p className="text-slate-400 text-[11px] max-w-sm mx-auto mt-1 leading-relaxed">
              This property location operates on standard ported voice trunks. An enterprise dedicated internet circuit has not been requested or provisioned for this site.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Circuit Header Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              Data Circuit Connectivity
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
              Carrier: {dataCircuit.carrier_name || 'Carrier Pending'} • {dataCircuit.bandwidth || '1 Gig'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-2xs">
          {dataCircuit.status?.replace(/_/g, ' ') || 'STARTED'}
        </span>
      </div>

      {/* Signed Agreement Document Box (Prominent) */}
      <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Signed Agreement PDF
          </span>
          {dataCircuit.agreement_file_url && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" /> Countersigned
            </span>
          )}
        </div>

        {dataCircuit.agreement_file_url ? (
          <div className="p-3.5 bg-white dark:bg-[#111217] rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {dataCircuit.agreement_file_name || 'Data_Circuit_Agreement.pdf'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {dataCircuit.paperwork_signed_at
                    ? `Executed on ${new Date(dataCircuit.paperwork_signed_at).toLocaleDateString()}`
                    : 'Official Agreement PDF'}
                </p>
              </div>
            </div>
            <a
              href={dataCircuit.agreement_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Signed PDF</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        ) : (
          <div className="p-4 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
            <FileText className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
            <p className="font-semibold">Agreement PDF Pending Signature</p>
            <p className="text-[11px] mt-0.5">Once paperwork is signed, the executed PDF will appear here.</p>
          </div>
        )}
      </div>

      {/* Technical Specifications */}
      <div className="p-4 bg-slate-50 dark:bg-[#181920] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
          Circuit Specifications
        </span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-[#111217] rounded-xl border border-slate-200/60 dark:border-[#252733]">
            <span className="text-[10px] text-slate-400 block">Carrier Service</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {dataCircuit.carrier_name || 'Carrier Pending'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-[#111217] rounded-xl border border-slate-200/60 dark:border-[#252733]">
            <span className="text-[10px] text-slate-400 block">Bandwidth</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {dataCircuit.bandwidth || '1 Gig'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-[#111217] rounded-xl border border-slate-200/60 dark:border-[#252733]">
            <span className="text-[10px] text-slate-400 block">Circuit Monthly Price</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {dataCircuit.circuit_monthly_price !== null && dataCircuit.circuit_monthly_price !== undefined
                ? `$${Number(dataCircuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                : '—'}
            </span>
          </div>
          <div className="p-3 bg-white dark:bg-[#111217] rounded-xl border border-slate-200/60 dark:border-[#252733]">
            <span className="text-[10px] text-slate-400 block">FOC Status</span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
              {dataCircuit.foc_date
                ? `${dataCircuit.foc_status || 'CONFIRMED'} (${dataCircuit.foc_date})`
                : dataCircuit.foc_status || 'PENDING'}
            </span>
          </div>
        </div>

        {dataCircuit.technical_details && (
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Technical Configuration (IP Address, Gateway, WAN IP, DNS)
            </span>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
              {dataCircuit.technical_details}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
