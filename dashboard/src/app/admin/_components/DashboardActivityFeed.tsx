'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, HandCoins } from 'lucide-react';
import Link from 'next/link';
import { sectionVariants } from './types';

interface DashboardActivityFeedProps {
  isSuperAdmin: boolean;
  managementGroups: any[];
  partnerCommissions: any[];
}

export default function DashboardActivityFeed({
  isSuperAdmin,
  managementGroups,
  partnerCommissions,
}: DashboardActivityFeedProps) {
  if (!isSuperAdmin) {
    return null;
  }

  return (
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
                <th className="pb-2 text-right">Revenue Share</th>
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
  );
}
