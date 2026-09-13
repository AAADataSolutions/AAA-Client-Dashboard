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
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreatePortingModal } from '@/components/client/CreatePortingModal';
import { PortingDetailDrawer } from '@/components/client/PortingDetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';

interface PortingRecordItem {
  id: string;
  org_property_id: string;
  property_id: string | null;
  property_name: string;
  property_address: string;
  property_location: string;
  property_phone: string;
  status: string;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  services_count: number;
  services: any[];
  created_at: string;
  updated_at: string;
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
  const [propertyFilterOptions, setPropertyFilterOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
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

  // 3-Dots Fixed Action Menu
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
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
        property_id: propertyFilter,
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
      if (json.filters?.properties) {
        setPropertyFilterOptions(json.filters.properties);
      }
    } catch (err: any) {
      console.error('Error fetching porting data:', err);
      setError(err.message || 'Error loading porting orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, propertyFilter]);

  useEffect(() => {
    fetchPortings();
  }, [fetchPortings]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: PortingRecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record });
  };

  const handleCopyNumbers = (record: PortingRecordItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nums = record.services.map((s) => s.phone_number).join(', ');
    if (nums) {
      navigator.clipboard.writeText(nums);
      setCopiedId(record.id);
      toast.success(`Copied ${record.services.length} number(s) to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.info('No phone numbers attached to this porting batch.');
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

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || propertyFilter !== 'ALL';
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Number Porting Tracker
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Carrier phone number migrations, LOA submissions, and scheduled FOC cutover dates for {orgName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isClientAdmin && (
            <button
              onClick={() => setShowPortingModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start Porting Request</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Cards (5 Cards as specified in Task.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Porting Requests */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Porting Requests
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Orders</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">All carrier migration orders</p>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${metrics.inProgress > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {metrics.inProgress}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Under Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Carrier validation in flight</p>
        </div>

        {/* Card 3: FOC Received */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              FOC Received
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${metrics.focReceived > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
              {metrics.focReceived}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Cutover Date</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Firm cutover date confirmed</p>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.completed}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Ported Live</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Successfully cut over &amp; active</p>
        </div>

        {/* Card 5: Action Required */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Action Required
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              metrics.actionRequired > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${metrics.actionRequired > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {metrics.actionRequired}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Issues / Rejected</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Rejected, cancelled, or pending LOA</p>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by phone number, property name, or notes..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-purple-500 transition"
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

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => {
              setPropertyFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter porting by property location"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Properties</option>
            {propertyFilterOptions.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter porting by order status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS_ALL">In Progress / Processing</option>
            <option value="FOC_RECEIVED">FOC Received</option>
            <option value="COMPLETED">Completed</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING">Pending</option>
            <option value="DRAFT">Draft</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPropertyFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline px-2 cursor-pointer font-medium self-end lg:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Porting Table — Separate Columns as specified in Task.md */}
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
            <AlertTriangle className="w-5 h-5" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchPortings}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : portings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center mx-auto mb-3">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No porting orders found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No porting requests matched your search and filter criteria.'
              : 'There are currently no active phone number porting orders for your organization.'}
          </p>
          {isClientAdmin && !hasActiveFilters && (
            <button
              onClick={() => setShowPortingModal(true)}
              className="mt-4 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Start Porting Request
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Property
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Numbers
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Target / FOC Date
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Created
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Last Updated
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {portings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedPortingForDrawer(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Property */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {item.property_name}
                          </span>
                          <span className="block text-[10.5px] text-slate-400 truncate max-w-[160px]">
                            {item.property_location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Numbers */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60">
                            <Phone className="w-3 h-3" />
                            <span>{item.services_count || item.services?.length || 0} Line(s)</span>
                          </span>
                          {item.services?.length > 0 && (
                            <button
                              onClick={(e) => handleCopyNumbers(item, e)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              title="Copy numbers"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        {item.services?.length > 0 && (
                          <span className="font-mono text-[10.5px] text-slate-400 block truncate max-w-[160px]">
                            {item.services.map((s) => s.phone_number).join(', ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 3: Current Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : item.status === 'FOC_RECEIVED'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                            : item.status === 'REJECTED' || item.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : item.status === 'FOC_RECEIVED'
                              ? 'bg-indigo-500'
                              : item.status === 'REJECTED' || item.status === 'CANCELLED'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Column 4: Target / FOC Date */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.target_date ? (
                            new Date(item.target_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          ) : (
                            <span className="text-slate-400 font-sans font-normal">Pending FOC</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: Created */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Column 6: Last Updated */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Column 7: Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPortingForDrawer(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                          aria-label="More porting actions"
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
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> porting orders
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
              top: `${menuPosition.top}px`,
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
              <Eye className="w-3.5 h-3.5 text-purple-500" />
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
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Copy Attached Numbers</span>
            </button>

            {menuPosition.record.property_id && (
              <button
                onClick={() => handleOpenProperty(menuPosition.record.property_id!)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
              >
                <Hotel className="w-3.5 h-3.5 text-indigo-500" />
                <span>View Property 360°</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleRaisePortingTicket(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Raise Porting Support Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* 7. Porting Detail Slide-Over Drawer */}
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

      {/* 8. Property 360 Inspection Drawer */}
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

      {/* 9. Create Porting Modal (Client Admin only) */}
      <CreatePortingModal
        isOpen={showPortingModal}
        onClose={() => setShowPortingModal(false)}
        onSuccess={fetchPortings}
      />

      {/* 10. Support Ticket Modal */}
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
    </div>
  );
}
