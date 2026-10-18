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
  const [currentMonthlyCommissionRate, setCurrentMonthlyCommissionRate] = useState<number>(0);
  const [totalPartnersCount, setTotalPartnersCount] = useState<number>(0);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState<number>(0);
  const [totalYearGross, setTotalYearGross] = useState<number>(0);

  const fetchMonthlyAnalytics = async (year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/monthly-analytics?year=${year}`);
      const json = await res.json();
      if (json.success && json.monthlyData) {
        setMonthlyData(json.monthlyData);
        setApiCurrentRunRate(json.currentMonthlyRunRate || 0);
        setCurrentMonthlyCommissionRate(json.currentMonthlyCommissionRate || 0);
        setTotalPartnersCount(json.totalPartnersCount || 0);
        setTotalInvoicesCount(json.totalInvoicesCount || 0);
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
                          <p className="text-slate-400 text-[9px]">${d.commissionAmount.toFixed(2)} Revenue Share</p>
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

        {/* RIGHT SIDE: 3 KEY PARTNER METRICS (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-[#0c2872] via-[#0f3496] to-[#1442bb] text-white rounded-2xl p-5 md:p-6 shadow-md border border-[#1e4ad4]/40 relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-white/15 text-slate-100 text-[10.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              Partner Overview KPI
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">
              Active Baseline
            </span>
          </div>

          {/* 1. HAR MAHINE KITNA PARTNERS KO DE RAHE HAI (NO INVOICE FILTER) */}
          <div className="relative z-10 my-4 p-4 rounded-xl bg-white/10 border border-white/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                Monthly Partner Revenue Share
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold font-mono">
                Recurring
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-4xl font-black text-emerald-300 tracking-tight font-mono">
                ${(currentMonthlyCommissionRate || currentMonthlyRunRate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-semibold text-white/90">
                / Month
              </span>
            </div>

            <p className="text-[11px] text-blue-100/80 leading-relaxed pt-1">
              Total monthly recurring revenue share payout to partners across all active properties.
            </p>
          </div>

          {/* 2 & 3: GRID FOR TOTAL PARTNERS & TOTAL INVOICES */}
          <div className="relative z-10 grid grid-cols-2 gap-3 pt-1">
            {/* 2. KITNE PARTNERS BAN CHUKE HAI */}
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10.5px] font-bold uppercase tracking-wide">
                <Users className="w-3.5 h-3.5 text-blue-300" />
                <span>Total Partners</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-white font-mono">
                  {totalPartnersCount}
                </p>
                <p className="text-[10px] text-blue-200/80 mt-0.5">
                  Channel Partners
                </p>
              </div>
            </div>

            {/* 3. KITNE INVOICES PADE HAI TOTAL */}
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-blue-200 text-[10.5px] font-bold uppercase tracking-wide">
                <FileText className="w-3.5 h-3.5 text-blue-300" />
                <span>Total Invoices</span>
              </div>
              <div className="mt-2">
                <p className="text-2xl font-black text-white font-mono">
                  {totalInvoicesCount}
                </p>
                <p className="text-[10px] text-blue-200/80 mt-0.5">
                  All-time Invoices
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Tag */}
          <div className="relative z-10 flex items-center justify-between pt-3 text-[11px] text-blue-100/80 border-t border-white/10 mt-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              Live System Status
            </span>
            <span className="text-[10.5px] text-blue-200 font-mono">
              Unfiltered Live Baseline
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
