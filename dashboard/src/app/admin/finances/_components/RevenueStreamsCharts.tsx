'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Network, TrendingUp, Building2, Radio } from 'lucide-react';
import { itemVariants, formatCurrency, type RevenueStreamsData } from './types';

interface RevenueStreamsChartsProps {
  data: RevenueStreamsData;
}

export function RevenueStreamsCharts({ data }: RevenueStreamsChartsProps) {
  const { portingRevenue, dataCircuitRevenue, summary, historicalTrends } = data;

  // Max value for 12-month trend chart scaling
  const maxTrendVal = Math.max(
    ...historicalTrends.map((t) => t.totalRevenue || 0),
    1
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Wholesaler Commission Leaderboard */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Wholesaler Rev Share Payouts
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {dataCircuitRevenue.wholesalerBreakdown.length} Wholesalers
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {dataCircuitRevenue.wholesalerBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No active wholesaler commissions recorded for this month.
              </p>
            ) : (
              dataCircuitRevenue.wholesalerBreakdown.map((w) => {
                const pct =
                  dataCircuitRevenue.totalExpectedRevShare > 0
                    ? Math.round((w.expectedAmount / dataCircuitRevenue.totalExpectedRevShare) * 100)
                    : 0;
                return (
                  <div key={w.wholesalerName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {w.wholesalerName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(w.receivedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          of {formatCurrency(w.expectedAmount)}
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-[#1f212c] h-2 rounded-full overflow-hidden flex">
                      <div
                        style={{
                          width: `${w.expectedAmount > 0 ? (w.receivedAmount / w.expectedAmount) * 100 : 0}%`,
                        }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        title={`Received: ${formatCurrency(w.receivedAmount)}`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{w.circuitsCount} circuit{w.circuitsCount === 1 ? '' : 's'}</span>
                      <span>{pct}% of circuit revenue</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Total Confirmed Payouts</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {formatCurrency(dataCircuitRevenue.receivedRevShare)}
          </span>
        </div>
      </motion.div>

      {/* 2. Underlying Carrier Distribution */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Carrier Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {dataCircuitRevenue.carrierBreakdown.length} Carriers
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {dataCircuitRevenue.carrierBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No carrier data recorded.
              </p>
            ) : (
              dataCircuitRevenue.carrierBreakdown.map((c) => {
                const pct =
                  dataCircuitRevenue.totalExpectedRevShare > 0
                    ? Math.round((c.commissionAmount / dataCircuitRevenue.totalExpectedRevShare) * 100)
                    : 0;
                return (
                  <div key={c.carrierName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {c.carrierName}
                      </span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(c.commissionAmount)}/mo
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#1f212c] h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, pct)}%` }}
                        className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{c.circuitsCount} circuit{c.circuitsCount === 1 ? '' : 's'}</span>
                      <span>{pct}% share</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-3 mt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Active Pipeline &amp; Live Circuits</span>
          <span className="text-slate-900 dark:text-white font-bold">
            {dataCircuitRevenue.circuitsCount} Total
          </span>
        </div>
      </motion.div>

      {/* 3. 12-Month Stream Comparison Bar Chart */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Historical Monthly Stream Inflows
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold">
              12 Months
            </span>
          </div>

          <div className="mt-4">
            <div className="h-44 flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-100 dark:border-[#222430]">
              {historicalTrends.map((t) => {
                const totalH = (t.totalRevenue / maxTrendVal) * 100;
                const portingH = t.totalRevenue > 0 ? (t.portingRevenue / t.totalRevenue) * totalH : 0;
                const circuitH = t.totalRevenue > 0 ? (t.circuitRevenue / t.totalRevenue) * totalH : 0;
                const isCurrent = t.monthKey === data.monthKey;

                return (
                  <div
                    key={t.monthKey}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition pointer-events-none z-30 bg-slate-900 text-white text-[10px] rounded-lg p-1.5 shadow-lg whitespace-nowrap">
                      <p className="font-bold">{t.monthKey}</p>
                      <p className="text-blue-300">Porting: {formatCurrency(t.portingRevenue)}</p>
                      <p className="text-emerald-300">Circuits: {formatCurrency(t.circuitRevenue)}</p>
                      <p className="border-t border-slate-700 mt-0.5 pt-0.5 font-bold">
                        Total: {formatCurrency(t.totalRevenue)}
                      </p>
                    </div>

                    {/* Stacked bar */}
                    <div className="w-full max-w-[18px] flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${circuitH}%` }}
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          isCurrent ? 'bg-emerald-500' : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                        }`}
                      />
                      <div
                        style={{ height: `${portingH}%` }}
                        className={`w-full transition-all duration-300 ${
                          isCurrent ? 'bg-blue-600' : 'bg-blue-500/80 group-hover:bg-blue-600'
                        }`}
                      />
                    </div>

                    <span
                      className={`text-[9px] mt-1.5 font-semibold ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {t.monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="pt-3 mt-2 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Porting / Voice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Circuit Rev Share</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

