'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, AlertCircle, Clock, CheckCircle2, Search, X } from 'lucide-react';
import { itemVariants } from './types';

interface TicketsKpisAndFiltersProps {
  metrics: {
    totalOpen?: number;
    openCount?: number;
    totalUrgent?: number;
    urgentCount?: number;
    totalWaiting?: number;
    waitingCount?: number;
    totalResolved?: number;
    resolvedCount?: number;
  };
  filters: {
    searchQuery: string;
    selectedPriority: string;
    selectedStatus: string;
    sortBy: string;
  };
  searchInput: string;
  onSearchChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onSortByChange: (val: string) => void;
  onResetFilters: () => void;
}

export default function TicketsKpisAndFilters({
  metrics,
  filters,
  searchInput,
  onSearchChange,
  onPriorityChange,
  onStatusChange,
  onSortByChange,
  onResetFilters,
}: TicketsKpisAndFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.selectedPriority !== 'ALL' ||
    filters.selectedStatus !== 'ALL' ||
    filters.sortBy !== 'NEWEST';

  return (
    <>
      {/* 2. Top Metric KPI Cards - Blue Variant 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Open */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => onStatusChange('OPEN')}
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
              {metrics.totalOpen || metrics.openCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Awaiting engineering response</p>
        </motion.div>

        {/* Card 2: Urgent Priority */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => onPriorityChange('URGENT')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Urgent Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalUrgent || metrics.urgentCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Critical</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">High SLA impact items</p>
        </motion.div>

        {/* Card 3: Waiting on Client */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => onStatusChange('WAITING_ON_CLIENT')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Waiting On Client
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalWaiting || metrics.waitingCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Pending</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Replied &amp; awaiting customer</p>
        </motion.div>

        {/* Card 4: Resolved & Closed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
          onClick={() => onStatusChange('RESOLVED')}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Resolved / Closed
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalResolved || metrics.resolvedCount || 0}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Done</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Successfully closed requests</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Omni Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ticket ID, subject, customer organization, property..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
            {searchInput && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filters.selectedPriority}
              onChange={(e) => onPriorityChange(e.target.value)}
              aria-label="Filter by priority"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🔵 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>

            <select
              value={filters.selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_ON_CLIENT">Waiting On Client</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              aria-label="Sort tickets"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PRIORITY">Sort: Priority</option>
              <option value="SUBJ_ASC">Sort: Subject (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                "{filters.searchQuery}"
                <button onClick={() => onSearchChange('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedPriority !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Priority: {filters.selectedPriority}
                <button onClick={() => onPriorityChange('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Status: {filters.selectedStatus}
                <button onClick={() => onStatusChange('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={onResetFilters}
              className="text-slate-500 hover:text-blue-600 text-xs font-medium underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </>
  );
}
