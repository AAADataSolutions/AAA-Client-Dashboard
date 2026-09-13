'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  X,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Copy,
  Edit2,
  LifeBuoy,
  RefreshCw,
  Plus,
  Shield,
  Hotel,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { E911EditModal } from '@/components/client/E911EditModal';
import { E911DetailDrawer } from '@/components/client/E911DetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';

interface E911RecordItem {
  id: string;
  org_property_id: string;
  property_id: string;
  property_name: string;
  property_location: string;
  property_phone: string;
  property_address: string;
  emergency_address: string;
  status: string;
  correction_notes: string | null;
  verified_at: string | null;
  ray_baud_and_logs_enabled: boolean;
  updated_at: string;
}

export default function ClientE911Page() {
  const { effectiveRole, orgMembership } = useAuth();
  const toast = useToast();
  const orgName = orgMembership?.organization?.name || 'Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

  // Data state
  const [records, setRecords] = useState<E911RecordItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    actionRequired: 0,
    correctionRequired: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<E911RecordItem | null>(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<E911RecordItem | null>(null);
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<any | null>(null);
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPropId, setTicketPropId] = useState<string | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    record: E911RecordItem;
  } | null>(null);

  const fetchE911Records = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        status: statusFilter,
      });

      const res = await fetch(`/api/client/e911?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch E911 records');
      }

      setRecords(json.data || []);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching E911 records:', err);
      setError(err.message || 'Error loading E911 status');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchE911Records();
  }, [fetchE911Records]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: E911RecordItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record });
  };

  const handleCopyAddress = (addr: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(addr);
    setCopiedId(id);
    toast.success('Emergency civic address copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = (record: E911RecordItem) => {
    setSelectedRecordForEdit(record);
    setShowEditModal(true);
    setMenuPosition(null);
  };

  const handleRaiseE911Ticket = (record: E911RecordItem) => {
    setTicketPropId(record.property_id);
    setShowTicketModal(true);
    setMenuPosition(null);
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

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL';
  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                E911 &amp; Emergency Compliance
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Public Safety Answering Point (PSAP) emergency address dispatch and Ray Baum Act verification for {orgName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setTicketPropId(null);
              setShowTicketModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise E911 Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (4 Cards as specified in Task.md) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Properties */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Properties
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Hotel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.total}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Evaluated Sites</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            All client physical locations monitored
          </p>
        </div>

        {/* Card 2: Verified */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Verified
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.verified}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              {metrics.total > 0 ? `${Math.round((metrics.verified / metrics.total) * 100)}% active` : '100%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            MSAG &amp; PSAP active dispatch confirmed
          </p>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${metrics.pending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {metrics.pending}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">In Validation</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Carrier civic database processing
          </p>
        </div>

        {/* Card 4: Action Required */}
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
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Correction Needed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Correction required or validation failed
          </p>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by property name, emergency address, or civic details..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition"
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
            aria-label="Filter by E911 compliance status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="ACTION_REQUIRED">Action Required (Correction/Failed)</option>
            <option value="CORRECTION_REQUIRED">Correction Required</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 cursor-pointer font-medium self-end sm:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. E911 Table — Separate Columns as specified in Task.md */}
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
            onClick={fetchE911Records}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No E911 records found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No property records matched your search and filter criteria.'
              : 'There are no active E911 property records configured for your organization.'}
          </p>
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
                    Emergency Address
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    E911 Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Correction / Issue
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Verified At
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {paginatedRecords.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecordForDetail(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Property */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {item.property_name}
                          </span>
                          <span className="block text-[10.5px] text-slate-400 truncate max-w-[160px]">
                            {item.property_location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Emergency Address */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[260px]">
                        <span className="text-slate-800 dark:text-slate-200 truncate font-medium" title={item.emergency_address}>
                          {item.emergency_address}
                        </span>
                        <button
                          onClick={(e) => handleCopyAddress(item.emergency_address, item.id, e)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0 cursor-pointer"
                          title="Copy emergency address"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Column 3: E911 Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : item.status === 'CORRECTION_REQUIRED' || item.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 animate-pulse'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-500'
                              : item.status === 'CORRECTION_REQUIRED' || item.status === 'FAILED'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {item.status === 'CORRECTION_REQUIRED'
                          ? 'Correction Required'
                          : item.status}
                      </span>
                    </td>

                    {/* Column 4: Correction / Issue */}
                    <td className="py-3.5 px-4">
                      {item.correction_notes ? (
                        <span
                          className={`block max-w-[200px] truncate text-[11px] ${
                            item.status === 'CORRECTION_REQUIRED' || item.status === 'FAILED'
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                          title={item.correction_notes}
                        >
                          {item.correction_notes}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Column 5: Verified At */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                      {item.verified_at ? (
                        new Date(item.verified_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-sans">Pending</span>
                      )}
                    </td>

                    {/* Column 6: Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedRecordForDetail(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        {isClientAdmin && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                            title="Update Address"
                            aria-label="Update Address"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleOpenMenu(e, item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                          aria-label="More E911 options"
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
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> property records
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
                E911 Location
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.record.property_name}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedRecordForDetail(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>View E911 Details</span>
            </button>

            <button
              onClick={() => {
                const addr = menuPosition.record.emergency_address;
                const id = menuPosition.record.id;
                setMenuPosition(null);
                handleCopyAddress(addr, id);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Copy Emergency Address</span>
            </button>

            <button
              onClick={() => handleOpenProperty(menuPosition.record.property_id)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Hotel className="w-3.5 h-3.5 text-indigo-500" />
              <span>View Property 360°</span>
            </button>

            {isClientAdmin && (
              <button
                onClick={() => handleOpenEdit(menuPosition.record)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-amber-600 dark:text-amber-400 flex items-center gap-2 transition cursor-pointer font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Update Emergency Address</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleRaiseE911Ticket(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Raise E911 Support Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* 7. E911 Detail Slide-Over Drawer */}
      {selectedRecordForDetail && (
        <E911DetailDrawer
          record={selectedRecordForDetail}
          isClientAdmin={isClientAdmin}
          onClose={() => setSelectedRecordForDetail(null)}
          onOpenEdit={(r) => {
            setSelectedRecordForDetail(null);
            handleOpenEdit(r);
          }}
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

      {/* 9. Edit Address Modal (Client Admin only) */}
      <E911EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedRecordForEdit(null);
        }}
        onSuccess={fetchE911Records}
        record={selectedRecordForEdit}
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
          onSuccess={fetchE911Records}
        />
      )}
    </div>
  );
}
