'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  Plus,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Upload,
  Download,
} from 'lucide-react';
import { type OrgRecord } from '@/store/slices/organizationsSlice';
import { itemVariants } from './types';

interface OrganizationsHeaderAndKpisProps {
  toastMsg: { text: string; type: 'success' | 'error' } | null;
  syncingPbx: boolean;
  handleSyncPbxPortal: () => void;
  exporting: boolean;
  handleExportCSV: () => void;
  setShowImportModal: (v: boolean) => void;
  setShowCreateModal: (v: boolean) => void;
  metrics: {
    totalOrganizations: number;
    activeOrganizations: number;
    totalProperties: number;
    totalGroups?: number;
    totalIndividuals?: number;
  };
  organizations: OrgRecord[];
  searchQuery: string;
  selectedTypeFilter: string;
  selectedStatus: string;
  selectedPropFilter: string;
  sortBy: string;
  setSortBy: (v: string) => void;
  hasActiveFilters: boolean;
  onUpdateFilters: (filters: Record<string, any>) => void;
}

export function OrganizationsHeaderAndKpis({
  toastMsg,
  syncingPbx,
  handleSyncPbxPortal,
  exporting,
  handleExportCSV,
  setShowImportModal,
  setShowCreateModal,
  metrics,
  organizations,
  searchQuery,
  selectedTypeFilter,
  selectedStatus,
  selectedPropFilter,
  sortBy,
  setSortBy,
  hasActiveFilters,
  onUpdateFilters,
}: OrganizationsHeaderAndKpisProps) {
  return (
    <>
      {/* Toast alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl text-black dark:text-white flex items-center justify-center">
            <Building2 size={256} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Management Groups
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncPbxPortal}
            disabled={syncingPbx}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Synchronize Management Groups with Call Forwarding Portal (management_group.php)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingPbx ? 'animate-spin' : ''}`} />
            <span>{syncingPbx ? 'Syncing PBX...' : 'Sync PBX Portal'}</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1a1b24] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#282a36] font-semibold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1a1b24] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Management Group</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Top KPI Cards Row (3 Standardized Cards: Total MG, Active MG, Total Properties) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
      >
        {/* Card 1: Total Clients */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Total Clients
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalOrganizations}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Clients</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">
            {(metrics as any).totalGroups ?? organizations.filter((o) => (o.type || 'GROUP') === 'GROUP').length} groups and {(metrics as any).totalIndividuals ?? organizations.filter((o) => o.type === 'INDIVIDUAL').length} individuals
          </p>
        </motion.div>

        {/* Card 2: Active Management Groups */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Active Management Groups
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.activeOrganizations}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Live Portfolios</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Operational active accounts</p>
        </motion.div>

        {/* Card 3: Total Properties */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Total Properties
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {metrics.totalProperties}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Locations</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Assigned across all clients</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
          {/* Search Input (Instant char-by-char) */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onUpdateFilters({ searchQuery: e.target.value, currentPage: 1 })}
              placeholder="Search by management group, address, contact, email, or phone..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onUpdateFilters({ searchQuery: '', currentPage: 1 })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => onUpdateFilters({ selectedTypeFilter: e.target.value, currentPage: 1 })}
            aria-label="Filter by management group type"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="GROUP">Group</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => onUpdateFilters({ selectedStatus: e.target.value, currentPage: 1 })}
            aria-label="Filter by management group status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_ONBOARDING">Pending Onboarding</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Properties Assignment Filter */}
          <select
            value={selectedPropFilter}
            onChange={(e) => onUpdateFilters({ selectedPropFilter: e.target.value, currentPage: 1 })}
            aria-label="Filter by assigned properties"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">All Property Statuses</option>
            <option value="HAS_PROPERTIES">Has Assigned Properties</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort management groups"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="NEWEST">Sort: Newest First</option>
            <option value="PROPERTIES_DESC">Most Properties First</option>
            <option value="PROPERTIES_ASC">Least Properties First</option>
            <option value="NAME_ASC">Name (A-Z)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              onUpdateFilters({
                searchQuery: '',
                selectedStatus: 'ALL',
                selectedTypeFilter: 'ALL',
                selectedPropFilter: 'ALL',
                currentPage: 1,
              });
              setSortBy('NEWEST');
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium self-end lg:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>
    </>
  );
}
