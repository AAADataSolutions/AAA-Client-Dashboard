'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart as LineChartIcon } from 'lucide-react';
import { itemVariants, formatCurrency, type MonthOption } from './types';

interface FinancesTrajectoryLineGraphProps {
  lineGraphYear: number;
  setLineGraphYear: (y: number) => void;
  lineGraphTimeframe: 'all' | 'ytd' | 'last6' | 'q1' | 'q2' | 'q3' | 'q4';
  setLineGraphTimeframe: (tf: 'all' | 'ytd' | 'last6' | 'q1' | 'q2' | 'q3' | 'q4') => void;
  lineGraphMetric: 'revenue' | 'netProfit' | 'partnerOutflow' | 'compareAll';
  setLineGraphMetric: (m: 'revenue' | 'netProfit' | 'partnerOutflow' | 'compareAll') => void;
  lineGraphFocusMonth: string;
  setLineGraphFocusMonth: (m: string) => void;
  activeHoverLineIdx: number | null;
  setActiveHoverLineIdx: (idx: number | null) => void;
  dynamicLineGraphData: {
    points: any[];
    maxVal: number;
    minVal: number;
    totalPeriodRevenue: number;
    avgRevenue: number;
    peakPoint?: any;
  };
  focusedLineMonthData: any | null;
  availableMonths: MonthOption[];
  nowYear: number;
}

export default function FinancesTrajectoryLineGraph({
  lineGraphYear,
  setLineGraphYear,
  lineGraphTimeframe,
  setLineGraphTimeframe,
  lineGraphMetric,
  setLineGraphMetric,
  lineGraphFocusMonth,
  setLineGraphFocusMonth,
  activeHoverLineIdx,
  setActiveHoverLineIdx,
  dynamicLineGraphData,
  focusedLineMonthData,
  availableMonths,
  nowYear,
}: FinancesTrajectoryLineGraphProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222430] pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-blue-600" /> Revenue & Financial Trajectory (Line Graph)
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
            Y-Axis: Dollar Amount / Revenue · X-Axis: Month Progression for {lineGraphYear}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Metric Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1a1b24] p-1 rounded-xl text-xs">
            <button
              onClick={() => setLineGraphMetric('revenue')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                lineGraphMetric === 'revenue'
                  ? 'bg-white dark:bg-[#252836] text-blue-600 shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Gross Revenue
            </button>
            <button
              onClick={() => setLineGraphMetric('netProfit')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                lineGraphMetric === 'netProfit'
                  ? 'bg-white dark:bg-[#252836] text-emerald-600 shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Net Profit
            </button>
            <button
              onClick={() => setLineGraphMetric('partnerOutflow')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                lineGraphMetric === 'partnerOutflow'
                  ? 'bg-white dark:bg-[#252836] text-amber-600 shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Partner Outflow
            </button>
            <button
              onClick={() => setLineGraphMetric('compareAll')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                lineGraphMetric === 'compareAll'
                  ? 'bg-white dark:bg-[#252836] text-purple-600 shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Compare All
            </button>
          </div>

          {/* Timeframe Range Filter */}
          <select
            value={lineGraphTimeframe}
            onChange={(e: any) => setLineGraphTimeframe(e.target.value)}
            className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
          >
            <option value="all">Full Year (Jan – Dec)</option>
            <option value="ytd">Year-to-Date (YTD)</option>
            <option value="last6">Last 6 Months</option>
            <option value="q1">Q1 (Jan – Mar)</option>
            <option value="q2">Q2 (Apr – Jun)</option>
            <option value="q3">Q3 (Jul – Sep)</option>
            <option value="q4">Q4 (Oct – Dec)</option>
          </select>

          {/* Year Selector */}
          <select
            value={lineGraphYear}
            onChange={(e) => setLineGraphYear(parseInt(e.target.value, 10))}
            className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
          >
            <option value={nowYear}>{nowYear}</option>
            <option value={nowYear - 1}>{nowYear - 1}</option>
          </select>

          {/* Month Focus Filter */}
          <select
            value={lineGraphFocusMonth}
            onChange={(e) => setLineGraphFocusMonth(e.target.value)}
            className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Months Overview</option>
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                Focus {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick KPI Bar for Selected Timeframe */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 dark:bg-[#1a1b24]/50 p-3 rounded-xl border border-slate-100 dark:border-[#222430] text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Period Total Revenue</span>
          <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
            {formatCurrency(dynamicLineGraphData.totalPeriodRevenue)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Average</span>
          <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
            {formatCurrency(dynamicLineGraphData.avgRevenue)}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Peak Month</span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
            {dynamicLineGraphData.peakPoint?.monthName || '-'}{' '}
            <span className="text-[11px] font-normal">({formatCurrency(dynamicLineGraphData.peakPoint?.grossRevenue || 0)})</span>
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">View Mode</span>
          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm capitalize">
            {lineGraphMetric === 'compareAll' ? '3-Metric Multi-Line' : lineGraphMetric}
          </span>
        </div>
      </div>

      {/* Dynamic SVG Line Graph (Y-Axis: Amount, X-Axis: Month) */}
      <div className="h-64 w-full pt-3 relative">
        <svg viewBox="0 0 700 220" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGraphGlowRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGraphGlowProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGraphGlowOutflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid & Y-Axis Scale Ticks */}
          {(() => {
            const max = dynamicLineGraphData.maxVal || 2000;
            const steps = 4;
            const lines = [];
            const T = 20;
            const B = 180;
            for (let i = 0; i <= steps; i++) {
              const val = (max / steps) * (steps - i);
              const y = T + ((B - T) / steps) * i;
              lines.push(
                <g key={i}>
                  <line x1="50" y1={y} x2="680" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.4" />
                  <text x="42" y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                    ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                  </text>
                </g>
              );
            }
            return lines;
          })()}

          {/* Path rendering */}
          {(() => {
            const pts = dynamicLineGraphData.points;
            if (!pts.length) return null;
            const L = 60;
            const R = 670;
            const T = 20;
            const B = 180;
            const max = dynamicLineGraphData.maxVal || 2000;
            const step = (R - L) / Math.max(1, pts.length - 1);

            const buildLine = (getter: (p: any) => number, color: string, glowId: string) => {
              const coords = pts.map((p, i) => {
                const x = L + i * step;
                const y = B - (Math.max(0, getter(p)) / max) * (B - T);
                return { x, y, raw: p };
              });
              const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
              const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${B} L ${coords[0].x} ${B} Z`;

              return (
                <g key={color}>
                  <path d={areaPath} fill={`url(#${glowId})`} />
                  <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
                  {coords.map((c, i) => (
                    <circle
                      key={i}
                      cx={c.x}
                      cy={c.y}
                      r={c.raw.isFocused || activeHoverLineIdx === i ? 6 : 4}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />
                  ))}
                </g>
              );
            };

            return (
              <>
                {lineGraphMetric === 'compareAll' ? (
                  <>
                    {buildLine((p) => p.grossRevenue, '#2563eb', 'lineGraphGlowRev')}
                    {buildLine((p) => p.netProfit, '#10b981', 'lineGraphGlowProfit')}
                    {buildLine((p) => p.partnerOutflow, '#f59e0b', 'lineGraphGlowOutflow')}
                  </>
                ) : (
                  buildLine(
                    (p) => p.value,
                    lineGraphMetric === 'netProfit'
                      ? '#10b981'
                      : lineGraphMetric === 'partnerOutflow'
                      ? '#f59e0b'
                      : '#2563eb',
                    lineGraphMetric === 'netProfit'
                      ? 'lineGraphGlowProfit'
                      : lineGraphMetric === 'partnerOutflow'
                      ? 'lineGraphGlowOutflow'
                      : 'lineGraphGlowRev'
                  )
                )}

                {/* X-Axis Month Labels with Interactive Hit Areas */}
                {pts.map((p, i) => {
                  const x = L + i * step;
                  return (
                    <g
                      key={i}
                      className="cursor-pointer"
                      onMouseEnter={() => setActiveHoverLineIdx(i)}
                      onMouseLeave={() => setActiveHoverLineIdx(null)}
                      onClick={() => setLineGraphFocusMonth(p.monthKey)}
                    >
                      <rect x={x - 15} y={T} width="30" height={B - T + 30} fill="transparent" />
                      <text
                        x={x}
                        y="204"
                        textAnchor="middle"
                        fontSize="10"
                        fill={p.isFocused || activeHoverLineIdx === i ? '#2563eb' : '#94a3b8'}
                        fontWeight={p.isFocused || activeHoverLineIdx === i ? 'bold' : '600'}
                      >
                        {p.monthLabel}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>

        {/* Hover / Focused Details Tooltip */}
        {activeHoverLineIdx !== null && dynamicLineGraphData.points[activeHoverLineIdx] && (
          <div className="absolute top-2 right-4 bg-slate-900/90 text-white p-3 rounded-xl text-xs backdrop-blur-md border border-slate-700 shadow-xl pointer-events-none space-y-1.5 min-w-[200px]">
            <div className="font-bold text-blue-300 flex items-center justify-between">
              <span>{dynamicLineGraphData.points[activeHoverLineIdx].monthName}</span>
              <span className="text-[10px] text-slate-400">Click to focus</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Gross Revenue:
                </span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(dynamicLineGraphData.points[activeHoverLineIdx].grossRevenue)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Partner Outflow:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {formatCurrency(dynamicLineGraphData.points[activeHoverLineIdx].partnerOutflow)}
                </span>
              </div>
              <div className="flex justify-between gap-3 pt-1 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Net Profit:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(dynamicLineGraphData.points[activeHoverLineIdx].netProfit)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focused Month Deep-Dive Drawer when user selects a specific month */}
      {focusedLineMonthData && (
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
              Focused Month Deep Dive
            </span>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {focusedLineMonthData.monthName} Performance Breakdown
            </h4>
          </div>

          <div className="flex items-center gap-4 flex-wrap font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block">GMR:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(focusedLineMonthData.grossMonthlyRevenue)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Disbursements:</span>
              <span className="font-bold text-amber-500">
                {formatCurrency(focusedLineMonthData.partnerCommissionOutflow)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Net Profit:</span>
              <span className="font-bold text-emerald-500">
                {formatCurrency(focusedLineMonthData.netProfit)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block">Margin:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {focusedLineMonthData.netProfitMarginPct}%
              </span>
            </div>
            <button
              onClick={() => setLineGraphFocusMonth('ALL')}
              className="px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
            >
              Clear Focus
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#222430] flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-blue-600 inline-block" /> Gross Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-emerald-500 inline-block" /> Net Profit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-amber-500 inline-block" /> Partner Outflow
        </span>
      </div>
    </motion.div>
  );
}
