'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Hotel,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import PartnerPersonalMonthlyAnalytics from '@/components/partner/PartnerPersonalMonthlyAnalytics';

interface PartnerOverviewData {
  partner: {
    name: string;
    company_name?: string | null;
    email: string;
    default_commission_rate: number;
    status: string;
  };
  metrics: {
    totalEarned: number;
    monthlyRunRate: number;
    activePropertiesCount: number;
    totalGrossRevenue: number;
    pendingPayout: number;
  };
  recentInvoices: any[];
}

export default function PartnerOverviewPage() {
  const [data, setData] = useState<PartnerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/partner/overview');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load partner overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const partner = data?.partner || {
    name: 'Partner Account',
    company_name: 'Affiliate Partner',
    email: 'partner@domain.com',
    default_commission_rate: 10,
    status: 'ACTIVE',
  };

  const metrics = data?.metrics || {
    totalEarned: 0,
    monthlyRunRate: 0,
    activePropertiesCount: 0,
    totalGrossRevenue: 0,
    pendingPayout: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Revenue Share Partner
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome, {partner.name}
          </h1>
          <p className="text-xs text-blue-200 max-w-xl">
            {partner.company_name ? `${partner.company_name} — ` : ''}Your default commission rate is{' '}
            <strong className="text-white font-bold">{partner.default_commission_rate}%</strong>. Track active hotel accounts and submit payout invoices directly below.
          </p>
        </div>
        <Link
          href="/partner/invoices"
          className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-600" /> Generate Invoice
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Earned */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid Out</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${metrics.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Lifetime cleared commission payouts</p>
        </div>

        {/* Card 2: Monthly Recurring Commission */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Run-Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ${metrics.monthlyRunRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-semibold">/ month</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Expected recurring revenue share</p>
        </div>

        {/* Card 3: Active Managed Properties */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Properties</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.activePropertiesCount}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-semibold">Hotels</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Properties assigned to your account</p>
        </div>

        {/* Card 4: Total Gross Portfolio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gross Volume</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${metrics.totalGrossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Monthly billing under partner accounts</p>
        </div>
      </div>

      {/* PERSONAL MONTHLY FINANCIAL PERFORMANCE GRAPH & KPI COMPONENT */}
      <PartnerPersonalMonthlyAnalytics currentMonthlyRunRate={metrics.monthlyRunRate} />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/partner/properties"
          className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] hover:border-blue-500/50 transition group shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition flex items-center gap-2">
              <Hotel className="w-4 h-4 text-blue-500" /> View Properties & Commission Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect all assigned hotel locations, monthly prices, and your specific commission percentages.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <Link
          href="/partner/invoices"
          className="p-6 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] hover:border-blue-500/50 transition group shadow-xs flex items-center justify-between"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Invoices & Payout History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate monthly revenue share invoices, preview branded AAA statements, and export clean PDF prints.
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Statements & Invoices</h3>
            <p className="text-xs text-slate-400">Payout records generated for your partner account.</p>
          </div>
          <Link href="/partner/invoices" className="text-xs font-bold text-blue-600 hover:underline">
            View All Invoices
          </Link>
        </div>

        {data?.recentInvoices && data.recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">INVOICE #</th>
                  <th className="py-2.5 px-3">PERIOD</th>
                  <th className="py-2.5 px-3">PROPERTIES</th>
                  <th className="py-2.5 px-3">COMMISSION AMOUNT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                {data.recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">{inv.invoice_number}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {inv.period_start} to {inv.period_end}
                    </td>
                    <td className="py-3 px-3 font-semibold">{inv.total_properties} Properties</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(inv.commission_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
            No invoices generated yet. Click &quot;Generate Invoice&quot; to submit your first payout request.
          </div>
        )}
      </div>
    </div>
  );
}
