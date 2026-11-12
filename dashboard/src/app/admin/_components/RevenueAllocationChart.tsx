'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { sectionVariants, SuperAdminKPIs } from './types';

interface RevenueAllocationChartProps {
  superAdminKPIs: SuperAdminKPIs;
}

export default function RevenueAllocationChart({ superAdminKPIs }: RevenueAllocationChartProps) {
  return (
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
                <span>Partner Revenue Share</span>
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
  );
}
