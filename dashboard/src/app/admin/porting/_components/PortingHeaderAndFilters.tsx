'use client';

import React from 'react';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { getStageBadge, Toast } from './portingTypes';

interface PortingHeaderAndFiltersProps {
  toasts: Toast[];
  onResetFilters: () => void;
  handleExportCSV: () => void;
  exportingCSV: boolean;
  onOpenImportModal: () => void;
  onOpenCreateModal: () => void;
  metrics: {
    totalRequests: number;
    inProgressCount: number;
    focReceivedCount: number;
    completedCount: number;
  };
  searchInput: string;
  handleSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
}

export function PortingHeaderAndFilters({
  toasts,
  onResetFilters,
  handleExportCSV,
  exportingCSV,
  onOpenImportModal,
  onOpenCreateModal,
  metrics,
  searchInput,
  handleSearchChange,
  selectedStatus,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
}: PortingHeaderAndFiltersProps) {
  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border text-xs shadow-xl flex items-start gap-2.5 max-w-sm animate-in slide-in-from-top-2 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-bold">{t.title}</p>
              {t.message && <p className="opacity-90 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-900 dark:text-white">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Porting Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <span>Reset Filters</span>
          </button>

          {/* Export CSV Button (All 19 Fields) */}
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {exportingCSV ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button */}
          <button
            onClick={onOpenImportModal}
            className="px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Import CSV</span>
          </button>

          {/* Create Porting Request Button */}
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Porting Request</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS — EXACT ROYAL BLUE AS IN IMAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REQUESTS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL REQUESTS
            </span>
            <ArrowLeftRight className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalRequests}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Ports</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            All porting requests across all orgs
          </p>
        </div>

        {/* Card 2: IN PROGRESS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              IN PROGRESS
            </span>
            <RefreshCw className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.inProgressCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Active</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Carrier processing &amp; submitted orders
          </p>
        </div>

        {/* Card 3: FOC RECEIVED */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              FOC RECEIVED
            </span>
            <ShieldCheck className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.focReceivedCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Confirmed</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Firm Order Confirmation received
          </p>
        </div>

        {/* Card 4: COMPLETED */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              COMPLETED
            </span>
            <CheckCircle2 className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.completedCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Done</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Numbers ported &amp; services activated
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR — EXACT LAYOUT AS IN SCREENSHOT */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, organization, phone number, notes..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Dropdown Filters: Status & Sort */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="DRAFT">Stage 1: Draft initialized</option>
              <option value="CONTRACT_SENT">Stage 2: Contract sent</option>
              <option value="SIGNED">Stage 3: Contract signed</option>
              <option value="CSR_DETAILS">Stage 4: CSR and contract details</option>
              <option value="CUT_SHEET_REVIEW">Stage 5: Cut sheet review</option>
              <option value="PORTING_SUBMITTED">Stage 6: Porting submitted</option>
              <option value="FOC_RECEIVED">Stage 7: FOC Confirm</option>
              <option value="COMPLETED">Stage 8: Onboarding</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="PROPERTY_ASC">Sort: Property Name (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Active Filters:</span>
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Status: {getStageBadge(selectedStatus).label}
                <button
                  onClick={() => onStatusFilterChange('ALL')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchInput.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Search: &ldquo;{searchInput}&rdquo;
                <button
                  onClick={() => handleSearchChange('')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus === 'ALL' && searchInput.trim() === '' && (
              <span className="text-slate-400 text-[11px] italic">None</span>
            )}
          </div>

          {(selectedStatus !== 'ALL' || searchInput.trim() !== '' || sortBy !== 'NEWEST') && (
            <button
              onClick={onResetFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </>
  );
}
