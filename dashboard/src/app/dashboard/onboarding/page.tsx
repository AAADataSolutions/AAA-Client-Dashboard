'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Search,
  X,
  Hotel,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  LifeBuoy,
  RefreshCw,
  Plus,
  ArrowRight,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  Eye,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { OnboardingDetailDrawer } from '@/components/client/OnboardingDetailDrawer';
import { StartOnboardingModal } from '@/components/client/StartOnboardingModal';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

interface OnboardingRecordItem {
  id: string;
  org_property_id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  property_location: string;
  property_phone: string;
  contact_person_name: string;
  services: any[];
  services_count: number;
  status: string;
  stage_label: string;
  step_index: number;
  is_waiting_on_client: boolean;
  target_date: string | null;
  progress_percentage: number;
  milestones: {
    contract_sent_at: string | null;
    signed_at: string | null;
    porting_waiting_at: string | null;
    porting_submitted_at: string | null;
    sof_waiting_at: string | null;
    foc_received_at: string | null;
    completed_at: string | null;
  };
  created_at: string;
  updated_at: string;
}

export default function ClientOnboardingPage() {
  const { orgMembership } = useAuth();
  const orgName = orgMembership?.organization?.name || 'Organization';

  // Data state
  const [onboardings, setOnboardings] = useState<OnboardingRecordItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    inProgress: 0,
    waitingOnClient: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [selectedOnboardingForDrawer, setSelectedOnboardingForDrawer] = useState<OnboardingRecordItem | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showStartOnboardingModal, setShowStartOnboardingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPropId, setTicketPropId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    record: OnboardingRecordItem;
  } | null>(null);

  const fetchOnboardings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/client/onboarding?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load onboarding pipeline');
      }

      setOnboardings(json.data || []);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching onboarding pipeline:', err);
      setError(err.message || 'Error loading onboardings');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchOnboardings();
  }, [fetchOnboardings]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingRecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const isNearBottom = rect.bottom + 230 > window.innerHeight;
    if (isNearBottom) {
      setMenuPosition({ bottom: window.innerHeight - rect.top + 6, left, record });
    } else {
      setMenuPosition({ top: rect.bottom + 4, left, record });
    }
  };

  const handleOpenDrawer = (record: OnboardingRecordItem) => {
    setSelectedOnboardingForDrawer(record);
    setShowDrawer(true);
    setMenuPosition(null);
  };

  const handleOpenTicketModal = (propId: string) => {
    setTicketPropId(propId);
    setShowTicketModal(true);
    setMenuPosition(null);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL';

  // Client-side pagination
  const totalRecords = onboardings.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = onboardings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <GitBranch size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
            Property Onboarding Tracker
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenTicketModal('')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#1e202a] border border-slate-200 dark:border-[#2b2d3b] hover:bg-slate-50 dark:hover:bg-[#252733] text-slate-700 dark:text-slate-200 font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-slate-400" />
            <span>Raise Ticket</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowStartOnboardingModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start New Onboarding</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. KPI Cards (4 Cards) - ALL VARIANT 1 ONLY */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Onboardings */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Total Onboardings
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Properties</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Total onboarding lifecycles recorded
          </p>
        </motion.div>

        {/* Card 2: In Progress */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Active Pipelines</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Properties actively undergoing provisioning
          </p>
        </motion.div>

        {/* Card 3: Waiting on Client */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Waiting on Client
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.waitingOnClient}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Pending Sign-off</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Action or documentation required from tenant
          </p>
        </motion.div>

        {/* Card 4: Completed */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Completed
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.completed}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Live Properties</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Successfully cutover and operational
          </p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
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
              placeholder="Search by property name, location, or stage..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition"
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

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter onboarding processes by stage status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Stages</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_ON_CLIENT">Waiting on Client</option>
            <option value="CONTRACT_SENT">Contract Sent</option>
            <option value="SIGNED">Signed</option>
            <option value="PORTING_SUBMITTED">Porting Submitted</option>
            <option value="SOF_WAITING">SOF Waiting</option>
            <option value="FOC_RECEIVED">FOC Received</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium self-end sm:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Main Onboarding Table */}
      {loading ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 space-y-4 shadow-xs animate-pulse">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchOnboardings}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No onboarding records found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No onboarding processes match your current search and stage filters.'
              : 'There are no active or completed property onboardings currently listed.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Property
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Location
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Current Stage
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Progress
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Target Date
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Last Updated
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {paginatedRecords.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpenDrawer(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Property */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.property_name}
                          </span>
                          {item.services_count > 0 && (
                            <span className="block text-[10.5px] text-slate-400">
                              {item.services_count} {item.services_count === 1 ? 'line' : 'lines'} configured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Location */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {item.property_location || item.property_address}
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Current Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                        <GitBranch className="w-3 h-3" />
                        <span>Stage {item.step_index}: {item.stage_label}</span>
                      </span>
                    </td>

                    {/* Column 4: Progress */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="w-32 space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {Math.round(item.progress_percentage)}%
                          </span>
                          <span className="text-slate-400">
                            {item.step_index}/8
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : item.is_waiting_on_client
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${item.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Column 5: Target Date */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.target_date ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">
                            {new Date(item.target_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">TBD</span>
                      )}
                    </td>

                    {/* Column 6: Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : item.is_waiting_on_client ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Waiting on Client</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                          <Clock className="w-3 h-3" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>

                    {/* Column 7: Last Updated */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Column 8: Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                          aria-label="More onboarding actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {totalRecords > pageSize && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] px-4 py-3 rounded-xl shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, totalRecords)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> onboardings
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Fixed 3-Dots Overlay Action Menu */}
      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="z-50 w-56 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#252733]">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                Onboarding Actions
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.record.property_name}
              </span>
            </div>

            <button
              onClick={() => handleOpenDrawer(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Onboarding Timeline</span>
            </button>

            {menuPosition.record.is_waiting_on_client && (
              <button
                onClick={() => handleOpenDrawer(menuPosition.record)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-amber-500" />
                <span>Submit Client Documentation</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleOpenTicketModal(menuPosition.record.property_id)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              <span>Raise Onboarding Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* 7. Onboarding Detail Slide-Over Drawer */}
      {showDrawer && selectedOnboardingForDrawer && (
        <OnboardingDetailDrawer
          onboarding={selectedOnboardingForDrawer}
          onClose={() => {
            setShowDrawer(false);
            setSelectedOnboardingForDrawer(null);
          }}
          onCreateTicket={(propId) => {
            setShowDrawer(false);
            handleOpenTicketModal(propId);
          }}
          onRefresh={() => fetchOnboardings()}
        />
      )}

      {/* 8. Support Ticket Modal */}
      {showTicketModal && (
        <CreateTicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setTicketPropId(null);
          }}
          preselectedPropertyId={ticketPropId || undefined}
          onSuccess={() => {
            fetchOnboardings();
          }}
        />
      )}

      {/* 9. Start New Onboarding Modal (Existing or New Property) */}
      {showStartOnboardingModal && (
        <StartOnboardingModal
          isOpen={showStartOnboardingModal}
          onClose={() => setShowStartOnboardingModal(false)}
          onSuccess={(newOnb) => {
            fetchOnboardings();
            if (newOnb) {
              setSelectedOnboardingForDrawer(newOnb);
              setShowDrawer(true);
            }
          }}
        />
      )}
    </motion.div>
  );
}
