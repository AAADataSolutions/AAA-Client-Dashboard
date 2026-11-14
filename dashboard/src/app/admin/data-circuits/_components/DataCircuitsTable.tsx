'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  Hotel,
  Loader2,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  itemVariants,
  getCircuitStageBadge,
  formatCurrency,
} from './types';

interface DataCircuitsTableProps {
  displayedCircuits: any[];
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
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
  totalCount,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  onPageChange,
  loading,
  activeViewTab,
  selectedMonth,
  togglingCircuitId,
  onOpenManageModal,
  onToggleMonthlyRevenue,
  onDeleteCircuit,
  onOpenCreate,
}: DataCircuitsTableProps) {
  const effectiveTotal = totalCount ?? displayedCircuits.length;
  const startItem = effectiveTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(effectiveTotal, currentPage * pageSize);
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
              <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Monthly revenue</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-black text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading Data Circuits...
                </td>
              </tr>
            ) : displayedCircuits.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500">
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
                const badge = getCircuitStageBadge(c.status, c);
                const isRec = Boolean(c.current_month_revenue?.revenue_received);

                return (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#191b24] transition-colors cursor-pointer"
                    onClick={() => onOpenManageModal(c, 'PRICING')}
                  >
                    {/* Property (shows name and address with location pin) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-black dark:text-white text-sm">
                        {c.property_name}
                      </div>
                      {c.property_address && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[280px]">{c.property_address}</span>
                        </div>
                      )}
                    </td>

                    {/* Wholesaler */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {c.wholesaler_name || <span className="text-slate-400 italic font-normal text-xs">Pending selection</span>}
                      </div>
                    </td>

                    {/* Carrier */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {c.carrier_name || '—'}
                      </div>
                      {c.bandwidth && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          {c.bandwidth}
                        </span>
                      )}
                    </td>

                    {/* Client Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(c.circuit_monthly_price)}
                        <span className="text-xs font-normal text-slate-400">/mo</span>
                      </div>
                    </td>

                    {/* Revenue Share */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(c.monthly_revenue_share_amount)}/mo
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                        ({c.revenue_share_percentage}%)
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Monthly revenue */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={togglingCircuitId === c.id}
                          onClick={() => onToggleMonthlyRevenue(c.id, true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            !isRec
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          }`}
                        >
                          No
                        </button>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        {isRec
                          ? `Added ${formatCurrency(c.monthly_revenue_share_amount)}`
                          : `Pending (${selectedMonth})`}
                      </span>
                      {Number(c.times_paid_count || 0) > 0 && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Paid {c.times_paid_count}x ({formatCurrency(c.total_revenue_paid)} total)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onOpenManageModal(c, 'PRICING')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => onDeleteCircuit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Delete Circuit"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Pagination Bar */}
      {effectiveTotal > 0 && onPageChange && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-900 dark:text-white">{startItem}</span>–
            <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{effectiveTotal}</span> circuits
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1e202b] flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1e202b] flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
