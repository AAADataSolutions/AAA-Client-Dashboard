'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Search,
  X,
  CheckCircle2,
  RefreshCw,
  Plus,
  ShieldCheck,
  Download,
  SlidersHorizontal,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreatePortingModal } from '@/components/client/CreatePortingModal';
import { PortingDetailDrawer } from '@/components/client/PortingDetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';
import { type PortingRecordItem, getStageLabel } from './_components/types';
import { PortingTableAndMenu } from './_components/PortingTableAndMenu';

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

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
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

      <PortingTableAndMenu
        loading={loading}
        portings={portings}
        setSelectedPortingForDrawer={setSelectedPortingForDrawer}
        copiedId={copiedId}
        setCopiedId={setCopiedId}
        toast={toast}
        handleOpenMenu={handleOpenMenu}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        totalRecords={totalRecords}
        totalPages={totalPages}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        handleCopyNumbers={handleCopyNumbers}
        handleOpenProperty={handleOpenProperty}
        handleRaisePortingTicket={handleRaisePortingTicket}
      />

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
