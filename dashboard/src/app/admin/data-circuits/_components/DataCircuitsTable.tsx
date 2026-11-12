'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  Hotel,
  Loader2,
  Trash2,
} from 'lucide-react';
import {
  itemVariants,
  getCircuitStageBadge,
  formatCurrency,
} from './types';

interface DataCircuitsTableProps {
  displayedCircuits: any[];
  loading: boolean;
  activeViewTab: 'PIPELINE' | 'INSTALLED';
  selectedMonth: string;
  togglingCircuitId: string | null;
  onOpenManageModal: (circuit: any, initialTab?: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW') => void;
  onToggleMonthlyRevenue: (circuitId: string, receiveYes: boolean) => void;
  onDeleteCircuit: (circuit: any) => void;
  onOpenCreate: () => void;
}

export default function DataCircuitsTable({
  displayedCircuits,
  loading,
  activeViewTab,
  selectedMonth,
  togglingCircuitId,
  onOpenManageModal,
  onToggleMonthlyRevenue,
  onDeleteCircuit,
  onOpenCreate,
}: DataCircuitsTableProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200/80 dark:border-[#222430] shadow-xs overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] text-xs font-black uppercase tracking-wider text-black dark:text-white">
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Property</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Wholesaler</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Carrier</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Client Price</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Revenue Share</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Stage</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Site Survey &amp; FOC</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Monthly revenue</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading Data Circuits...
                </td>
              </tr>
            ) : displayedCircuits.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-500">
                  <Network className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    {activeViewTab === 'INSTALLED'
                      ? 'No Installed Data Circuits Yet'
                      : 'No Pipeline Data Circuits Found'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activeViewTab === 'INSTALLED'
                      ? 'Circuits automatically move here from the Pipeline the moment their stage is set to Installed.'
                      : 'Click "New Data Circuit Request" to start a new property data circuit.'}
                  </p>
                </td>
              </tr>
            ) : (
              displayedCircuits.map((c) => {
                const badge = getCircuitStageBadge(c.status);
                const hasPdf = Boolean(c.agreement_file_name || c.agreement_storage_path || c.agreement_file_url);
                const isRec = Boolean(c.current_month_revenue?.revenue_received);

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#191b24] transition-colors cursor-pointer"
                    onClick={() => onOpenManageModal(c, 'PRICING')}
                  >
                    {/* Property (shows name and address only) */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Hotel className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{c.property_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[240px]">
                        {c.property_address}
                      </p>
                    </td>

                    {/* Wholesaler */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {c.wholesaler_name || <span className="text-slate-400 italic">Pending selection</span>}
                      </div>
                    </td>

                    {/* Carrier */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {c.carrier_name || '—'}
                      </div>
                      {c.bandwidth && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.bandwidth}
                        </span>
                      )}
                    </td>

                    {/* Client Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.circuit_monthly_price)}
                        <span className="text-[10px] font-normal text-slate-400">/mo</span>
                      </div>
                    </td>

                    {/* Revenue Share */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.monthly_revenue_share_amount)}/mo
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        ({c.revenue_share_percentage}%)
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                        <span className={hasPdf ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600'}>
                          {hasPdf ? '✓ PDF Signed' : '• Needs PDF'}
                        </span>
                      </div>
                    </td>

                    {/* Site Survey & FOC Status + Notes */}
                    <td
                      className="py-3.5 px-4 max-w-[260px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenManageModal(c, 'STAGES');
                      }}
                      title="Click to update Site Survey & FOC status and notes"
                    >
                      <div className="space-y-1.5">
                        {/* Site Survey Status Badge + Notes */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                                c.site_survey_status === 'COMPLETED' || c.site_survey_status === 'DONE'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : c.site_survey_status === 'NOT_REQUIRED'
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                              }`}
                            >
                              {c.site_survey_status === 'COMPLETED' || c.site_survey_status === 'DONE'
                                ? '✓ Site Survey: Done'
                                : c.site_survey_status === 'NOT_REQUIRED'
                                ? 'Site Survey: N/A'
                                : '• Site Survey: Pending'}
                            </span>
                          </div>
                          {c.site_survey_notes && (
                            <p
                              className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 truncate"
                              title={c.site_survey_notes}
                            >
                              Note: {c.site_survey_notes}
                            </p>
                          )}
                        </div>

                        {/* FOC Status Badge + Date + Notes */}
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                                c.foc_status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                              }`}
                            >
                              {c.foc_status === 'CONFIRMED'
                                ? `✓ FOC Confirmed${c.foc_date ? ` (${String(c.foc_date).slice(0, 10)})` : ''}`
                                : `• FOC: Pending Actions${c.foc_date ? ` (${String(c.foc_date).slice(0, 10)})` : ''}`}
                            </span>
                          </div>
                          {c.foc_pending_actions_notes && (
                            <p
                              className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 truncate"
                              title={c.foc_pending_actions_notes}
                            >
                              FOC Note: {c.foc_pending_actions_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Monthly revenue */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={togglingCircuitId === c.id}
                          onClick={() => onToggleMonthlyRevenue(c.id, true)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            isRec
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          disabled={togglingCircuitId === c.id}
                          onClick={() => onToggleMonthlyRevenue(c.id, false)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                            !isRec
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          }`}
                        >
                          No
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {isRec
                          ? `Added ${formatCurrency(c.monthly_revenue_share_amount)}`
                          : `Pending (${selectedMonth})`}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenManageModal(c, 'PRICING')}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => onDeleteCircuit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete Circuit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
