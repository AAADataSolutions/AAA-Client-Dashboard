'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
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
  Phone,
  Copy,
  Calendar,
  Eye,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  GitBranch,
  FileText,
  ShieldCheck,
  Download,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreatePortingModal } from '@/components/client/CreatePortingModal';
import { PortingDetailDrawer } from '@/components/client/PortingDetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

interface PortingRecordItem {
  id: string;
  org_property_id: string;
  property_id: string | null;
  property_name: string;
  property_address: string;
  property_location: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  property_phone: string;
  fax?: string;
  monthly_price?: number | string | null;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  e911_status?: string | null;
  ray_baud_and_logs_enabled?: boolean;
  ray_baum_status?: string | null;
  carrier_details?: string;
  attachments?: any[];
  status: string;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  services_count: number;
  services: any[];
  created_at: string;
  updated_at: string;
  organization_name?: string;
}

export default function ClientPortingPage() {
  const { effectiveRole, orgMembership } = useAuth();
  const toast = useToast();
  const orgName = orgMembership?.organization?.name || 'Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

  // Data state
  const [portings, setPortings] = useState<PortingRecordItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    inProgress: 0,
    focReceived: 0,
    completed: 0,
    actionRequired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Modals & Drawers
  const [selectedPortingForDrawer, setSelectedPortingForDrawer] = useState<PortingRecordItem | null>(null);
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<any | null>(null);
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [showPortingModal, setShowPortingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPropId, setTicketPropId] = useState<string | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu with upside detection
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    record: PortingRecordItem;
  } | null>(null);

  const fetchPortings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery.trim(),
        status: statusFilter,
        sortBy: sortBy,
      });

      const res = await fetch(`/api/client/porting?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load porting orders');
      }

      setPortings(json.data || []);
      setTotalRecords(json.total || 0);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching porting data:', err);
      setError(err.message || 'Error loading porting orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchPortings();
  }, [fetchPortings]);

  // Open 3-Dots Menu strictly ABOVE the line (Rule 8)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: PortingRecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    setMenuPosition({
      bottom: window.innerHeight - rect.top + 6,
      left,
      record,
    });
  };

  const handleCopyNumbers = (record: PortingRecordItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nums = record.property_phone || (record.services || []).map((s) => s.phone_number).join(', ');
    if (nums) {
      navigator.clipboard.writeText(nums);
      setCopiedId(record.id);
      toast.success(`Copied phone number to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.info('No phone number attached to this porting.');
    }
  };

  const handleOpenProperty = async (propId: string) => {
    try {
      const res = await fetch(`/api/client/properties?limit=100`);
      const json = await res.json();
      if (json.success && json.data) {
        const found = json.data.find((p: any) => p.id === propId || p.org_property_id === propId);
        if (found) {
          setSelectedPropForDrawer(found);
          setShowPropertyDrawer(true);
        }
      }
    } catch (err) {
      console.error('Failed to open property drawer:', err);
    }
    setMenuPosition(null);
  };

  const handleRaisePortingTicket = (record: PortingRecordItem) => {
    setTicketPropId(record.property_id);
    setShowTicketModal(true);
    setMenuPosition(null);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || sortBy !== 'NEWEST';
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  const getStageLabel = (stageKey: string) => {
    switch (stageKey) {
      case 'DRAFT':
        return 'Stage 1: Draft Initialized';
      case 'CONTRACT_SENT':
        return 'Stage 2: Contract Sent';
      case 'SIGNED':
        return 'Stage 3: Contract Signed';
      case 'CUT_SHEET_REVIEW':
      case 'SOF_WAITING':
      case 'CUT_SHEET':
        return 'Stage 4: Cut Sheet Review';
      case 'PORTING_SUBMITTED':
      case 'SUBMITTED':
      case 'IN_PROGRESS':
        return 'Stage 5: Porting Submitted';
      case 'FOC_RECEIVED':
        return 'Stage 6: FOC Confirmed';
      case 'COMPLETED':
        return 'Stage 7: Onboarded';
      default:
        return 'Submitted';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100"
    >
      {/* 1. Header with Title & Action Buttons */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-900 dark:text-white">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Porting Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export CSV Button */}
          <button
            onClick={() => {
              if (portings.length === 0) {
                toast.info('No porting records to export.');
                return;
              }
              const headers = ['Property Name', 'Location', 'Organization', 'Stage', 'Phone', 'Fax', 'Target Date'];
              const rows = portings.map((p) => [
                `"${p.property_name || ''}"`,
                `"${p.property_location || p.property_address || ''}"`,
                `"${p.organization_name || orgName || '—'}"`,
                `"${getStageLabel(p.status)}"`,
                `"${p.property_phone || '—'}"`,
                `"${p.fax || '—'}"`,
                `"${p.target_date || '—'}"`,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `porting_management_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Porting records downloaded as CSV.');
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Reset Filters Button */}
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setSortBy('NEWEST');
              setCurrentPage(1);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>

          {/* Create Porting Request Button */}
          {isClientAdmin && (
            <button
              onClick={() => setShowPortingModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Porting Request</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* 2. KPI Cards (4 Cards) - EXACT ROYAL BLUE AS IN IMAGE */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {metrics.total}
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
              {metrics.inProgress}
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
              {metrics.focReceived}
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
              {metrics.completed}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Done</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Numbers ported &amp; services activated
          </p>
        </div>
      </motion.div>

      {/* 3. Search & Filters Bar — EXACT SCREENSHOT LAYOUT */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by property, organization, phone number, notes..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Dropdown Filters: Status & Sort */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="DRAFT">Stage 1: Draft Initialized</option>
              <option value="CONTRACT_SENT">Stage 2: Contract Sent</option>
              <option value="SIGNED">Stage 3: Contract Signed</option>
              <option value="CUT_SHEET_REVIEW">Stage 4: Cut Sheet Review</option>
              <option value="PORTING_SUBMITTED">Stage 5: Porting Submitted</option>
              <option value="FOC_RECEIVED">Stage 6: FOC Confirmed</option>
              <option value="COMPLETED">Stage 7: Onboarded</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="PROPERTY_ASC">Sort: Property Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Active Filters:</span>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Status: {getStageLabel(statusFilter)}
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter === 'ALL' && searchQuery.trim() === '' && (
              <span className="text-slate-400 text-[11px] italic">None</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSortBy('NEWEST');
                setCurrentPage(1);
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* 4. Porting Table — 11 REQUESTED COLUMNS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY</th>
                <th className="py-3 px-4 whitespace-nowrap">MONTHLY PRICE</th>
                <th className="py-3 px-4 whitespace-nowrap">MAIN PHONE NO.</th>
                <th className="py-3 px-4 whitespace-nowrap">NO. OF SERVICES</th>
                <th className="py-3 px-4 whitespace-nowrap">E911 STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">RAY BAUM AND KARY&apos;S LAW</th>
                <th className="py-3 px-4 whitespace-nowrap">GM NAME</th>
                <th className="py-3 px-4 whitespace-nowrap">GM EMAIL</th>
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY STATUS</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/60">
              {loading && portings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading porting records...
                  </td>
                </tr>
              ) : portings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No porting records found matching your filter.
                  </td>
                </tr>
              ) : (
                portings.map((item) => {
                  const normalizedStage = (
                    item.status === 'SOF_WAITING' ? 'CUT_SHEET_REVIEW' :
                    item.status === 'SUBMITTED' ? 'PORTING_SUBMITTED' :
                    item.status === 'IN_PROGRESS' ? 'PORTING_SUBMITTED' :
                    (item as any).stage || item.status || 'DRAFT'
                  );
                  let badge = {
                    label: 'Stage 1: Draft Initialized',
                    bg: 'bg-slate-100 dark:bg-[#1a1c24]',
                    text: 'text-slate-800 dark:text-slate-200',
                    border: 'border-slate-200 dark:border-[#2a2c3a]',
                  };
                  switch (normalizedStage) {
                    case 'DRAFT':
                      badge = { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]' };
                      break;
                    case 'CONTRACT_SENT':
                      badge = { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50' };
                      break;
                    case 'SIGNED':
                      badge = { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50' };
                      break;
                    case 'CUT_SHEET_REVIEW':
                    case 'SOF_WAITING':
                    case 'CUT_SHEET':
                      badge = { label: 'Cut Sheet Review', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50' };
                      break;
                    case 'PORTING_SUBMITTED':
                    case 'SUBMITTED':
                    case 'IN_PROGRESS':
                      badge = { label: 'Porting Submitted', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50' };
                      break;
                    case 'FOC_RECEIVED':
                      badge = { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50' };
                      break;
                    case 'COMPLETED':
                      badge = { label: 'Onboarded', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50' };
                      break;
                  }

                  const locationStr = item.city
                    ? `${item.city}${item.state ? `, ${item.state}` : ''}`
                    : (item.property_location || item.property_address || '—');
                  const servicesCount = item.services_count !== undefined ? item.services_count : (item.services?.length || 0);

                  const isE911Verified = item.e911_status === 'VERIFIED' || item.ray_baud_and_logs_enabled || item.status === 'COMPLETED';
                  const isE911Correction = item.e911_status === 'CORRECTION_REQUIRED';
                  const isRayBaumCompliant =
                    item.ray_baud_and_logs_enabled === true ||
                    item.ray_baum_status === 'ACTIVE' ||
                    item.ray_baum_status === 'Active' ||
                    item.ray_baum_status === 'VERIFIED' ||
                    (item as any).is_ray_baum_active === true;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedPortingForDrawer(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#191b24] transition cursor-pointer"
                    >
                      {/* 1. Property Name with Address / Location underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.property_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {locationStr}
                        </div>
                      </td>

                      {/* 2. Monthly Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {item.monthly_price !== null && item.monthly_price !== undefined && item.monthly_price !== '' ? (
                          <span>${Number(item.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 3. Main Phone No. */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-mono" onClick={(e) => e.stopPropagation()}>
                        {item.property_phone && item.property_phone !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{item.property_phone}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.property_phone);
                                setCopiedId(`phone_${item.id}`);
                                toast.success('Phone copied');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedId === `phone_${item.id}` ? (
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

                      {/* 4. No. of Services */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {servicesCount} {servicesCount === 1 ? 'Service' : 'Services'}
                        </span>
                      </td>

                      {/* 5. E911 Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isE911Verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified
                          </span>
                        ) : isE911Correction ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Correction Req
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 6. Ray Baum and Kari's Law */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRayBaumCompliant ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.property_id) {
                                window.open(`/dashboard/ray-baum/${item.property_id}`, '_blank');
                              } else {
                                setSelectedPortingForDrawer(item);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                            title="Click to view Ray Baum and Kary's Law dispatch records in a new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>View Ray Baum&apos;s No.</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* 8. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                        {item.general_manager_name && item.general_manager_name !== 'N/A' && item.general_manager_name !== '—' ? (
                          item.general_manager_name
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 9. GM Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                        {item.general_manager_email && item.general_manager_email !== 'N/A' && item.general_manager_email !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{item.general_manager_email}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.general_manager_email || '');
                                setCopiedId(`gm_email_${item.id}`);
                                toast.success('GM Email copied');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedId === `gm_email_${item.id}` ? (
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

                      {/* 10. Property Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedPortingForDrawer(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200/60 dark:border-blue-800/60 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalRecords)} of{' '}
            {totalRecords} requests
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentPage === num
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed 3-Dots Overlay Action Menu */}
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
                Porting Order
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.record.property_name}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedPortingForDrawer(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Porting Timeline</span>
            </button>

            <button
              onClick={() => {
                const rec = menuPosition.record;
                setMenuPosition(null);
                handleCopyNumbers(rec);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span>Copy Attached Numbers</span>
            </button>

            {menuPosition.record.property_id && (
              <button
                onClick={() => handleOpenProperty(menuPosition.record.property_id!)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
              >
                <Hotel className="w-3.5 h-3.5 text-blue-500" />
                <span>View Property 360°</span>
              </button>
            )}

            {menuPosition.record.property_id && (
              menuPosition.record.ray_baud_and_logs_enabled === true ||
              menuPosition.record.ray_baum_status === 'ACTIVE' ||
              menuPosition.record.ray_baum_status === 'Active' ||
              menuPosition.record.ray_baum_status === 'VERIFIED' ||
              (menuPosition.record as any).is_ray_baum_active === true
            ) && (
              <button
                onClick={() => {
                  const propId = menuPosition.record.property_id;
                  setMenuPosition(null);
                  window.open(`/dashboard/ray-baum/${propId}`, '_blank');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Ray Baum&apos;s No.</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleRaisePortingTicket(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              <span>Raise Porting Support Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* Porting Detail Slide-Over Drawer */}
      {selectedPortingForDrawer && (
        <PortingDetailDrawer
          porting={selectedPortingForDrawer}
          onClose={() => setSelectedPortingForDrawer(null)}
          onOpenProperty={(propId) => handleOpenProperty(propId)}
          onCreateTicket={(propId) => {
            setTicketPropId(propId);
            setShowTicketModal(true);
          }}
        />
      )}

      {/* Property 360 Inspection Drawer */}
      {showPropertyDrawer && selectedPropForDrawer && (
        <PropertyDetailDrawer
          property={selectedPropForDrawer}
          onClose={() => {
            setShowPropertyDrawer(false);
            setSelectedPropForDrawer(null);
          }}
          onCreateTicket={(propId) => {
            setShowPropertyDrawer(false);
            setTicketPropId(propId);
            setShowTicketModal(true);
          }}
        />
      )}

      {/* Create Porting Modal */}
      <CreatePortingModal
        isOpen={showPortingModal}
        onClose={() => setShowPortingModal(false)}
        onSuccess={fetchPortings}
      />

      {/* Support Ticket Modal */}
      {showTicketModal && (
        <CreateTicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setTicketPropId(null);
          }}
          preselectedPropertyId={ticketPropId || undefined}
          onSuccess={fetchPortings}
        />
      )}
    </motion.div>
  );
}
