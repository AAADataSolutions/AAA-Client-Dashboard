'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { itemVariants, type MonthOption } from './types';

interface FinancesWaterfallAndBridgeProps {
  waterfallMonth: string;
  setWaterfallMonth: (val: string) => void;
  waterfallItems: any[];
  maxWaterfallVal: number;
  bridgeMonth: string;
  setBridgeMonth: (val: string) => void;
  bridgeItems: any[];
  maxBridgeVal: number;
  availableMonths: MonthOption[];
}

export default function FinancesWaterfallAndBridge({
  waterfallMonth,
  setWaterfallMonth,
  waterfallItems,
  maxWaterfallVal,
  bridgeMonth,
  setBridgeMonth,
  bridgeItems,
  maxBridgeVal,
  availableMonths,
}: FinancesWaterfallAndBridgeProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* P&L Financial Waterfall (2 cols) */}
      <div className="lg:col-span-2 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">P&L Financial Waterfall</h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">
              GMR → partner share → vendors → servers → net profit
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Month:</span>
            <select
              value={waterfallMonth}
              onChange={(e) => setWaterfallMonth(e.target.value)}
              className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-56 w-full flex items-end justify-between gap-3 pt-4 px-2">
          {waterfallItems.map((item: any, idx: number) => {
            const absVal = Math.abs(Number(item.value || 0));
            const heightPct = Math.min(100, Math.max(absVal > 0 ? 8 : 2, (absVal / maxWaterfallVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">
                  {item.value < 0 ? '−' : item.isTotal ? '' : '+'}${absVal.toFixed(0)}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: item.color,
                  }}
                />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center truncate w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Movement Bridge (1 col) */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Revenue Movement Bridge</h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">GMR Expansion vs Prior Month</p>
          </div>

          <select
            value={bridgeMonth}
            onChange={(e) => setBridgeMonth(e.target.value)}
            className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-56 w-full flex items-end justify-between gap-2 pt-4 px-1">
          {bridgeItems.map((item: any, idx: number) => {
            const absVal = Math.abs(Number(item.value || 0));
            const heightPct = Math.min(100, Math.max(absVal > 0 ? 8 : 2, (absVal / maxBridgeVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-bold font-mono text-slate-700 dark:text-slate-300 truncate">
                  {item.value < 0 ? '−' : item.isTotal ? '' : '+'}${absVal.toFixed(0)}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all duration-300"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: item.color,
                  }}
                />
                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 text-center truncate w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
