'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Hotel,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export interface MonthlyDataPoint {
  monthKey: string;
  monthIndex: number;
  monthName: string;
  shortMonth: string;
  year: number;
  grossRevenue: number;
  commissionAmount: number;
  propertiesCount: number;
  partnersCount: number;
  invoicesCount: number;
  growthPct: number | null;
  status: 'RECORDED' | 'LIVE_CURRENT' | 'PROJECTED' | 'NO_DATA';
  isCurrentMonth: boolean;
}

interface PartnerMonthlyAnalyticsProps {
  currentMonthlyRunRate?: number;
  onRefreshNeeded?: () => void;
}

export default function PartnerMonthlyAnalytics({
  currentMonthlyRunRate = 0,
  onRefreshNeeded,
}: PartnerMonthlyAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyDataPoint | null>(null);
  const [apiCurrentRunRate, setApiCurrentRunRate] = useState<number>(0);
  const [totalYearGross, setTotalYearGross] = useState<number>(0);

  const fetchMonthlyAnalytics = async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/monthly-analytics?year=${year}`);
      const json = await res.json();
      if (json.success && json.monthlyData) {
        setMonthlyData(json.monthlyData);
        setApiCurrentRunRate(json.currentMonthlyRunRate || 0);
        setTotalYearGross(json.totalYearGross || 0);

        // Auto-select current month or default to latest month with data or current month
        const currentMonthData = json.monthlyData.find((d: MonthlyDataPoint) => d.isCurrentMonth);
        if (currentMonthData) {
          setSelectedMonthKey((prev) => prev || currentMonthData.monthKey);
        } else if (json.monthlyData.length > 0) {
          setSelectedMonthKey((prev) => prev || json.monthlyData[0].monthKey);
        }
      }
    } catch (err) {
      console.error('Failed to fetch monthly partner analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyAnalytics(selectedYear);
  }, [selectedYear]);

  // Selected Month Data Object
  const selectedMonth = useMemo(() => {
    return (
      monthlyData.find((d) => d.monthKey === selectedMonthKey) ||
      monthlyData.find((d) => d.isCurrentMonth) ||
      monthlyData[0] ||
      null
    );
  }, [monthlyData, selectedMonthKey]);

  // Calculations for SVG chart scaling
  const maxGross = useMemo(() => {
    const highest = Math.max(...monthlyData.map((d) => d.grossRevenue), 100);
    return Math.ceil(highest / 100) * 100;
  }, [monthlyData]);

  // Handle previous/next month navigation
  const handlePrevMonth = () => {
    if (!selectedMonth) return;
    const currentIdx = monthlyData.findIndex((d) => d.monthKey === selectedMonth.monthKey);
    if (currentIdx > 0) {
      setSelectedMonthKey(monthlyData[currentIdx - 1].monthKey);
    }
  };

  const handleNextMonth = () => {
    if (!selectedMonth) return;
    const currentIdx = monthlyData.findIndex((d) => d.monthKey === selectedMonth.monthKey);
    if (currentIdx < monthlyData.length - 1) {
      setSelectedMonthKey(monthlyData[currentIdx + 1].monthKey);
    }
  };

  const effectiveCurrentRunRate = currentMonthlyRunRate || apiCurrentRunRate;

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#20222c] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Monthly Revenue Performance &amp; Run Rate
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare each month&apos;s isolated revenue against the total monthly run rate. Click any bar to inspect that month.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent font-bold focus:outline-none cursor-pointer"
            >
              <option value={2026} className="bg-white dark:bg-[#15161c]">2026</option>
              <option value={2025} className="bg-white dark:bg-[#15161c]">2025</option>
              <option value={2024} className="bg-white dark:bg-[#15161c]">2024</option>
            </select>
          </div>

          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>YTD Gross: ${totalYearGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Left Graph | Right Selected Month KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT SIDE: MONTH-BY-MONTH GRAPH (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50/60 dark:bg-[#111217]/60 border border-slate-200/70 dark:border-[#1e202a] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Monthly Gross Revenue Graph ({selectedYear})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Interactive • Select bar to inspect
            </span>
          </div>

          {/* Graph Visual Area */}
          <div className="relative pt-6 pb-2 min-h-[220px] flex items-end">
            {loading ? (
              <div className="w-full h-44 flex items-center justify-center text-slate-400 text-xs">
                Loading monthly graph data...
              </div>
            ) : (
              <div className="w-full grid grid-cols-12 gap-1.5 sm:gap-2 h-48 items-end">
                {monthlyData.map((d) => {
                  const isSelected = selectedMonth?.monthKey === d.monthKey;
                  const isHovered = hoveredMonth?.monthKey === d.monthKey;
                  const heightPercent = maxGross > 0 ? Math.max((d.grossRevenue / maxGross) * 100, 6) : 6;

                  return (
                    <div
                      key={d.monthKey}
                      onClick={() => setSelectedMonthKey(d.monthKey)}
                      onMouseEnter={() => setHoveredMonth(d)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="group relative flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-150"
                    >
                      {/* Hover Tooltip */}
                      {(isHovered || (isSelected && !hoveredMonth)) && (
                        <div className="absolute -top-12 z-30 bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1 font-mono transition-all animate-in fade-in zoom-in-95">
                          <p className="font-bold text-[11px] text-blue-300 font-sans">{d.monthName}</p>
                          <p className="text-emerald-300 font-bold">${d.grossRevenue.toFixed(2)} Gross</p>
                          <p className="text-slate-400 text-[9px]">${d.commissionAmount.toFixed(2)} Commission</p>
                        </div>
                      )}

                      {/* Bar Value on top if selected */}
                      {isSelected && (
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 mb-1 font-mono">
                          ${d.grossRevenue >= 1000 ? `${(d.grossRevenue / 1000).toFixed(1)}k` : d.grossRevenue.toFixed(0)}
                        </span>
                      )}

                      {/* The Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-md shadow-blue-500/30 ring-2 ring-blue-500'
                            : d.grossRevenue > 0
                            ? 'bg-gradient-to-t from-blue-500/80 to-blue-400/80 hover:from-blue-600 hover:to-blue-500'
                            : 'bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {d.isCurrentMonth && (
                          <span
                            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#15161c]"
                            title="Current Active Month"
                          />
                        )}
                      </div>

                      {/* Month Label */}
                      <span
                        className={`text-[10px] mt-2 font-bold transition ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 scale-110'
                            : d.isCurrentMonth
                            ? 'text-emerald-600 dark:text-emerald-400 font-black'
                            : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                        }`}
                      >
                        {d.shortMonth}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Graph Footer Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 dark:border-[#1f212c] text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                <span>Selected Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Current Month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-700" />
                <span>No Revenue</span>
              </div>
            </div>
            <span className="text-slate-400 text-[10px]">Scale max: ${maxGross.toLocaleString()}</span>
          </div>
        </div>

        {/* RIGHT SIDE: SELECTED MONTH KPI & RATE CARD (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0c2872] via-[#0f3496] to-[#1442bb] text-white rounded-2xl p-5 md:p-6 shadow-md border border-[#1e4ad4]/40 relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header & Month Selector */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-slate-100 text-[10.5px] font-extrabold uppercase tracking-wider">
                  Month Detail KPI
                </span>
                {selectedMonth?.isCurrentMonth && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">
                    Active Month
                  </span>
                )}
              </div>

              {/* Month navigation arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dropdown Selector for Month */}
            <div className="flex items-center justify-between gap-2 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl p-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-200" />
                <span className="text-xs font-semibold text-blue-100">Selected Month:</span>
              </div>
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-white text-slate-900 font-bold text-xs px-3 py-1 rounded-lg border border-slate-200 shadow-xs focus:outline-none cursor-pointer"
              >
                {monthlyData.map((d) => (
                  <option key={d.monthKey} value={d.monthKey} className="bg-white text-slate-900 font-medium">
                    {d.monthName} {d.isCurrentMonth ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MAIN SELECTED MONTH REVENUE RATE KPI */}
          <div className="relative z-10 my-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
                {selectedMonth?.shortMonth.toUpperCase()} REVENUE RATE
              </span>
              {selectedMonth?.growthPct !== null && selectedMonth?.growthPct !== undefined && (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedMonth.growthPct >= 0
                      ? 'bg-emerald-400/20 text-emerald-300'
                      : 'bg-rose-400/20 text-rose-300'
                  }`}
                >
                  {selectedMonth.growthPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{selectedMonth.growthPct > 0 ? `+${selectedMonth.growthPct}%` : `${selectedMonth.growthPct}%`} MoM</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">
                ${(selectedMonth?.grossRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-semibold text-blue-200">
                for {selectedMonth?.shortMonth}
              </span>
            </div>

            <p className="text-[11px] text-blue-100/80">
              Total gross revenue for {selectedMonth?.monthName}
            </p>
          </div>

          {/* CURRENT MONTHLY RUN RATE COMPARISON */}
          <div className="relative z-10 p-3 rounded-xl bg-white/10 border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wide">
                CURRENT MONTHLY RUN RATE
              </span>
              <span className="font-mono font-black text-emerald-300 text-sm">
                ${effectiveCurrentRunRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-normal text-white">/ Mo</span>
              </span>
            </div>
            <p className="text-[10.5px] text-blue-100/70 leading-tight">
              Combined recurring baseline from all active assigned partner properties.
            </p>
          </div>

          {/* BREAKDOWN METRICS GRID */}
          <div className="relative z-10 grid grid-cols-2 gap-2 pt-3 border-t border-white/15">
            {/* Commission Due */}
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase">
                <DollarSign className="w-3 h-3 text-emerald-300" />
                <span>Partner Commission</span>
              </div>
              <p className="text-base font-black text-emerald-300 mt-1">
                ${(selectedMonth?.commissionAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Contributing Properties */}
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-bold uppercase">
                <Hotel className="w-3 h-3 text-blue-300" />
                <span>Active Properties</span>
              </div>
              <p className="text-base font-black text-white mt-1">
                {selectedMonth?.propertiesCount || 0} <span className="text-xs font-normal text-blue-200">Props</span>
              </p>
            </div>
          </div>

          {/* Invoicing Status Banner */}
          <div className="relative z-10 flex items-center justify-between pt-2 text-[11px] text-blue-100/90">
            <div className="flex items-center gap-1.5">
              {selectedMonth?.status === 'RECORDED' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ) : selectedMonth?.status === 'LIVE_CURRENT' ? (
                <Clock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Info className="w-3.5 h-3.5 text-blue-300" />
              )}
              <span className="font-semibold">
                {selectedMonth?.status === 'RECORDED'
                  ? `${selectedMonth.invoicesCount} Invoices Invoiced & Recorded`
                  : selectedMonth?.status === 'LIVE_CURRENT'
                  ? 'Live Ongoing Month (Invoices on 1st)'
                  : 'Historical / Projected'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
