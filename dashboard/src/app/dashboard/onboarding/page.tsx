'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { StartOnboardingModal } from '@/components/client/StartOnboardingModal';
import { EditGMModal } from '@/components/client/EditGMModal';
import { OnboardingTimelineModal } from '@/components/client/OnboardingTimelineModal';
import { motion } from 'framer-motion';
import { OnboardingRecordItem, containerVariants, itemVariants } from './_components/types';
import { OnboardingMetricCards } from './_components/OnboardingMetricCards';
import { OnboardingFilterBar } from './_components/OnboardingFilterBar';
import { OnboardingTableView } from './_components/OnboardingTableView';

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

  const handleOpenTimeline = (record: OnboardingRecordItem) => {
    setSelectedOnboardingForTimeline(record);
    setShowTimelineModal(true);
  };

  const handleOpenEditGM = (record: OnboardingRecordItem) => {
    setEditingGMOnboarding(record);
    setShowEditGMModal(true);
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
    setSortBy('NEWEST');
    setCurrentPage(1);
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

      {/* 2. Metric KPI Cards */}
      <OnboardingMetricCards metrics={metrics} fallbackTotal={onboardings.length} />

      {/* 3. Search & Filter Bar */}
      <OnboardingFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
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
        <OnboardingTableView
          paginatedRecords={paginatedRecords}
          totalRecords={totalRecords}
          pageSize={pageSize}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          copiedId={copiedId}
          onOpenTimeline={handleOpenTimeline}
          onOpenEditGM={handleOpenEditGM}
          onCopyText={handleCopyText}
        />
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
