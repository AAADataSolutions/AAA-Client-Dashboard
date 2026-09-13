'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Search,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { InviteMemberModal } from '@/components/client/InviteMemberModal';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { CreatePortingModal } from '@/components/client/CreatePortingModal';

export default function ClientDashboardOverviewPage() {
  const { profile, orgMembership, effectiveRole } = useAuth();
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const orgName = orgMembership?.organization?.name || 'My Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showPortingModal, setShowPortingModal] = useState(false);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');

  // Telemetry data state
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/client/overview');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch dashboard data');
      }
      setData(json.data);
    } catch (err: any) {
      console.error('Overview fetch error:', err);
      setError(err.message || 'Error loading dashboard telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const metrics = data?.metrics || {
    propertiesCount: 0,
    servicesCount: 0,
    activeOnboardingsCount: 0,
    activePortingCount: 0,
    openTicketsCount: 0,
    ticketsInLast24Hours: 0,
  };

  const attentionQueue = data?.attentionRequired || [];
  const deadlines = data?.upcomingDeadlines || [];
  const ticketStats = data?.ticketAnalytics || {
    open: 0,
    inProgress: 0,
    waitingOnClient: 0,
    resolved: 0,
    closed: 0,
    resolutionRate: '100%',
  };
  const recentActivities = data?.recentActivity || [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Greeting & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hello {userName}
            </h1>
            <span
              className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                isClientAdmin
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isClientAdmin ? 'Client Admin' : 'Client Member'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Operational dashboard and telecommunication infrastructure for <strong className="text-slate-800 dark:text-slate-200">{orgName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Raise Ticket button for all client users */}
          <button
            onClick={() => setShowTicketModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Support Ticket</span>
          </button>

          {/* Admin shortcuts */}
          {isClientAdmin && (
            <>
              <button
                onClick={() => setShowPortingModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] font-semibold text-xs transition shadow-2xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
                <span>Submit Porting</span>
              </button>

              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] font-semibold text-xs transition shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                <span>Invite Member</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Top KPI Cards Row (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Organization */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Organization
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {orgName}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
              Active Tenant
            </span>
          </div>
        </div>

        {/* Card 2: Properties */}
        <Link
          href="/dashboard/properties"
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Properties
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Hotel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.propertiesCount}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
              View Portfolio &rarr;
            </span>
          </div>
        </Link>

        {/* Card 3: Services & Lines */}
        <Link
          href="/dashboard/services"
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Services &amp; Lines
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.servicesCount}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
              View Inventory &rarr;
            </span>
          </div>
        </Link>

        {/* Card 4: Active Onboardings */}
        <Link
          href="/dashboard/onboarding"
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Onboardings
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.activeOnboardingsCount}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
              Track Pipeline &rarr;
            </span>
          </div>
        </Link>

        {/* Card 5: Active Porting */}
        <Link
          href="/dashboard/porting"
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Porting
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.activePortingCount}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
              Carrier Status &rarr;
            </span>
          </div>
        </Link>

        {/* Card 6: Open Tickets */}
        <Link
          href="/dashboard/tickets"
          className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs flex flex-col justify-between space-y-2 hover:border-indigo-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Open Tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {metrics.openTicketsCount}
            </h2>
            <span className="inline-block text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              {metrics.ticketsInLast24Hours} in last 24h
            </span>
          </div>
        </Link>
      </div>

      {/* 3. Row: Attention Required & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Attention Required (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attention Required</h3>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  {attentionQueue.length} Priority
                </span>
              </div>
              <span className="text-[11px] text-slate-400">High priority triggers</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1f212c] mt-1">
              {attentionQueue.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200">No Critical Operational Triggers</p>
                  <p className="text-[11px]">All emergency routes, onboardings, and porting queues are in order.</p>
                </div>
              ) : (
                attentionQueue.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0 ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                            : item.severity === 'ATTENTION'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={item.actionHref || '/dashboard'}
                      className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                    >
                      {item.actionLabel || 'Fix Now →'}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link
              href="/dashboard/e911"
              className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View full E911 &amp; compliance center</span> &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Upcoming Deadlines (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Target Dates</h3>
              </div>
              <span className="text-[11px] text-slate-400">Carrier milestones</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#1f212c] mt-1">
              {deadlines.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <p>No upcoming target deadlines recorded for active orders.</p>
                </div>
              ) : (
                deadlines.map((dl: any) => (
                  <div key={dl.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-[#181920] border border-slate-200 dark:border-[#262833] flex flex-col items-center justify-center leading-none">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          {dl.month}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {dl.day}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                          {dl.propertyName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                          Stage: {dl.stage}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        dl.type === 'Onboarding'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40'
                      }`}
                    >
                      {dl.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
            <Link
              href="/dashboard/porting"
              className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <span>View carrier porting schedule</span> &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Row: Ticket Analytics Visual Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ticket Analytics (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Support Ticket Analytics</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Resolution performance and active ticket lifecycle.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
              {ticketStats.resolutionRate} Resolution Rate
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-slate-900 dark:text-white block font-mono">
                {ticketStats.open}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Open</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 block font-mono">
                {ticketStats.inProgress}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">In Progress</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block font-mono">
                {ticketStats.waitingOnClient}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Waiting</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                {ticketStats.resolved}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Resolved</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-slate-400 block font-mono">
                {ticketStats.closed}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Closed</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Avg Engineering response: <strong>&lt; 15 mins</strong>
            </span>
            <Link
              href="/dashboard/tickets"
              className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Open Ticket Desk &rarr;
            </Link>
          </div>
        </div>

        {/* Recent Activity Log (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Organization Activity</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Audit event updates across your telecommunication services.
              </p>
            </div>
            <span className="text-[11px] text-slate-400">Live feed</span>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p>No recent activity records logged for this billing period.</p>
              </div>
            ) : (
              recentActivities.map((act: any) => (
                <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#20222a] flex items-center justify-center shrink-0 mt-0.5 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block capitalize">
                        {act.action?.replace(/_/g, ' ')}
                      </span>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Target: {act.entity_type} {act.actor_email ? `• ${act.actor_email}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchOverview}
      />
      <CreateTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSuccess={fetchOverview}
      />
      <CreatePortingModal
        isOpen={showPortingModal}
        onClose={() => setShowPortingModal(false)}
        onSuccess={fetchOverview}
      />
    </div>
  );
}
