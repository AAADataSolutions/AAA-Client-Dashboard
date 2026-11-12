'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { motion } from 'framer-motion';
import { ServiceItem, containerVariants, itemVariants } from './_components/types';
import { ServicesMetricCards } from './_components/ServicesMetricCards';
import { ServicesFilterBar } from './_components/ServicesFilterBar';
import { ServicesTableView } from './_components/ServicesTableView';
import { ServiceDetailDrawer } from './_components/ServiceDetailDrawer';

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

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setPropertyFilter('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
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

      {/* 2. Metric KPI Cards */}
      <ServicesMetricCards metrics={metrics} fallbackTotal={services.length} />

      {/* 3. Search & Filter Bar */}
      <ServicesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        typeFilterOptions={typeFilterOptions}
        sortBy={sortBy}
        setSortBy={setSortBy}
        setCurrentPage={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Table UI */}
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
        <ServicesTableView
          services={services}
          copiedId={copiedId}
          onCopyPhone={handleCopyPhone}
          onSelectService={setSelectedServiceForDrawer}
        />
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

      {/* 6. Service Detail Slide-Over Drawer */}
      <ServiceDetailDrawer
        selectedService={selectedServiceForDrawer}
        onClose={() => setSelectedServiceForDrawer(null)}
        orgName={orgName}
      />
    </motion.div>
  );
}
