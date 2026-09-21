'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  PhoneCall,
  GitBranch,
  LifeBuoy,
  Clock,
  ShieldCheck,
  UserPlus,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { InviteMemberModal } from '@/components/client/InviteMemberModal';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { CreatePortingModal } from '@/components/client/CreatePortingModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export default function ClientDashboardOverviewPage() {
  const { profile, orgMembership, effectiveRole } = useAuth();
  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User';
  const isClientAdmin = effectiveRole === 'ADMIN';

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showPortingModal, setShowPortingModal] = useState(false);

  // Telemetry data state
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgName = data?.organization?.name || orgMembership?.organization?.name || 'My Organization';

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
    resolutionRate: '0%',
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Standardized Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <Radio size={256} className="w-full h-full object-contain" />
            {/* <img className='h-36' src={"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZ88OMSYrb9ggBc2cMAWnSr6tc9evVTD33M4-Nlx_3SR40-NoJ8-z5DBE&s=10"} /> */}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
            {orgName}
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Raise Ticket button for all client users */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowTicketModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Support Ticket</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPortingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Submit Porting</span>
          </motion.button>

          {/* Admin shortcuts */}
          {isClientAdmin && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Invite Member</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* 2. Top KPI Cards Row - VARIANT 1 ONLY FOR ALL CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Organization */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Organization
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-white truncate block">
              {orgName}
            </span>
            <span className="text-xs text-slate-200 font-medium">Active Tenant</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Verified enterprise account</p>
        </motion.div>

        {/* Card 2: Properties */}
        <Link href="/dashboard/properties" className="block">
          <motion.div
            whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Properties
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Hotel className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">
                {metrics.propertiesCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Locations</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">View complete portfolio &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 3: Services & Lines */}
        <Link href="/dashboard/services" className="block">
          <motion.div
            whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Services &amp; Lines
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <PhoneCall className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">
                {metrics.servicesCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Active</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">View inventory &amp; DIDs &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 4: Active Onboardings */}
        <Link href="/dashboard/onboarding" className="block">
          <motion.div
            whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Onboardings
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">
                {metrics.activeOnboardingsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Pipelines</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Track deployment &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 5: Active Porting */}
        <Link href="/dashboard/porting" className="block">
          <motion.div
            whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Active Porting
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">
                {metrics.activePortingCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">Orders</span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Carrier migration queue &rarr;</p>
          </motion.div>
        </Link>

        {/* Card 6: Open Tickets */}
        <Link href="/dashboard/tickets" className="block">
          <motion.div
            whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer h-full"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                Open Tickets
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <LifeBuoy className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white">
                {metrics.openTicketsCount}
              </span>
              <span className="text-xs text-slate-200 ml-1.5 font-medium">
                {metrics.ticketsInLast24Hours} in 24h
              </span>
            </div>
            <p className="text-[11px] text-slate-200 mt-2">Support desk &rarr;</p>
          </motion.div>
        </Link>
      </motion.div>

      {/* 3. Row: Attention Required & Upcoming Deadlines */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Attention Required (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs space-y-4 flex flex-col justify-between">
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
                            : 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40'
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
                      className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
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
              className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View full E911 &amp; compliance center</span> &rarr;
            </Link>
          </div>
        </div>

        {/* Right: Upcoming Deadlines (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs space-y-4 flex flex-col justify-between">
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
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40'
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
              className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View carrier porting schedule</span> &rarr;
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 4. Row: Ticket Analytics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5">
        {/* Ticket Analytics (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs space-y-4">
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
              <span className="text-lg font-bold text-slate-900 dark:text-white block">
                {ticketStats.open}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Open</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 block">
                {ticketStats.inProgress}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">In Progress</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 block">
                {ticketStats.waitingOnClient}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Waiting</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
                {ticketStats.resolved}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Resolved</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200/60 dark:border-[#252733]">
              <span className="text-lg font-bold text-slate-400 block">
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
              className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Open Ticket Desk &rarr;
            </Link>
          </div>
        </div>

      </motion.div>

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
    </motion.div>
  );
}
