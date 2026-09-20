'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Search,
  X,
  Hotel,
  ShieldCheck,
  Radio,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  AlertCircle,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
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
  custom_service_id?: string;
  service_name?: string;
  phone_number: string;
  service_type: string;
  service_type_description: string;
  organization_name?: string;
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
  const [sortBy, setSortBy] = useState('NEWEST');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Drawer state (View Only)
  const [selectedServiceForDrawer, setSelectedServiceForDrawer] = useState<ServiceItem | null>(null);

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
        sortBy: sortBy,
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
  }, [currentPage, searchQuery, typeFilter, statusFilter, propertyFilter, sortBy]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleCopyPhone = (phone: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success('Copied phone number to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyText = (text: string, id: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'ALL' || statusFilter !== 'ALL' || propertyFilter !== 'ALL' || sortBy !== 'NEWEST';
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
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Telecom Services &amp; DIDs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Directory of voice lines, trunks, and active DIDs assigned across <strong className="text-slate-700 dark:text-slate-200">{orgName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchServices}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] transition cursor-pointer"
            title="Refresh services list"
            aria-label="Refresh services list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Metric KPI Cards - Blue Variant 1 */}
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
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.totalServices || services.length}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Provisioned</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Total voice lines &amp; telecom DIDs</p>
        </motion.div>

        {/* Card 2: Active Lines */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Active Lines
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Radio className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.activeServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Live</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Active routing and provisioned lines</p>
        </motion.div>

        {/* Card 3: Porting / Pending */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
          className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              Porting / Pending
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {metrics.pendingPortingServices}
            </span>
            <span className="text-xs text-slate-200 ml-1.5 font-medium">In Transit</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Carrier cutover window</p>
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
            <span className="text-xs text-slate-200 ml-1.5 font-medium">Inactive</span>
          </div>
          <p className="text-[11px] text-slate-200 mt-2">Deactivated services</p>
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
              placeholder="Search by service ID, service name, phone number, or property..."
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter services by status"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PORTING">Porting</option>
            <option value="PENDING_PORT">Pending Port</option>
            <option value="DISCONNECTED">Disconnected</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter services by type"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Service Types</option>
            {typeFilterOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Sort telecom services"
            className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="NEWEST">Sort: Recently Added</option>
            <option value="NUMBER_ASC">Sort: Number (Ascending)</option>
            <option value="NUMBER_DESC">Sort: Number (Descending)</option>
            <option value="TYPE_ASC">Sort: Type (A-Z)</option>
            <option value="PROP_ASC">Sort: Property (A-Z)</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
              setPropertyFilter('ALL');
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
            onClick={fetchServices}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
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
            No services found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No service records match your active search filters.'
              : 'There are no active telecom voice lines provisioned for your organization.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    SERVICE ID
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    SERVICE NAME
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    SERVICE NUMBER
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    SERVICE TYPE
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    ORGANIZATION
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    PROPERTY
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {services.map((item) => {
                  const serviceId = item.custom_service_id || `SVC-${item.id.slice(0, 6).toUpperCase()}`;
                  const serviceName = item.service_name || item.description || 'Standard Voice Line';
                  const organization = item.organization_name || orgName;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedServiceForDrawer(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                    >
                      {/* Column 1: SERVICE ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {serviceId}
                      </td>

                      {/* Column 2: SERVICE NAME */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                        <span className="truncate max-w-[180px] block" title={serviceName}>
                          {serviceName}
                        </span>
                      </td>

                      {/* Column 3: SERVICE NUMBER */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                        {item.phone_number ? (
                          <div className="flex items-center gap-1.5">
                            <span>{item.phone_number}</span>
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

                      {/* Column 4: SERVICE TYPE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Radio className="w-3 h-3 text-blue-500" />
                          <span>{item.service_type || 'Voice Line'}</span>
                        </span>
                      </td>

                      {/* Column 5: ORGANIZATION */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{organization}</span>
                        </div>
                      </td>

                      {/* Column 6: PROPERTY */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{item.property_name}</span>
                        </div>
                      </td>

                      {/* Column 7: STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                              : item.status === 'PORTING' || item.status === 'PENDING_PORT'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
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

                      {/* Column 8: ACTIONS (View Service Only) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedServiceForDrawer(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer border border-blue-200 dark:border-blue-900/40"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Service</span>
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

      {/* 6. Service Detail Slide-Over Drawer (View Service Only) */}
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
                    {selectedServiceForDrawer.phone_number || 'Voice Line'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedServiceForDrawer.service_type || 'Voice Trunk / DID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForDrawer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Operational Status
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white mt-0.5 inline-block">
                    {selectedServiceForDrawer.status === 'ACTIVE'
                      ? 'Live Carrier Route Active'
                      : selectedServiceForDrawer.status === 'PORTING'
                      ? 'Carrier Porting in Progress'
                      : 'Line Inactive / Pending'}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedServiceForDrawer.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60'
                  }`}
                >
                  {selectedServiceForDrawer.status}
                </span>
              </div>

              {/* Service Line Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Service Specifications
                </h4>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Service ID</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {selectedServiceForDrawer.custom_service_id || `SVC-${selectedServiceForDrawer.id.slice(0, 6).toUpperCase()}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Service Name</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedServiceForDrawer.service_name || selectedServiceForDrawer.description || 'Standard Voice Line'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#222430] grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Service Type</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedServiceForDrawer.service_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Organization</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedServiceForDrawer.organization_name || orgName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <span className="text-[10px] text-slate-400 block">Description / Notes</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium text-xs mt-0.5">
                      {selectedServiceForDrawer.description || 'No additional technical notes provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Location */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  Assigned Location
                </h4>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Hotel className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {selectedServiceForDrawer.property_name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        {selectedServiceForDrawer.property_address || selectedServiceForDrawer.property_location || 'Address on file'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Line ID: <span className="text-slate-600 dark:text-slate-300 font-mono">{selectedServiceForDrawer.id.substring(0, 8)}...</span>
              </span>
              <button
                onClick={() => setSelectedServiceForDrawer(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1e27] text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
