'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  DollarSign,
  Lock,
  Loader2,
  TrendingUp,
  Users,
  Building2,
  Radio,
  Server,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search,
  X,
  Activity,
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminFinancesPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading: authLoading } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Independent working filters for each and every component on the page
  const [gmrMonth, setGmrMonth] = useState(defaultMonthKey);
  const [revAddedMonth, setRevAddedMonth] = useState(defaultMonthKey);
  const [partnerOutflowMonth, setPartnerOutflowMonth] = useState(defaultMonthKey);
  const [nrvMonth, setNrvMonth] = useState(defaultMonthKey);
  const [netProfitMonth, setNetProfitMonth] = useState(defaultMonthKey);
  const [expensesMonth, setExpensesMonth] = useState(defaultMonthKey);
  const [arrMonth, setArrMonth] = useState(defaultMonthKey);

  const [waterfallMonth, setWaterfallMonth] = useState(defaultMonthKey);
  const [bridgeMonth, setBridgeMonth] = useState(defaultMonthKey);
  const [donutMonth, setDonutMonth] = useState(defaultMonthKey);
  const [invoicesMonth, setInvoicesMonth] = useState(defaultMonthKey);

  const [barChartYear, setBarChartYear] = useState(now.getFullYear());
  const [gmrCompareYoY, setGmrCompareYoY] = useState(false);

  // Cumulative Area Chart Filters & States
  const [cumulativeRangeTab, setCumulativeRangeTab] = useState<'lifetime' | 'ytd' | 'last12'>('lifetime');
  const [cumulativeUpToMonth, setCumulativeUpToMonth] = useState('ALL');
  const [activeHoverCumIdx, setActiveHoverCumIdx] = useState<number | null>(null);

  // Line Graph Filters & States (Replacing Unassigned Inventory)
  const [lineGraphYear, setLineGraphYear] = useState(now.getFullYear());
  const [lineGraphTimeframe, setLineGraphTimeframe] = useState<'all' | 'ytd' | 'last6' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [lineGraphMetric, setLineGraphMetric] = useState<'revenue' | 'netProfit' | 'partnerOutflow' | 'compareAll'>('revenue');
  const [lineGraphFocusMonth, setLineGraphFocusMonth] = useState<string>('ALL');
  const [activeHoverLineIdx, setActiveHoverLineIdx] = useState<number | null>(null);

  const [cumulativeYtd, setCumulativeYtd] = useState(false);

  // Data states
  const [data, setData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Back-order modal
  const [showBackorderModal, setShowBackorderModal] = useState(false);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [backorderForm, setBackorderForm] = useState({
    partner_id: '',
    period_month: defaultMonthKey,
    custom_commission_rate: '',
    status: 'SUBMITTED',
    notes: '',
  });
  const [candidateProperties, setCandidateProperties] = useState<any[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [backorderSubmitting, setBackorderSubmitting] = useState(false);

  // Strict route protection
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, isSuperAdmin, router]);

  const fetchFinances = async () => {
    try {
      setDataLoading(true);
      const res = await fetch(`/api/admin/finances`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch finances:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners');
      const json = await res.json();
      if (json.success) {
        setPartnersList(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch partners:', e);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFinances();
      fetchPartners();
    }
  }, [isSuperAdmin]);

  // Fetch candidate properties for the selected partner and month
  useEffect(() => {
    if (!showBackorderModal || !backorderForm.partner_id) {
      setCandidateProperties([]);
      setSelectedPropertyIds([]);
      return;
    }

    const fetchCandidates = async () => {
      try {
        setLoadingCandidates(true);
        const res = await fetch(
          `/api/admin/finances/backorder-invoice?partner_id=${backorderForm.partner_id}&period_month=${backorderForm.period_month}`
        );
        const json = await res.json();
        if (json.success) {
          const props = json.properties || [];
          setCandidateProperties(props);
          // Default: select all properties that existed on or before this month
          setSelectedPropertyIds(props.map((p: any) => p.id));
        }
      } catch (err) {
        console.error('Failed to load candidate properties:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [showBackorderModal, backorderForm.partner_id, backorderForm.period_month]);

  const handleCreateBackorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPropertyIds.length === 0) {
      alert('Please select at least one property to generate the commission invoice.');
      return;
    }
    try {
      setBackorderSubmitting(true);
      const res = await fetch('/api/admin/finances/backorder-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backorderForm,
          property_ids: selectedPropertyIds,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowBackorderModal(false);
        setBackorderForm({
          partner_id: '',
          period_month: defaultMonthKey,
          custom_commission_rate: '',
          status: 'SUBMITTED',
          notes: '',
        });
        setSelectedPropertyIds([]);
        setCandidateProperties([]);
        await fetchFinances();
      } else {
        alert(json.error || 'Failed to generate back-order invoice');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setBackorderSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Extract maps from API
  const monthlyDataMap = data?.monthlyDataMap || {};
  const availableMonths: { key: string; label: string; year: number }[] = data?.availableMonths || [];

  // Data resolvers for each individual card & component
  const gmrData = monthlyDataMap[gmrMonth] || data?.defaultMonthData || {};
  const revAddedData = monthlyDataMap[revAddedMonth] || data?.defaultMonthData || {};
  const partnerOutflowData = monthlyDataMap[partnerOutflowMonth] || data?.defaultMonthData || {};
  const nrvData = monthlyDataMap[nrvMonth] || data?.defaultMonthData || {};
  const netProfitData = monthlyDataMap[netProfitMonth] || data?.defaultMonthData || {};
  const expensesData = monthlyDataMap[expensesMonth] || data?.defaultMonthData || {};
  const arrData = monthlyDataMap[arrMonth] || data?.defaultMonthData || {};

  const waterfallDataObj = monthlyDataMap[waterfallMonth] || data?.defaultMonthData || {};
  const waterfallItems: any[] = waterfallDataObj.waterfallData || [];

  const bridgeDataObj = monthlyDataMap[bridgeMonth] || data?.defaultMonthData || {};
  const bridgeItems: any[] = bridgeDataObj.revenueBridgeData || [];

  const donutDataObj = monthlyDataMap[donutMonth] || data?.defaultMonthData || {};
  const donutItems: any[] = donutDataObj.partnerBreakdown || [];

  const invoicesDataObj = monthlyDataMap[invoicesMonth] || data?.defaultMonthData || {};
  const invoicesItems: any[] = invoicesDataObj.invoiceList || [];

  // Dynamic real Cumulative YTD Profit Calculation for Net Profit Card
  const realYtdProfit = useMemo(() => {
    const parts = netProfitMonth.split('-');
    const selYear = parts[0];
    const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : now.getMonth();
    let ytdGross = 0;
    let ytdExpenses = 0;
    for (let i = 0; i <= mIdx; i++) {
      const k = `${selYear}-${String(i + 1).padStart(2, '0')}`;
      const d = monthlyDataMap[k];
      if (d) {
        ytdGross += Number(d.grossMonthlyRevenue || 0);
        ytdExpenses += Number(d.totalOperatingExpenses || 0);
      }
    }
    return ytdGross - ytdExpenses;
  }, [monthlyDataMap, netProfitMonth]);

  // Dynamic Sparkline Points for GMR card
  const sparklinePoints = useMemo(() => {
    const parts = gmrMonth.split('-');
    const selYear = parts[0];
    const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : now.getMonth();

    const last6 = [];
    for (let i = Math.max(0, mIdx - 5); i <= mIdx; i++) {
      const k = `${selYear}-${String(i + 1).padStart(2, '0')}`;
      const d = monthlyDataMap[k];
      last6.push(Number(d?.grossMonthlyRevenue || 0));
    }

    if (!last6.length) return '0,20 100,20';
    const min = Math.min(...last6, 0);
    const max = Math.max(...last6, 100);
    const range = max - min || 1;

    return last6
      .map((val, idx) => {
        const x = Math.round((idx / Math.max(1, last6.length - 1)) * 100);
        const y = Math.round(24 - ((val - min) / range) * 20);
        return `${x},${y}`;
      })
      .join(' ');
  }, [monthlyDataMap, gmrMonth]);

  // ---------------------------------------------------------------------------
  // 1. DYNAMIC 12-MONTH BAR CHART DATA (Recomputes when barChartYear changes)
  // ---------------------------------------------------------------------------
  const barChartSeriesData = useMemo(() => {
    const series = [];
    const priorSeries = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${barChartYear}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || {
        grossMonthlyRevenue: 0,
        monthName: `${monthNames[m]} ${barChartYear}`,
        monthLabel: monthShort[m],
      };
      series.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${barChartYear}`,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
        isCurrent: mKey === defaultMonthKey,
      });

      const lyKey = `${barChartYear - 1}-${String(m + 1).padStart(2, '0')}`;
      const lyData = monthlyDataMap[lyKey] || {
        grossMonthlyRevenue: 0,
      };
      priorSeries.push({
        monthKey: lyKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${barChartYear - 1}`,
        grossRevenue: Number(lyData.grossMonthlyRevenue || 0),
      });
    }

    const allVals = [
      ...series.map((s) => s.grossRevenue),
      ...priorSeries.map((s) => s.grossRevenue),
    ];
    const maxVal = Math.max(...allVals, 500) * 1.15;

    return { series, priorSeries, maxVal };
  }, [barChartYear, monthlyDataMap, defaultMonthKey]);

  // ---------------------------------------------------------------------------
  // 2. 100% DYNAMIC GROSS REVENUE (CUMULATIVE) AREA CHART
  // ---------------------------------------------------------------------------
  const dynamicCumulativeData = useMemo(() => {
    const currentYearPoints = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || { grossMonthlyRevenue: 0 };
      currentYearPoints.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${now.getFullYear()}`,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
      });
    }

    let seriesToUse = [...currentYearPoints];

    if (cumulativeRangeTab === 'ytd') {
      const parts = defaultMonthKey.split('-');
      const mIdx = parseInt(parts[1], 10) - 1;
      seriesToUse = seriesToUse.slice(0, mIdx + 1);
    } else if (cumulativeRangeTab === 'last12') {
      seriesToUse = currentYearPoints;
    }

    if (cumulativeUpToMonth !== 'ALL') {
      const targetIdx = seriesToUse.findIndex((s) => s.monthKey === cumulativeUpToMonth);
      if (targetIdx !== -1) {
        seriesToUse = seriesToUse.slice(0, targetIdx + 1);
      }
    }

    let running = 0;
    const points = seriesToUse.map((m: any, idx: number) => {
      const added = Number(m.grossRevenue || 0);
      running += added;
      return {
        ...m,
        monthAdded: added,
        cumulativeGross: running,
        index: idx,
      };
    });

    const total = running;
    const maxVal = Math.max(...points.map((p) => p.cumulativeGross), 1000) * 1.15;
    const avgMonthly = points.length > 0 ? total / points.length : 0;

    return { points, total, maxVal, avgMonthly };
  }, [monthlyDataMap, cumulativeRangeTab, cumulativeUpToMonth, defaultMonthKey]);

  // ---------------------------------------------------------------------------
  // 3. DYNAMIC LINE GRAPH (Recomputes dynamically when lineGraphYear/Timeframe changes)
  // ---------------------------------------------------------------------------
  const dynamicLineGraphData = useMemo(() => {
    const yearPoints = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${lineGraphYear}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || {
        grossMonthlyRevenue: 0,
        netProfit: 0,
        partnerCommissionOutflow: 0,
        totalOperatingExpenses: 0,
        monthName: `${monthNames[m]} ${lineGraphYear}`,
        monthLabel: monthShort[m],
      };
      yearPoints.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${lineGraphYear}`,
        monthIndex: m,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
        netProfit: Number(mData.netProfit || 0),
        partnerOutflow: Number(mData.partnerCommissionOutflow || 0),
        expenses: Number(mData.totalOperatingExpenses || 0),
        isCurrent: mKey === defaultMonthKey,
      });
    }

    let sliced = [...yearPoints];
    if (lineGraphTimeframe === 'ytd') {
      const parts = defaultMonthKey.split('-');
      const currentYearNum = parseInt(parts[0], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      if (lineGraphYear === currentYearNum) {
        sliced = sliced.slice(0, mIdx + 1);
      }
    } else if (lineGraphTimeframe === 'last6') {
      sliced = sliced.slice(6, 12);
    } else if (lineGraphTimeframe === 'q1') {
      sliced = sliced.slice(0, 3);
    } else if (lineGraphTimeframe === 'q2') {
      sliced = sliced.slice(3, 6);
    } else if (lineGraphTimeframe === 'q3') {
      sliced = sliced.slice(6, 9);
    } else if (lineGraphTimeframe === 'q4') {
      sliced = sliced.slice(9, 12);
    }

    const points = sliced.map((m, idx) => {
      let val = m.grossRevenue;
      if (lineGraphMetric === 'netProfit') val = m.netProfit;
      if (lineGraphMetric === 'partnerOutflow') val = m.partnerOutflow;

      return {
        ...m,
        index: idx,
        value: val,
        isFocused: lineGraphFocusMonth !== 'ALL' && m.monthKey === lineGraphFocusMonth,
      };
    });

    const allValues =
      lineGraphMetric === 'compareAll'
        ? points.flatMap((p) => [p.grossRevenue, p.netProfit, p.partnerOutflow])
        : points.map((p) => p.value);

    const maxVal = Math.max(...allValues.map((v) => Math.abs(v)), 500) * 1.25;
    const minVal = Math.min(...allValues, 0);

    const totalPeriodRevenue = points.reduce((s, p) => s + p.grossRevenue, 0);
    const avgRevenue = points.length > 0 ? totalPeriodRevenue / points.length : 0;
    const peakPoint = points.reduce(
      (prev, curr) => (curr.grossRevenue > prev.grossRevenue ? curr : prev),
      points[0] || { monthName: '-', grossRevenue: 0 }
    );

    return {
      points,
      maxVal,
      minVal,
      totalPeriodRevenue,
      avgRevenue,
      peakPoint,
    };
  }, [lineGraphYear, lineGraphTimeframe, lineGraphMetric, lineGraphFocusMonth, monthlyDataMap, defaultMonthKey]);

  // Focused month data for line graph inspector
  const focusedLineMonthData = useMemo(() => {
    if (lineGraphFocusMonth === 'ALL') return null;
    return monthlyDataMap[lineGraphFocusMonth] || null;
  }, [lineGraphFocusMonth, monthlyDataMap]);

  // Max value for Waterfall
  const maxWaterfallVal = useMemo(() => {
    const allVals = waterfallItems.map((d: any) => Math.abs(Number(d.value || 0)));
    return Math.max(...allVals, 500) * 1.15;
  }, [waterfallItems]);

  // Max value for Bridge
  const maxBridgeVal = useMemo(() => {
    const allVals = bridgeItems.map((d: any) => Math.abs(Number(d.value || 0)));
    return Math.max(...allVals, 500) * 1.15;
  }, [bridgeItems]);

  if (authLoading || (dataLoading && !data)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">
          Loading live financial ledger & database records...
        </p>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 font-sans max-w-7xl mx-auto"
    >
      {/* Top Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Finances & Revenue Analytics
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" />
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#71717a] mt-1">
            Dynamic revenue analytics, real partner disbursements, and independent working month filters on every component.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowBackorderModal(true)}
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Back-Order Invoice
          </button>
          <Link
            href="/admin/vendors"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-500" /> Vendors Ledger
          </Link>
          <Link
            href="/admin/servers"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" /> Servers & Infra
          </Link>
          <Link
            href="/admin/partners"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Users className="w-3.5 h-3.5" /> Manage Partners
          </Link>
        </div>
      </motion.div>

      {/* Row 1: Core Revenue & Partner Outflows (Each with its own working month filter) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Monthly Revenue (GMR) Card */}
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
            Across {gmrData.activePropertiesCount || 0} active billed hotel properties
          </p>
        </div>

        {/* Revenue Added This Month Card (Pure Number, No Graph) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#047857] via-[#065f46] to-[#064e3b] text-white border border-emerald-600/50 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Revenue Added This Month
              </span>
              <select
                value={revAddedMonth}
                onChange={(e) => setRevAddedMonth(e.target.value)}
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
                <span className={`text-2xl font-black ${
                  (revAddedData.revenueAddedThisMonth ?? 0) >= 0 ? 'text-white' : 'text-rose-300'
                }`}>
                  {(revAddedData.revenueAddedThisMonth ?? 0) >= 0 ? '' : ''}
                  {formatCurrency(revAddedData.revenueAddedThisMonth ?? 0)}
                </span>
                {revAddedData.revenueAddedGrowthPct !== undefined && revAddedData.previousMonthGmr > 0 && (
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    revAddedData.revenueAddedThisMonth >= 0
                      ? 'bg-emerald-400/20 text-emerald-200'
                      : 'bg-rose-500/20 text-rose-200'
                  }`}>
                    {revAddedData.revenueAddedThisMonth >= 0 ? '+' : ''}{revAddedData.revenueAddedGrowthPct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-emerald-200 mt-2 pt-2 border-t border-white/10">
            {revAddedData.previousMonthName
              ? `From ${formatCurrency(revAddedData.previousMonthGmr || 0)} (${revAddedData.previousMonthShort || 'prev'}) to ${formatCurrency(revAddedData.grossMonthlyRevenue || 0)}`
              : 'Net new recurring revenue addition'}
          </p>
        </div>
        {/* Partner Commission Outflow Card */}
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

        {/* Net Retained Value (NRV) Card */}
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
      </motion.div>

      {/* Row 2: Net Profit Hero, Operating Expenses, and ARR */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Profit (The Glowing Hero Card) */}
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
                className={`text-3xl font-black font-mono ${
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

        {/* Total Operating Expenses Card */}
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

        {/* Annualized Run-Rate (ARR) Card */}
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

      {/* Row 3: P&L Waterfall & Revenue Bridge (Each with its own working month filter) */}
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

      {/* Row 4: 12-Month GMR Bar Chart & 100% Dynamic Gross Revenue (Cumulative) Area Chart */}
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
                <option value={now.getFullYear()}>{now.getFullYear()}</option>
                <option value={now.getFullYear() - 1}>{now.getFullYear() - 1}</option>
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

      {/* Row 5: Partner Outflow Donut & Partner Invoices */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partner Outflow Donut */}
        {/* <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-500" /> Partner Outflow by Partner
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#71717a]">
                Active partners commission share breakdown
              </p>
            </div>

            <select
              value={donutMonth}
              onChange={(e) => setDonutMonth(e.target.value)}
              className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {donutItems.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="16"
                    strokeDasharray="160 226"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="36"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray="66 226"
                    strokeDashoffset="-160"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(donutDataObj.partnerCommissionOutflow || 0)}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2 text-xs">
                {donutItems.map((pt: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-100 dark:border-[#242634]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pt.color }} />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{pt.partnerName}</span>
                        <span className="text-[10px] text-slate-400">{pt.count} properties ({pt.rate}%)</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatCurrency(pt.commission)}
                      </span>
                      <span className="text-[10px] text-slate-400">{pt.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#242634] rounded-xl">
              No active partner commission outflows recorded for {donutDataObj.monthName || donutMonth}.
            </div>
          )}
        </div> */}

        {/* Partner Invoices Table */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Partner Invoices & Payouts
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#71717a]">
                Accrued commissions vs recorded disbursements
              </p>
            </div>

            <select
              value={invoicesMonth}
              onChange={(e) => setInvoicesMonth(e.target.value)}
              className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {invoicesItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#222430] text-slate-400 font-semibold">
                    <th className="py-2 px-2">Partner</th>
                    <th className="py-2 px-2">Invoice #</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                  {invoicesItems.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1b24]/40">
                      <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                        {inv.partner_name}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">{inv.invoice_number}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(Number(inv.commission_amount || 0))}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#242634] rounded-xl">
              No partner invoices found for {invoicesDataObj.monthName || invoicesMonth}. Click "Back-Order Invoice" above to generate on-demand.
            </div>
          )}
        </div>
      </motion.div>

      {/* Row 6: Revenue Over Time Line Graph (Replacing Revenue Lost to Unassigned Inventory) */}
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
              <option value={now.getFullYear()}>{now.getFullYear()}</option>
              <option value={now.getFullYear() - 1}>{now.getFullYear() - 1}</option>
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

      {/* Back-Order Invoice Modal */}
      <AnimatePresence>
        {showBackorderModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Generate Back-Order Revenue Share Invoice
                </h3>
                <button
                  onClick={() => setShowBackorderModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBackorder} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner *</label>
                  <select
                    required
                    value={backorderForm.partner_id}
                    onChange={(e) => setBackorderForm({ ...backorderForm, partner_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="">Select Partner</option>
                    {partnersList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.company_name || 'Individual'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Period Month *</label>
                    <input
                      type="month"
                      required
                      value={backorderForm.period_month}
                      onChange={(e) => setBackorderForm({ ...backorderForm, period_month: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice Status *</label>
                    <select
                      value={backorderForm.status}
                      onChange={(e) => setBackorderForm({ ...backorderForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PAID">Paid</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Override Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Default"
                      value={backorderForm.custom_commission_rate}
                      onChange={(e) =>
                        setBackorderForm({ ...backorderForm, custom_commission_rate: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Candidate properties checklist with live preview */}
                {backorderForm.partner_id && (
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#222430]">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        Assigned Partner Properties ({selectedPropertyIds.length}/{candidateProperties.length})
                      </label>
                      {candidateProperties.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setSelectedPropertyIds(candidateProperties.map((p) => p.id))}
                            className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPropertyIds([])}
                            className="text-slate-400 hover:underline cursor-pointer"
                          >
                            Deselect All
                          </button>
                        </div>
                      )}
                    </div>

                    {loadingCandidates ? (
                      <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-[#1a1b24] rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        <span>Finding eligible properties...</span>
                      </div>
                    ) : candidateProperties.length === 0 ? (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-[11px]">
                        No properties currently assigned to this partner.
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-[#1a1b24] rounded-xl border border-slate-200 dark:border-[#282a36]">
                        {candidateProperties.map((prop) => {
                          const isChecked = selectedPropertyIds.includes(prop.id);
                          const propRate =
                            backorderForm.custom_commission_rate !== ''
                              ? Number(backorderForm.custom_commission_rate)
                              : prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
                              ? Number(prop.partner_commission_override)
                              : Number(
                                  partnersList.find((p) => p.id === backorderForm.partner_id)?.default_commission_rate || 10
                                );
                          const propComm = Number(prop.monthly_price || 0) * (propRate / 100);

                          return (
                            <label
                              key={prop.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-500/10 border border-blue-500/20 text-slate-900 dark:text-white'
                                  : 'hover:bg-slate-100 dark:hover:bg-[#20222e] text-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPropertyIds([...selectedPropertyIds, prop.id]);
                                    } else {
                                      setSelectedPropertyIds(selectedPropertyIds.filter((id) => id !== prop.id));
                                    }
                                  }}
                                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="font-semibold text-xs">{prop.name}</span>
                              </div>
                              <div className="text-right font-mono text-[11px]">
                                <span>{formatCurrency(Number(prop.monthly_price || 0))}</span>
                                <span className="text-slate-400 text-[10px] ml-1.5">({propRate}% = {formatCurrency(propComm)})</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary preview */}
                    {candidateProperties.length > 0 && selectedPropertyIds.length > 0 && (
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-between font-mono text-xs text-blue-900 dark:text-blue-300">
                        <span>
                          Total Invoice ({selectedPropertyIds.length} propert{selectedPropertyIds.length > 1 ? 'ies' : 'y'}):
                        </span>
                        <span className="font-bold">
                          {formatCurrency(
                            candidateProperties
                              .filter((p) => selectedPropertyIds.includes(p.id))
                              .reduce((sum, p) => {
                                const rate =
                                  backorderForm.custom_commission_rate !== ''
                                    ? Number(backorderForm.custom_commission_rate)
                                    : p.partner_commission_override !== null && p.partner_commission_override !== undefined
                                    ? Number(p.partner_commission_override)
                                    : Number(
                                        partnersList.find((ptr) => ptr.id === backorderForm.partner_id)?.default_commission_rate || 10
                                      );
                                return sum + Number(p.monthly_price || 0) * (rate / 100);
                              }, 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Historical October commission adjustment for properties A, B, C."
                    value={backorderForm.notes}
                    onChange={(e) => setBackorderForm({ ...backorderForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowBackorderModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={backorderSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {backorderSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Generate Invoice
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
