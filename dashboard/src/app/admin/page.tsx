'use client';

import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  DollarSign,
  Users,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  PieChart,
  Percent,
  HandCoins,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  ArrowLeftRight,
  Clock,
  LifeBuoy,
  AlertCircle,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

export default function AdminOverviewPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch overview metrics');
      }
      setData(json.data);
    } catch (err: any) {
      console.error('Error fetching admin overview data:', err);
      setError(err.message || 'Error loading overview data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const superAdminKPIs = data?.superAdminKPIs || {
    managementGroupsCount: 0,
    activeManagementGroupsCount: 0,
    propertiesCount: 0,
    activePropertiesCount: 0,
    pendingPropertiesCount: 0,
    grossMRR: 0,
    activeMRR: 0,
    pendingMRR: 0,
    partnerCommissionOutflow: 0,
    netRetainedMRR: 0,
    retainedPct: 100,
    outflowPct: 0,
    averagePropertyMRR: 0,
    totalPartnersCount: 0,
    activePartnersCount: 0,
    partnerAssignedPropsCount: 0,
  };

  const managementGroups = data?.managementGroups || [];
  const partnerCommissions = data?.partnerCommissions || [];
  const topRevenueProperties = data?.topRevenueProperties || [];

  // Operational metrics for Sub Super Admin
  const stats = data?.stats || {
    orgsCount: 0,
    propsCount: 0,
    servicesCount: 0,
    portingCount: 0,
    ticketsCount: 0,
    urgentTicketsCount: 0,
    onboardingsCount: 0,
  };

  const onboardingPipeline = data?.onboardingPipeline || {
    totalActive: 0,
    stageCounts: {
      draft: 0,
      contractSent: 0,
      signed: 0,
      cutSheetReview: 0,
      portingSubmitted: 0,
      focReceived: 0,
      completed: 0,
      total: 0,
    },
    keyProperties: [],
  };

  const ticketAnalytics = data?.ticketAnalytics || {
    open: stats.ticketsCount || 0,
    urgent: stats.urgentTicketsCount || 0,
    pending: 0,
    resolved: 0,
    last7Days: [
      { dayName: 'Thu', created: 0, resolved: 0 },
      { dayName: 'Fri', created: 0, resolved: 0 },
      { dayName: 'Sat', created: 0, resolved: 0 },
      { dayName: 'Sun', created: 0, resolved: 0 },
      { dayName: 'Mon', created: 0, resolved: 0 },
      { dayName: 'Tue', created: 0, resolved: 0 },
      { dayName: 'Wed', created: 0, resolved: 0 },
    ],
  };

  const e911Compliance = data?.e911Compliance || {
    verified: 0,
    pending: 0,
    correctionRequired: 0,
    failed: 0,
    total: 0,
  };

  const recentActivities = data?.recentActivities || [];
  const organizationsOverview = data?.organizationsOverview || {
    list: managementGroups.slice(0, 5),
    total: managementGroups.length,
  };

  const maxTicketVal = Math.max(
    ...ticketAnalytics.last7Days.map((d: any) => Math.max(d.created || 0, d.resolved || 0, 1)),
    4
  );

  const createdPoints = ticketAnalytics.last7Days
    .map((d: any, idx: number) => {
      const x = (idx / 6) * 190 + 5;
      const y = 35 - ((d.created || 0) / maxTicketVal) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  const resolvedPoints = ticketAnalytics.last7Days
    .map((d: any, idx: number) => {
      const x = (idx / 6) * 190 + 5;
      const y = 35 - ((d.resolved || 0) / maxTicketVal) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading executive overview telemetry...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-center space-y-3 max-w-lg mx-auto mt-12">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
        <button
          onClick={fetchAdminOverview}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // =========================================================================
  // 1. SUPER ADMIN EXECUTIVE OVERVIEW (FINANCIAL STATS & PORTFOLIO METRICS)
  // =========================================================================
  if (isSuperAdmin) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-7 pb-16 font-sans text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#222430]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Super Admin Executive Overview
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchAdminOverview}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </motion.div>

        {/* 4 Super Admin KPI Cards in one line (Blue Color Variant) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Management Groups */}
          <Link href="/admin/organizations" className="block group">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  Management Groups
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {superAdminKPIs.managementGroupsCount}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {superAdminKPIs.activeManagementGroupsCount} Active
                  </span>
                  <span className="text-blue-200 group-hover:text-white font-medium flex items-center gap-0.5">
                    View groups &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: Properties */}
          <Link href="/admin/properties" className="block group">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  Properties
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <Hotel className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-white">
                  {superAdminKPIs.propertiesCount}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                  <span className="text-blue-100 font-medium">
                    <strong className="text-white font-bold">{superAdminKPIs.activePropertiesCount}</strong> Active &bull; <strong className="text-white font-bold">{superAdminKPIs.pendingPropertiesCount}</strong> Pipeline
                  </span>
                  <span className="text-blue-200 group-hover:text-white font-medium">
                    &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3: Gross Monthly Revenue (MRR) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Gross Monthly Revenue (MRR)
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                ${Number(superAdminKPIs.grossMRR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                <span className="text-blue-200">
                  Avg <strong className="text-white font-bold">${Number(superAdminKPIs.averagePropertyMRR).toFixed(0)}</strong> / property
                </span>
                <span className="text-emerald-300 font-semibold">
                  ${Number(superAdminKPIs.activeMRR).toLocaleString('en-US', { minimumFractionDigits: 0 })} Active
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Partner Commission Outflow */}
          <Link href="/admin/partners" className="block group">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  Partner Commission Outflow
                </span>
                <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <HandCoins className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold tracking-tight text-amber-300">
                  ${Number(superAdminKPIs.partnerCommissionOutflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                  <span className="text-blue-200">
                    <strong className="text-white font-bold">{superAdminKPIs.totalPartnersCount}</strong> Partners ({superAdminKPIs.outflowPct}% of MRR)
                  </span>
                  <span className="text-blue-200 group-hover:text-white font-medium">
                    View &rarr;
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Executive Revenue Allocation & Retention Breakdown */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                Executive Revenue Allocation & Retention Breakdown
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution between platform retained MRR and partner channel payouts.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-[#20222a] px-3 py-1 rounded-full w-fit">
              Monthly Run-Rate Model
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Multi-Segment Bar */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  MRR Split Ratio
                </span>
                <span className="font-mono text-slate-500">
                  {superAdminKPIs.retainedPct}% Retained / {superAdminKPIs.outflowPct}% Outflow
                </span>
              </div>

              <div className="h-5 w-full rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden flex p-0.5 border border-slate-200 dark:border-[#2a2c3a]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${superAdminKPIs.retainedPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-l-full relative group cursor-pointer"
                  title={`Net Retained MRR: $${Number(superAdminKPIs.netRetainedMRR).toFixed(2)}`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${superAdminKPIs.outflowPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-r-full relative group cursor-pointer"
                  title={`Partner Outflow: $${Number(superAdminKPIs.partnerCommissionOutflow).toFixed(2)}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Net Platform Retained MRR</span>
                  </div>
                  <div className="text-xl font-extrabold text-blue-950 dark:text-blue-100">
                    ${Number(superAdminKPIs.netRetainedMRR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                    {superAdminKPIs.retainedPct}% of total monthly revenue retained
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Partner Commissions</span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-950 dark:text-amber-100">
                    ${Number(superAdminKPIs.partnerCommissionOutflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 font-medium">
                    {superAdminKPIs.outflowPct}% distributed across {superAdminKPIs.totalPartnersCount} partners
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Summary */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#20222c] space-y-3.5 flex flex-col justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Portfolio Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#222430]">
                  <span className="text-slate-600 dark:text-slate-400">Total Management Groups</span>
                  <span className="font-bold text-slate-900 dark:text-white">{superAdminKPIs.managementGroupsCount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#222430]">
                  <span className="text-slate-600 dark:text-slate-400">Total Properties</span>
                  <span className="font-bold text-slate-900 dark:text-white">{superAdminKPIs.propertiesCount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-[#222430]">
                  <span className="text-slate-600 dark:text-slate-400">Partner-Assigned Properties</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{superAdminKPIs.partnerAssignedPropsCount}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 dark:text-slate-400">Average Property MRR</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">${Number(superAdminKPIs.averagePropertyMRR).toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/admin/finances"
                className="w-full py-2 px-3 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>View Full Financial Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Detailed Stats Tables */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Table 1: Management Groups MRR Breakdown */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Management Groups MRR Breakdown
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Portfolio volume, revenue share, and property breakdown.
                </p>
              </div>
              <Link href="/admin/organizations" className="text-xs font-bold text-blue-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#222430] text-[10.5px] uppercase font-bold text-slate-400">
                    <th className="pb-2">Group</th>
                    <th className="pb-2">Props</th>
                    <th className="pb-2 text-right">Monthly Rev</th>
                    <th className="pb-2 text-right">Share %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                  {managementGroups.slice(0, 6).map((org: any) => (
                    <tr key={org.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        <Link href={`/admin/organizations/${org.id}`} className="hover:text-blue-600">
                          {org.name}
                        </Link>
                      </td>
                      <td className="py-2.5 font-medium text-slate-600 dark:text-slate-300">
                        {org.propertiesCount}
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-slate-900 dark:text-white">
                        ${Number(org.monthlyRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-blue-600">
                        {org.revenueSharePct}%
                      </td>
                    </tr>
                  ))}
                  {managementGroups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No management groups configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Partner Commissions Outflow Breakdown */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-amber-500" />
                  Partner Outflow Breakdown
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Assigned properties, commission rates, and outflow sums.
                </p>
              </div>
              <Link href="/admin/partners" className="text-xs font-bold text-blue-600 hover:underline">
                View All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#222430] text-[10.5px] uppercase font-bold text-slate-400">
                    <th className="pb-2">Partner</th>
                    <th className="pb-2">Props</th>
                    <th className="pb-2">Rate</th>
                    <th className="pb-2 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                  {partnerCommissions.slice(0, 6).map((pt: any) => (
                    <tr key={pt.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {pt.name}
                      </td>
                      <td className="py-2.5 font-medium text-slate-600 dark:text-slate-300">
                        {pt.assignedPropertiesCount}
                      </td>
                      <td className="py-2.5 font-semibold text-blue-600">
                        {pt.commissionRate}%
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        ${Number(pt.commissionOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {partnerCommissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No partners assigned to properties yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // =========================================================================
  // 2. SUB SUPER ADMIN OPERATIONAL DASHBOARD (MATCHING THE ORIGINAL UI)
  // =========================================================================
  const stageCounts = onboardingPipeline.stageCounts || {
    draft: 0,
    contractSent: 0,
    signed: 0,
    cutSheetReview: 0,
    portingSubmitted: 0,
    focReceived: 0,
    completed: 0,
    total: 0,
  };

  const totalPipelineCount = stageCounts.total || 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100"
    >
      {/* 1. Top Operational KPI Cards (Management Groups, Properties, Services, Portings) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Management Groups */}
        <Link href="/admin/organizations" className="block group">
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Management Groups
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <Building2 size={18} />
              </div>
            </div>
            <div className="flex items-baseline mt-4">
              <span className="text-2xl font-bold text-slate-100">
                {stats.orgsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Groups</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Active client tenants &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 2: Properties */}
        <Link href="/admin/properties" className="block group">
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Properties
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <Hotel size={18} />
              </div>
            </div>
            <div className="flex items-baseline mt-4">
              <span className="text-2xl font-bold text-slate-100">
                {stats.propsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Sites</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Portfolio locations &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 3: Active Services */}
        <Link href="/admin/services" className="block group">
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Active Services
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <PhoneCall size={18} />
              </div>
            </div>
            <div className="flex items-baseline mt-4">
              <span className="text-2xl font-bold text-slate-100">
                {stats.servicesCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Services</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Voice & data lines &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 4: Active Portings */}
        <Link href="/admin/porting" className="block group">
          <motion.div
            variants={itemVariants}
            className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Active Portings
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <ArrowLeftRight size={18} />
              </div>
            </div>
            <div className="flex items-baseline mt-4">
              <span className="text-2xl font-bold text-slate-100">
                {stats.portingCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">In-flight</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">LSR migrations active &rarr;</p>
          </motion.div>
        </Link>
      </motion.div>

      {/* SECTION 1: Onboarding & Porting Pipeline (Exact Match to Screenshot) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] p-6 shadow-xs space-y-4"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Onboarding &amp; Porting Pipeline
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#2a2c3a]">
              {totalPipelineCount} Active Total
            </span>
          </div>
          <Link
            href="/admin/porting"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Porting Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Full 7-stage lifecycle progression across all active hospitality property cutovers.
        </p>

        {/* Content Body: Ring Gauge + 2-col Legend + Vertical Divider + Key Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 items-center">
          {/* Left Column: Ring Gauge & 7-Stage Counts (7 cols) */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Multi-segment Donut Chart */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-[#20222a]"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Dynamic Colored Segments */}
                {(() => {
                  const segments = [
                    { name: 'Draft', value: stageCounts.draft || 0, color: '#64748b' },
                    { name: 'Sent', value: stageCounts.contractSent || 0, color: '#6366f1' },
                    { name: 'Signed', value: stageCounts.signed || 0, color: '#2563eb' },
                    { name: 'CutSheet', value: stageCounts.cutSheetReview || 0, color: '#a855f7' },
                    { name: 'Porting', value: stageCounts.portingSubmitted || 0, color: '#f59e0b' },
                    { name: 'FOC', value: stageCounts.focReceived || 0, color: '#0ea5e9' },
                    { name: 'Onboarded', value: stageCounts.completed || 0, color: '#10b981' },
                  ];
                  const total = totalPipelineCount > 0 ? totalPipelineCount : segments.reduce((acc, s) => acc + s.value, 0);
                  if (total === 0) return null;

                  let runningOffset = 0;
                  return segments
                    .filter((s) => s.value > 0)
                    .map((s) => {
                      const fraction = s.value / total;
                      const dashLength = fraction * 251.327;
                      const offset = -runningOffset;
                      runningOffset += dashLength;
                      return (
                        <circle
                          key={s.name}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={s.color}
                          strokeWidth="8"
                          strokeDasharray={`${dashLength} ${251.327 - dashLength}`}
                          strokeDashoffset={offset}
                          strokeLinecap="butt"
                          fill="none"
                          className="transition-all duration-700"
                        />
                      );
                    });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {totalPipelineCount}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-1">
                  TOTAL
                </span>
              </div>
            </div>

            {/* 2-Column Stages Legend */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs w-full">
              {/* Column 1 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                    1. Draft
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.draft || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    3. Signed
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.signed || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    5. Porting Submitted
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.portingSubmitted || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    7. Onboarded
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.completed || 0}</span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    2. Sent
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.contractSent || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    4. Cut Sheet Review
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.cutSheetReview || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    6. FOC Recv
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{stageCounts.focReceived || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Properties in Pipeline (5 cols) */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430] lg:pl-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                KEY PROPERTIES IN PIPELINE
              </span>
              <span className="text-[11px] text-slate-400">
                Last 3 Porting Properties
              </span>
            </div>

            {onboardingPipeline.keyProperties && onboardingPipeline.keyProperties.length > 0 ? (
              <div className="space-y-2.5">
                {onboardingPipeline.keyProperties.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                        {item.propertyName}
                      </span>
                      <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${item.color || '#2563eb'}18`,
                          color: item.color || '#2563eb',
                        }}
                      >
                        {item.stageName}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color || '#2563eb' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-400">
                No active properties in porting pipeline.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* SECTION 2: Support Tickets (Exact Match to Screenshot) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] p-6 shadow-xs space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Support Tickets
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10.5px] font-extrabold uppercase tracking-wide">
            {ticketAnalytics.urgent > 0 ? `${ticketAnalytics.urgent} URGENT` : 'NORMAL QUEUE'}
          </span>
        </div>

        {/* Content Body: Active Queue + Stats boxes + 7-Day Trend Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-center">
          {/* Left Column: Active Queue & Response Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                ACTIVE QUEUE
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {ticketAnalytics.open} Open
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Average response: &lt; 15 minutes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Avg Response
                </span>
                <strong className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                  &lt; 15 mins
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Open Priority
                </span>
                <strong className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                  {ticketAnalytics.urgent} Urgent
                </strong>
              </div>
            </div>
          </div>

          {/* Right Column: 7-Day Trend SVG Graph (7 cols) */}
          <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430] lg:pl-8 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Ticket Activity (Last 7 Days)
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Created
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved
                </span>
              </div>
            </div>

            {/* SVG Trend Line Graph */}
            <div className="pt-2">
              <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points={createdPoints || '0,35 200,35'}
                />
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points={resolvedPoints || '0,35 200,35'}
                />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 px-0.5 mt-1">
                {ticketAnalytics.last7Days.map((d: any, idx: number) => (
                  <span key={idx}>{d.dayName}</span>
                ))}
              </div>
            </div>

            <div className="pt-1 text-right">
              <Link
                href="/admin/tickets"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Ticket Dispatch Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* SECTION 3: E911 Emergency Compliance Overview (Exact Match to Screenshot) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] p-6 shadow-xs space-y-4"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              E911 Emergency Compliance Overview
            </h3>
            <span className="px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10.5px] font-bold">
              Regulatory Mandate
            </span>
          </div>
          <Link
            href="/admin/e911"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Compliance Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          KARY&apos;S Law and RAY BAUM&apos;S Act location dispatch verification status across all properties.
        </p>

        {/* Content Body: Ring Gauge + Legend + Warning Banner Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 items-center">
          {/* Left Column: Ring Gauge & Status Legend (5 cols) */}
          <div className="lg:col-span-5 flex items-center gap-6">
            {/* Multi-segment Donut Chart */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-100 dark:stroke-[#20222a]"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Dynamic Colored Segments */}
                {(() => {
                  const segments = [
                    { name: 'Verified', value: e911Compliance.verified || 0, color: '#10b981' },
                    { name: 'Pending', value: e911Compliance.pending || 0, color: '#0ea5e9' },
                    { name: 'Correction', value: (e911Compliance.correctionRequired || 0) + (e911Compliance.failed || 0), color: '#f59e0b' },
                  ];
                  const total = e911Compliance.total > 0 ? e911Compliance.total : segments.reduce((acc, s) => acc + s.value, 0);
                  if (total === 0) return null;

                  let runningOffset = 0;
                  return segments
                    .filter((s) => s.value > 0)
                    .map((s) => {
                      const fraction = s.value / total;
                      const dashLength = fraction * 251.327;
                      const offset = -runningOffset;
                      runningOffset += dashLength;
                      return (
                        <circle
                          key={s.name}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={s.color}
                          strokeWidth="8"
                          strokeDasharray={`${dashLength} ${251.327 - dashLength}`}
                          strokeDashoffset={offset}
                          strokeLinecap="butt"
                          fill="none"
                          className="transition-all duration-700"
                        />
                      );
                    });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {e911Compliance.verified}
                </span>
                <span className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mt-1">
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Status Legend */}
            <div className="space-y-2.5 text-xs w-full">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  PSAP Verified
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{e911Compliance.verified}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  Pending Test
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{e911Compliance.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Correction Req.
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{e911Compliance.correctionRequired}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Alert Callout Banner (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {e911Compliance.correctionRequired + e911Compliance.failed > 0
                      ? `${e911Compliance.correctionRequired + e911Compliance.failed} locations require address correction`
                      : 'All emergency dispatch routes verified'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Dispatchable location address fields are cross-referenced with civic PSAP and MSAG databases.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/e911"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
              >
                Review E911 Locations &rarr;
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
