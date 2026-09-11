'use client';

import React from 'react';
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
  Search,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

// Framer Motion Animation Variants with strict TS typing
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
  hidden: { opacity: 0, y: 22, scale: 0.97 },
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      staggerChildren: 0.1,
    },
  },
};

export default function AdminOverviewPage() {
  const { profile } = useAuth();
  const userName = profile?.full_name || 'Jason Smith';

  return (
    <div className="space-y-6 pb-12 overflow-hidden">
      {/* 1. Greeting Header with Spring Fade In */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#f97316] block">
            TELECOM OPERATIONS MESH
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Hello {userName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Take a real-time operational overview across all hospitality portfolios and carrier pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Core Mesh Operational
          </span>
        </div>
      </motion.div>

      {/* 2. Top KPI Cards Row (6 Cards with Heavy Staggered Viewport Animations) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
      >
        {/* Card 1: Organizations */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-orange-500/40 dark:hover:border-orange-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Organizations
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#f97316] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors">
              42
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 4 this month
            </span>
          </div>
        </motion.div>

        {/* Card 2: Properties */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Properties
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Hotel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              186
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 12 this month
            </span>
          </div>
        </motion.div>

        {/* Card 3: Services & Lines */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-sky-500/40 dark:hover:border-sky-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Voice Lines
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
              1,248
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 36 this month
            </span>
          </div>
        </motion.div>

        {/* Card 4: Active Onboardings */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-orange-500/40 dark:hover:border-orange-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Onboardings
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#f97316] flex items-center justify-center">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors">
              18
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-[#ea580c] dark:text-[#f97316] bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-800/40">
              4 due this week
            </span>
          </div>
        </motion.div>

        {/* Card 5: Active Porting */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-purple-500/40 dark:hover:border-purple-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Porting Active
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">
              27
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/40">
              7 due this week
            </span>
          </div>
        </motion.div>

        {/* Card 6: Open Tickets */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm hover:border-rose-500/40 dark:hover:border-rose-500/40 flex flex-col justify-between space-y-2 cursor-pointer transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Open Tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
              14
            </h2>
            <span className="inline-block text-[10.5px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/40">
              2 Last 24 hours
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* 3. Row 1: Attention Required & Upcoming Deadlines (Viewport Triggered) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Left: Attention Required (7 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attention Required</h3>
                <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                  5 Items
                </span>
              </div>
              <span className="text-[11px] text-slate-400">High priority operational triggers</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1f212a] mt-1">
              {/* Item 1 */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="py-2.5 flex items-start justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 uppercase mt-0.5">
                    Critical
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                      5 E911 corrections required
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      PSAP routing mismatch identified on Grandview &amp; ABC properties.
                    </p>
                  </div>
                </div>
                <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#f97316] hover:underline shrink-0">
                  Fix Now →
                </Link>
              </motion.div>

              {/* Item 2 */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="py-2.5 flex items-start justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 uppercase mt-0.5">
                    Critical
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                      2 E911 verification failed
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Dispatch validation error: Address unverified against MSAG database.
                    </p>
                  </div>
                </div>
                <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#f97316] hover:underline shrink-0">
                  Review →
                </Link>
              </motion.div>

              {/* Item 3 */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="py-2.5 flex items-start justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase mt-0.5">
                    Attention
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      6 onboarding overdue
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Pending Service Order Form (SOF) sign-off from tenant managers.
                    </p>
                  </div>
                </div>
                <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#f97316] hover:underline shrink-0">
                  Notify →
                </Link>
              </motion.div>

              {/* Item 4 */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="py-2.5 flex items-start justify-between gap-3 text-xs group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 uppercase mt-0.5">
                    Attention
                  </span>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      4 porting due soon
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      FOC cutover window active in &lt; 48 hours. Pre-testing pending.
                    </p>
                  </div>
                </div>
                <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#f97316] hover:underline shrink-0">
                  Schedule →
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1">
              <span>View all attention items &amp; action queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Right: Upcoming Deadlines (5 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
              </div>
              <span className="text-[11px] text-slate-400">Target milestones</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1f212a] mt-1">
              {/* Deadline 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="py-3 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1f212a] border border-slate-200 dark:border-[#2a2d39] flex flex-col items-center justify-center leading-none group-hover:border-orange-500/50 transition-colors">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sep</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">12</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors">
                      Courtyard Richmond Downtown
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Stage: FOC Target Verification</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] dark:text-[#f97316] border border-orange-200 dark:border-orange-800/40">
                  Onboarding
                </span>
              </motion.div>

              {/* Deadline 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.2 }}
                className="py-3 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1f212a] border border-slate-200 dark:border-[#2a2d39] flex flex-col items-center justify-center leading-none group-hover:border-purple-500/50 transition-colors">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sep</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">14</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-purple-400 transition-colors">
                      Residence Inn Austin Downtown
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Stage: Carrier Cutover Milestone</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                  Porting
                </span>
              </motion.div>

              {/* Deadline 3 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.3 }}
                className="py-3 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#1f212a] border border-slate-200 dark:border-[#2a2d39] flex flex-col items-center justify-center leading-none group-hover:border-orange-500/50 transition-colors">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sep</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">15</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors">
                      Westin Seattle Waterfront
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Stage: PBX Live Activation</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/40 text-[#ea580c] dark:text-[#f97316] border border-orange-200 dark:border-orange-800/40">
                  Onboarding
                </span>
              </motion.div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1">
              <span>View calendar &amp; schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Row 2: Onboarding Overview with Animated Donut Chart & Progress Bars */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Onboarding Pipeline Overview</h3>
            <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c]">
              18 Active Total
            </span>
          </div>
          <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#f97316] hover:underline">
            View All Onboardings →
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
          Deployment pipeline velocity and stage progression across prospective tenant locations.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          {/* Animated Donut Chart & Legend (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-around gap-4">
            {/* SVG Ring Donut Chart with Motion */}
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
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "22 78" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#f97316" strokeWidth="4" strokeDashoffset="0"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "33 67" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#0ea5e9" strokeWidth="4" strokeDashoffset="-22"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "17 83" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDashoffset="-55"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "16 84" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#a855f7" strokeWidth="4" strokeDashoffset="-72"
                />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-slate-900 dark:text-white block">18</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Active</span>
              </div>
            </motion.div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                  <span className="text-[11px]">Waiting Signature</span>
                </div>
                <strong className="text-slate-900 dark:text-white">4</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[11px]">Waiting Porting</span>
                </div>
                <strong className="text-slate-900 dark:text-white">6</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px]">Porting Submitted</span>
                </div>
                <strong className="text-slate-900 dark:text-white">3</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-[11px]">SOF Review</span>
                </div>
                <strong className="text-slate-900 dark:text-white">2</strong>
              </div>
            </div>
          </div>

          {/* Key Properties in Pipeline (7 cols with Animated Progress Bars) */}
          <div className="lg:col-span-7 space-y-3.5 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Key Properties in Pipeline
            </h4>

            {/* Pipeline Item 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white">Courtyard Richmond Downtown</span>
                <span className="text-emerald-500 text-[11px]">FOC Received · 90%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '90%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Pipeline Item 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white">Residence Inn Austin Downtown</span>
                <span className="text-sky-500 text-[11px]">Porting Submitted · 70%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '70%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
                  className="h-full bg-sky-500 rounded-full"
                />
              </div>
            </div>

            {/* Pipeline Item 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white">Westin Seattle Waterfront</span>
                <span className="text-purple-400 text-[11px]">Waiting for Porting · 55%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '55%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>

            {/* Pipeline Item 4 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-white">Hyatt Regency Chicago Loop</span>
                <span className="text-[#f97316] text-[11px]">Waiting for SOF · 80%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#20222a] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '80%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.45, ease: 'easeOut' }}
                  className="h-full bg-[#f97316] rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 5. Row 3: Porting Overview & Support Tickets (Viewport Triggered) */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Left: Porting Overview (7 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Porting Pipeline Overview</h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Total: 35 Orders</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Carrier number transfer pipeline across CLECs &amp; ILECs</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
              Velocity: 98.2% Ontime
            </span>
          </div>

          {/* Volume by Stage Pills with Animated Stagger */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-5 gap-2 text-center"
          >
            <motion.div variants={itemVariants} className="p-2 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530]">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">Pending</span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white">5</strong>
            </motion.div>
            <motion.div variants={itemVariants} className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 block">Submitted</span>
              <strong className="text-sm font-bold text-blue-600 dark:text-blue-400">8</strong>
            </motion.div>
            <motion.div variants={itemVariants} className="p-2 rounded-lg bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
              <span className="text-[10px] font-medium text-[#ea580c] dark:text-[#f97316] block">In Progress</span>
              <strong className="text-sm font-bold text-[#ea580c] dark:text-[#f97316]">6</strong>
            </motion.div>
            <motion.div variants={itemVariants} className="p-2 rounded-lg bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
              <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 block">FOC Recv.</span>
              <strong className="text-sm font-bold text-purple-600 dark:text-purple-400">3</strong>
            </motion.div>
            <motion.div variants={itemVariants} className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 block">Completed</span>
              <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">13</strong>
            </motion.div>
          </motion.div>

          {/* Mini Porting Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-[#222430]">
                <tr>
                  <th className="pb-2">Property</th>
                  <th className="pb-2">Numbers</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Target Date</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a]">
                <tr className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white">Courtyard Richmond</td>
                  <td className="py-2.5">36 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-medium border border-emerald-200 dark:border-emerald-800/40">
                      Live Cutover
                    </span>
                  </td>
                  <td className="py-2.5">Feb 15, 2025</td>
                  <td className="py-2.5 text-right font-semibold text-[#f97316] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-white">Residence Inn Austin</td>
                  <td className="py-2.5">24 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10.5px] font-medium border border-sky-200 dark:border-sky-800/40">
                      FOC Confirmed
                    </span>
                  </td>
                  <td className="py-2.5">Mar 24, 2025</td>
                  <td className="py-2.5 text-right font-semibold text-[#f97316] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right: Support Tickets with Trend Graph (5 cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Tickets</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 uppercase">
                SLA Priority
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Active Queue</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">14 Open</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Average first response: &lt; 18 minutes</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530]">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">Avg Response</span>
                <strong className="text-xs font-bold text-slate-900 dark:text-white">18 mins</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530]">
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block">Avg Resolution</span>
                <strong className="text-xs font-bold text-slate-900 dark:text-white">2.4 hours</strong>
              </div>
            </div>

            {/* Ticket Volume 7-Day Trend Chart SVG with Animated Stroke */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Ticket Volume (7 Days)</span>
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
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points="0,30 30,22 60,28 90,15 120,20 150,12 180,18 200,10"
                />
                <motion.polyline
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points="0,35 30,30 60,22 90,18 120,25 150,15 180,10 200,8"
                />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-400 px-0.5 font-mono">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link href="/admin/tickets" className="text-[11.5px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1">
              <span>Open Ticket Dispatch Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* 6. Row 4: E911 Emergency Compliance Overview (Viewport Triggered) */}
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
          <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#f97316] hover:underline">
            Full Compliance Report →
          </Link>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
          KARI&apos;S Law and RAY BAUM&apos;S Act location dispatch verification status across all properties.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* Donut Chart & Legend (5 cols) */}
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
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "86 14" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDashoffset="0"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "7 93" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#0ea5e9" strokeWidth="4" strokeDashoffset="-86"
                />
                <motion.circle
                  initial={{ strokeDasharray: "0 100" }}
                  whileInView={{ strokeDasharray: "4 96" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                  cx="18" cy="18" r="14" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDashoffset="-93"
                />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-slate-900 dark:text-white block">124</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-500">Verified</span>
              </div>
            </motion.div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px]">PSAP Verified</span>
                </div>
                <strong className="text-slate-900 dark:text-white">124</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  <span className="text-[11px]">Pending Test</span>
                </div>
                <strong className="text-slate-900 dark:text-white">10</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[11px]">Correction Req.</span>
                </div>
                <strong className="text-slate-900 dark:text-white">5</strong>
              </div>
            </div>
          </div>

          {/* Warning Callout Card (7 cols) */}
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
                  5 properties require correction · 2 properties pending verification
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/70 leading-relaxed max-w-lg">
                  Dispatchable location address fields lack suite or floor numbers necessary for civic PSAP validation.
                </p>
              </div>
            </div>

            <Link
              href="/admin/e911"
              className="px-4 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
            >
              Review E911 Locations →
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 7. Row 5: Organizations Overview & Recent Activity (Viewport Triggered) */}
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organizations Overview</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Master enterprise accounts and property volume</p>
              </div>
              <Link href="/admin/organizations" className="text-[11.5px] font-semibold text-[#f97316] hover:underline">
                View All Organizations →
              </Link>
            </div>

            {/* Organizations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-[#222430]">
                  <tr>
                    <th className="pb-2">Organization</th>
                    <th className="pb-2">Properties</th>
                    <th className="pb-2">Services</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a]">
                  <tr className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#2c2e3c]">
                        SH
                      </div>
                      <span>Shamin Hotels</span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">24</td>
                    <td className="py-2.5">182 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/40">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#f97316] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#2c2e3c]">
                        AH
                      </div>
                      <span>ABC Hospitality</span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">18</td>
                    <td className="py-2.5">124 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/40">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#f97316] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center border border-slate-200 dark:border-[#2c2e3c]">
                        SM
                      </div>
                      <span>Summit Hospitality Partners</span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-white">9</td>
                    <td className="py-2.5">76 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/40">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#f97316] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Showing 3 of 42 active enterprise accounts</span>
            <Link href="/admin/organizations" className="font-semibold text-[#f97316] hover:underline">
              View All 42 Accounts →
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
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white">Onboarding milestone reached</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Courtyard Richmond moved to Live Cutover stage.</p>
                  <span className="text-[10px] text-slate-400 font-mono">12 min ago</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white">New property provisioned</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Residence Inn Austin configured with 24 DIDs.</p>
                  <span className="text-[10px] text-slate-400 font-mono">35 min ago</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-start gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 dark:text-white">E911 status verified</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Westin Seattle certified for PSAP emergency dispatch.</p>
                  <span className="text-[10px] text-slate-400 font-mono">1 hour ago</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link href="/admin/audit-logs" className="text-[11.5px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1">
              <span>View system audit log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
