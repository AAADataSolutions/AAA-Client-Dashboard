'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  X,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { OnboardingRecord } from '@/store/slices/onboardingSlice';
import { itemVariants, STAGES_ROAD, Toast } from './onboardingTypes';

interface OnboardingHeaderAndFiltersProps {
  toasts: Toast[];
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>;
  onboardings: OnboardingRecord[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  resetAllFilters: () => void;
  onOpenCreateModal: () => void;
  metrics: {
    totalOnboardings: number;
    completedCount: number;
    inProgressCount: number;
    pendingReviewCount: number;
  };
  searchInput: string;
  handleSearchChange: (val: string) => void;
  selectedStage: string;
  onStageFilterChange: (stage: string) => void;
  sortBy: string;
  onSortByChange: (sortBy: any) => void;
}

export function OnboardingHeaderAndFilters({
  toasts,
  setToasts,
  onboardings,
  showToast,
  resetAllFilters,
  onOpenCreateModal,
  metrics,
  searchInput,
  handleSearchChange,
  selectedStage,
  onStageFilterChange,
  sortBy,
  onSortByChange,
}: OnboardingHeaderAndFiltersProps) {
  return (
    <>
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-3 ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/30 text-white'
                : 'bg-slate-900/95 border-blue-500/30 text-white'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-semibold text-white">{t.title}</p>
              {t.message && <p className="text-slate-300 mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <ArrowLeftRight size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding &amp; Porting</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const headers = ['ID,Property,Organization,Stage,Assignee,Target Date,GM Name,GM Phone,GM Email\n'];
              const rows = onboardings.map((o: OnboardingRecord) =>
                `"${o.id}","${o.property_name}","${o.organization_name}","${o.stage || o.status || ''}","${o.assigned_to_name || 'Unassigned'}","${o.target_date || ''}","${o.general_manager_name || ''}","${o.general_manager_phone || ''}","${o.general_manager_email || ''}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `onboardings-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', 'Onboardings exported as CSV.', 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetAllFilters}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-[#4f46e5] text-white text-xs font-medium rounded-lg flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#4338ca] transition"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Pipeline
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards (4 Key Metrics) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Onboarding</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalOnboardings}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Live / Activated</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">In Flight / Porting</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.inProgressCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Review / SOF</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pendingReviewCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Filters & Real-time Search */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search property, GM, assignee..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => onStageFilterChange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Lifecycle Stages</option>
            {STAGES_ROAD.map((s) => (
              <option key={s.key} value={s.key}>
                Stage {s.step}: {s.label}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PROP_ASC">Sort: Property Name (A-Z)</option>
            <option value="ORG_ASC">Sort: Organization (A-Z)</option>
            <option value="STATUS">Sort: Progress Percentage</option>
          </select>
        </div>
      </motion.div>
    </>
  );
}
