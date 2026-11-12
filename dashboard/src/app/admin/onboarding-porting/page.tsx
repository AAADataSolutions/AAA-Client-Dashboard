'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchOnboardings,
  setSearchQuery,
  setStageFilter,
  setSortBy,
  setPagination,
  optimisticUpdateStage,
  OnboardingItem,
  OnboardingAttachment,
} from '@/store/slices/onboardingSlice';
import {
  containerVariants,
  getStageBadge,
  OnboardingStatus,
  OrgOption,
  Teammate,
  Toast,
} from './_components/onboardingTypes';
import { OnboardingHeaderAndFilters } from './_components/OnboardingHeaderAndFilters';
import { OnboardingTable } from './_components/OnboardingTable';
import { OnboardingUnifiedModal } from './_components/OnboardingUnifiedModal';
import { OnboardingCreateModal } from './_components/OnboardingCreateModal';

export type { OnboardingStatus };

const INITIAL_CREATE_FORM = {
  property_name: '',
  organization_id: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  general_manager_name: '',
  general_manager_phone: '',
  general_manager_email: '',
  target_date: '',
  e911_status: 'PENDING',
  ray_baum_status: 'AUDIT_REQUIRED',
};

export default function AdminOnboardingPortingPage() {
  const dispatch = useAppDispatch();
  const {
    items: onboardings,
    loading,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.onboarding);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'STAGE'>('DETAILS');
  const [selectedRecord, setSelectedRecord] = useState<OnboardingItem | null>(null);

  // Stage Edit State inside Unified Modal
  const [editStageStatus, setEditStageStatus] = useState<OnboardingStatus>('DRAFT');
  const [editTargetDate, setEditTargetDate] = useState<string>('');
  const [stageDates, setStageDates] = useState({
    draft_date: '',
    contract_sent_date: '',
    signed_date: '',
    porting_submitted_date: '',
    sof_review_date: '',
    foc_confirmed_date: '',
    live_cutover_date: '',
  });

  // Internal Assignment, Notes & Attachments (Admin Only)
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [assignedToName, setAssignedToName] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'TEAMMATE' | 'CUSTOM'>('TEAMMATE');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [existingAttachments, setExistingAttachments] = useState<OnboardingAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [updatingStage, setUpdatingStage] = useState(false);

  // 3-Dots Action Menu Position (strictly opens ABOVE)
  const [menuPosition, setMenuPosition] = useState<{ bottom: number; left: number; record: OnboardingItem } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Form State for creating new onboarding
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load organizations for dropdown
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/admin/organizations?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrgOptions(data.data.map((o: any) => ({ id: o.id, name: o.name })));
        }
      } catch (err) {
        console.warn('Could not load org options:', err);
      }
    }
    loadOrgs();
  }, []);

  // Load admin teammates for assignment
  useEffect(() => {
    async function loadTeammates() {
      try {
        const res = await fetch('/api/admin/members');
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setTeammates(data.members);
        }
      } catch (err) {
        console.warn('Could not load teammates:', err);
      }
    }
    loadTeammates();
  }, []);

  // Fetch Onboardings
  const loadData = useCallback(() => {
    dispatch(
      fetchOnboardings({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        stage: filters.selectedStage,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search input handler (char-by-char)
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${text} copied to clipboard.`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Open 3-Dots Menu strictly ABOVE the line (Rule 8)
  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingItem) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, record });
  };

  // Open Unified Modal
  const openUnifiedModal = (record: OnboardingItem, defaultTab: 'DETAILS' | 'STAGE' = 'DETAILS') => {
    setSelectedRecord(record);
    setActiveTab(defaultTab);
    const currentStatus = (record.status || (record as any).stage || 'DRAFT') as OnboardingStatus;
    setEditStageStatus(currentStatus);
    setEditTargetDate(record.target_date || '');
    setStageDates({
      draft_date: (record as any).draft_date ? (record as any).draft_date.split('T')[0] : '',
      contract_sent_date: (record as any).contract_sent_date ? (record as any).contract_sent_date.split('T')[0] : '',
      signed_date: (record as any).signed_date ? (record as any).signed_date.split('T')[0] : '',
      porting_submitted_date: (record as any).porting_submitted_date ? (record as any).porting_submitted_date.split('T')[0] : '',
      sof_review_date: (record as any).sof_review_date ? (record as any).sof_review_date.split('T')[0] : '',
      foc_confirmed_date: (record as any).foc_confirmed_date ? (record as any).foc_confirmed_date.split('T')[0] : '',
      live_cutover_date: (record as any).live_cutover_date ? (record as any).live_cutover_date.split('T')[0] : '',
    });

    const rawAssignedTo = record.assigned_to || '';
    const rawAssignedToName = record.assigned_to_name || '';
    setAssignedTo(rawAssignedTo);
    setAssignedToName(rawAssignedToName);
    if (rawAssignedTo) {
      setAssignmentMode('TEAMMATE');
    } else if (rawAssignedToName) {
      setAssignmentMode('CUSTOM');
    } else {
      setAssignmentMode('TEAMMATE');
    }

    setInternalNotes(record.internal_notes || '');
    setExistingAttachments(record.attachments || []);
    setNewFiles([]);
    setShowUnifiedModal(true);
  };

  // Handle Save Create Onboarding
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_name.trim()) {
      setCreateError('Property name is required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to initialize onboarding.');

      showToast('Onboarding Initialized', `${createForm.property_name} saved as Draft Initialized (INACTIVE).`, 'success');
      setShowCreateModal(false);
      setCreateForm(INITIAL_CREATE_FORM);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Remove Existing Attachment
  const handleRemoveExistingAttachment = async (attId?: string, storagePath?: string) => {
    if (!selectedRecord) return;
    const targetKey = attId || storagePath;
    if (!targetKey) return;

    try {
      setDeletingAttId(targetKey);
      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          remove_attachment_id: targetKey,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setExistingAttachments((prev) => prev.filter((a) => (a.id || a.storage_path) !== targetKey));
        showToast('Attachment Removed', 'Internal attachment was removed.', 'info');
      } else {
        throw new Error(result.error || 'Failed to remove attachment');
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to remove attachment', 'error');
    } finally {
      setDeletingAttId(null);
    }
  };

  // Handle Download / Preview Attachment
  const handleDownloadAttachment = (att: OnboardingAttachment) => {
    const url = `/api/admin/onboarding/attachment?path=${encodeURIComponent(att.storage_path)}&name=${encodeURIComponent(att.file_name)}`;
    window.open(url, '_blank');
  };

  // Handle Update Stage Submit (includes internal assignment, notes & attachments)
  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    // Instant optimistic Redux update (< 1ms zero reload)
    dispatch(optimisticUpdateStage({ id: selectedRecord.id, stage: editStageStatus, status: editStageStatus }));

    try {
      setUpdatingStage(true);

      const newAttachmentsPayload: {
        file_name: string;
        file_size: number;
        mime_type: string;
        storage_path: string;
      }[] = [];

      if (newFiles.length > 0) {
        setUploadingFiles(true);
        const supabase = createClient();
        for (const file of newFiles) {
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `onboarding_${selectedRecord.id}/${Date.now()}_${safeName}`;

          let uploadRes = await supabase.storage.from('onboarding-attachments').upload(storagePath, file, {
            upsert: true,
          });

          if (uploadRes.error) {
            uploadRes = await supabase.storage.from('porting-attachments').upload(storagePath, file, {
              upsert: true,
            });
          }

          newAttachmentsPayload.push({
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            storage_path: storagePath,
          });
        }
        setUploadingFiles(false);
      }

      // Determine final assignee name
      let finalAssignedTo = assignmentMode === 'TEAMMATE' ? (assignedTo || null) : null;
      let finalAssignedToName = assignedToName.trim();
      if (assignmentMode === 'TEAMMATE' && assignedTo) {
        const match = teammates.find((t) => t.id === assignedTo);
        if (match) {
          finalAssignedToName = match.full_name || match.email;
        }
      }

      const payload: any = {
        id: selectedRecord.id,
        status: editStageStatus,
        target_date: editTargetDate || null,
        draft_date: stageDates.draft_date || null,
        contract_sent_date: stageDates.contract_sent_date || null,
        signed_date: stageDates.signed_date || null,
        porting_submitted_date: stageDates.porting_submitted_date || null,
        sof_review_date: stageDates.sof_review_date || null,
        foc_confirmed_date: stageDates.foc_confirmed_date || null,
        live_cutover_date: stageDates.live_cutover_date || null,
        assigned_to: finalAssignedTo,
        assigned_to_name: finalAssignedToName || null,
        internal_notes: internalNotes || null,
      };

      if (newAttachmentsPayload.length > 0) {
        payload.new_attachments = newAttachmentsPayload;
      }

      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update stage.');

      if (editStageStatus === 'COMPLETED') {
        showToast(
          'Property Activated!',
          `${selectedRecord.property_name} cutover complete — property is now ACTIVE!`,
          'success'
        );
      } else {
        showToast('Stage & Internal Details Saved', `Pipeline updated to ${getStageBadge(editStageStatus).label}.`, 'success');
      }

      setShowUnifiedModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
      loadData();
    } finally {
      setUpdatingStage(false);
      setUploadingFiles(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStageFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters = filters.searchQuery.trim() !== '' || filters.selectedStage !== 'ALL' || filters.sortBy !== 'NEWEST';
  const isStage3OrAbove = ['SIGNED', 'CSR_DETAILS', 'CSR_AND_CONTRACT_DETAILS', 'CUT_SHEET_REVIEW', 'SOF_WAITING', 'PORTING_SUBMITTED', 'FOC_RECEIVED', 'COMPLETED'].includes(editStageStatus);

  const handleOpenCreateModal = () => {
    setCreateForm(INITIAL_CREATE_FORM);
    setCreateError(null);
    setShowCreateModal(true);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <OnboardingHeaderAndFilters
        toasts={toasts}
        setToasts={setToasts}
        onboardings={onboardings}
        showToast={showToast}
        resetAllFilters={resetAllFilters}
        onOpenCreateModal={handleOpenCreateModal}
        metrics={metrics}
        searchInput={searchInput}
        handleSearchChange={handleSearchChange}
        selectedStage={filters.selectedStage}
        onStageFilterChange={(stage) => {
          dispatch(setStageFilter(stage));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        sortBy={filters.sortBy}
        onSortByChange={(sortVal) => {
          dispatch(setSortBy(sortVal));
          dispatch(setPagination({ currentPage: 1 }));
        }}
      />

      <OnboardingTable
        loading={loading}
        onboardings={onboardings}
        hasActiveFilters={hasActiveFilters}
        resetAllFilters={resetAllFilters}
        onOpenCreateModal={handleOpenCreateModal}
        openUnifiedModal={openUnifiedModal}
        handleCopy={handleCopy}
        copiedField={copiedField}
        handleOpenMenu={handleOpenMenu}
        pagination={pagination}
        onPageChange={(page) => dispatch(setPagination({ currentPage: page }))}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
      />

      <OnboardingUnifiedModal
        showUnifiedModal={showUnifiedModal}
        setShowUnifiedModal={setShowUnifiedModal}
        selectedRecord={selectedRecord}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        editStageStatus={editStageStatus}
        setEditStageStatus={setEditStageStatus}
        editTargetDate={editTargetDate}
        setEditTargetDate={setEditTargetDate}
        stageDates={stageDates}
        setStageDates={setStageDates}
        isStage3OrAbove={isStage3OrAbove}
        assignmentMode={assignmentMode}
        setAssignmentMode={setAssignmentMode}
        assignedTo={assignedTo}
        setAssignedTo={setAssignedTo}
        assignedToName={assignedToName}
        setAssignedToName={setAssignedToName}
        teammates={teammates}
        internalNotes={internalNotes}
        setInternalNotes={setInternalNotes}
        newFiles={newFiles}
        setNewFiles={setNewFiles}
        existingAttachments={existingAttachments}
        deletingAttId={deletingAttId}
        handleDownloadAttachment={handleDownloadAttachment}
        handleRemoveExistingAttachment={handleRemoveExistingAttachment}
        updatingStage={updatingStage}
        uploadingFiles={uploadingFiles}
        handleUpdateStageSubmit={handleUpdateStageSubmit}
      />

      <OnboardingCreateModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createError={createError}
        createLoading={createLoading}
        orgOptions={orgOptions}
        handleCreateSubmit={handleCreateSubmit}
      />
    </motion.div>
  );
}
