'use client';

import { useState } from 'react';
import { PortingItem } from '@/store/slices/portingSlice';
import {
  LifecycleStage,
  STAGES_ROAD,
  getStageBadge,
  normalizeStageKey,
} from './portingTypes';

interface UsePortingUnifiedModalProps {
  loadData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePortingUnifiedModal({ loadData, showToast }: UsePortingUnifiedModalProps) {
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'STAGE' | 'MEDIA'>('STAGE');
  const [selectedRecord, setSelectedRecord] = useState<PortingItem | null>(null);

  // Details Edit State (Inside Details Tab)
  const [detailForm, setDetailForm] = useState({
    property_name: '',
    organization_id: '',
    partner_id: '',
    partner_commission_override: '' as string | number,
    property_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    property_phone: '',
    fax: '',
    monthly_price: '' as string | number,
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    e911_status: 'VERIFIED' as 'VERIFIED' | 'AUDIT_REQUIRED',
    ray_baud_and_logs_enabled: true,
    ray_baum_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    carrier_details: '',
    target_date: '',
    notes: '',
  });
  const [savingDetails, setSavingDetails] = useState(false);

  // Stage Tracking State (Inside Stage Tab)
  const [editStageStatus, setEditStageStatus] = useState<LifecycleStage>('DRAFT');
  const [editTargetDate, setEditTargetDate] = useState<string>('');
  const [stageDates, setStageDates] = useState({
    draft_date: '',
    contract_sent_date: '',
    signed_date: '',
    csr_details_date: '',
    cut_sheet_review_date: '',
    porting_submitted_date: '',
    foc_confirmed_date: '',
    live_cutover_date: '',
  });

  const [stage3AssignedTo, setStage3AssignedTo] = useState<string>('');
  const [stage3AssignedToName, setStage3AssignedToName] = useState<string>('');
  const [stage3Notes, setStage3Notes] = useState<string>('');

  const [stage4AssignedTo, setStage4AssignedTo] = useState<string>('');
  const [stage4AssignedToName, setStage4AssignedToName] = useState<string>('');
  const [stage4Notes, setStage4Notes] = useState<string>('');
  const [stageAssignments, setStageAssignments] = useState<Record<string, { assigned_to: string; assigned_to_name: string; mode: 'TEAMMATE' | 'CUSTOM'; notes: string }>>({});
  const [showBillingConfirmModal, setShowBillingConfirmModal] = useState(false);

  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [modalNewFiles, setModalNewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  // Open Unified Modal
  const openUnifiedModal = (
    record: PortingItem,
    defaultTab: 'DETAILS' | 'STAGE' | 'MEDIA' = 'STAGE'
  ) => {
    setSelectedRecord(record);
    setActiveTab(defaultTab);
    const normalizedStage = normalizeStageKey(record.status || record.stage || 'DRAFT');
    setEditStageStatus(normalizedStage);

    const sanitizeDateForInput = (val?: string | null) => {
      if (!val || val === '—' || val === 'N/A' || val === 'null' || val === 'undefined') return '';
      try {
        const clean = String(val).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(clean)) return clean.substring(0, 10);
        const d = new Date(clean);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().substring(0, 10);
      } catch {
        return '';
      }
    };

    const targetDateSanitized = sanitizeDateForInput(record.target_date);
    setEditTargetDate(targetDateSanitized);
    setStageDates({
      draft_date: sanitizeDateForInput(record.draft_date),
      contract_sent_date: sanitizeDateForInput(record.contract_sent_date),
      signed_date: sanitizeDateForInput(record.signed_date),
      csr_details_date: sanitizeDateForInput((record as any).csr_details_date),
      cut_sheet_review_date: sanitizeDateForInput(record.cut_sheet_review_date || (record as any).sof_review_date),
      porting_submitted_date: sanitizeDateForInput(record.porting_submitted_date),
      foc_confirmed_date: sanitizeDateForInput(record.foc_confirmed_date),
      live_cutover_date: sanitizeDateForInput(record.live_cutover_date || (record as any).completed_at),
    });
    setStage3AssignedTo((record as any).stage3_assigned_to || record.assigned_to || '');
    setStage3AssignedToName((record as any).stage3_assigned_to_name || record.assigned_to_name || '');
    setStage3Notes((record as any).stage3_notes || record.internal_notes || record.notes || '');
    setStage4AssignedTo((record as any).stage4_assigned_to || '');
    setStage4AssignedToName((record as any).stage4_assigned_to_name || '');
    setStage4Notes((record as any).stage4_notes || '');
    const rawAssignments = (record as any).stage_assignments || {};
    const initialStageAssignments: Record<string, { assigned_to: string; assigned_to_name: string; mode: 'TEAMMATE' | 'CUSTOM'; notes: string }> = {};
    STAGES_ROAD.forEach((st) => {
      const existing = rawAssignments[st.key] || {};
      let assigned_to = existing.assigned_to || '';
      let assigned_to_name = existing.assigned_to_name || '';
      let notes = existing.notes || '';
      if (st.key === 'SIGNED') {
        assigned_to = assigned_to || (record as any).stage3_assigned_to || record.assigned_to || '';
        assigned_to_name = assigned_to_name || (record as any).stage3_assigned_to_name || record.assigned_to_name || '';
        notes = notes || (record as any).stage3_notes || record.internal_notes || '';
      } else if (st.key === 'CSR_DETAILS') {
        assigned_to = assigned_to || (record as any).stage4_assigned_to || '';
        assigned_to_name = assigned_to_name || (record as any).stage4_assigned_to_name || '';
        notes = notes || (record as any).stage4_notes || '';
      }
      initialStageAssignments[st.key] = {
        assigned_to,
        assigned_to_name,
        mode: existing.mode || (assigned_to_name && !assigned_to ? 'CUSTOM' : 'TEAMMATE'),
        notes,
      };
    });
    setStageAssignments(initialStageAssignments);
    setExistingAttachments(record.attachments || []);
    setModalNewFiles([]);

    // Populate Details Form
    setDetailForm({
      property_name: record.property_name || '',
      organization_id: record.organization_id || '',
      partner_id: (record as any).partner_id || (record as any).partner?.id || (record as any).property?.partner_id || '',
      partner_commission_override: (record as any).partner_commission_override !== null && (record as any).partner_commission_override !== undefined ? (record as any).partner_commission_override : '',
      property_address: record.property_address || '',
      city: record.city || '',
      state: record.state || '',
      zip_code: record.zip_code || '',
      country: record.country || 'USA',
      property_phone: record.property_phone || '',
      fax: record.fax === '—' ? '' : record.fax || '',
      monthly_price: record.monthly_price || '',
      general_manager_name: record.general_manager_name === 'N/A' ? '' : record.general_manager_name || '',
      general_manager_phone: record.general_manager_phone === 'N/A' ? '' : record.general_manager_phone || '',
      general_manager_email: record.general_manager_email === 'N/A' ? '' : record.general_manager_email || '',
      e911_status: (record.e911_status as any) || 'VERIFIED',
      ray_baud_and_logs_enabled: record.ray_baud_and_logs_enabled ?? true,
      ray_baum_status: (record.ray_baum_status as any) || 'ACTIVE',
      carrier_details: record.carrier_details || '',
      target_date: record.target_date || '',
      notes: record.notes || '',
    });

    setShowUnifiedModal(true);
  };

  const handleStageSelect = (stageKey: LifecycleStage) => {
    setEditStageStatus(stageKey);
    if (stageKey === 'COMPLETED') {
      setShowBillingConfirmModal(true);
    }
  };

  const handleDownloadAttachment = (att: any) => {
    if (!att.storage_path) return;
    window.open(`/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`, '_blank');
  };

  const handleDeleteAttachment = (storagePath: string) => {
    setExistingAttachments((prev) => prev.filter((a) => a.storage_path !== storagePath));
    showToast('File Removed', 'Attachment removed from list. Click Save Changes to apply.', 'info');
  };

  const handleSaveDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setSavingDetails(true);
      const res = await fetch('/api/admin/porting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          property_name: detailForm.property_name.trim(),
          organization_id: detailForm.organization_id || null,
          partner_id: detailForm.partner_id || null,
          partner_commission_override: detailForm.partner_commission_override !== '' && detailForm.partner_commission_override !== null && detailForm.partner_commission_override !== undefined ? Number(detailForm.partner_commission_override) : null,
          property_address: detailForm.property_address.trim(),
          city: detailForm.city.trim(),
          state: detailForm.state.trim(),
          zip_code: detailForm.zip_code.trim(),
          country: detailForm.country.trim(),
          property_phone: detailForm.property_phone.trim(),
          fax: detailForm.fax.trim() || null,
          monthly_price: detailForm.monthly_price ? Number(detailForm.monthly_price) : null,
          general_manager_name: detailForm.general_manager_name.trim() || null,
          general_manager_phone: detailForm.general_manager_phone.trim() || null,
          general_manager_email: detailForm.general_manager_email.trim() || null,
          e911_status: detailForm.e911_status,
          ray_baud_and_logs_enabled: detailForm.ray_baud_and_logs_enabled,
          ray_baum_status: detailForm.ray_baum_status,
          carrier_details: detailForm.carrier_details.trim() || null,
          target_date: detailForm.target_date || null,
          notes: detailForm.notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save property details.');

      showToast('Details Updated', `Property details for ${detailForm.property_name} saved successfully.`, 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveMediaSubmit = async () => {
    if (!selectedRecord) return;
    try {
      setUploadingFiles(true);
      const newlyUploadedAttachments: any[] = [];

      if (modalNewFiles.length > 0) {
        for (let i = 0; i < modalNewFiles.length; i++) {
          const file = modalNewFiles[i];
          const fd = new FormData();
          fd.append('file', file);
          const upRes = await fetch('/api/admin/porting/attachment', { method: 'POST', body: fd });
          const upJson = await upRes.json();
          if (upRes.ok && upJson.success && upJson.data) {
            newlyUploadedAttachments.push(upJson.data);
          } else {
            throw new Error(upJson.error || `Failed to upload ${file.name}`);
          }
        }
      }

      const combinedAttachments = [...existingAttachments, ...newlyUploadedAttachments];

      const res = await fetch('/api/admin/porting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          attachments: combinedAttachments,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save media.');

      setExistingAttachments(combinedAttachments);
      setModalNewFiles([]);
      showToast('Media Updated', 'PDFs and images saved successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUpdateStageSubmit = async (e?: React.FormEvent, chosenBillingStatus?: 'BILLING_DONE' | 'BILLING_PENDING') => {
    if (e) e.preventDefault();
    if (!selectedRecord) return;
    if (editStageStatus === 'COMPLETED' && !chosenBillingStatus) {
      setShowBillingConfirmModal(true);
      return;
    }

    try {
      setUpdatingStage(true);
      const newlyUploadedAttachments: any[] = [];

      if (modalNewFiles.length > 0) {
        setUploadingFiles(true);
        for (let i = 0; i < modalNewFiles.length; i++) {
          const file = modalNewFiles[i];
          const fd = new FormData();
          fd.append('file', file);
          const upRes = await fetch('/api/admin/porting/attachment', { method: 'POST', body: fd });
          const upJson = await upRes.json();
          if (upRes.ok && upJson.success && upJson.data) {
            newlyUploadedAttachments.push(upJson.data);
          } else {
            throw new Error(upJson.error || `Failed to upload ${file.name}`);
          }
        }
        setUploadingFiles(false);
      }

      const combinedAttachments = [...existingAttachments, ...newlyUploadedAttachments];

      const res = await fetch('/api/admin/porting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecord.id,
          status: editStageStatus,
          target_date: editTargetDate || null,
          draft_date: stageDates.draft_date || null,
          contract_sent_date: stageDates.contract_sent_date || null,
          signed_date: stageDates.signed_date || null,
          csr_details_date: stageDates.csr_details_date || null,
          cut_sheet_review_date: stageDates.cut_sheet_review_date || null,
          porting_submitted_date: stageDates.porting_submitted_date || null,
          foc_confirmed_date: stageDates.foc_confirmed_date || null,
          live_cutover_date: stageDates.live_cutover_date || null,
          stage3_assigned_to: stageAssignments.SIGNED?.assigned_to || stage3AssignedTo || null,
          stage3_assigned_to_name: stageAssignments.SIGNED?.assigned_to_name || stage3AssignedToName || null,
          stage3_notes: stageAssignments.SIGNED?.notes || stage3Notes || null,
          stage4_assigned_to: stageAssignments.CSR_DETAILS?.assigned_to || stage4AssignedTo || null,
          stage4_assigned_to_name: stageAssignments.CSR_DETAILS?.assigned_to_name || stage4AssignedToName || null,
          stage4_notes: stageAssignments.CSR_DETAILS?.notes || stage4Notes || null,
          assigned_to: stageAssignments[editStageStatus]?.assigned_to || stageAssignments.SIGNED?.assigned_to || stage3AssignedTo || null,
          assigned_to_name: stageAssignments[editStageStatus]?.assigned_to_name || stageAssignments.SIGNED?.assigned_to_name || stage3AssignedToName || null,
          internal_notes: stageAssignments[editStageStatus]?.notes || stageAssignments.SIGNED?.notes || stage3Notes || null,
          stage_assignments: stageAssignments,
          ...(chosenBillingStatus ? { billing_status: chosenBillingStatus } : {}),
          attachments: combinedAttachments,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update stage.');
      }

      const isNowCompleted = editStageStatus === 'COMPLETED';
      showToast(
        isNowCompleted ? 'Property Onboarded & Activated' : 'Lifecycle Stage Updated',
        isNowCompleted
          ? `${selectedRecord.property_name} is now onboarded (${chosenBillingStatus === 'BILLING_DONE' ? 'Billing Done' : 'Billing Pending'}) and has moved to the Properties section.`
          : `${selectedRecord.property_name} updated to ${getStageBadge(editStageStatus).label}.`,
        'success'
      );
      setShowBillingConfirmModal(false);
      setShowUnifiedModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setUpdatingStage(false);
      setUploadingFiles(false);
    }
  };

  return {
    showUnifiedModal,
    setShowUnifiedModal,
    activeTab,
    setActiveTab,
    selectedRecord,
    setSelectedRecord,
    detailForm,
    setDetailForm,
    savingDetails,
    editStageStatus,
    setEditStageStatus,
    editTargetDate,
    setEditTargetDate,
    stageDates,
    setStageDates,
    stageAssignments,
    setStageAssignments,
    showBillingConfirmModal,
    setShowBillingConfirmModal,
    existingAttachments,
    modalNewFiles,
    setModalNewFiles,
    uploadingFiles,
    updatingStage,
    openUnifiedModal,
    handleStageSelect,
    handleDownloadAttachment,
    handleDeleteAttachment,
    handleSaveDetailsSubmit,
    handleSaveMediaSubmit,
    handleUpdateStageSubmit,
  };
}
