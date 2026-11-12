'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { containerVariants } from './_components/types';
import DashboardQuickActions from './_components/DashboardQuickActions';
import DashboardKpiCards from './_components/DashboardKpiCards';
import DashboardCharts from './_components/DashboardCharts';
import DashboardActivityFeed from './_components/DashboardActivityFeed';

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={
        isSuperAdmin
          ? 'space-y-7 pb-16 font-sans text-slate-900 dark:text-slate-100'
          : 'space-y-6 pb-16 font-sans text-slate-900 dark:text-slate-100'
      }
    >
      {/* 1. Super Admin Header / Quick Actions */}
      <DashboardQuickActions
        isSuperAdmin={isSuperAdmin}
        loading={loading}
        onRefresh={fetchAdminOverview}
      />

      {/* 2. Top KPI Cards (Super Admin or Operational) */}
      <DashboardKpiCards
        isSuperAdmin={isSuperAdmin}
        superAdminKPIs={superAdminKPIs}
        stats={stats}
      />

      {/* 3. Charts & Pipelines Section */}
      <DashboardCharts
        isSuperAdmin={isSuperAdmin}
        superAdminKPIs={superAdminKPIs}
        onboardingPipeline={onboardingPipeline}
        ticketAnalytics={ticketAnalytics}
        e911Compliance={e911Compliance}
      />

      {/* 4. Detailed Activity Feed / Breakdown Tables */}
      <DashboardActivityFeed
        isSuperAdmin={isSuperAdmin}
        managementGroups={managementGroups}
        partnerCommissions={partnerCommissions}
      />
    </motion.div>
  );
}
