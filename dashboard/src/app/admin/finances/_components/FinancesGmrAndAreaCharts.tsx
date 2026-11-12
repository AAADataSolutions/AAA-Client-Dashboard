'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { itemVariants, formatCurrency, type MonthOption } from './types';

interface FinancesGmrAndAreaChartsProps {
  barChartYear: number;
  setBarChartYear: (y: number) => void;
  gmrCompareYoY: boolean;
  setGmrCompareYoY: (v: boolean) => void;
  barChartSeriesData: {
    series: any[];
    priorSeries: any[];
    maxVal: number;
  };
  dynamicCumulativeData: {
    points: any[];
    total: number;
    maxVal: number;
    avgMonthly: number;
  };
  cumulativeRangeTab: 'lifetime' | 'ytd' | 'last12';
  setCumulativeRangeTab: (t: 'lifetime' | 'ytd' | 'last12') => void;
  cumulativeUpToMonth: string;
  setCumulativeUpToMonth: (m: string) => void;
  activeHoverCumIdx: number | null;
  setActiveHoverCumIdx: (idx: number | null) => void;
  availableMonths: MonthOption[];
  nowYear: number;
}

export default function FinancesGmrAndAreaCharts({
  barChartYear,
  setBarChartYear,
  gmrCompareYoY,
  setGmrCompareYoY,
  barChartSeriesData,
  dynamicCumulativeData,
  cumulativeRangeTab,
  setCumulativeRangeTab,
  cumulativeUpToMonth,
  setCumulativeUpToMonth,
  activeHoverCumIdx,
  setActiveHoverCumIdx,
  availableMonths,
  nowYear,
}: FinancesGmrAndAreaChartsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 12-Month GMR Bar Chart (Truly Dynamic: Connected to barChartYear) */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> Gross Monthly Revenue — 12 Months
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">
              Month-by-month revenue run-rate for {barChartYear}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={barChartYear}
              onChange={(e) => setBarChartYear(parseInt(e.target.value, 10))}
              className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
            >
              <option value={nowYear}>{nowYear}</option>
              <option value={nowYear - 1}>{nowYear - 1}</option>
            </select>

            <button
              onClick={() => setGmrCompareYoY(!gmrCompareYoY)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                gmrCompareYoY
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-[#1a1b24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282a36]'
              }`}
            >
              Compare YoY
            </button>
          </div>
        </div>

        <div className="h-48 w-full flex items-end justify-between gap-2 pt-4">
          {barChartSeriesData.series.map((m: any, idx: number) => {
            const heightPct = Math.min(
              100,
              Math.max(m.grossRevenue > 0 ? 8 : 2, (m.grossRevenue / barChartSeriesData.maxVal) * 100)
            );
            const lyVal = barChartSeriesData.priorSeries[idx]?.grossRevenue || 0;
            const lyHeight = Math.min(100, Math.max(lyVal > 0 ? 8 : 2, (lyVal / barChartSeriesData.maxVal) * 100));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  {gmrCompareYoY && (
                    <div
                      className="w-1/2 bg-slate-300 dark:bg-slate-700 rounded-t-sm transition-all duration-300"
                      style={{ height: `${lyHeight}%` }}
                      title={`Prior Year (${barChartYear - 1}) ${m.monthLabel}: $${lyVal}`}
                    />
                  )}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      m.isCurrent
                        ? 'bg-blue-600 shadow-sm'
                        : m.grossRevenue > 0
                        ? 'bg-blue-500/80 hover:bg-blue-600'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${m.monthName}: $${m.grossRevenue}`}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {m.monthLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#222430]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> {barChartYear} GMR
          </span>
          {gmrCompareYoY && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" /> {barChartYear - 1} GMR
            </span>
          )}
        </div>
      </div>

      {/* 100% Dynamic Gross Revenue (Cumulative) Area Chart */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Gross Revenue (Cumulative)
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">
              Total billed to date: <b className="text-slate-900 dark:text-white font-mono">{formatCurrency(dynamicCumulativeData.total)}</b>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Range Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-[#1a1b24] p-1 rounded-xl text-xs">
              {(['lifetime', 'ytd', 'last12'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setCumulativeRangeTab(tab);
                    setCumulativeUpToMonth('ALL');
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                    cumulativeRangeTab === tab && cumulativeUpToMonth === 'ALL'
                      ? 'bg-white dark:bg-[#252836] text-blue-600 shadow-xs'
                      : 'text-slate-400'
                  }`}
                >
                  {tab === 'last12' ? 'Last 12M' : tab}
                </button>
              ))}
            </div>

            {/* Up to Month Selector */}
            <select
              value={cumulativeUpToMonth}
              onChange={(e) => setCumulativeUpToMonth(e.target.value)}
              className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
              title="Calculate cumulative revenue up to specific month"
            >
              <option value="ALL">All Points</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  Up to {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic SVG Area Chart with Tooltip Node */}
        <div className="h-48 w-full pt-2 relative">
          <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="cumAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines & Y-Axis Scale Ticks */}
            {(() => {
              const max = dynamicCumulativeData.maxVal || 2000;
              const steps = 3;
              const lines = [];
              const T = 20;
              const B = 145;
              for (let i = 0; i <= steps; i++) {
                const val = (max / steps) * (steps - i);
                const y = T + ((B - T) / steps) * i;
                lines.push(
                  <g key={i}>
                    <line x1="35" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="3 3" opacity="0.35" />
                    <text x="30" y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="600">
                      ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                    </text>
                  </g>
                );
              }
              return lines;
            })()}

            {/* Area Path & Line */}
            {(() => {
              const pts = dynamicCumulativeData.points;
              if (!pts.length) return null;
              const L = 45;
              const R = 585;
              const T = 20;
              const B = 145;
              const max = dynamicCumulativeData.maxVal || 1000;
              const step = (R - L) / Math.max(1, pts.length - 1);

              const coords = pts.map((p, i) => {
                const x = L + i * step;
                const y = B - (p.cumulativeGross / max) * (B - T);
                return { x, y, ...p };
              });

              const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
              const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${B} L ${coords[0].x} ${B} Z`;

              return (
                <>
                  <path d={areaPath} fill="url(#cumAreaGradient)" />
                  <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                  {coords.map((c, i) => (
                    <g
                      key={i}
                      className="cursor-pointer group"
                      onMouseEnter={() => setActiveHoverCumIdx(i)}
                      onMouseLeave={() => setActiveHoverCumIdx(null)}
                    >
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={activeHoverCumIdx === i ? 6 : 3.5}
                        fill="#2563eb"
                        stroke="#fff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                      <text
                        x={c.x}
                        y="166"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#94a3b8"
                        fontWeight="600"
                      >
                        {c.monthLabel}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>

          {/* Hover floating info card */}
          {activeHoverCumIdx !== null && dynamicCumulativeData.points[activeHoverCumIdx] && (
            <div className="absolute top-2 right-4 bg-slate-900/90 text-white p-2.5 rounded-xl text-xs backdrop-blur-md border border-slate-700 shadow-xl pointer-events-none space-y-1">
              <div className="font-bold text-blue-300">
                {dynamicCumulativeData.points[activeHoverCumIdx].monthName}
              </div>
              <div className="flex justify-between gap-4 text-[11px]">
                <span className="text-slate-400">Added this month:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatCurrency(dynamicCumulativeData.points[activeHoverCumIdx].monthAdded)}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-[11px] pt-1 border-t border-slate-800">
                <span className="text-slate-400">Cumulative Total:</span>
                <span className="font-mono font-black text-white">
                  {formatCurrency(dynamicCumulativeData.points[activeHoverCumIdx].cumulativeGross)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-[#222430]">
          <span>Average monthly addition: <b>{formatCurrency(dynamicCumulativeData.avgMonthly)}</b></span>
          <span>Trajectory: <b>Billed Subscriptions & Active MRR</b></span>
        </div>
      </div>
    </motion.div>
  );
}
