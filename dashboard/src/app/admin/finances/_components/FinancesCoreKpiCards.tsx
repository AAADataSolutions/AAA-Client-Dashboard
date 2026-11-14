'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  itemVariants,
  formatCurrency,
  type MonthOption,
} from './types';

interface FinancesCoreKpiCardsProps {
  availableMonths: MonthOption[];
  gmrMonth: string;
  setGmrMonth: (m: string) => void;
  revAddedVoiceMonth: string;
  setRevAddedVoiceMonth: (m: string) => void;
  revAddedInternetMonth: string;
  setRevAddedInternetMonth: (m: string) => void;
  partnerOutflowMonth: string;
  setPartnerOutflowMonth: (m: string) => void;
  nrvMonth: string;
  setNrvMonth: (m: string) => void;
  netProfitMonth: string;
  setNetProfitMonth: (m: string) => void;
  expensesMonth: string;
  setExpensesMonth: (m: string) => void;
  arrMonth: string;
  setArrMonth: (m: string) => void;
  cumulativeYtd: boolean;
  setCumulativeYtd: (c: boolean) => void;
  gmrData: any;
  revAddedVoiceData: any;
  revAddedInternetData: any;
  partnerOutflowData: any;
  nrvData: any;
  netProfitData: any;
  expensesData: any;
  arrData: any;
  realYtdProfit: number;
  sparklinePoints: string;
}

export default function FinancesCoreKpiCards({
  availableMonths,
  gmrMonth,
  setGmrMonth,
  revAddedVoiceMonth,
  setRevAddedVoiceMonth,
  revAddedInternetMonth,
  setRevAddedInternetMonth,
  partnerOutflowMonth,
  setPartnerOutflowMonth,
  nrvMonth,
  setNrvMonth,
  netProfitMonth,
  setNetProfitMonth,
  expensesMonth,
  setExpensesMonth,
  arrMonth,
  setArrMonth,
  cumulativeYtd,
  setCumulativeYtd,
  gmrData,
  revAddedVoiceData,
  revAddedInternetData,
  partnerOutflowData,
  nrvData,
  netProfitData,
  expensesData,
  arrData,
  realYtdProfit,
  sparklinePoints,
}: FinancesCoreKpiCardsProps) {
  // Voice added calculations
  const voiceAdded =
    revAddedVoiceData.voiceRevenueAddedThisMonth !== undefined
      ? revAddedVoiceData.voiceRevenueAddedThisMonth
      : (revAddedVoiceData.revenueAddedThisMonth || 0) - (revAddedVoiceData.dataCircuitRevenueShare || 0);

  const voiceGrowth =
    revAddedVoiceData.voiceRevenueGrowthPct !== undefined
      ? revAddedVoiceData.voiceRevenueGrowthPct
      : revAddedVoiceData.revenueAddedGrowthPct || 0;

  // Internet added calculations
  const internetAdded =
    revAddedInternetData.internetRevenueAddedThisMonth !== undefined
      ? revAddedInternetData.internetRevenueAddedThisMonth
      : revAddedInternetData.dataCircuitRevenueShare || 0;

  const internetGrowth =
    revAddedInternetData.internetRevenueGrowthPct !== undefined
      ? revAddedInternetData.internetRevenueGrowthPct
      : 100;

  return (
    <>
      {/* Row 1: GMR, Voice Added, Internet Added, Partner Outflow (4 cards in one row) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Monthly Revenue (GMR) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Gross Monthly Revenue (GMR)
              </span>
              <select
                value={gmrMonth}
                onChange={(e) => setGmrMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {formatCurrency(gmrData.grossMonthlyRevenue || 0)}
                </span>
                {gmrData.revenueIncreaseMonthly > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    +{formatCurrency(gmrData.revenueIncreaseMonthly)}
                  </span>
                )}
              </div>

              {/* Dynamic Sparkline SVG */}
              <svg width="70" height="22" className="overflow-visible opacity-90">
                <polyline fill="none" stroke="#86efac" strokeWidth="2" points={sparklinePoints} />
              </svg>
            </div>
          </div>

          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Across {gmrData.activePropertiesCount || 0} active properties
            {Number(gmrData.dataCircuitRevenueShare || 0) > 0 && (
              <span className="ml-1 font-bold text-cyan-200">
                (+{formatCurrency(Number(gmrData.dataCircuitRevenueShare))} Data Circuit share)
              </span>
            )}
          </p>
        </div>

        {/* Card 2: Revenue Added This Month from Voice Services (Green) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#047857] via-[#065f46] to-[#064e3b] text-white border border-emerald-600/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Revenue Added (Voice)
              </span>
              <select
                value={revAddedVoiceMonth}
                onChange={(e) => setRevAddedVoiceMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${voiceAdded >= 0 ? 'text-white' : 'text-rose-300'}`}>
                  {formatCurrency(voiceAdded)}
                </span>
                {voiceGrowth !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    voiceAdded >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                  }`}>
                    {voiceAdded >= 0 ? '+' : ''}{voiceGrowth}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-emerald-200 mt-2 pt-2 border-t border-white/10">
            {revAddedVoiceData.previousMonthName
              ? `From ${formatCurrency(revAddedVoiceData.prevVoiceGmr || revAddedVoiceData.previousMonthGmr || 0)} (${revAddedVoiceData.previousMonthShort || 'prev'}) to ${formatCurrency(revAddedVoiceData.voiceGmr || revAddedVoiceData.grossMonthlyRevenue || 0)}`
              : 'Voice line plans & recurring additions'}
          </p>
        </div>

        {/* Card 3: Revenue Added This Month from Internet Services (Green) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#047857] via-[#065f46] to-[#064e3b] text-white border border-emerald-600/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Revenue Added (Internet)
              </span>
              <select
                value={revAddedInternetMonth}
                onChange={(e) => setRevAddedInternetMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${internetAdded >= 0 ? 'text-white' : 'text-rose-300'}`}>
                  {formatCurrency(internetAdded)}
                </span>
                {internetGrowth !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    internetAdded >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                  }`}>
                    {internetAdded >= 0 ? '+' : ''}{internetGrowth}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-emerald-200 mt-2 pt-2 border-t border-white/10">
            {revAddedInternetData.dataCircuitReceivedCount
              ? `${revAddedInternetData.dataCircuitReceivedCount} active circuit rev shares received`
              : 'Data circuit vendor commission share'}
          </p>
        </div>

        {/* Card 4: Partner Outflow */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Partner Outflow
              </span>
              <select
                value={partnerOutflowMonth}
                onChange={(e) => setPartnerOutflowMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-amber-300">
                {formatCurrency(partnerOutflowData.partnerCommissionOutflow || 0)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                {partnerOutflowData.partnerOutflowPctOfGMR || 0}% of GMR
              </span>
            </div>
          </div>

          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Across {partnerOutflowData.activePartnersCount || 0} active channel partners
          </p>
        </div>
      </motion.div>

      {/* Row 2: NRV, Net Profit, Operating Expenses, ARR (4 cards in one row) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 5: Net Retained Value (NRV) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Net Retained Value (NRV)
              </span>
              <select
                value={nrvMonth}
                onChange={(e) => setNrvMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-emerald-300">
                {formatCurrency(nrvData.netRetainedValue || 0)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                {nrvData.netRetainedPct || 0}% retained
              </span>
            </div>
          </div>

          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Company revenue after partner share disbursements
          </p>
        </div>

        {/* Card 6: Net Profit (Hero Card) */}
        <div
          className={`p-5 rounded-2xl bg-white dark:bg-[#15161c] text-slate-900 dark:text-white border shadow-lg relative overflow-hidden flex flex-col justify-between ${
            (cumulativeYtd ? realYtdProfit : netProfitData.netProfit || 0) >= 0
              ? 'border-emerald-500/80 shadow-[0_0_24px_rgba(52,211,153,0.25)]'
              : 'border-rose-500/80 shadow-[0_0_24px_rgba(251,113,133,0.25)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Profit
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={netProfitMonth}
                  onChange={(e) => setNetProfitMonth(e.target.value)}
                  className="bg-slate-100 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-lg px-2 py-0.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cumulativeYtd}
                    onChange={(e) => setCumulativeYtd(e.target.checked)}
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  YTD
                </label>
              </div>
            </div>

            <div className="mt-2.5">
              <span
                className={`text-2xl font-black font-mono ${
                  (cumulativeYtd ? realYtdProfit : netProfitData.netProfit || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600'
                }`}
              >
                {formatCurrency(cumulativeYtd ? realYtdProfit : netProfitData.netProfit || 0)}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
            {cumulativeYtd ? 'YTD Total · ' : ''}
            {netProfitData.netProfitMarginPct || 0}% net profit margin
          </p>
        </div>

        {/* Card 7: Total Operating Expenses */}
        <div className="p-5 rounded-2xl bg-[#0a1330] text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Operating Expenses
              </span>
              <select
                value={expensesMonth}
                onChange={(e) => setExpensesMonth(e.target.value)}
                className="bg-black/40 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/60 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex justify-between items-baseline">
              <span className="text-xl font-black text-rose-300">
                {formatCurrency(expensesData.totalOperatingExpenses || 0)}
              </span>
            </div>

            <div className="mt-2.5 space-y-1.5 text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span>Partners</span>
                  <span className="font-mono text-amber-300">
                    {formatCurrency(expensesData.partnerCommissionOutflow || 0)}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        expensesData.totalOperatingExpenses > 0
                          ? (expensesData.partnerCommissionOutflow / expensesData.totalOperatingExpenses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span>Vendors</span>
                  <span className="font-mono text-blue-300">
                    {formatCurrency(expensesData.vendorExpenses || 0)}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        expensesData.totalOperatingExpenses > 0
                          ? (expensesData.vendorExpenses / expensesData.totalOperatingExpenses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                  <span>Servers</span>
                  <span className="font-mono text-emerald-300">
                    {formatCurrency(expensesData.serverExpenses || 0)}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        expensesData.totalOperatingExpenses > 0
                          ? (expensesData.serverExpenses / expensesData.totalOperatingExpenses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 8: Annualized Run-Rate (ARR) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                Annualized Run-Rate (ARR)
              </span>
              <select
                value={arrMonth}
                onChange={(e) => setArrMonth(e.target.value)}
                className="bg-black/25 text-white text-[10px] font-bold rounded-lg px-2 py-0.5 border border-white/20 focus:outline-hidden cursor-pointer hover:bg-black/40 transition"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key} className="bg-[#0f172a] text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-white">
                {formatCurrency(arrData.annualizedRunRate || 0)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                ▲ 12x Run-Rate
              </span>
            </div>
          </div>

          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Computed from {arrData.monthName || arrMonth} GMR ($
            {arrData.grossMonthlyRevenue?.toLocaleString() || 0} × 12)
          </p>
        </div>
      </motion.div>
    </>
  );
}
