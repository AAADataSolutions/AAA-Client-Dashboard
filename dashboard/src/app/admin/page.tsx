'use client';

import React, { useState } from 'react';
import {
  Building2,
  Hotel,
  PhoneCall,
  Send,
  GitBranch,
  LifeBuoy,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  ChevronDown,
  Filter,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminOverviewPage() {
  const { profile } = useAuth();
  const userName = profile?.full_name || 'Binoy';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Greeting Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">
          Hello {userName}
        </h1>
        <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
          Take an overview of your operations across all hospitality portfolios.
        </p>
      </div>

      {/* 2. Top KPI Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Organizations */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Organizations
            </span>
            <Building2 className="w-3.5 h-3.5 text-[#f97316]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">42</h2>
            <span className="inline-block text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 4 this month
            </span>
          </div>
        </div>

        {/* Card 2: Properties */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Properties
            </span>
            <Hotel className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">186</h2>
            <span className="inline-block text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 12 this month
            </span>
          </div>
        </div>

        {/* Card 3: Services & Lines */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Services &amp; Lines
            </span>
            <PhoneCall className="w-3.5 h-3.5 text-[#1275e2] dark:text-sky-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">1,248</h2>
            <span className="inline-block text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
              ↑ 36 this month
            </span>
          </div>
        </div>

        {/* Card 4: Active Onboardings */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Active Onboardings
            </span>
            <Send className="w-3.5 h-3.5 text-[#ea580c] dark:text-[#f97316]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">18</h2>
            <span className="inline-block text-[10.5px] font-medium text-[#ea580c] dark:text-[#f97316] bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-800/40">
              4 due this week
            </span>
          </div>
        </div>

        {/* Card 5: Active Porting */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Active Porting
            </span>
            <GitBranch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">27</h2>
            <span className="inline-block text-[10.5px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800/40">
              7 due this week
            </span>
          </div>
        </div>

        {/* Card 6: Open Tickets */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-[#e2e8f0] dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-[#64748b] dark:text-slate-400">
              Open Tickets
            </span>
            <LifeBuoy className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#181c22] dark:text-white">14</h2>
            <span className="inline-block text-[10.5px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/40">
              2 Last 24 hours
            </span>
          </div>
        </div>
      </div>

      {/* 3. Row 1: Attention Required & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Attention Required (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Attention Required</h3>
                <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                  5 Items
                </span>
              </div>
              <span className="text-[11px] text-[#94a3b8]">High priority operational triggers</span>
            </div>

            <div className="divide-y divide-[#f1f3fc] mt-1">
              {/* Item 1 */}
              <div className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 uppercase mt-0.5">
                    Critical
                  </span>
                  <div>
                    <h4 className="font-semibold text-[#181c22]">5 E911 corrections required</h4>
                    <p className="text-[#64748b] text-[11px]">PSAP routing mismatch identified on Grandview &amp; ABC properties.</p>
                  </div>
                </div>
                <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline shrink-0">
                  Fix Now →
                </Link>
              </div>

              {/* Item 2 */}
              <div className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200 uppercase mt-0.5">
                    Critical
                  </span>
                  <div>
                    <h4 className="font-semibold text-[#181c22]">2 E911 verification failed</h4>
                    <p className="text-[#64748b] text-[11px]">Dispatch validation error: Address unverified against MSAG database.</p>
                  </div>
                </div>
                <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline shrink-0">
                  Review →
                </Link>
              </div>

              {/* Item 3 */}
              <div className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 uppercase mt-0.5">
                    Attention
                  </span>
                  <div>
                    <h4 className="font-semibold text-[#181c22]">6 onboarding overdue</h4>
                    <p className="text-[#64748b] text-[11px]">Pending Service Order Form (SOF) sign-off from tenant managers.</p>
                  </div>
                </div>
                <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline shrink-0">
                  Notify →
                </Link>
              </div>

              {/* Item 4 */}
              <div className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200 uppercase mt-0.5">
                    Attention
                  </span>
                  <div>
                    <h4 className="font-semibold text-[#181c22]">4 porting due soon</h4>
                    <p className="text-[#64748b] text-[11px]">FOC cutover window active in &lt; 48 hours. Pre-testing pending.</p>
                  </div>
                </div>
                <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline shrink-0">
                  Schedule →
                </Link>
              </div>

              {/* Item 5 */}
              <div className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 uppercase mt-0.5">
                    Warning
                  </span>
                  <div>
                    <h4 className="font-semibold text-[#181c22]">3 porting/onboarding approaching target date</h4>
                    <p className="text-[#64748b] text-[11px]">Buffer duration reduced below SLA standard (less than 2 days).</p>
                  </div>
                </div>
                <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline shrink-0">
                  Details →
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f1f3fc]">
            <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
              View all attention items &amp; action queue →
            </Link>
          </div>
        </div>

        {/* Right: Upcoming Deadlines (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#181c22]" />
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Upcoming Deadlines</h3>
              </div>
              <span className="text-[11px] text-[#94a3b8]">Target milestones</span>
            </div>

            <div className="divide-y divide-[#f1f3fc] mt-1">
              {/* Deadline 1 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f1f3fc] border border-[#e2e8f0] flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase">Sep</span>
                    <span className="text-sm font-bold text-[#181c22]">12</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#181c22]">Hotel ABC</h4>
                    <p className="text-[11px] text-[#64748b]">Stage: FOC Target</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] border border-orange-200">
                  Onboarding
                </span>
              </div>

              {/* Deadline 2 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f1f3fc] border border-[#e2e8f0] flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase">Sep</span>
                    <span className="text-sm font-bold text-[#181c22]">14</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#181c22]">Hotel XYZ</h4>
                    <p className="text-[11px] text-[#64748b]">Stage: Carrier Cutover</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">
                  Porting
                </span>
              </div>

              {/* Deadline 3 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f1f3fc] border border-[#e2e8f0] flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase">Sep</span>
                    <span className="text-sm font-bold text-[#181c22]">15</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#181c22]">Hotel DEF</h4>
                    <p className="text-[11px] text-[#64748b]">Stage: PBX Live Activation</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] border border-orange-200">
                  Onboarding
                </span>
              </div>

              {/* Deadline 4 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f1f3fc] border border-[#e2e8f0] flex flex-col items-center justify-center leading-none">
                    <span className="text-[9px] font-bold text-[#64748b] uppercase">Sep</span>
                    <span className="text-sm font-bold text-[#181c22]">18</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#181c22]">Grandview Resort</h4>
                    <p className="text-[11px] text-[#64748b]">Stage: DID Batch Port</p>
                  </div>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200">
                  Porting
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f1f3fc]">
            <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
              View calendar &amp; schedule →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Row 2: Onboarding Overview */}
      <div className="p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f1f3fc] gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-bold text-[#181c22]">Onboarding Overview</h3>
            <span className="text-[10.5px] font-semibold px-2 py-0.2 rounded-full bg-[#f1f3fc] text-[#465f88] border border-[#e2e8f0]">
              18 Active Total
            </span>
          </div>
          <Link href="/admin/onboarding-porting" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
            View All Onboardings →
          </Link>
        </div>
        <p className="text-[11px] text-[#64748b] -mt-2">
          Deployment pipeline and stage velocity across prospective tenant locations.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-center">
          {/* Donut Chart & Legend (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-around gap-4">
            {/* SVG Ring Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f3fc" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#ea580c" strokeWidth="4" strokeDasharray="22 78" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#1275e2" strokeWidth="4" strokeDasharray="33 67" strokeDashoffset="-22" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#16a34a" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="-55" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#9333ea" strokeWidth="4" strokeDasharray="16 84" strokeDashoffset="-72" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#059669" strokeWidth="4" strokeDasharray="12 88" strokeDashoffset="-88" />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-[#181c22] block">18</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#64748b]">Active</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs text-[#64748b]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                  <span className="text-[11px]">Waiting for Signature</span>
                </div>
                <strong className="text-[#181c22]">4</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1275e2]" />
                  <span className="text-[11px]">Waiting for Porting</span>
                </div>
                <strong className="text-[#181c22]">6</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-[11px]">Porting Submitted</span>
                </div>
                <strong className="text-[#181c22]">3</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span className="text-[11px]">Waiting for SOF</span>
                </div>
                <strong className="text-[#181c22]">2</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px]">FOC Received</span>
                </div>
                <strong className="text-[#181c22]">3</strong>
              </div>
            </div>
          </div>

          {/* Key Properties in Pipeline (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-[#f1f3fc]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Key Properties in Pipeline
            </h4>

            {/* Pipeline Item 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#181c22]">Hotel ABC</span>
                <span className="text-emerald-600 text-[11px]">FOC Received · 80%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f3fc] overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            {/* Pipeline Item 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#181c22]">Hotel XYZ</span>
                <span className="text-[#1275e2] text-[11px]">Porting Submitted · 55%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f3fc] overflow-hidden">
                <div className="h-full bg-[#1275e2] rounded-full" style={{ width: '55%' }} />
              </div>
            </div>

            {/* Pipeline Item 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#181c22]">Sheraton Downtown</span>
                <span className="text-[#465f88] text-[11px]">Waiting for Porting · 40%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f3fc] overflow-hidden">
                <div className="h-full bg-[#465f88] rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Pipeline Item 4 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#181c22]">Hotel DEF</span>
                <span className="text-[#ea580c] text-[11px]">Waiting for Signature · 25%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#f1f3fc] overflow-hidden">
                <div className="h-full bg-[#ea580c] rounded-full" style={{ width: '25%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Row 3: Porting Overview & Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Porting Overview (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Porting Overview</h3>
                <span className="text-[11px] text-[#64748b]">Total: 35 Orders</span>
              </div>
              <p className="text-[11px] text-[#64748b]">Carrier number transfer pipeline across CLECs &amp; ILECs</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Target Resolution: 98.2%
            </span>
          </div>

          {/* Volume by Stage Pills */}
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="p-2 rounded-lg bg-[#f8f9fa] border border-[#e2e8f0]">
              <span className="text-[10px] font-medium text-[#64748b] block">Pending</span>
              <strong className="text-sm font-bold text-[#181c22]">5</strong>
            </div>
            <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
              <span className="text-[10px] font-medium text-[#1275e2] block">Submitted</span>
              <strong className="text-sm font-bold text-[#1275e2]">8</strong>
            </div>
            <div className="p-2 rounded-lg bg-orange-50/60 border border-orange-100">
              <span className="text-[10px] font-medium text-[#ea580c] block">In Progress</span>
              <strong className="text-sm font-bold text-[#ea580c]">6</strong>
            </div>
            <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-100">
              <span className="text-[10px] font-medium text-purple-600 block">FOC Recv.</span>
              <strong className="text-sm font-bold text-purple-600">3</strong>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-[10px] font-medium text-emerald-600 block">Completed</span>
              <strong className="text-sm font-bold text-emerald-600">13</strong>
            </div>
          </div>

          {/* Mini Porting Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#64748b]">
              <thead className="text-[10px] uppercase font-bold text-[#94a3b8] border-b border-[#f1f3fc]">
                <tr>
                  <th className="pb-2">Property</th>
                  <th className="pb-2">Numbers</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Target Date</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3fc]">
                <tr>
                  <td className="py-2.5 font-semibold text-[#181c22]">Hotel ABC</td>
                  <td className="py-2.5">12 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#1275e2] text-[10.5px] font-medium border border-blue-200">
                      Submitted
                    </span>
                  </td>
                  <td className="py-2.5">Sep 16, 2026</td>
                  <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-[#181c22]">Hotel XYZ</td>
                  <td className="py-2.5">5 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10.5px] font-medium border border-emerald-200">
                      FOC Received
                    </span>
                  </td>
                  <td className="py-2.5">Sep 16, 2026</td>
                  <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-[#181c22]">Hotel DEF</td>
                  <td className="py-2.5">8 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-orange-50 text-[#ea580c] text-[10.5px] font-medium border border-orange-200">
                      In Progress
                    </span>
                  </td>
                  <td className="py-2.5">Sep 18, 2026</td>
                  <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 font-semibold text-[#181c22]">Grandview Suites</td>
                  <td className="py-2.5">24 DIDs</td>
                  <td className="py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#f1f3fc] text-[#465f88] text-[10.5px] font-medium border border-[#e2e8f0]">
                      Carrier Review
                    </span>
                  </td>
                  <td className="py-2.5">Sep 20, 2026</td>
                  <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                    Track →
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Support Tickets (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-[#181c22]" />
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Support Tickets</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-100 uppercase">
                SLA Priority
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Current Load</span>
              <h2 className="text-xl font-bold text-[#181c22]">14 Open</h2>
              <p className="text-[11px] text-[#64748b]">Reported in the last 24 hours</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#e2e8f0]">
                <span className="text-[10.5px] text-[#64748b] block">Avg Response</span>
                <strong className="text-xs font-bold text-[#181c22]">2h 18m</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#e2e8f0]">
                <span className="text-[10.5px] text-[#64748b] block">Avg Resolution</span>
                <strong className="text-xs font-bold text-[#181c22]">8h 42m</strong>
              </div>
            </div>

            {/* Ticket Volume 7-Day Trend Chart SVG */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="font-semibold text-[#64748b]">Ticket Volume (7 Days)</span>
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
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  points="0,30 30,22 60,28 90,15 120,20 150,12 180,18 200,10"
                />
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  points="0,35 30,30 60,22 90,18 120,25 150,15 180,10 200,8"
                />
              </svg>
              <div className="flex justify-between text-[9px] text-[#94a3b8] px-0.5">
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

          <div className="pt-2 border-t border-[#f1f3fc]">
            <Link href="/admin/tickets" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
              Open Ticket Dispatch Console →
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Row 4: E911 Emergency Compliance Overview */}
      <div className="p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-bold text-[#181c22]">E911 Emergency Compliance Overview</h3>
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Regulatory Mandate
            </span>
          </div>
          <Link href="/admin/e911" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
            Full Compliance Report →
          </Link>
        </div>
        <p className="text-[11px] text-[#64748b] -mt-2">
          KARI&apos;S Law and RAY BAUM&apos;S Act location dispatch verification status.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
          {/* Donut Chart & Legend (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-around gap-4">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f3fc" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#16a34a" strokeWidth="4" strokeDasharray="86 14" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#0284c7" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-86" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#ea580c" strokeWidth="4" strokeDasharray="4 96" strokeDashoffset="-93" />
                <circle cx="18" cy="18" r="14" fill="transparent" stroke="#dc2626" strokeWidth="4" strokeDasharray="3 97" strokeDashoffset="-97" />
              </svg>
              <div className="absolute text-center leading-none">
                <span className="text-xl font-bold text-[#181c22] block">124</span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600">Verified</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#64748b]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="text-[11px]">Verified</span>
                </div>
                <strong className="text-[#181c22]">124</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span className="text-[11px]">Pending</span>
                </div>
                <strong className="text-[#181c22]">10</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                  <span className="text-[11px]">Correction Req.</span>
                </div>
                <strong className="text-[#181c22]">5</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span className="text-[11px]">Failed</span>
                </div>
                <strong className="text-[#181c22]">2</strong>
              </div>
            </div>
          </div>

          {/* Yellow Warning Callout Card (7 cols) */}
          <div className="lg:col-span-7 p-4.5 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 text-[#b45309] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#92400e]">
                  5 properties require correction · 2 properties failed verification
                </h4>
                <p className="text-[11px] text-[#b45309] leading-relaxed max-w-lg">
                  Dispatchable location address fields lack suite or floor numbers necessary for civic PSAP validation. Immediate remediation suggested to avoid carrier fines.
                </p>
              </div>
            </div>

            <Link
              href="/admin/e911"
              className="px-4 py-2 rounded-lg bg-[#78350f] hover:bg-[#92400e] text-white text-xs font-semibold shrink-0 transition-colors"
            >
              Review E911 Locations →
            </Link>
          </div>
        </div>
      </div>

      {/* 7. Row 5: Organizations Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Organizations Overview (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
              <div className="space-y-0.5">
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Organizations Overview</h3>
                <p className="text-[11px] text-[#64748b]">Master enterprise accounts and property volume</p>
              </div>
              <Link href="/admin/organizations" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
                View All Organizations →
              </Link>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none"
                />
              </div>
              <button className="px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] flex items-center gap-1 hover:bg-[#f8f9fa]">
                <span>Status</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] flex items-center gap-1 hover:bg-[#f8f9fa]">
                <span>Sort</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Organizations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#64748b]">
                <thead className="text-[10px] uppercase font-bold text-[#94a3b8] border-b border-[#f1f3fc]">
                  <tr>
                    <th className="pb-2">Organization</th>
                    <th className="pb-2">Properties</th>
                    <th className="pb-2">Services</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3fc]">
                  <tr>
                    <td className="py-2.5 font-semibold text-[#181c22] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#f1f3fc] text-[#465f88] font-bold text-[10px] flex items-center justify-center border border-[#e2e8f0]">
                        GH
                      </div>
                      <span>Grandview Hotels</span>
                    </td>
                    <td className="py-2.5 font-medium text-[#181c22]">24</td>
                    <td className="py-2.5">182 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-semibold text-[#181c22] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#f1f3fc] text-[#465f88] font-bold text-[10px] flex items-center justify-center border border-[#e2e8f0]">
                        AH
                      </div>
                      <span>ABC Hospitality</span>
                    </td>
                    <td className="py-2.5 font-medium text-[#181c22]">18</td>
                    <td className="py-2.5">124 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-semibold text-[#181c22] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#f1f3fc] text-[#465f88] font-bold text-[10px] flex items-center justify-center border border-[#e2e8f0]">
                        XH
                      </div>
                      <span>XYZ Hotels</span>
                    </td>
                    <td className="py-2.5 font-medium text-[#181c22]">9</td>
                    <td className="py-2.5">76 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-semibold text-[#181c22] flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#f1f3fc] text-[#465f88] font-bold text-[10px] flex items-center justify-center border border-[#e2e8f0]">
                        SH
                      </div>
                      <span>Sheraton Hotels</span>
                    </td>
                    <td className="py-2.5 font-medium text-[#181c22]">56</td>
                    <td className="py-2.5">420 Lines</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                        ● Active
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-[#1275e2] cursor-pointer hover:underline">
                      Manage →
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f1f3fc] flex items-center justify-between text-xs text-[#64748b]">
            <span>Showing 4 of 42 active enterprise accounts</span>
            <div className="flex items-center gap-1.5">
              <button className="px-2 py-1 rounded border border-[#e2e8f0] hover:bg-[#f8f9fa]">Previous</button>
              <button className="px-2 py-1 rounded bg-[#1275e2] text-white">1</button>
              <button className="px-2 py-1 rounded border border-[#e2e8f0] hover:bg-[#f8f9fa]">Next</button>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3fc]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#181c22]" />
                <h3 className="text-[13.5px] font-bold text-[#181c22]">Recent Activity</h3>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                Live Feed
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#181c22]">Onboarding updated</p>
                  <p className="text-[11px] text-[#64748b]">Hotel ABC moved to FOC Received stage.</p>
                  <span className="text-[10px] text-[#94a3b8]">12 min ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#1275e2] mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#181c22]">New property added</p>
                  <p className="text-[11px] text-[#64748b]">Hotel XYZ added under ABC Hospitality.</p>
                  <span className="text-[10px] text-[#94a3b8]">35 min ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#181c22]">E911 status updated</p>
                  <p className="text-[11px] text-[#64748b]">Hotel DEF marked as Verified by PSAP.</p>
                  <span className="text-[10px] text-[#94a3b8]">1 hour ago</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#ea580c] mt-1 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#181c22]">Service added</p>
                  <p className="text-[11px] text-[#64748b]">5 new voice lines provisioned to Hotel ABC.</p>
                  <span className="text-[10px] text-[#94a3b8]">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f1f3fc]">
            <Link href="/admin/audit-logs" className="text-[11.5px] font-semibold text-[#1275e2] hover:underline">
              View system audit log →
            </Link>
          </div>
        </div>
      </div>

      {/* 8. Footer */}
      <footer className="pt-6 border-t border-[#e2e8f0] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#94a3b8] gap-3">
        <span>
          © 2026 NexusCore Telecom Platforms. All rights reserved. · Enterprise Multi-Tenant Node v4.13
        </span>
        <div className="flex items-center gap-4 text-[#64748b]">
          <span className="hover:text-[#181c22] cursor-pointer">FCC / KARI&apos;S Law Docs</span>
          <span className="hover:text-[#181c22] cursor-pointer">Carrier API Gateway</span>
          <span className="hover:text-[#181c22] cursor-pointer">Privacy &amp; Audit</span>
        </div>
      </footer>
    </div>
  );
}
