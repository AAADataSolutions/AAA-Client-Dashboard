'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Search,
  X,
  Hotel,
  ShieldCheck,
  Radio,
  MoreVertical,
  LifeBuoy,
  Plus,
  RefreshCw,
  GitBranch,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  ArrowUpRight,
  Eye,
  Building,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';
import Link from 'next/link';
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

interface ServiceItem {
  id: string;
  ops_id: string;
  phone_number: string;
  service_type: string;
  service_type_description: string;
  description: string;
  status: string;
  property_id: string | null;
  property_name: string;
  property_location: string;
  property_address: string;
  is_porting: boolean;
  porting_request_id: string | null;
  porting_status: string | null;
  porting_foc_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function ClientServicesPage() {
  const { orgMembership } = useAuth();
  const orgName = orgMembership?.organization?.name || 'Organization';
  const toast = useToast();

  // Data state
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalServices: 0,
    activeServices: 0,
    pendingPortingServices: 0,
    disconnectedServices: 0,
  });
  const [propertyFilterOptions, setPropertyFilterOptions] = useState<{ id: string; name: string }[]>([]);
  const [typeFilterOptions, setTypeFilterOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Modals & Drawers
  const [selectedServiceForDrawer, setSelectedServiceForDrawer] = useState<ServiceItem | null>(null);
  const [selectedPropForDrawer, setSelectedPropForDrawer] = useState<any | null>(null);
  const [showPropertyDrawer, setShowPropertyDrawer] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketPropId, setTicketPropId] = useState<string | null>(null);

  // 3-Dots Fixed Action Menu
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    record: ServiceItem;
  } | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        q: searchQuery.trim(),
        type: typeFilter,
        status: statusFilter,
        property_id: propertyFilter,
      });

      const res = await fetch(`/api/client/services?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load services');
      }

      setServices(json.data || []);
      setTotalRecords(json.total || 0);
      if (json.metrics) {
        setMetrics(json.metrics);
      }
      if (json.filters) {
        if (json.filters.properties) setPropertyFilterOptions(json.filters.properties);
        if (json.filters.types) setTypeFilterOptions(json.filters.types);
      }
    } catch (err: any) {
      console.error('Error fetching client services:', err);
      setError(err.message || 'Error loading services');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter, propertyFilter]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success(`Copied ${phone} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: ServiceItem) => {
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

  const handleOpenTicketModalForService = (service: ServiceItem) => {
    setTicketPropId(service.property_id);
    setShowTicketModal(true);
    setMenuPosition(null);
  };

  const handleOpenPropertyForService = async (service: ServiceItem) => {
    if (!service.property_id) return;
    try {
      const res = await fetch(`/api/client/properties?q=${encodeURIComponent(service.property_name)}`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        const found = json.data.find((p: any) => p.id === service.property_id) || json.data[0];
        setSelectedPropForDrawer(found);
        setShowPropertyDrawer(true);
      }
    } catch (err) {
      console.error('Failed to open property drawer:', err);
    }
    setMenuPosition(null);
  };

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL' || propertyFilter !== 'ALL';
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

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
            <PhoneCall size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
            Services &amp; Lines Inventory
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setTicketPropId(null);
              setShowTicketModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Line Ticket</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. KPI Cards (4 Cards) - ALL VARIANT 1 ONLY */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Services */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Total Services
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Telecom Lines</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Active &amp; provisioning services
          </p>
        </motion.div>

        {/* Card 2: Active Services */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Active Services
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.activeServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Live In Service</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Operational voice &amp; trunk circuits
          </p>
        </motion.div>

        {/* Card 3: Pending / Porting */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Pending / Porting
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.pendingPortingServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Transfer In Flight</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Numbers undergoing carrier cutover
          </p>
        </motion.div>

        {/* Card 4: Disconnected */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Disconnected
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.disconnectedServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Decommissioned</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">
            Inactive or retired telecom lines
          </p>
        </motion.div>
      </motion.div>

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
              placeholder="Search by phone number, property, or description..."
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

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => {
              setPropertyFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter services by property location"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Properties</option>
            {propertyFilterOptions.map((prop) => (
              <option key={prop.id} value={prop.id}>
                {prop.name}
              </option>
            ))}
          </select>

          {/* Service Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter services by telecom type"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Service Types</option>
            {typeFilterOptions.map((t) => (
              <option key={t} value={t}>
                {t}
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
            aria-label="Filter services by operational status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PORTING_ALL">Porting / Pending</option>
            <option value="DISCONNECTED">Disconnected</option>
            <option value="RESERVED">Reserved</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
              setPropertyFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 cursor-pointer font-medium self-end lg:self-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* 4. Services Table — Separate Columns as specified in Task.md */}
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
            onClick={fetchServices}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <PhoneCall className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No telecom services found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No lines matched your active search and filter criteria.'
              : 'There are no active telecom lines or numbers provisioned for your organization.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Property
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Service Type
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Phone Number
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Description
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
                {services.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedServiceForDrawer(item)}
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
                          <span className="block text-[10.5px] text-slate-400 truncate max-w-[160px]">
                            {item.property_location}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Service Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Radio className="w-3 h-3 text-blue-500" />
                        <span>{item.service_type}</span>
                      </span>
                    </td>

                    {/* Column 3: Phone Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.phone_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.phone_number}
                          </span>
                          <button
                            onClick={(e) => handleCopyPhone(item.phone_number, item.id, e)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Copy number"
                          >
                            {copiedId === item.id ? (
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

                    {/* Column 4: Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                            : item.status === 'PORTING' || item.status === 'PENDING_PORT'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : item.status === 'PORTING' || item.status === 'PENDING_PORT'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {item.status === 'PENDING_PORT' ? 'Pending Port' : item.status}
                      </span>
                    </td>

                    {/* Column 5: Description */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="block max-w-[200px] truncate" title={item.description}>
                        {item.description || 'Standard Voice Line'}
                      </span>
                    </td>

                    {/* Column 6: Last Updated */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(item.updated_at || item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Column 7: Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedServiceForDrawer(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={(e) => handleOpenMenu(e, item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                          aria-label="More service actions"
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
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> services
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
                Service Line
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.record.phone_number}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedServiceForDrawer(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Service Details</span>
            </button>

            <button
              onClick={() => handleOpenPropertyForService(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Hotel className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property ({menuPosition.record.property_name})</span>
            </button>

            {menuPosition.record.is_porting && (
              <Link
                href="/dashboard/porting"
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-amber-600 dark:text-amber-400 flex items-center gap-2 transition cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-amber-500" />
                <span>View Porting Status</span>
              </Link>
            )}

            <Link
              href="/dashboard/e911"
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-emerald-600 dark:text-emerald-400 flex items-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>View E911 Status</span>
            </Link>

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleOpenTicketModalForService(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              <span>Raise Support Ticket</span>
            </button>
          </div>
        </>
      )}

      {/* 7. Service Detail Slide-Over Drawer */}
      {selectedServiceForDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedServiceForDrawer(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedServiceForDrawer.phone_number}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedServiceForDrawer.service_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForDrawer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-200/80 dark:border-[#252733] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Service Line Status
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedServiceForDrawer.status === 'ACTIVE'
                      ? 'Operational Voice Circuit'
                      : selectedServiceForDrawer.status === 'PORTING'
                      ? 'Carrier Cutover In Progress'
                      : 'Provisioned Line'}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedServiceForDrawer.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {selectedServiceForDrawer.status}
                </span>
              </div>

              {/* Property Card */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Assigned Property Location
                </span>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {selectedServiceForDrawer.property_name}
                    </span>
                    <button
                      onClick={() => handleOpenPropertyForService(selectedServiceForDrawer)}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>View 360°</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {selectedServiceForDrawer.property_address || selectedServiceForDrawer.property_location}
                  </p>
                </div>
              </div>

              {/* Line Details */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                  Configuration &amp; Routing
                </span>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedServiceForDrawer.phone_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Service Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedServiceForDrawer.service_type}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-slate-400">Description / Routing:</span>
                    <span className="text-right font-medium text-slate-800 dark:text-slate-200">
                      {selectedServiceForDrawer.description}
                    </span>
                  </div>
                  {selectedServiceForDrawer.service_type_description && (
                    <p className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-100 dark:border-[#222430]">
                      {selectedServiceForDrawer.service_type_description}
                    </p>
                  )}
                </div>
              </div>

              {/* Porting Alert if Applicable */}
              {selectedServiceForDrawer.is_porting && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-xs">Active Porting Order</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    This number is currently included in carrier porting order #{selectedServiceForDrawer.porting_request_id?.slice(0, 8) || 'Active'}.
                    {selectedServiceForDrawer.porting_foc_date && (
                      <span className="block mt-1">
                        Scheduled FOC Date: <strong>{new Date(selectedServiceForDrawer.porting_foc_date).toLocaleDateString()}</strong>
                      </span>
                    )}
                  </p>
                  <Link
                    href="/dashboard/porting"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline pt-1 cursor-pointer"
                  >
                    <span>Track Porting Progress</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleOpenTicketModalForService(selectedServiceForDrawer)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs cursor-pointer"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Raise Line Ticket</span>
              </button>
              <button
                onClick={() => setSelectedServiceForDrawer(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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

      {/* 9. Support Ticket Modal */}
      {showTicketModal && (
        <CreateTicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setTicketPropId(null);
          }}
          preselectedPropertyId={ticketPropId || undefined}
          onSuccess={() => fetchServices()}
        />
      )}
    </motion.div>
  );
}
