'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Hotel,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { motion } from 'framer-motion';
import {
  PropertyRecord,
  getCircuitStageBadge,
  containerVariants,
  itemVariants,
} from './_components/types';
import { PropertiesTableView } from './_components/PropertiesTableView';
import { PropertiesGridView, PropertiesPaginationAndMenu } from './_components/PropertiesGridAndMenu';
import { PropertiesMetricCards } from './_components/PropertiesMetricCards';
import { PropertiesFilterBar } from './_components/PropertiesFilterBar';
import { PropertiesModals } from './_components/PropertiesModals';

export { getCircuitStageBadge };

export default function ClientPropertiesPage() {
  const { orgMembership } = useAuth();
  const orgName = orgMembership?.organization?.name || 'Organization';
  const toast = useToast();

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
  const [sortBy, setSortBy] = useState('NEWEST');
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

  // Edit GM & Onboarding Timeline Modals
  const [editingGMProp, setEditingGMProp] = useState<PropertyRecord | null>(null);
  const [showEditGMModal, setShowEditGMModal] = useState(false);
  const [viewingTimelineProp, setViewingTimelineProp] = useState<PropertyRecord | null>(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  // 3-Dots Fixed Action Menu state
  const [menuPosition, setMenuPosition] = useState<{
    bottom?: number;
    top?: number;
    left: number;
    prop: PropertyRecord;
  } | null>(null);

  // Filter for Ray Baum
  const [rayBaumFilter, setRayBaumFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        sortBy: sortBy,
      });
      if (rayBaumFilter !== 'ALL') {
        params.set('rayBaum', rayBaumFilter);
      }

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
  }, [currentPage, searchQuery, statusFilter, onboardingFilter, stateFilter, sortBy, rayBaumFilter]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyRecord) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 240;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, prop });
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

  const handleOpenEditGM = (prop: PropertyRecord) => {
    setEditingGMProp(prop);
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setOnboardingFilter('ALL');
    setStateFilter('ALL');
    setSortBy('NEWEST');
    setRayBaumFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || onboardingFilter !== 'ALL' || stateFilter !== 'ALL' || rayBaumFilter !== 'ALL' || sortBy !== 'NEWEST';
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Header with Breadcrumb & KPI Summary */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <Hotel size={256} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Properties &amp; Locations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Overview of all hospitality properties managed under <strong className="text-slate-700 dark:text-slate-200">{orgName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchProperties}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a1c24] transition cursor-pointer"
            title="Refresh list"
            aria-label="Refresh properties list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Top Metric Cards */}
      <PropertiesMetricCards metrics={metrics} fallbackTotal={properties.length} />

      {/* 3. Search & Filter Bar */}
      <PropertiesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onboardingFilter={onboardingFilter}
        setOnboardingFilter={setOnboardingFilter}
        rayBaumFilter={rayBaumFilter}
        setRayBaumFilter={setRayBaumFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        setCurrentPage={setCurrentPage}
        viewMode={viewMode}
        setViewMode={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

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
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
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
        <PropertiesTableView
          properties={properties}
          copiedId={copiedId}
          handleOpenPropertyDetails={handleOpenPropertyDetails}
          handleCopyText={handleCopyText}
          handleOpenMenu={handleOpenMenu}
        />
      ) : (
        <PropertiesGridView
          properties={properties}
          handleOpenPropertyDetails={handleOpenPropertyDetails}
          handleOpenMenu={handleOpenMenu}
        />
      )}

      {/* 5 & 6. Pagination & 3-Dots Action Menu */}
      <PropertiesPaginationAndMenu
        totalRecords={totalRecords}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        handleOpenPropertyDetails={handleOpenPropertyDetails}
        handleOpenEditGM={handleOpenEditGM}
      />

      {/* Modals and Drawer */}
      <PropertiesModals
        showDrawer={showDrawer}
        selectedPropForDrawer={selectedPropForDrawer}
        drawerDefaultTab={drawerDefaultTab}
        setShowDrawer={setShowDrawer}
        setSelectedPropForDrawer={setSelectedPropForDrawer}
        handleOpenTicketModalForProp={handleOpenTicketModalForProp}
        showCreateTicketModal={showCreateTicketModal}
        setShowCreateTicketModal={setShowCreateTicketModal}
        ticketPropId={ticketPropId}
        setTicketPropId={setTicketPropId}
        onRefresh={fetchProperties}
        showEditGMModal={showEditGMModal}
        editingGMProp={editingGMProp}
        setShowEditGMModal={setShowEditGMModal}
        setEditingGMProp={setEditingGMProp}
        showTimelineModal={showTimelineModal}
        viewingTimelineProp={viewingTimelineProp}
        setShowTimelineModal={setShowTimelineModal}
        setViewingTimelineProp={setViewingTimelineProp}
        orgName={orgName}
      />
    </motion.div>
  );
}
