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
  RefreshCw,
  Plus,
  MapPin,
  Calendar,
  Layers,
  AlertTriangle,
  Eye,
  Edit2,
  Copy,
  Check,
  Building2,
  User,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { StartOnboardingModal } from '@/components/client/StartOnboardingModal';
import { EditGMModal } from '@/components/client/EditGMModal';
import { OnboardingTimelineModal, getStageBadge, STAGES_ROAD } from '@/components/client/OnboardingTimelineModal';
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
  organization_name?: string;
  property_address: string;
  property_location: string;
  property_phone: string;
  contact_person_name: string;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  services: any[];
  services_count: number;
  status: string;
  stage?: string;
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
  const toast = useToast();

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
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [selectedOnboardingForTimeline, setSelectedOnboardingForTimeline] = useState<OnboardingRecordItem | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [editingGMOnboarding, setEditingGMOnboarding] = useState<OnboardingRecordItem | null>(null);
  const [showEditGMModal, setShowEditGMModal] = useState(false);
  const [showStartOnboardingModal, setShowStartOnboardingModal] = useState(false);

  // 3-Dots Fixed Action Menu
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    record: OnboardingRecordItem;
  } | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOnboardings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        status: statusFilter,
        sortBy: sortBy,
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
  }, [searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchOnboardings();
  }, [fetchOnboardings]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingRecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const isNearBottom = rect.bottom + 180 > window.innerHeight;
    if (isNearBottom) {
      setMenuPosition({ bottom: window.innerHeight - rect.top + 6, left, record });
    } else {
      setMenuPosition({ top: rect.bottom + 4, left, record });
    }
  };

  const handleOpenTimeline = (record: OnboardingRecordItem) => {
    setSelectedOnboardingForTimeline(record);
    setShowTimelineModal(true);
    setMenuPosition(null);
  };

  const handleOpenEditGM = (record: OnboardingRecordItem) => {
    setEditingGMOnboarding(record);
    setShowEditGMModal(true);
    setMenuPosition(null);
  };

  const handleCopyText = (text: string, id: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || sortBy !== 'NEWEST';
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
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Property Onboarding Tracker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cutover milestones &amp; lifecycle progress for <strong className="text-slate-700 dark:text-slate-200">{orgName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchOnboardings}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] transition cursor-pointer"
            title="Refresh onboardings"
            aria-label="Refresh onboardings list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Metric KPI Cards - Blue Variant 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pipelines */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Total Pipelines
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.total || onboardings.length}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Properties</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Tracked onboarding properties</p>
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
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Active carrier cutover steps</p>
        </motion.div>

        {/* Card 3: Waiting Sign-Off */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Waiting Sign-Off
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.waitingOnClient}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Review</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Contract / SOF Review needed</p>
        </motion.div>

        {/* Card 4: Live Cutover */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Live Cutover
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.completed}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Complete</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Fully operational properties</p>
        </motion.div>
      </motion.div>

      {/* 3. Search & Filter Bar */}
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
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setSortBy('NEWEST');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium whitespace-nowrap"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Table UI — Strictly Required Columns */}
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
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center mx-auto mb-3">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No onboarding pipelines found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No records match your active search filters.'
              : 'There are no property locations currently in onboarding for your organization.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    PROPERTY NAME
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    ADDRESS
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    ORGANIZATION
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    STAGE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    TARGET CUTOVER DATE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    GM NAME
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    GM PHONE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    GM EMAIL
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {paginatedRecords.map((item) => {
                  const stageBadge = getStageBadge(item.stage || item.status);
                  const gmName = item.general_manager_name || item.contact_person_name || '—';
                  const gmPhone = item.general_manager_phone || item.property_phone || null;
                  const gmEmail = item.general_manager_email || null;
                  const organization = item.organization_name || orgName;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenTimeline(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                    >
                      {/* Column 1: PROPERTY NAME */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                            <Hotel className="w-4 h-4" />
                          </div>
                          <span>{item.property_name}</span>
                        </div>
                      </td>

                      {/* Column 2: ADDRESS */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span className="truncate max-w-[200px] block" title={item.property_address || item.property_location}>
                          {item.property_address || item.property_location || 'Address pending'}
                        </span>
                      </td>

                      {/* Column 3: ORGANIZATION */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{organization}</span>
                        </div>
                      </td>

                      {/* Column 4: STAGE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${stageBadge.bg} ${stageBadge.text} border ${stageBadge.border}`}>
                          <GitBranch className="w-3 h-3" />
                          <span>{stageBadge.label}</span>
                        </span>
                      </td>

                      {/* Column 5: TARGET CUTOVER DATE */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {item.target_date
                              ? new Date(item.target_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Pending Schedule'}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: GM NAME */}
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[130px]" title={gmName}>
                            {gmName}
                          </span>
                        </div>
                      </td>

                      {/* Column 7: GM PHONE */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {gmPhone && gmPhone !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{gmPhone}</span>
                            <button
                              onClick={(e) => handleCopyText(gmPhone, `${item.id}-phone`, 'GM phone', e)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              title="Copy phone"
                            >
                              {copiedId === `${item.id}-phone` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 8: GM EMAIL */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {gmEmail && gmEmail !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={gmEmail}>
                              {gmEmail}
                            </span>
                            <button
                              onClick={(e) => handleCopyText(gmEmail, `${item.id}-email`, 'GM email', e)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              title="Copy email"
                            >
                              {copiedId === `${item.id}-email` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 9: ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenTimeline(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer border border-blue-200 dark:border-blue-900/40"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                            <span>View Timeline</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditGM(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-slate-200 dark:hover:bg-[#282a3a] text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                            title="Edit GM Details"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Edit GM</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> pipelines
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

      {/* 6. Onboarding Timeline Modal (Admin UI Roadmap) */}
      {showTimelineModal && selectedOnboardingForTimeline && (
        <OnboardingTimelineModal
          isOpen={showTimelineModal}
          onClose={() => {
            setShowTimelineModal(false);
            setSelectedOnboardingForTimeline(null);
          }}
          record={{
            property_name: selectedOnboardingForTimeline.property_name,
            organization_name: selectedOnboardingForTimeline.organization_name || orgName,
            property_address: selectedOnboardingForTimeline.property_address || selectedOnboardingForTimeline.property_location,
            status: selectedOnboardingForTimeline.stage || selectedOnboardingForTimeline.status,
            stage: selectedOnboardingForTimeline.stage || selectedOnboardingForTimeline.status,
            target_date: selectedOnboardingForTimeline.target_date,
            general_manager_name: selectedOnboardingForTimeline.general_manager_name,
            general_manager_phone: selectedOnboardingForTimeline.general_manager_phone,
            general_manager_email: selectedOnboardingForTimeline.general_manager_email,
          }}
        />
      )}

      {/* 7. Edit GM Details Modal */}
      {showEditGMModal && editingGMOnboarding && (
        <EditGMModal
          isOpen={showEditGMModal}
          onClose={() => {
            setShowEditGMModal(false);
            setEditingGMOnboarding(null);
          }}
          property={{
            id: editingGMOnboarding.property_id,
            property_name: editingGMOnboarding.property_name,
            general_manager_name: editingGMOnboarding.general_manager_name,
            general_manager_phone: editingGMOnboarding.general_manager_phone,
            general_manager_email: editingGMOnboarding.general_manager_email,
            contact_person_name: editingGMOnboarding.contact_person_name,
          }}
          onSuccess={() => {
            fetchOnboardings();
          }}
        />
      )}
    </motion.div>
  );
}
