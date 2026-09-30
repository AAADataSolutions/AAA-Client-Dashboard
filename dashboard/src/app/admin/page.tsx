'use client';

import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  PhoneCall,
  Send,
  GitBranch,
  LifeBuoy,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Loader2,
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
  hidden: { opacity: 0, y: 20, scale: 0.98 },
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
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

export default function AdminOverviewPage() {
  const { profile } = useAuth();

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
        throw new Error(json.error || 'Failed to fetch operations telemetry');
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

  const stats = data?.stats || {
    orgsCount: 0,
    propsCount: 0,
    servicesCount: 0,
    onboardingsCount: 0,
    portingCount: 0,
    ticketsCount: 0,
    urgentTicketsCount: 0,
  };

  const onboardingPipeline = data?.onboardingPipeline || {
    totalActive: 0,
    stageCounts: { draft: 0, contractSent: 0, signed: 0, portingSubmitted: 0, sofWaiting: 0, focReceived: 0, completed: 0, total: 0 },
    keyProperties: [],
  };
  const ticketAnalytics = data?.ticketAnalytics || {
    openCount: 0,
    urgentCount: 0,
    last7Days: [],
  };
  const e911Compliance = data?.e911Compliance || {
    verified: 0,
    pending: 0,
    correctionRequired: 0,
    failed: 0,
    total: 0,
  };
  const organizationsOverview = data?.organizationsOverview || {
    total: 0,
    list: [],
  };
  const recentActivities = data?.recentActivities || [];

  // Calculate 7-Stage Pipeline Donut chart stroke segments
  const stageCounts: any = onboardingPipeline.stageCounts || {};
  const totalStages = Math.max(1, stageCounts.total || onboardingPipeline.totalActive || 1);
  const draftPct = Math.round(((stageCounts.draft || 0) / totalStages) * 100);
  const contractSentPct = Math.round(((stageCounts.contractSent || 0) / totalStages) * 100);
  const signedPct = Math.round(((stageCounts.signed || 0) / totalStages) * 100);
  const cutSheetReviewPct = Math.round(((stageCounts.cutSheetReview || stageCounts.sofWaiting || 0) / totalStages) * 100);
  const portingSubPct = Math.round(((stageCounts.portingSubmitted || 0) / totalStages) * 100);
  const focRecvPct = Math.round(((stageCounts.focReceived || 0) / totalStages) * 100);
  const completedPct = Math.round(((stageCounts.completed || 0) / totalStages) * 100);

  // Calculate E911 Donut chart stroke segments
  const totalE911 = Math.max(1, e911Compliance.total || (e911Compliance.verified + e911Compliance.pending + e911Compliance.correctionRequired + e911Compliance.failed) || 1);
  const verifiedPct = Math.round((e911Compliance.verified / totalE911) * 100);
  const pendingPct = Math.round((e911Compliance.pending / totalE911) * 100);
  const correctionPct = Math.round(((e911Compliance.correctionRequired + e911Compliance.failed) / totalE911) * 100);

  // Build SVG trend points for 7-day tickets
  const maxTicketCount = Math.max(
    1,
    ...ticketAnalytics.last7Days.map((d: any) => Math.max(d.created || 0, d.resolved || 0))
  );

  const createdPoints = ticketAnalytics.last7Days
    .map((d: any, i: number) => {
      const x = Math.round((i / (ticketAnalytics.last7Days.length - 1 || 1)) * 200);
      const y = Math.round(35 - ((d.created || 0) / maxTicketCount) * 28);
      return `${x},${y}`;
    })
    .join(' ');

  const resolvedPoints = ticketAnalytics.last7Days
    .map((d: any, i: number) => {
      const x = Math.round((i / (ticketAnalytics.last7Days.length - 1 || 1)) * 200);
      const y = Math.round(35 - ((d.resolved || 0) / maxTicketCount) * 28);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 overflow-hidden font-sans"
    >
      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl text-black dark:text-white flex items-center justify-center">
            <Layers size={256} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Operations Overview
            </h1>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
            <span>Syncing telemetry...</span>
          </div>
        )}
      </motion.div>

      {/* 2. Top KPI Cards Row */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5"
      >
        {/* Card 1: Organizations */}
        <Link href="/admin/organizations" className="block">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/40 p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Management Groups
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <Building2 size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {stats.orgsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Clients</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Active client tenants &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 2: Properties */}
        <Link href="/admin/properties" className="block">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/40 p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Properties
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <Hotel size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {stats.propsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Assets</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Hospitality locations &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 3: Services */}
        <Link href="/admin/services" className="block">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/40 p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Services
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <PhoneCall size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {stats.servicesCount}
              </span>
                <span className="text-xs text-slate-200 ml-1.5 font-medium">Services</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Total services &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 5: Porting Active */}
        <Link href="/admin/porting" className="block">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/40 p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Porting Active
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <GitBranch size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {stats.portingCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Orders</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Carrier trunk cuts &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 6: Open Tickets */}
        <Link href="/admin/tickets" className="block">
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/40 p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Open Tickets
              </span>
              <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
                <LifeBuoy size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-100">
                {stats.ticketsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Issues</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">
              {stats.urgentTicketsCount > 0 ? `${stats.urgentTicketsCount} Urgent tickets` : 'Queue normal &rarr;'}
            </p>
          </motion.div>
        </Link>
      </motion.div>

      {/* 3. Row 1: 7-Stage Porting & Onboarding Pipeline Overview */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Onboarding &amp; Porting Pipeline</h3>
            <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c]">
              {onboardingPipeline.totalActive} Active Total
            </span>
          </div>
          <Link href="/admin/porting" className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            View All Porting Requests →
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
          Full 7-stage lifecycle progression across all active hospitality property cutovers.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          {/* Donut Chart with All 7 Stages & Colors + 7-Stage Legend */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row items-center justify-start gap-6">
            <motion.div
              initial={{ rotate: -180, scale: 0.8, opacity: 0 }}
              whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, type: 'spring', stiffness: 120 }}
              className="relative w-36 h-36 shrink-0 flex items-center justify-center"
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-[#20222a]" strokeWidth="4" />
                {/* Stage 1: DRAFT (Slate #64748b) */}
                {draftPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${draftPct} ${100 - draftPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#64748b" strokeWidth="4" strokeDashoffset="0"
                  />
                )}
                {/* Stage 2: CONTRACT_SENT (Indigo #6366f1) */}
                {contractSentPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${contractSentPct} ${100 - contractSentPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.1, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#6366f1" strokeWidth="4" strokeDashoffset={`-${draftPct}`}
                  />
                )}
                {/* Stage 3: SIGNED (Blue #2563eb) */}
                {signedPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${signedPct} ${100 - signedPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.2, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#2563eb" strokeWidth="4" strokeDashoffset={`-${draftPct + contractSentPct}`}
                  />
                )}
                {/* Stage 4: CUT_SHEET_REVIEW (Purple #a855f7) */}
                {cutSheetReviewPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${cutSheetReviewPct} ${100 - cutSheetReviewPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.3, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#a855f7" strokeWidth="4" strokeDashoffset={`-${draftPct + contractSentPct + signedPct}`}
                  />
                )}
                {/* Stage 5: PORTING_SUBMITTED (Amber #f59e0b) */}
                {portingSubPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${portingSubPct} ${100 - portingSubPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.4, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDashoffset={`-${draftPct + contractSentPct + signedPct + cutSheetReviewPct}`}
                  />
                )}
                {/* Stage 6: FOC_RECEIVED (Sky #0ea5e9) */}
                {focRecvPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${focRecvPct} ${100 - focRecvPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.5, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#0ea5e9" strokeWidth="4" strokeDashoffset={`-${draftPct + contractSentPct + signedPct + cutSheetReviewPct + portingSubPct}`}
                  />
                )}
                {/* Stage 7: COMPLETED (Emerald #10b981) */}
                {completedPct > 0 && (
                  <motion.circle
                    initial={{ strokeDasharray: '0 100' }}
                    whileInView={{ strokeDasharray: `${completedPct} ${100 - completedPct}` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.0, delay: 0.6, ease: 'easeOut' }}
                    cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDashoffset={`-${draftPct + contractSentPct + signedPct + cutSheetReviewPct + portingSubPct + focRecvPct}`}
                  />
                )}
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-slate-900 dark:text-white block">
                  {onboardingPipeline.totalActive}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total</span>
              </div>
            </motion.div>

            {/* 7-Stage Color Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 w-full">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  <span className="text-[11px] truncate">1. Draft</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.draft || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-[11px] truncate">2. Sent</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.contractSent || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="text-[11px] truncate">3. Signed</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.signed || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span className="text-[11px] truncate">4. Cut Sheet</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.cutSheetReview || stageCounts.sofWaiting || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-[11px] truncate">5. Submitted</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.portingSubmitted || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <span className="text-[11px] truncate">6. FOC Recv</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.focReceived || 0}</strong>
              </div>
              <div className="flex items-center justify-between gap-2 col-span-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[11px] truncate">7. Onboarded</span>
                </div>
                <strong className="text-slate-900 dark:text-white font-bold text-xs">{stageCounts.completed || 0}</strong>
              </div>
            </div>
          </div>

          {/* Key Properties in Pipeline (Last 3 from Porting) */}
          <div className="lg:col-span-6 space-y-3 pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Key Properties in Pipeline
              </h4>
              <span className="text-[10px] text-slate-400">Last 3 Porting Properties</span>
            </div>

            {onboardingPipeline.keyProperties.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No active properties in porting pipeline.</p>
            ) : (
              onboardingPipeline.keyProperties.slice(0, 3).map((item: any) => (
                <div key={item.id} className="space-y-1.5 p-2.5 rounded-lg bg-slate-50/70 dark:bg-[#181920] border border-slate-100 dark:border-[#20222a]">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{item.propertyName}</span>
                    <span className={`text-[11px] font-bold ${item.colorClass.split(' ').find((cls: string) => cls.startsWith('text-')) || 'text-slate-500'}`}>
                      {item.stageLabel}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`h-full rounded-full ${item.colorClass.split(' ')[0]}`}
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Row 2: Support Tickets Queue & Volume Analytics */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-slate-800 dark:text-slate-200" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Tickets</h3>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 uppercase">
            {ticketAnalytics.urgentCount > 0 ? `${ticketAnalytics.urgentCount} Urgent` : 'Normal Queue'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left metrics */}
          <div className="lg:col-span-5 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Active Queue</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{ticketAnalytics.openCount} Open</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Average response: &lt; 15 minutes</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530]">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">Avg Response</span>
                <strong className="text-xs font-bold text-slate-900 dark:text-white">&lt; 15 mins</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530]">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">Open Priority</span>
                <strong className="text-xs font-bold text-slate-900 dark:text-white">{ticketAnalytics.urgentCount} Urgent</strong>
              </div>
            </div>
          </div>

          {/* Right 7-Day Trend SVG Graph */}
          <div className="lg:col-span-7 space-y-2 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430]">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Ticket Activity (Last 7 Days)</span>
              <div className="flex items-center gap-2 text-[9.5px]">
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Created
                </span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Resolved
                </span>
              </div>
            </div>
            <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={createdPoints || '0,35 200,35'}
              />
              <motion.polyline
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.2, ease: 'easeInOut' }}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={resolvedPoints || '0,35 200,35'}
              />
            </svg>
            <div className="flex justify-between text-[9px] text-slate-400 px-0.5">
              {ticketAnalytics.last7Days.map((d: any, idx: number) => (
                <span key={idx}>{d.dayName}</span>
              ))}
            </div>

            <div className="pt-2 text-right">
              <Link href="/admin/tickets" className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer">
                <span>Open Ticket Dispatch Console</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Row 4: E911 Emergency Compliance Overview */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">E911 Emergency Compliance Overview</h3>
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              Regulatory Mandate
            </span>
          </div>
          <Link href="/admin/e911" className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            Full Compliance Report →
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
          KARY&apos;S Law and RAY BAUM&apos;S Act location dispatch verification status across all properties.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* Donut Chart & Legend */}
          <div className="lg:col-span-5 flex items-center justify-around gap-4">
            <motion.div
              initial={{ rotate: -180, scale: 0.8, opacity: 0 }}
              whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, type: 'spring', stiffness: 120 }}
              className="relative w-36 h-36 shrink-0 flex items-center justify-center"
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-[#20222a]" strokeWidth="4" />
                <motion.circle
                  initial={{ strokeDasharray: '0 100' }}
                  whileInView={{ strokeDasharray: `${verifiedPct} ${100 - verifiedPct}` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDashoffset="0"
                />
                <motion.circle
                  initial={{ strokeDasharray: '0 100' }}
                  whileInView={{ strokeDasharray: `${pendingPct} ${100 - pendingPct}` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#0ea5e9" strokeWidth="4" strokeDashoffset={`-${verifiedPct}`}
                />
                <motion.circle
                  initial={{ strokeDasharray: '0 100' }}
                  whileInView={{ strokeDasharray: `${correctionPct} ${100 - correctionPct}` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDashoffset={`-${verifiedPct + pendingPct}`}
                />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-slate-900 dark:text-white block">{e911Compliance.verified}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-500">Verified</span>
              </div>
            </motion.div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px]">PSAP Verified</span>
                </div>
                <strong className="text-slate-900 dark:text-white">{e911Compliance.verified}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[11px]">Pending Test</span>
                </div>
                <strong className="text-slate-900 dark:text-white">{e911Compliance.pending}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[11px]">Correction Req.</span>
                </div>
                <strong className="text-slate-900 dark:text-white">{e911Compliance.correctionRequired + e911Compliance.failed}</strong>
              </div>
            </div>
          </div>

          {/* Warning Callout Card */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-7 p-4.5 rounded-xl bg-amber-50/70 dark:bg-[#1a1710] border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {e911Compliance.correctionRequired + e911Compliance.failed > 0
                    ? `${e911Compliance.correctionRequired + e911Compliance.failed} locations require address correction`
                    : 'All emergency dispatch routes verified'}
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70 leading-relaxed max-w-lg">
                  Dispatchable location address fields are cross-referenced with civic PSAP and MSAG databases.
                </p>
              </div>
            </div>

            <Link
              href="/admin/e911"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              Review E911 Locations →
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 7. Row 5: Organizations Overview & Recent Activity */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Left: Organizations Overview (8 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Management Groups Overview</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Master enterprise accounts and property volume</p>
              </div>
              <Link href="/admin/organizations" className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                View All Management Groups →
              </Link>
            </div>

            {/* Organizations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-[#222430]">
                  <tr>
                    <th className="pb-2">Management Group</th>
                    <th className="pb-2">Properties</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a]">
                  {organizationsOverview.list.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">
                        No management groups found in workspace.
                      </td>
                    </tr>
                  ) : (
                    organizationsOverview.list.map((org: any) => (
                      <tr key={org.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#2c2e3c]">
                            {org.initials}
                          </div>
                          <span>{org.name}</span>
                        </td>
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">{org.propertiesCount}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/40 capitalize">
                            ● {org.status?.toLowerCase()}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                          <Link href="/admin/organizations">Manage →</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing {organizationsOverview.list.length} of {organizationsOverview.total} active accounts</span>
            <Link href="/admin/organizations" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              View All {organizationsOverview.total} Accounts →
            </Link>
          </div>
        </motion.div>

        {/* Right: Recent Activity (4 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded font-semibold border border-emerald-200 dark:border-emerald-800/40">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>No audit activity events recorded yet.</p>
                </div>
              ) : (
                recentActivities.map((act: any, idx: number) => (
                  <motion.div
                    key={act.id || idx}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-white capitalize">{act.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{act.description}</p>
                      <span className="text-[10px] text-slate-400">{act.timeAgo}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link href="/admin/audit-logs" className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer">
              <span>View system audit log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
