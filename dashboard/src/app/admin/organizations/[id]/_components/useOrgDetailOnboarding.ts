'use client';

import React, { useState } from 'react';
import { type OrgDetail, type OnboardingStatus, getStageBadge } from './types';

interface UseOrgDetailOnboardingParams {
  orgId: string;
  org: OrgDetail | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchOrgDetails: () => Promise<void>;
}

export function useOrgDetailOnboarding({
  orgId,
  org,
  showToast,
  fetchOrgDetails,
}: UseOrgDetailOnboardingParams) {
  // Onboarding Tab Filtering & Search
  const [onbSearchInput, setOnbSearchInput] = useState('');
  const [onbStageFilter, setOnbStageFilter] = useState('ALL');
  const [onbSortBy, setOnbSortBy] = useState('NEWEST');

  // Onboarding Unified Modal (Details & Stage Roadmap)
  const [unifiedOnboardingRecord, setUnifiedOnboardingRecord] = useState<any | null>(null);
  const [unifiedOnboardingTab, setUnifiedOnboardingTab] = useState<'DETAILS' | 'STAGE'>('DETAILS');
  const [editOnbStageStatus, setEditOnbStageStatus] = useState<OnboardingStatus>('DRAFT');
  const [editOnbTargetDate, setEditOnbTargetDate] = useState<string>('');
  const [onbStageDates, setOnbStageDates] = useState({
    draft_date: '',
    contract_sent_date: '',
    signed_date: '',
    porting_submitted_date: '',
    sof_review_date: '',
    foc_confirmed_date: '',
    live_cutover_date: '',
  });
  const [updatingOnbStage, setUpdatingOnbStage] = useState(false);

  // Onboarding Initialize Modal (scoped to this organization)
  const [showInitOnbModal, setShowInitOnbModal] = useState(false);
  const [initOnbForm, setInitOnbForm] = useState({
    property_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    target_date: '',
  });
  const [initOnbLoading, setInitOnbLoading] = useState(false);
  const [initOnbError, setInitOnbError] = useState<string | null>(null);

  // Legacy onboarding popover compatibility
  const [onboardingMenuPosition, setOnboardingMenuPosition] = useState<{
    onb: any;
    bottom: number;
    left: number;
  } | null>(null);
  const [viewingOnboardingDetails, setViewingOnboardingDetails] = useState<any | null>(null);
  const [editingOnboardingStage, setEditingOnboardingStage] = useState<any | null>(null);
  const [savingOnboardingStage, setSavingOnboardingStage] = useState(false);
  const [stageProgressOnboarding, setStageProgressOnboarding] = useState<any | null>(null);

  // Onboarding Stage Save
  const handleSaveOnboardingStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOnboardingStage) return;
    setSavingOnboardingStage(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${editingOnboardingStage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingOnboardingStage.stage,
          current_stage: editingOnboardingStage.stage,
          target_completion_date: editingOnboardingStage.target_date,
          draft_date: editingOnboardingStage.draft_date,
          contract_sent_date: editingOnboardingStage.contract_sent_date,
          signed_date: editingOnboardingStage.signed_date,
          porting_submitted_date: editingOnboardingStage.porting_submitted_date,
          sof_review_date: editingOnboardingStage.sof_review_date,
          foc_confirmed_date: editingOnboardingStage.foc_confirmed_date,
          live_cutover_date: editingOnboardingStage.live_cutover_date,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update onboarding stage');
      showToast('Onboarding stage and milestone dates updated.');
      setEditingOnboardingStage(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating onboarding stage', 'error');
    } finally {
      setSavingOnboardingStage(false);
    }
  };

  // Onboarding Unified Modal Handler
  const openUnifiedOnboardingModal = (record: any, tab: 'DETAILS' | 'STAGE' = 'DETAILS') => {
    setUnifiedOnboardingRecord(record);
    setUnifiedOnboardingTab(tab);
    setEditOnbStageStatus((record.stage || record.status || 'DRAFT') as OnboardingStatus);
    setEditOnbTargetDate(record.target_date ? record.target_date.split('T')[0] : '');
    setOnbStageDates({
      draft_date: record.draft_date ? record.draft_date.split('T')[0] : '',
      contract_sent_date: record.contract_sent_date ? record.contract_sent_date.split('T')[0] : '',
      signed_date: record.signed_date ? record.signed_date.split('T')[0] : '',
      porting_submitted_date: record.porting_submitted_date ? record.porting_submitted_date.split('T')[0] : '',
      sof_review_date: record.sof_review_date ? record.sof_review_date.split('T')[0] : '',
      foc_confirmed_date: record.foc_confirmed_date ? record.foc_confirmed_date.split('T')[0] : '',
      live_cutover_date: record.live_cutover_date ? record.live_cutover_date.split('T')[0] : '',
    });
  };

  // Save Onboarding Stage from Unified Modal
  const handleUpdateOnbStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unifiedOnboardingRecord) return;
    setUpdatingOnbStage(true);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unifiedOnboardingRecord.id,
          status: editOnbStageStatus,
          target_date: editOnbTargetDate || null,
          draft_date: onbStageDates.draft_date || null,
          contract_sent_date: onbStageDates.contract_sent_date || null,
          signed_date: onbStageDates.signed_date || null,
          porting_submitted_date: onbStageDates.porting_submitted_date || null,
          sof_review_date: onbStageDates.sof_review_date || null,
          foc_confirmed_date: onbStageDates.foc_confirmed_date || null,
          live_cutover_date: onbStageDates.live_cutover_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update stage');

      if (editOnbStageStatus === 'COMPLETED') {
        showToast(`Property cutover completed and activated!`);
      } else {
        showToast(`Stage updated to ${getStageBadge(editOnbStageStatus).label}.`);
      }
      setUnifiedOnboardingRecord(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating stage', 'error');
    } finally {
      setUpdatingOnbStage(false);
    }
  };

  // Initialize Onboarding Submit
  const handleCreateOnbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initOnbForm.property_name.trim()) {
      setInitOnbError('Property name is required.');
      return;
    }
    setInitOnbLoading(true);
    setInitOnbError(null);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...initOnbForm,
          organization_id: orgId,
          e911_status: 'PENDING',
          ray_baum_status: 'AUDIT_REQUIRED',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to initialize onboarding');

      showToast(`Onboarding initialized for "${initOnbForm.property_name}".`);
      setShowInitOnbModal(false);
      setInitOnbForm({
        property_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        general_manager_name: '',
        general_manager_phone: '',
        general_manager_email: '',
        target_date: '',
      });
      fetchOrgDetails();
    } catch (err: any) {
      setInitOnbError(err.message || 'Creation failed');
      showToast(err.message || 'Error initializing onboarding', 'error');
    } finally {
      setInitOnbLoading(false);
    }
  };

  // Export Onboardings to CSV
  const handleExportOnbCSV = () => {
    const list = org?.onboardings || [];
    const headers = ['ID,Property,Organization,Stage,Target Date,GM Name,GM Phone,GM Email\n'];
    const rows = list.map((o: any) =>
      `"${o.id}","${o.property_name || ''}","${org?.name || ''}","${o.stage || o.status || ''}","${o.target_date || ''}","${o.general_manager_name || ''}","${o.general_manager_phone || ''}","${o.general_manager_email || ''}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${org?.name || 'organization'}-onboardings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Onboardings exported as CSV.');
  };

  return {
    onbSearchInput,
    setOnbSearchInput,
    onbStageFilter,
    setOnbStageFilter,
    onbSortBy,
    setOnbSortBy,
    unifiedOnboardingRecord,
    setUnifiedOnboardingRecord,
    unifiedOnboardingTab,
    setUnifiedOnboardingTab,
    editOnbStageStatus,
    setEditOnbStageStatus,
    editOnbTargetDate,
    setEditOnbTargetDate,
    onbStageDates,
    setOnbStageDates,
    updatingOnbStage,
    showInitOnbModal,
    setShowInitOnbModal,
    initOnbForm,
    setInitOnbForm,
    initOnbLoading,
    initOnbError,
    setInitOnbError,
    onboardingMenuPosition,
    setOnboardingMenuPosition,
    viewingOnboardingDetails,
    setViewingOnboardingDetails,
    editingOnboardingStage,
    setEditingOnboardingStage,
    savingOnboardingStage,
    stageProgressOnboarding,
    setStageProgressOnboarding,
    handleSaveOnboardingStage,
    openUnifiedOnboardingModal,
    handleUpdateOnbStageSubmit,
    handleCreateOnbSubmit,
    handleExportOnbCSV,
  };
}
