'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Hotel,
  Search,
  X,
  MapPin,
  Phone,
  ShieldCheck,
  PhoneCall,
  MoreVertical,
  LifeBuoy,
  Plus,
  RefreshCw,
  LayoutGrid,
  List,
  AlertCircle,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  User,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';

interface PropertyRecord {
  id: string;
  org_property_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string | null;
  fax: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  general_manager_name: string | null;
  ray_baud_and_logs_enabled: boolean;
  status: string;
  services_count: number;
  services: any[];
  e911_status: string;
  e911_verified_at: string | null;
  e911_record: any | null;
  onboarding_status: string | null;
  onboarding_target_date: string | null;
  open_tickets_count: number;
  tickets: any[];
  created_at: string;
}

export default function ClientPropertiesPage() {
  const { orgMembership } = useAuth();
  const orgName = orgMembership?.organization?.name || 'Organization';

  // Data state
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalProperties: 0,
    activeProperties: 0,
    onboardingProperties: 0,
    inactiveProperties: 0,
    e911VerifiedProperties: 0,
    totalServices: 0,
    servicesAttention: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onboardingFilter, setOnboardingFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Drawer & Modal states
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<PropertyRecord | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<'OVERVIEW' | 'SERVICES' | 'E911' | 'ONBOARDING' | 'TICKETS'>('OVERVIEW');
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [ticketPropId, setTicketPropId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu state
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    prop: PropertyRecord;
  } | null>(null);

  // Copy phone state
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery.trim(),
        status: statusFilter,
        onboarding: onboardingFilter,
        state: stateFilter,
      });

      const res = await fetch(`/api/client/properties?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load properties');
      }

      setProperties(json.data || []);
      setTotalRecords(json.total || 0);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
    } catch (err: any) {
      console.error('Error fetching client properties:', err);
      setError(err.message || 'Error loading properties');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, onboardingFilter, stateFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 230;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, prop });
  };

  const handleOpenTicketModalForProp = (propId: string) => {
    setTicketPropId(propId);
    setShowCreateTicketModal(true);
    setMenuPosition(null);
  };

  const handleOpenPropertyDetails = (prop: PropertyRecord, tab: 'OVERVIEW' | 'SERVICES' | 'E911' | 'ONBOARDING' | 'TICKETS' = 'OVERVIEW') => {
    setSelectedPropForDrawer(prop);
    setDrawerDefaultTab(tab);
    setShowDrawer(true);
    setMenuPosition(null);
  };

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || onboardingFilter !== 'ALL' || stateFilter !== 'ALL';
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  // Donut chart calculations
  const donutData = useMemo(() => {
    const total = metrics.totalProperties || 0;
    const circumference = 2 * Math.PI * 38; // ~238.76
    if (total === 0) {
      return {
        activePct: 0,
        onboardingPct: 0,
        inactivePct: 0,
        circumference,
        activeLength: 0,
        onboardingLength: 0,
        inactiveLength: 0,
      };
    }
    const activeLength = (metrics.activeProperties / total) * circumference;
    const onboardingLength = (metrics.onboardingProperties / total) * circumference;
    const inactiveLength = (metrics.inactiveProperties / total) * circumference;

    return {
      activePct: Math.round((metrics.activeProperties / total) * 100),
      onboardingPct: Math.round((metrics.onboardingProperties / total) * 100),
      inactivePct: Math.round((metrics.inactiveProperties / total) * 100),
      circumference,
      activeLength,
      onboardingLength,
      inactiveLength,
    };
  }, [metrics]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Properties &amp; Locations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Directory and operational telecommunication status for {orgName} properties.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenTicketModalForProp('')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Property Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Card 1: Donut / Pie Chart of Total Properties */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Properties Breakdown
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {metrics.totalProperties} Total
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* SVG Donut Chart */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-100 dark:text-slate-800"
                />
                {metrics.totalProperties > 0 ? (
                  <>
                    {/* Active Segment (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeDasharray={`${donutData.activeLength} ${donutData.circumference}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700"
                    />
                    {/* Onboarding Segment (Purple) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="10"
                      strokeDasharray={`${donutData.onboardingLength} ${donutData.circumference}`}
                      strokeDashoffset={-donutData.activeLength}
                      className="transition-all duration-700"
                    />
                    {/* Inactive Segment (Slate) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#64748b"
                      strokeWidth="10"
                      strokeDasharray={`${donutData.inactiveLength} ${donutData.circumference}`}
                      strokeDashoffset={-(donutData.activeLength + donutData.onboardingLength)}
                      className="transition-all duration-700"
                    />
                  </>
                ) : null}
              </svg>
              {/* Donut Center Count */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {metrics.totalProperties}
                </span>
                <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                  Properties
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="flex-1 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Active</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.activeProperties}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({donutData.activePct}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  <span>Onboarding</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.onboardingProperties}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({donutData.onboardingPct}%)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  <span>Inactive</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.inactiveProperties}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({donutData.inactivePct}%)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Total Services */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Telecom Services
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalServices}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Provisioned Lines</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-emerald-500" />
            <span>DIDs, SIP trunks, analog voice across properties</span>
          </p>
        </div>

        {/* KPI Card 3: Services Requiring Attention */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Services Needing Attention
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              metrics.servicesAttention > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold ${
              metrics.servicesAttention > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}>
              {metrics.servicesAttention}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">In-Flight / Pending</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Lines undergoing carrier porting or cutover review
          </p>
        </div>

        {/* KPI Card 4: Open Tickets */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Open Support Tickets
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LifeBuoy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.openTickets}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">Active Inquiries</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Unresolved tickets across all tenant locations
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
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
              placeholder="Search by property name, address, or main phone..."
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
            aria-label="Filter properties by operational status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ONBOARDING">Onboarding</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OFFBOARDED">Offboarded</option>
          </select>

          {/* Onboarding Stage Filter */}
          <select
            value={onboardingFilter}
            onChange={(e) => {
              setOnboardingFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter properties by onboarding pipeline status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Onboarding</option>
            <option value="ONBOARDING">In Onboarding</option>
            <option value="COMPLETED">Completed</option>
            <option value="NONE">Not in Onboarding</option>
          </select>
        </div>

        {/* View Toggle & Reset */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setOnboardingFilter('ALL');
                setStateFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 cursor-pointer font-medium"
            >
              Reset Filters
            </button>
          )}

          <div className="flex items-center bg-slate-100 dark:bg-[#181920] p-0.5 rounded-lg border border-slate-200/80 dark:border-[#222430]">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                viewMode === 'LIST'
                  ? 'bg-white dark:bg-[#252733] text-indigo-600 dark:text-white shadow-2xs'
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
                  ? 'bg-white dark:bg-[#252733] text-indigo-600 dark:text-white shadow-2xs'
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

      {/* 4. Main Properties Content: Table or Grid */}
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
            onClick={fetchProperties}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <Hotel className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No properties found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No property records matched your active filters. Try adjusting your search query.'
              : 'There are no properties currently associated with your organization tenant.'}
          </p>
        </div>
      ) : viewMode === 'LIST' ? (
        /* TABLE VIEW — Strictly separate individual columns */
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Property Name
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Address
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Contact Person
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phone
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Services
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Onboarding
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {properties.map((prop) => (
                  <tr
                    key={prop.id}
                    onClick={() => handleOpenPropertyDetails(prop)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: Property Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {prop.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Address */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="block max-w-[200px] truncate" title={`${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`}>
                        {prop.address ? `${prop.address}, ${prop.city}, ${prop.state}` : `${prop.city}, ${prop.state}`}
                      </span>
                    </td>

                    {/* Column 3: Contact Person */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {prop.contact_person_name || prop.general_manager_name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Phone */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {prop.main_phone ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span>{prop.main_phone}</span>
                          <button
                            onClick={(e) => handleCopyPhone(prop.main_phone!, prop.id, e)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Copy phone"
                          >
                            {copiedPhoneId === prop.id ? (
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

                    {/* Column 5: Services */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <PhoneCall className="w-3 h-3 text-indigo-500" />
                        <span>{prop.services_count} {prop.services_count === 1 ? 'Line' : 'Lines'}</span>
                      </span>
                    </td>

                    {/* Column 6: Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          prop.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : prop.status === 'ONBOARDING'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            prop.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : prop.status === 'ONBOARDING'
                              ? 'bg-purple-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {prop.status}
                      </span>
                    </td>

                    {/* Column 7: Onboarding */}
                    <td className="py-3.5 px-4">
                      {prop.onboarding_status ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          <GitBranch className="w-3 h-3" />
                          <span>{prop.onboarding_status}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    {/* Column 8: Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenPropertyDetails(prop)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, prop)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                          aria-label="More property actions"
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
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((prop) => (
            <div
              key={prop.id}
              onClick={() => handleOpenPropertyDetails(prop)}
              className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                      <Hotel className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {prop.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{prop.city}, {prop.state}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 ${
                      prop.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs py-2 border-t border-b border-slate-100 dark:border-[#20222c] my-2 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Main Phone:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {prop.main_phone || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Contact Person:</span>
                    <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                      {prop.contact_person_name || prop.general_manager_name || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Active Services:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {prop.services_count} Lines
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPropertyDetails(prop);
                  }}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={(e) => handleOpenMenu(e, prop)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#20222d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Property options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Pagination */}
      {totalRecords > 0 && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] px-4 py-3 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, totalRecords)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> properties
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        currentPage === p
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a]'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer"
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
                Property Actions
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.prop.name}
              </span>
            </div>

            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'OVERVIEW')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property Details</span>
            </button>

            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'SERVICES')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-indigo-500" />
              <span>View Assigned Services ({menuPosition.prop.services_count})</span>
            </button>

            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'E911')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>View E911 Status</span>
            </button>

            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'ONBOARDING')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-purple-500" />
              <span>View Onboarding Progress</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleOpenTicketModalForProp(menuPosition.prop.id)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-indigo-500" />
              <span>Raise Support Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* 7. Property 360 Details Slide-Over Drawer */}
      {showDrawer && selectedPropForDrawer && (
        <PropertyDetailDrawer
          property={selectedPropForDrawer}
          onClose={() => {
            setShowDrawer(false);
            setSelectedPropForDrawer(null);
          }}
          onCreateTicket={(propId) => {
            setShowDrawer(false);
            handleOpenTicketModalForProp(propId);
          }}
        />
      )}

      {/* 8. Create Support Ticket Modal */}
      {showCreateTicketModal && (
        <CreateTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => {
            setShowCreateTicketModal(false);
            setTicketPropId(null);
          }}
          preselectedPropertyId={ticketPropId || undefined}
          onSuccess={() => {
            fetchProperties();
          }}
        />
      )}
    </div>
  );
}
