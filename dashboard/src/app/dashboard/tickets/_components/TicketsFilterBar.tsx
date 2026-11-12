import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter } from 'lucide-react';
import { itemVariants, STATUS_TABS, TicketRecordItem } from './types';

interface TicketsFilterBarProps {
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  metrics: {
    total: number;
    open: number;
  };
  tickets: TicketRecordItem[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function TicketsFilterBar({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  metrics,
  tickets,
  hasActiveFilters,
  onResetFilters,
}: TicketsFilterBarProps) {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      {/* Status Tab Filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          const count = tab.value === 'ALL' ? metrics.total
            : tab.value === 'OPEN' ? metrics.open
            : tab.value === 'IN_PROGRESS' ? tickets.filter(t => t.status === 'IN_PROGRESS').length
            : tab.value === 'RESOLVED' ? tickets.filter(t => t.status === 'RESOLVED').length
            : tab.value === 'CLOSED' ? tickets.filter(t => t.status === 'CLOSED').length
            : 0;

          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#15161c] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#1a1c24]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-[#222430]'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search + Priority Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ticket ID, subject or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter tickets by priority"
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer text-xs font-medium"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort support tickets"
            className="text-xs px-3 py-2 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="NEWEST">Sort: Recently Added</option>
            <option value="PRIORITY">Sort: Priority</option>
            <option value="SUBJ_ASC">Sort: Subject (A-Z)</option>
            <option value="PROP_ASC">Sort: Property (A-Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
