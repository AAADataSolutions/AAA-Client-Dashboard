import React from 'react';
import { Search, X } from 'lucide-react';
import { STAGES_ROAD } from '@/components/client/OnboardingTimelineModal';

interface OnboardingFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  setCurrentPage: (val: number) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function OnboardingFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  setCurrentPage,
  hasActiveFilters,
  onResetFilters,
}: OnboardingFilterBarProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-2.5 w-full">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by property name, address, GM, or stage..."
            className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
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

        {/* Stage Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter onboarding by stage"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          <optgroup label="Stage Groups">
            <option value="IN_PROGRESS">In Progress (Active)</option>
            <option value="WAITING_ON_CLIENT">Waiting Sign-off</option>
          </optgroup>
          <optgroup label="All 8 Pipeline Stages">
            {STAGES_ROAD.map((s) => (
              <option key={s.key} value={s.key}>
                {s.step}. {s.label}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Sort By Filter */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Sort onboarding pipelines"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="NEWEST">Sort: Recently Added</option>
          <option value="PROP_ASC">Sort: Property (A-Z)</option>
          <option value="PROP_DESC">Sort: Property (Z-A)</option>
          <option value="STAGE_DESC">Sort: Stage Progress</option>
          <option value="TARGET_DATE">Sort: Target Date</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onResetFilters}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium whitespace-nowrap"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
