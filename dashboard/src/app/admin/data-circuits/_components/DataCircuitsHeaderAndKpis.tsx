'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  Search,
  Plus,
  RefreshCw,
  Building2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Check,
} from 'lucide-react';
import {
  itemVariants,
  CIRCUIT_STAGES,
  formatCurrency,
  type CircuitMetrics,
} from './types';

interface DataCircuitsHeaderAndKpisProps {
  wholesalersCount: number;
  loading: boolean;
  tableMissing: boolean;
  metrics: CircuitMetrics;
  selectedMonth: string;
  activeViewTab: 'PIPELINE' | 'INSTALLED';
  setActiveViewTab: (tab: 'PIPELINE' | 'INSTALLED') => void;
  pipelineCount: number;
  installedCount: number;
  displayedCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  onOpenWholesalers: () => void;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

export default function DataCircuitsHeaderAndKpis({
  wholesalersCount,
  loading,
  tableMissing,
  metrics,
  selectedMonth,
  activeViewTab,
  setActiveViewTab,
  pipelineCount,
  installedCount,
  displayedCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onOpenWholesalers,
  onRefresh,
  onOpenCreate,
}: DataCircuitsHeaderAndKpisProps) {
  return (
    <>
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Data Circuit &amp; Wholesaler Revenue Share
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Request wholesaler quotes, finalize winning prices, send client quotations (wholesaler hidden), enforce Agreement PDF sign-off, and track monthly revenue share.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenWholesalers}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e202b] text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            title="Manage Wholesalers Directory"
          >
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Wholesalers ({wholesalersCount})</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1d1f29] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Data Circuit Request
          </button>
        </div>
      </motion.div>

      {tableMissing && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Migration Pending</p>
            <p className="mt-0.5">
              Please run <code className="font-mono font-bold">DB_Queries/24_data_circuits_schema.sql</code> and{' '}
              <code className="font-mono font-bold">27_update_circuit_stages_enum.sql</code> in your Supabase SQL Editor to initialize all 7 lifecycle stages.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards - Deep Blue Theme */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Total Data Circuits</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalCircuits}</span>
            <span className="text-xs text-blue-200 font-medium">({metrics.inProgressCircuits} in pipeline)</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Active requests, quotes &amp; live installations
          </p>
        </div>

        {/* Card 2: Installed & Live */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Installed &amp; Live</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">
              {metrics.installedCircuits}
            </span>
            <span className="text-xs text-blue-200 font-medium">live properties</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Synced to Admin &amp; Client Property pages
          </p>
        </div>

        {/* Card 3: Expected Monthly Rev Share */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Expected Monthly Rev Share
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-200" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.expectedMonthlyRevShare)}</span>
            <span className="text-[11px] text-blue-200">/ month</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Total AAA commission across wholesalers
          </p>
        </div>

        {/* Card 4: Received Monthly Rev Share */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Received ({selectedMonth})
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.receivedMonthlyRevShare)}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-blue-100 font-bold">
              Pending: {formatCurrency(metrics.pendingMonthlyRevShare)}
            </span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Confirmed received &amp; added to Finances GMR
          </p>
        </div>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161c] p-3 rounded-2xl border border-slate-200/80 dark:border-[#222430]"
      >
        <div className="flex items-center gap-2">
          {/* <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              activeViewTab === 'INSTALLED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            {activeViewTab === 'INSTALLED' ? <CheckCircle2 className="w-4 h-4" /> : <Network className="w-4 h-4" />}
            <span>
              {activeViewTab === 'INSTALLED'
                ? `Installed Data Circuits (${displayedCount})`
                : `Pipeline Circuits (${displayedCount})`}
            </span>
          </div> */}
        </div>

        {/* Search & Stage Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search property, wholesaler, carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 w-60"
            />
          </div>

          {activeViewTab === 'PIPELINE' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Pipeline Stages (1-6)</option>
              {CIRCUIT_STAGES.filter((st) => st.key !== 'INSTALLED').map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </motion.div>
    </>
  );
}
