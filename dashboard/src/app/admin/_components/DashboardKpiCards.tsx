'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Hotel,
  DollarSign,
  HandCoins,
  CheckCircle2,
  PhoneCall,
  ArrowLeftRight,
} from 'lucide-react';
import Link from 'next/link';
import { itemVariants, SuperAdminKPIs, OperationalStats } from './types';

interface DashboardKpiCardsProps {
  isSuperAdmin: boolean;
  superAdminKPIs: SuperAdminKPIs;
  stats: OperationalStats;
}

export default function DashboardKpiCards({
  isSuperAdmin,
  superAdminKPIs,
  stats,
}: DashboardKpiCardsProps) {
  if (isSuperAdmin) {
    return (
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Card 1: Management Groups */}
        <Link href="/admin/organizations" className="block group">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Management Groups
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {superAdminKPIs.managementGroupsCount}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {superAdminKPIs.activeManagementGroupsCount} Active
                </span>
                <span className="text-blue-200 group-hover:text-white font-medium flex items-center gap-0.5">
                  View groups &rarr;
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 2: Properties */}
        <Link href="/admin/properties" className="block group">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Properties
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                <Hotel className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-white">
                {superAdminKPIs.propertiesCount}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                <span className="text-blue-100 font-medium">
                  <strong className="text-white font-bold">{superAdminKPIs.activePropertiesCount}</strong> Active &bull; <strong className="text-white font-bold">{superAdminKPIs.pendingPropertiesCount}</strong> Pipeline
                </span>
                <span className="text-blue-200 group-hover:text-white font-medium">
                  &rarr;
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Card 3: Gross Monthly Revenue (MRR) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
              Gross Monthly Revenue (MRR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight text-white">
              ${Number(superAdminKPIs.grossMRR).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
              <span className="text-blue-200">
                Across <strong className="text-white font-bold">{superAdminKPIs.activePropertiesCount}</strong> Active Properties
              </span>
              <span className="text-emerald-300 font-semibold">
                Avg ${Number(superAdminKPIs.averagePropertyMRR).toFixed(0)} / prop
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Partner Commission Outflow */}
        <Link href="/admin/partners" className="block group">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white border border-blue-700/50 shadow-md hover:shadow-lg hover:border-blue-500/80 transition-all flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                Partner Revenue Share Outflow
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform backdrop-blur-xs">
                <HandCoins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-amber-300">
                ${Number(superAdminKPIs.partnerCommissionOutflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-700/60 text-[11px]">
                <span className="text-blue-200">
                  <strong className="text-white font-bold">{superAdminKPIs.totalPartnersCount}</strong> Partners ({superAdminKPIs.outflowPct}% of MRR)
                </span>
                <span className="text-blue-200 group-hover:text-white font-medium">
                  View &rarr;
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Operational KPI Cards for Sub Super Admin
  return (
    <motion.div
      variants={itemVariants}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* Card 1: Management Groups */}
      <Link href="/admin/organizations" className="block group">
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Management Groups
            </span>
            <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="flex items-baseline mt-4">
            <span className="text-2xl font-bold text-slate-100">
              {stats.orgsCount}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Groups</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Active client tenants &rarr;</p>
        </motion.div>
      </Link>

      {/* Card 2: Properties */}
      <Link href="/admin/properties" className="block group">
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Properties
            </span>
            <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
              <Hotel size={18} />
            </div>
          </div>
          <div className="flex items-baseline mt-4">
            <span className="text-2xl font-bold text-slate-100">
              {stats.propsCount}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Sites</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Portfolio locations &rarr;</p>
        </motion.div>
      </Link>

      {/* Card 3: Active Services */}
      <Link href="/admin/services" className="block group">
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Active Services
            </span>
            <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="flex items-baseline mt-4">
            <span className="text-2xl font-bold text-slate-100">
              {stats.servicesCount}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Services</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Voice & data lines &rarr;</p>
        </motion.div>
      </Link>

      {/* Card 4: Active Portings */}
      <Link href="/admin/porting" className="block group">
        <motion.div
          variants={itemVariants}
          className="p-5 rounded-2xl bg-blue-900 dark:bg-blue-950 text-white border border-blue-800 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Active Portings
            </span>
            <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div className="flex items-baseline mt-4">
            <span className="text-2xl font-bold text-slate-100">
              {stats.portingCount}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">In-flight</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">LSR migrations active &rarr;</p>
        </motion.div>
      </Link>
    </motion.div>
  );
}
