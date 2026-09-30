'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  DollarSign,
  ShieldAlert,
  Loader2,
  Lock,
  Wallet,
  TrendingUp,
  Users,
  Hotel,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  Receipt,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function AdminFinancesPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const [financeData, setFinanceData] = useState<{
    totalMRR: number;
    partnerCommissionOutflow: number;
    netRetainedRevenue: number;
    activePropertiesCount: number;
    activePartnersCount: number;
    topProperties: any[];
    partners: any[];
  }>({
    totalMRR: 0,
    partnerCommissionOutflow: 0,
    netRetainedRevenue: 0,
    activePropertiesCount: 0,
    activePartnersCount: 0,
    topProperties: [],
    partners: [],
  });
  const [dataLoading, setDataLoading] = useState(true);

  // Strict route protection: immediately redirect unauthorized users
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [loading, isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      const fetchFinances = async () => {
        setDataLoading(true);
        try {
          const [resProps, resPartners] = await Promise.all([
            fetch('/api/admin/properties?limit=200'),
            fetch('/api/admin/partners'),
          ]);
          const jsonProps = await resProps.json();
          const jsonPartners = await resPartners.json();

          const props = jsonProps.data || [];
          const partners = jsonPartners.data || [];

          const activeProps = props.filter((p: any) => p.status === 'ACTIVE');
          const totalMRR = activeProps.reduce((sum: number, p: any) => sum + Number(p.monthly_price || 0), 0);

          const partnerOutflow = partners.reduce((sum: number, pt: any) => sum + Number(pt.monthly_commission_estimated || 0), 0);
          const netRetained = Math.max(0, totalMRR - partnerOutflow);

          setFinanceData({
            totalMRR,
            partnerCommissionOutflow: partnerOutflow,
            netRetainedRevenue: netRetained,
            activePropertiesCount: activeProps.length,
            activePartnersCount: partners.filter((pt: any) => pt.status === 'ACTIVE').length,
            topProperties: activeProps.sort((a: any, b: any) => Number(b.monthly_price || 0) - Number(a.monthly_price || 0)).slice(0, 5),
            partners: partners.slice(0, 5),
          });
        } catch (err) {
          console.error('Error fetching finances:', err);
        } finally {
          setDataLoading(false);
        }
      };
      fetchFinances();
    }
  }, [isSuperAdmin]);

  // Loading state
  if (loading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">
          Loading financial data...
        </p>
      </div>
    );
  }

  // Access Denied guard
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans p-6 md:p-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Finances & Revenue Analytics
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" />
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Monthly recurring subscriptions, partner revenue share disbursements, and net revenue.
            </p>
          </div>
        </div>
        <Link
          href="/admin/partners"
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition self-start sm:self-auto"
        >
          <Users className="w-3.5 h-3.5" /> Manage Partners
        </Link>
      </motion.div>

      {/* Financial Metric Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gross MRR */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Monthly Revenue (MRR)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${financeData.totalMRR.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">From {financeData.activePropertiesCount} active properties</p>
        </div>

        {/* Partner Commission Outflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Partner Commission Outflow</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              ${financeData.partnerCommissionOutflow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across {financeData.activePartnersCount} active channel partners</p>
        </div>

        {/* Net Retained Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Retained Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${financeData.netRetainedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Company revenue after partner shares</p>
        </div>
      </motion.div>

      {/* Top Properties & Partner Shares */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Properties by Subscription */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Hotel className="w-4 h-4 text-blue-500" /> Top Subscription Properties
            </h3>
            <Link href="/admin/properties" className="text-xs text-blue-600 hover:underline font-bold">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
            {financeData.topProperties.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{p.name}</span>
                  <span className="text-[10px] text-slate-400">{p.city}, {p.state}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${Number(p.monthly_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Outflows Breakdown */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" /> Partner Commission Shares
            </h3>
            <Link href="/admin/partners" className="text-xs text-blue-600 hover:underline font-bold">
              View All Partners
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
            {financeData.partners.length > 0 ? (
              financeData.partners.map((pt) => (
                <div key={pt.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{pt.name}</span>
                    <span className="text-[10px] text-slate-400">{pt.active_properties_count} Properties ({pt.default_commission_rate}%)</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(pt.monthly_commission_estimated || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                  </span>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-slate-400">No partner accounts configured yet.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
