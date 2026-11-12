import React from 'react';
import { Search, X, List, LayoutGrid } from 'lucide-react';

interface PropertiesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onboardingFilter: string;
  setOnboardingFilter: (val: string) => void;
  rayBaumFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  setRayBaumFilter: (val: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  setCurrentPage: (val: number) => void;
  viewMode: 'LIST' | 'GRID';
  setViewMode: (val: 'LIST' | 'GRID') => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

export function PropertiesFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  onboardingFilter,
  setOnboardingFilter,
  rayBaumFilter,
  setRayBaumFilter,
  sortBy,
  setSortBy,
  setCurrentPage,
  viewMode,
  setViewMode,
  hasActiveFilters,
  onResetFilters,
}: PropertiesFilterBarProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
      <div className="flex flex-1 items-center gap-2.5 w-full">
        {/* Omni Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by property, city, state, GM name, phone, or email..."
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

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter properties by operational status"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Onboarding Stage Filter */}
        <select
          value={onboardingFilter}
          onChange={(e) => {
            setOnboardingFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter properties by onboarding pipeline status"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          <option value="ONBOARDING">In Onboarding</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Ray Baum and Kary's Law Filter */}
        <select
          value={rayBaumFilter}
          onChange={(e) => {
            setRayBaumFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          aria-label="Filter properties by Ray Baum and Kary's Law"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">Ray Baum: All</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        {/* Sort By Filter */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="Sort properties"
          className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="NEWEST">Sort: Recently Added</option>
          <option value="NAME_ASC">Sort: Name (A-Z)</option>
          <option value="NAME_DESC">Sort: Name (Z-A)</option>
          <option value="SERVICES_DESC">Sort: Most Voice Lines</option>
          <option value="TICKETS_DESC">Sort: Open Tickets</option>
        </select>
      </div>

      {/* View Toggle & Reset */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium whitespace-nowrap"
          >
            Reset Filters
          </button>
        )}

        <div className="flex items-center bg-slate-100 dark:bg-[#181920] p-0.5 rounded-lg border border-slate-200/80 dark:border-[#222430]">
          <button
            onClick={() => setViewMode('LIST')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-white dark:bg-[#252733] text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Table View"
            aria-label="Switch to Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('GRID')}
            className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
              viewMode === 'GRID'
                ? 'bg-white dark:bg-[#252733] text-blue-600 dark:text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Grid View"
            aria-label="Switch to Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
