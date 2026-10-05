'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ArrowLeftRight,
  Search,
  Plus,
  Download,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Calendar,
  Sparkles,
  RefreshCw,
  Info,
  Clock,
  Loader2,
  Check,
  Hotel,
  Copy,
  Mail,
  Phone,
  MapPin,
  Eye,
  GitBranch,
  ShieldCheck,
  Building2,
  Trash2,
  Upload,
  UserCheck,
  User,
  Paperclip,
  Lock,
  ExternalLink,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPortingRequests,
  setSearchQuery,
  setStatusFilter,
  setSortBy,
  setPagination,
  PortingItem,
} from '@/store/slices/portingSlice';

export type LifecycleStage =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'CSR_DETAILS'
  | 'CUT_SHEET_REVIEW'
  | 'PORTING_SUBMITTED'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

export const STAGES_ROAD: {
  key: LifecycleStage;
  label: string;
  step: number;
  desc: string;
  dateField: string;
}[] = [
  {
    key: 'DRAFT',
    label: 'Draft initialized',
    step: 1,
    desc: 'Property draft initialized with inactive status',
    dateField: 'draft_date',
  },
  {
    key: 'CONTRACT_SENT',
    label: 'Contract sent',
    step: 2,
    desc: 'Service agreement dispatched to GM',
    dateField: 'contract_sent_date',
  },
  {
    key: 'SIGNED',
    label: 'Contract signed',
    step: 3,
    desc: 'Agreement executed and verified',
    dateField: 'signed_date',
  },
  {
    key: 'CSR_DETAILS',
    label: 'CSR and contract details',
    step: 4,
    desc: 'Customer service record & contract verified',
    dateField: 'csr_details_date',
  },
  {
    key: 'CUT_SHEET_REVIEW',
    label: 'Cut sheet review',
    step: 5,
    desc: 'Technical cut sheet review and validation',
    dateField: 'cut_sheet_review_date',
  },
  {
    key: 'PORTING_SUBMITTED',
    label: 'Porting submitted',
    step: 6,
    desc: 'LSR porting order submitted to winning carrier',
    dateField: 'porting_submitted_date',
  },
  {
    key: 'FOC_RECEIVED',
    label: 'FOC Confirm',
    step: 7,
    desc: 'Firm Order Confirmation date locked',
    dateField: 'foc_confirmed_date',
  },
  {
    key: 'COMPLETED',
    label: 'Onboarding',
    step: 8,
    desc: 'Traffic migrated & property activated',
    dateField: 'live_cutover_date',
  },
];

export function getStageBadge(status: string): {
  label: string;
  step: number;
  bg: string;
  text: string;
  border: string;
  pct: number;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Stage 1: Draft initialized',
        step: 1,
        bg: 'bg-slate-100 dark:bg-[#1a1c24]',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-[#2a2c3a]',
        pct: 12.5,
      };
    case 'CONTRACT_SENT':
      return {
        label: 'Stage 2: Contract sent',
        step: 2,
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        pct: 25,
      };
    case 'SIGNED':
      return {
        label: 'Stage 3: Contract signed',
        step: 3,
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        pct: 37.5,
      };
    case 'CSR_DETAILS':
    case 'CSR_AND_CONTRACT_DETAILS':
      return {
        label: 'Stage 4: CSR and contract details',
        step: 4,
        bg: 'bg-teal-50 dark:bg-teal-950/50',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/50',
        pct: 50,
      };
    case 'CUT_SHEET_REVIEW':
    case 'SOF_WAITING':
    case 'CUT_SHEET':
      return {
        label: 'Stage 5: Cut sheet review',
        step: 5,
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/50',
        pct: 62.5,
      };
    case 'PORTING_SUBMITTED':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      return {
        label: 'Stage 6: Porting submitted',
        step: 6,
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        pct: 75,
      };
    case 'FOC_RECEIVED':
      return {
        label: 'Stage 7: FOC Confirm',
        step: 7,
        bg: 'bg-sky-50 dark:bg-sky-950/50',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/50',
        pct: 87.5,
      };
    case 'COMPLETED':
      return {
        label: 'Stage 8: Onboarding',
        step: 8,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        pct: 100,
      };
    default:
      return {
        label: status || 'Stage 1: Draft initialized',
        step: 1,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 12.5,
      };
  }
}

export function normalizeStageKey(statusOrStage?: string): LifecycleStage {
  if (!statusOrStage) return 'DRAFT';
  const s = String(statusOrStage).toUpperCase();
  if (s.includes('CONTRACT_SENT') || s.includes('CONTRACT SENT') || s.includes('STAGE 2')) return 'CONTRACT_SENT';
  if (s.includes('SIGNED') || s.includes('STAGE 3')) return 'SIGNED';
  if (s.includes('CSR') || s.includes('STAGE 4')) return 'CSR_DETAILS';
  if (s.includes('CUT_SHEET') || s.includes('CUT SHEET') || s.includes('SOF') || s.includes('STAGE 5')) return 'CUT_SHEET_REVIEW';
  if (s.includes('PORTING_SUBMITTED') || s.includes('SUBMITTED') || s.includes('IN_PROGRESS') || s.includes('STAGE 6')) return 'PORTING_SUBMITTED';
  if (s.includes('FOC') || s.includes('STAGE 7')) return 'FOC_RECEIVED';
  if (s.includes('COMPLETED') || s.includes('ONBOARD') || s.includes('STAGE 8')) return 'COMPLETED';
  return 'DRAFT';
}

export function formatStageDate(rawDate?: string | null): string {
  if (!rawDate || rawDate === '—' || rawDate === 'N/A' || rawDate === 'null' || rawDate === 'undefined' || String(rawDate).trim() === '') {
    return '(-)';
  }
  try {
    const cleanDate = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanDate)) {
      const parts = cleanDate.substring(0, 10).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const d = new Date(cleanDate);
    if (isNaN(d.getTime())) return '(-)';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '(-)';
  }
}

export function getStageDate(rec: any, status?: string): string {
  if (!rec) return '(-)';
  const currentStage = normalizeStageKey(status || rec.status || rec.stage || 'DRAFT');
  let rawDate: string | null | undefined = null;

  switch (currentStage) {
    case 'DRAFT':
      rawDate = rec.draft_date;
      break;
    case 'CONTRACT_SENT':
      rawDate = rec.contract_sent_date;
      break;
    case 'SIGNED':
      rawDate = rec.signed_date;
      break;
    case 'CSR_DETAILS':
      rawDate = rec.csr_details_date;
      break;
    case 'CUT_SHEET_REVIEW':
      rawDate = rec.cut_sheet_review_date || rec.sof_review_date;
      break;
    case 'PORTING_SUBMITTED':
      rawDate = rec.porting_submitted_date;
      break;
    case 'FOC_RECEIVED':
      rawDate = rec.foc_confirmed_date;
      break;
    case 'COMPLETED':
      rawDate = rec.live_cutover_date || rec.completed_at;
      break;
    default:
      rawDate = null;
  }

  return formatStageDate(rawDate);
}

interface OrgOption {
  id: string;
  name: string;
}

interface PartnerOption {
  id: string;
  name: string;
  company_name?: string;
  default_commission_rate: number;
}

interface Teammate {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminPortingPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const dispatch = useAppDispatch();
  const {
    items: portings,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.porting);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Stage 3 & Stage 4 Assignee, Notes (Admin Only)
  const [stage3AssignedTo, setStage3AssignedTo] = useState<string>('');
  const [stage3AssignedToName, setStage3AssignedToName] = useState<string>('');
  const [stage3AssignmentMode, setStage3AssignmentMode] = useState<'TEAMMATE' | 'CUSTOM'>('TEAMMATE');
  const [stage3Notes, setStage3Notes] = useState<string>('');

  const [stage4AssignedTo, setStage4AssignedTo] = useState<string>('');
  const [stage4AssignedToName, setStage4AssignedToName] = useState<string>('');
  const [stage4AssignmentMode, setStage4AssignmentMode] = useState<'TEAMMATE' | 'CUSTOM'>('TEAMMATE');
  const [stage4Notes, setStage4Notes] = useState<string>('');

  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [modalNewFiles, setModalNewFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  // 3-Dots Action Menu Position (strictly opens ABOVE the row)
  const [menuPosition, setMenuPosition] = useState<{
    bottom: number;
    left: number;
    record: PortingItem;
  } | null>(null);

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<PortingItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Form State for creating new Porting Request with EVERY property field
  const [createForm, setCreateForm] = useState({
    organization_id: '',
    partner_id: '',
    partner_commission_override: '' as string | number,
    property_name: '',
    monthly_price: '' as string | number,
    property_phone: '',
    fax: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    e911_status: 'VERIFIED' as 'VERIFIED' | 'AUDIT_REQUIRED',
    ray_baud_and_logs_enabled: true,
    ray_baum_status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    target_date: '',
    carrier_details: '',
    status: 'DRAFT' as LifecycleStage,
  });
  const [createFiles, setCreateFiles] = useState<File[]>([]);
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

  // Load partners for dropdown
  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch('/api/admin/partners?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPartnerOptions(
            data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              company_name: p.company_name,
              default_commission_rate: p.default_commission_rate ?? 0,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load partner options:', err);
      }
    }
    loadPartners();
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

  // Fetch porting requests
  const loadData = useCallback(() => {
    dispatch(
      fetchPortingRequests({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        status: filters.selectedStatus,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync search input
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

  // Open 3-Dots Menu (opens ABOVE the row)
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    record: PortingItem
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, record });
  };

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
  };

  // Check if current stage is Stage 3+ for internal handoff unlock
  const currentStepNum =
    STAGES_ROAD.find((s) => s.key === editStageStatus)?.step || 1;
  const isStage3OrAbove = currentStepNum >= 3;

  // Handle Download Attachment
  const handleDownloadAttachment = (att: any) => {
    if (!att.storage_path) return;
    window.open(`/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`, '_blank');
  };

  // Handle Delete Attachment
  const handleDeleteAttachment = (storagePath: string) => {
    setExistingAttachments((prev) => prev.filter((a) => a.storage_path !== storagePath));
    showToast('File Removed', 'Attachment removed from list. Click Save Changes to apply.', 'info');
  };

  // Handle Save All Property Details (Details Tab)
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

  // Handle Save Attachments / Media (PDFs & Images Tab)
  const handleSaveMediaSubmit = async () => {
    if (!selectedRecord) return;
    try {
      setUploadingFiles(true);
      const newlyUploadedAttachments: any[] = [];
      if (modalNewFiles.length > 0) {
        const supabase = createClient();
        for (let i = 0; i < modalNewFiles.length; i++) {
          const file = modalNewFiles[i];
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `admin/${Date.now()}_${cleanName}`;
          const { error: uploadErr } = await supabase.storage
            .from('porting-attachments')
            .upload(storagePath, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });
          if (!uploadErr) {
            newlyUploadedAttachments.push({
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
            });
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

  // Handle Create Porting Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_name.trim() || !createForm.property_phone.trim()) {
      setCreateError('Property Name and Phone Number are required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const uploadedAttachments: {
        file_name: string;
        file_size: number;
        mime_type: string;
        storage_path: string;
      }[] = [];

      if (createFiles.length > 0) {
        const supabase = createClient();
        for (let i = 0; i < createFiles.length; i++) {
          const file = createFiles[i];
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `admin/${Date.now()}_${cleanName}`;
          const { error: uploadErr } = await supabase.storage
            .from('porting-attachments')
            .upload(storagePath, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });
          if (uploadErr) {
            console.error('Upload error:', uploadErr);
          } else {
            uploadedAttachments.push({
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
            });
          }
        }
      }

      const res = await fetch('/api/admin/porting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: createForm.organization_id || null,
          partner_id: createForm.partner_id || null,
          partner_commission_override: createForm.partner_commission_override !== '' && createForm.partner_commission_override !== null && createForm.partner_commission_override !== undefined ? Number(createForm.partner_commission_override) : null,
          property_name: createForm.property_name.trim(),
          property_phone: createForm.property_phone.trim(),
          fax: createForm.fax.trim() || null,
          monthly_price: createForm.monthly_price ? Number(createForm.monthly_price) : null,
          property_address: createForm.address.trim() || null,
          city: createForm.city.trim() || null,
          state: createForm.state.trim() || null,
          zip_code: createForm.zip_code.trim() || null,
          country: createForm.country.trim() || 'USA',
          general_manager_name: createForm.general_manager_name.trim() || null,
          general_manager_phone: createForm.general_manager_phone.trim() || null,
          general_manager_email: createForm.general_manager_email.trim() || null,
          e911_status: createForm.e911_status,
          ray_baud_and_logs_enabled: createForm.ray_baud_and_logs_enabled,
          ray_baum_status: createForm.ray_baum_status,
          target_date: createForm.target_date || null,
          carrier_details: createForm.carrier_details.trim() || null,
          status: createForm.status || 'DRAFT',
          attachments: uploadedAttachments,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create porting record.');
      }

      showToast(
        'Porting Created Successfully',
        `Porting lifecycle initialized for ${createForm.property_name}.`,
        'success'
      );
      setShowCreateModal(false);
      setCreateForm({
        organization_id: '',
        partner_id: '',
        partner_commission_override: '',
        property_name: '',
        monthly_price: '',
        property_phone: '',
        fax: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        general_manager_name: '',
        general_manager_phone: '',
        general_manager_email: '',
        e911_status: 'VERIFIED',
        ray_baud_and_logs_enabled: true,
        ray_baum_status: 'ACTIVE',
        target_date: '',
        carrier_details: '',
        status: 'DRAFT',
      });
      setCreateFiles([]);
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Update Stage Submit (Unified Modal)
  const handleUpdateStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      setUpdatingStage(true);

      const newlyUploadedAttachments: any[] = [];
      if (modalNewFiles.length > 0) {
        setUploadingFiles(true);
        const supabase = createClient();
        for (let i = 0; i < modalNewFiles.length; i++) {
          const file = modalNewFiles[i];
          const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const storagePath = `admin/${Date.now()}_${cleanName}`;
          const { error: uploadErr } = await supabase.storage
            .from('porting-attachments')
            .upload(storagePath, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: false,
            });
          if (!uploadErr) {
            newlyUploadedAttachments.push({
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
            });
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
          stage3_assigned_to: stage3AssignedTo || null,
          stage3_assigned_to_name: stage3AssignedToName || null,
          stage3_notes: stage3Notes || null,
          stage4_assigned_to: stage4AssignedTo || null,
          stage4_assigned_to_name: stage4AssignedToName || null,
          stage4_notes: stage4Notes || null,
          assigned_to: stage3AssignedTo || stage4AssignedTo || null,
          assigned_to_name: stage3AssignedToName || stage4AssignedToName || null,
          internal_notes: stage3Notes || stage4Notes || null,
          attachments: combinedAttachments,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update stage.');
      }

      showToast(
        'Lifecycle Stage Updated',
        `${selectedRecord.property_name} updated to ${getStageBadge(editStageStatus).label}.`,
        'success'
      );
      setShowUnifiedModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setUpdatingStage(false);
      setUploadingFiles(false);
    }
  };

  // Handle Delete Porting
  const handleDeleteSubmit = async () => {
    if (!recordToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/porting?id=${recordToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed.');

      showToast('Deleted', `Porting for ${recordToDelete.property_name} removed.`, 'success');
      setShowDeleteModal(false);
      setRecordToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-xl border text-xs shadow-xl flex items-start gap-2.5 max-w-sm animate-in slide-in-from-top-2 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : 'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-bold">{t.title}</p>
              {t.message && <p className="opacity-90 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center shrink-0 text-slate-900 dark:text-white">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Porting Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export CSV Button */}
          <button
            onClick={() => {
              if (portings.length === 0) {
                showToast('No Data', 'No porting records to export.', 'info');
                return;
              }
              const headers = ['Property Name', 'Location', 'Organization', 'Stage', 'GM Name', 'GM Email', 'Phone', 'Fax', 'Target Date'];
              const rows = portings.map((p) => [
                `"${p.property_name || ''}"`,
                `"${p.city || p.property_address || ''}"`,
                `"${p.organization_name || '—'}"`,
                `"${getStageBadge(p.status || p.stage || 'DRAFT').label}"`,
                `"${p.general_manager_name || '—'}"`,
                `"${p.general_manager_email || '—'}"`,
                `"${p.property_phone || '—'}"`,
                `"${p.fax || '—'}"`,
                `"${p.target_date || '—'}"`,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `porting_management_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast('Export Successful', 'Porting records downloaded as CSV.', 'success');
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Reset Filters Button */}
          <button
            onClick={() => {
              setSearchInput('');
              dispatch(setSearchQuery(''));
              dispatch(setStatusFilter('ALL'));
              dispatch(setSortBy('NEWEST'));
              dispatch(setPagination({ currentPage: 1 }));
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1f212c] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            {/* <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> */}
            <span>Reset Filters</span>
          </button>

          {/* Create Porting Request Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Porting Request</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS — EXACT ROYAL BLUE AS IN IMAGE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REQUESTS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL REQUESTS
            </span>
            <ArrowLeftRight className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalRequests}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Ports</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            All porting requests across all orgs
          </p>
        </div>

        {/* Card 2: IN PROGRESS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              IN PROGRESS
            </span>
            <RefreshCw className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.inProgressCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Active</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Carrier processing &amp; submitted orders
          </p>
        </div>

        {/* Card 3: FOC RECEIVED */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              FOC RECEIVED
            </span>
            <ShieldCheck className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.focReceivedCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Confirmed</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Firm Order Confirmation received
          </p>
        </div>

        {/* Card 4: COMPLETED */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              COMPLETED
            </span>
            <CheckCircle2 className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.completedCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Done</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Numbers ported &amp; services activated
          </p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR — EXACT LAYOUT AS IN SCREENSHOT */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, organization, phone number, notes..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Dropdown Filters: Status & Sort */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Status Dropdown */}
            <select
              value={filters.selectedStatus}
              onChange={(e) => {
                dispatch(setStatusFilter(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="DRAFT">Stage 1: Draft initialized</option>
              <option value="CONTRACT_SENT">Stage 2: Contract sent</option>
              <option value="SIGNED">Stage 3: Contract signed</option>
              <option value="CSR_DETAILS">Stage 4: CSR and contract details</option>
              <option value="CUT_SHEET_REVIEW">Stage 5: Cut sheet review</option>
              <option value="PORTING_SUBMITTED">Stage 6: Porting submitted</option>
              <option value="FOC_RECEIVED">Stage 7: FOC Confirm</option>
              <option value="COMPLETED">Stage 8: Onboarding</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={filters.sortBy}
              onChange={(e) => {
                dispatch(setSortBy(e.target.value));
                dispatch(setPagination({ currentPage: 1 }));
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-xs text-slate-800 dark:text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-blue-500 shrink-0"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="OLDEST">Sort: Oldest First</option>
              <option value="PROPERTY_ASC">Sort: Property Name (A-Z)</option>
              <option value="ORG_ASC">Sort: Organization (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar */}
        <div className="flex items-center justify-between text-xs pt-1 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Active Filters:</span>
            {filters.selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Status: {getStageBadge(filters.selectedStatus).label}
                <button
                  onClick={() => dispatch(setStatusFilter('ALL'))}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchInput.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-medium">
                Search: &ldquo;{searchInput}&rdquo;
                <button
                  onClick={() => handleSearchChange('')}
                  className="hover:text-blue-900 cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.selectedStatus === 'ALL' && searchInput.trim() === '' && (
              <span className="text-slate-400 text-[11px] italic">None</span>
            )}
          </div>

          {(filters.selectedStatus !== 'ALL' || searchInput.trim() !== '' || filters.sortBy !== 'NEWEST') && (
            <button
              onClick={() => {
                setSearchInput('');
                dispatch(setSearchQuery(''));
                dispatch(setStatusFilter('ALL'));
                dispatch(setSortBy('NEWEST'));
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* MAIN DATA TABLE — 11 REQUESTED COLUMNS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY</th>
                {isSuperAdmin && <th className="py-3 px-4 whitespace-nowrap">MONTHLY PRICE</th>}
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">MAIN PHONE NO.</th>
                <th className="py-3 px-4 whitespace-nowrap">MANAGEMENT GROUP</th>
                <th className="py-3 px-4 whitespace-nowrap">NO. OF SERVICES</th>
                <th className="py-3 px-4 whitespace-nowrap">E911 STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">RAY BAUM AND KARY&apos;S LAW</th>
                <th className="py-3 px-4 whitespace-nowrap">GM NAME</th>
                <th className="py-3 px-4 whitespace-nowrap">GM EMAIL</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/60">
              {loading && portings.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading porting records...
                  </td>
                </tr>
              ) : portings.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No porting records found matching your filter.
                  </td>
                </tr>
              ) : (
                portings.map((rec) => {
                  const badge = getStageBadge(rec.status || rec.stage || 'DRAFT');
                  const locationStr = rec.city
                    ? `${rec.city}${rec.state ? `, ${rec.state}` : ''}`
                    : rec.property_address || '—';
                  const servicesCount = rec.services_count !== undefined ? rec.services_count : (rec.services?.length || 0);

                  const isE911Verified = rec.e911_status === 'VERIFIED' || rec.ray_baud_and_logs_enabled || rec.status === 'COMPLETED';
                  const isE911Correction = rec.e911_status === 'CORRECTION_REQUIRED';
                  const isRayBaumCompliant = rec.ray_baud_and_logs_enabled ?? (rec.ray_baum_status === 'ACTIVE' || rec.status === 'COMPLETED');

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openUnifiedModal(rec, 'STAGE')}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#191b24] transition cursor-pointer"
                    >
                      {/* 1. Property Name with Address / Location underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.property_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {locationStr}
                        </div>
                      </td>

                      {/* 2. Monthly Price */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {rec.monthly_price !== null && rec.monthly_price !== undefined && rec.monthly_price !== '' ? (
                            <span>${Number(rec.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* 3. Property Status (Badge + Date underneath) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {badge.label}
                          </span>
                          <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 pl-1">
                            {getStageDate(rec, rec.status || rec.stage)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Main Phone No. */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-mono" onClick={(e) => e.stopPropagation()}>
                        {rec.property_phone && rec.property_phone !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{rec.property_phone}</span>
                            <button
                              onClick={() => handleCopy(rec.property_phone || '', `prop_phone_${rec.id}`)}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedField === `prop_phone_${rec.id}` ? (
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

                      {/* 5. Management Group (Organization Name or -) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {rec.organization_name && rec.organization_name !== 'Unassigned Organization' && rec.organization_name !== 'Direct Portfolio' ? (
                          rec.organization_name
                        ) : (
                          <span className="text-slate-400 font-semibold">—</span>
                        )}
                      </td>

                      {/* 6. No. of Services */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {servicesCount} {servicesCount === 1 ? 'Service' : 'Services'}
                        </span>
                      </td>

                      {/* 7. E911 Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isE911Verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified
                          </span>
                        ) : isE911Correction ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Correction Req
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 8. Ray Baum and Kari's Law */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRayBaumCompliant ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = rec.property_id || rec.organization_property_id || rec.id;
                              window.open(`/admin/ray-baum/${targetId}`, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                            title="Click to view Ray Baum and Kari's Law dispatch records in a new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>View Ray Baum No.s</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* 9. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                        {rec.general_manager_name && rec.general_manager_name !== 'N/A' && rec.general_manager_name !== '—' ? (
                          rec.general_manager_name
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 10. GM Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_email && rec.general_manager_email !== 'N/A' && rec.general_manager_email !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{rec.general_manager_email}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_email || '', `gm_email_${rec.id}`)}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedField === `gm_email_${rec.id}` ? (
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

                      {/* 11. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openUnifiedModal(rec, 'DETAILS')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200/60 dark:border-blue-800/60 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, rec)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} requests
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                dispatch(setPagination({ currentPage: Math.max(1, pagination.currentPage - 1) }))
              }
              disabled={pagination.currentPage <= 1 || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => dispatch(setPagination({ currentPage: num }))}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  pagination.currentPage === num
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() =>
                dispatch(
                  setPagination({
                    currentPage: Math.min(pagination.totalPages, pagination.currentPage + 1),
                  })
                )
              }
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-DOTS ACTION POPUP (OPENS STRICTLY ABOVE) */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ bottom: `${menuPosition.bottom}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuPosition.record.property_name}
              </p>
              <p className="text-[10px] text-slate-400">Pipeline Actions</p>
            </div>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'DETAILS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View &amp; Edit Details</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-500" />
              <span>Stage Tracking Roadmap</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'MEDIA');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>PDFs &amp; Images ({menuPosition.record.attachments?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                setRecordToDelete(menuPosition.record);
                setShowDeleteModal(true);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 dark:border-[#222430]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Porting Record</span>
            </button>
          </div>
        </>
      )}

      {/* UNIFIED MODAL (DETAILS, STAGE TRACKING, AND PDFS & IMAGES TABS) */}
      <AnimatePresence>
        {showUnifiedModal && selectedRecord && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedRecord.property_name}
                    </h3>
                    <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tab Navigation: Details, Stage Tracking, PDFs & Images */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('DETAILS')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        activeTab === 'DETAILS'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('STAGE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        activeTab === 'STAGE'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Stage Tracking
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('MEDIA')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'MEDIA'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>PDFs &amp; Images</span>
                      {existingAttachments.length > 0 && (
                        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                          {existingAttachments.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowUnifiedModal(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TAB 1: DETAILS (COMPLETELY VIEWABLE & EDITABLE) */}
              {activeTab === 'DETAILS' && (
                <form onSubmit={handleSaveDetailsSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Hotel className="w-4 h-4 text-blue-500" /> Comprehensive Property Details (Editable)
                    </p>
                    <span className="text-[11px] text-slate-400">All fields sync with properties and client dashboard</span>
                  </div>

                  {/* Section 1: Property & Org Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Property Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={detailForm.property_name}
                        onChange={(e) => setDetailForm((p) => ({ ...p, property_name: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Management Group / Organization
                      </label>
                      <select
                        value={detailForm.organization_id}
                        onChange={(e) => setDetailForm((p) => ({ ...p, organization_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Direct Portfolio (Unassigned) --</option>
                        {orgOptions.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Main Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={detailForm.property_phone}
                        onChange={(e) => setDetailForm((p) => ({ ...p, property_phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Fax Number
                      </label>
                      <input
                        type="tel"
                        value={detailForm.fax}
                        onChange={(e) => setDetailForm((p) => ({ ...p, fax: e.target.value }))}
                        placeholder="e.g., (555) 987-6543"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {isSuperAdmin && (
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Monthly Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={detailForm.monthly_price}
                          onChange={(e) => setDetailForm((p) => ({ ...p, monthly_price: e.target.value }))}
                          placeholder="e.g., 249.00"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Channel Partner
                      </label>
                      <select
                        value={detailForm.partner_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const matched = partnerOptions.find((p) => p.id === pId);
                          setDetailForm((p) => ({
                            ...p,
                            partner_id: pId,
                            partner_commission_override: matched && (p.partner_commission_override === '' || p.partner_commission_override === null) ? matched.default_commission_rate : p.partner_commission_override,
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No Partner Assigned</option>
                        {partnerOptions.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} - {partner.default_commission_rate}%
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Partner Revenue Share (% Commission Override)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!detailForm.partner_id}
                          value={detailForm.partner_commission_override}
                          onChange={(e) => setDetailForm((p) => ({ ...p, partner_commission_override: e.target.value }))}
                          placeholder={
                            detailForm.partner_id
                              ? `${partnerOptions.find((p) => p.id === detailForm.partner_id)?.default_commission_rate ?? 0}% (Default Rate)`
                              : 'Select a partner first'
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                      </div>
                      {isSuperAdmin && detailForm.partner_id && detailForm.monthly_price && Number(detailForm.monthly_price) > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          Est. Monthly Partner Payout: $
                          {(
                            (Number(detailForm.monthly_price) *
                              Number(
                                detailForm.partner_commission_override !== ''
                                  ? detailForm.partner_commission_override
                                  : partnerOptions.find((p) => p.id === detailForm.partner_id)?.default_commission_rate || 0
                              )) /
                            100
                          ).toFixed(2)}
                          /mo
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Target Cutover Date
                      </label>
                      <input
                        type="date"
                        value={detailForm.target_date ? detailForm.target_date.split('T')[0] : ''}
                        onChange={(e) => setDetailForm((p) => ({ ...p, target_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section 2: Address */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-500" /> Physical &amp; Emergency Address
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-4">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={detailForm.property_address}
                          onChange={(e) => setDetailForm((p) => ({ ...p, property_address: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={detailForm.city}
                          onChange={(e) => setDetailForm((p) => ({ ...p, city: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          value={detailForm.state}
                          onChange={(e) => setDetailForm((p) => ({ ...p, state: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={detailForm.zip_code}
                          onChange={(e) => setDetailForm((p) => ({ ...p, zip_code: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: General Manager Contacts */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <User className="w-4 h-4 text-purple-500" /> General Manager / Onsite Contact
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          GM Full Name
                        </label>
                        <input
                          type="text"
                          value={detailForm.general_manager_name}
                          onChange={(e) => setDetailForm((p) => ({ ...p, general_manager_name: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          GM Phone Number
                        </label>
                        <input
                          type="tel"
                          value={detailForm.general_manager_phone}
                          onChange={(e) => setDetailForm((p) => ({ ...p, general_manager_phone: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          GM Email Address
                        </label>
                        <input
                          type="email"
                          value={detailForm.general_manager_email}
                          onChange={(e) => setDetailForm((p) => ({ ...p, general_manager_email: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Compliance & Carrier Info */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" /> Compliance Status &amp; Carrier Notes
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          E911 Compliance Status
                        </label>
                        <select
                          value={detailForm.e911_status}
                          onChange={(e) => setDetailForm((p) => ({ ...p, e911_status: e.target.value as any }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="VERIFIED">PSAP Verified (Compliant)</option>
                          <option value="AUDIT_REQUIRED">Audit Required</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Ray Baum &amp; Kari&apos;s Law
                        </label>
                        <select
                          value={detailForm.ray_baum_status}
                          onChange={(e) => setDetailForm((p) => ({
                            ...p,
                            ray_baum_status: e.target.value as any,
                            ray_baud_and_logs_enabled: e.target.value === 'ACTIVE',
                          }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
                        >
                          <option value="ACTIVE">Active (Compliant)</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Carrier Details / Porting Instructions
                        </label>
                        <textarea
                          rows={2}
                          value={detailForm.carrier_details}
                          onChange={(e) => setDetailForm((p) => ({ ...p, carrier_details: e.target.value }))}
                          placeholder="Carrier details, losing carrier account number, PIN..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Details Button */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="submit"
                      disabled={savingDetails}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Property Details</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: STAGE TRACKING (ROADMAP CURVED ROAD - EXACT SCREENSHOT MATCH) */}
              {activeTab === 'STAGE' && (
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {/* Stage Road Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Onboarding Progress Roadmap
                      </h4>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {getStageBadge(editStageStatus).pct}% Complete
                      </span>
                    </div>

                    {/* Progress Bar with Gradient Fill Animation */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getStageBadge(editStageStatus).pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
                      />
                    </div>

                    {/* 7 Stage Cards Grid (Exact Screenshot Layout) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {STAGES_ROAD.map((st, idx) => {
                        const currentStepIndex = STAGES_ROAD.findIndex(
                          (s) => s.key === editStageStatus
                        );
                        const isDone = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <motion.div
                            key={st.key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            onClick={() => handleStageSelect(st.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                                : isDone
                                ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                                : 'border-slate-200 dark:border-[#222430] opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#181920]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-[#222430] text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {isDone ? <Check className="w-3 h-3" /> : st.step}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                Stage {st.step}
                              </span>
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white text-xs">
                              {st.label}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                              {st.desc}
                            </p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Update Form */}
                  <form
                    onSubmit={handleUpdateStageSubmit}
                    className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-slate-900 dark:text-white block mb-1">
                          Set Next Lifecycle Stage
                        </label>
                        <select
                          value={editStageStatus}
                          onChange={(e) =>
                            handleStageSelect(e.target.value as LifecycleStage)
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {STAGES_ROAD.map((s) => (
                            <option key={s.key} value={s.key}>
                              Stage {s.step}: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-900 dark:text-white block mb-1">
                          Target Cutover Date
                        </label>
                        <input
                          type="date"
                          value={editTargetDate ? editTargetDate.split('T')[0] : ''}
                          onChange={(e) => setEditTargetDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Milestone Expected Completion Dates (All 8 Stages) */}
                    <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 dark:text-white block text-xs">
                          Milestone Expected Dates (All 8 Stages)
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Synced with client tracking view
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {STAGES_ROAD.map((s) => (
                          <div key={s.dateField} className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                              Stage {s.step}: {s.label}
                            </label>
                            <input
                              type="date"
                              value={(stageDates as any)[s.dateField] || ''}
                              onChange={(e) =>
                                setStageDates((prev) => ({
                                  ...prev,
                                  [s.dateField]: e.target.value,
                                }))
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* STAGE 3 & STAGE 4: ASSIGNEE & NOTES (ADMIN ONLY) */}
                    {isStage3OrAbove ? (
                      <div className="space-y-4">
                        {/* STAGE 3 ASSIGNMENT & NOTES */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 dark:from-[#131728] dark:via-[#13141a] dark:to-[#171a2a] border border-blue-200/80 dark:border-blue-800/50 rounded-xl space-y-4 shadow-sm"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-950/60 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                3
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                                  Stage 3: Contract Signed — Assignee &amp; Notes
                                </h4>
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                  Executed agreement verification, contract handoff &amp; operational notes
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                              <Lock className="w-3 h-3" /> Admin Only
                            </span>
                          </div>

                          {/* Stage 3 Assignee */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-900 dark:text-white block text-xs">
                                Stage 3 Assignee:
                              </label>
                              <div className="flex items-center p-0.5 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-lg text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setStage3AssignmentMode('TEAMMATE')}
                                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                    stage3AssignmentMode === 'TEAMMATE'
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Teammate List
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStage3AssignmentMode('CUSTOM')}
                                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                    stage3AssignmentMode === 'CUSTOM'
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Custom Name
                                </button>
                              </div>
                            </div>

                            {stage3AssignmentMode === 'TEAMMATE' ? (
                              <select
                                value={stage3AssignedTo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStage3AssignedTo(val);
                                  const found = teammates.find((t) => t.id === val);
                                  setStage3AssignedToName(found ? found.full_name || found.email : '');
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                <option value="">-- Select Teammate to Assign (Stage 3) --</option>
                                {teammates.map((tm) => (
                                  <option key={tm.id} value={tm.id}>
                                    {tm.full_name || tm.email} ({tm.role || 'Member'})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Enter custom assignee name or role for Stage 3..."
                                value={stage3AssignedToName}
                                onChange={(e) => {
                                  setStage3AssignedToName(e.target.value);
                                  setStage3AssignedTo('');
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                              />
                            )}
                          </div>

                          {/* Stage 3 Notes */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-900 dark:text-white block text-xs">
                              Stage 3 Operational Notes:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Add Stage 3 notes, contract signature details, GM signoff notes..."
                              value={stage3Notes}
                              onChange={(e) => setStage3Notes(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </motion.div>

                        {/* STAGE 4 ASSIGNMENT & NOTES */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-gradient-to-br from-teal-50/70 via-slate-50 to-emerald-50/50 dark:from-[#112022] dark:via-[#13141a] dark:to-[#12221b] border border-teal-200/80 dark:border-teal-800/50 rounded-xl space-y-4 shadow-sm"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-950/60 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                                4
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                                  Stage 4: CSR and Contract Details — Assignee &amp; Notes
                                </h4>
                                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                                  Customer Service Record (CSR) validation, losing carrier PIN &amp; technical details
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-semibold text-[10px] border border-teal-200 dark:border-teal-800">
                              <Lock className="w-3 h-3" /> Admin Only
                            </span>
                          </div>

                          {/* Stage 4 Assignee */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-900 dark:text-white block text-xs">
                                Stage 4 Assignee:
                              </label>
                              <div className="flex items-center p-0.5 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-lg text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setStage4AssignmentMode('TEAMMATE')}
                                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                    stage4AssignmentMode === 'TEAMMATE'
                                      ? 'bg-teal-600 text-white'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Teammate List
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setStage4AssignmentMode('CUSTOM')}
                                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                    stage4AssignmentMode === 'CUSTOM'
                                      ? 'bg-teal-600 text-white'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Custom Name
                                </button>
                              </div>
                            </div>

                            {stage4AssignmentMode === 'TEAMMATE' ? (
                              <select
                                value={stage4AssignedTo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStage4AssignedTo(val);
                                  const found = teammates.find((t) => t.id === val);
                                  setStage4AssignedToName(found ? found.full_name || found.email : '');
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500 cursor-pointer"
                              >
                                <option value="">-- Select Teammate to Assign (Stage 4) --</option>
                                {teammates.map((tm) => (
                                  <option key={tm.id} value={tm.id}>
                                    {tm.full_name || tm.email} ({tm.role || 'Member'})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Enter custom assignee name or role for Stage 4..."
                                value={stage4AssignedToName}
                                onChange={(e) => {
                                  setStage4AssignedToName(e.target.value);
                                  setStage4AssignedTo('');
                                }}
                                className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                              />
                            )}
                          </div>

                          {/* Stage 4 Notes */}
                          <div className="space-y-1.5">
                            <label className="font-bold text-slate-900 dark:text-white block text-xs">
                              Stage 4 Operational Notes:
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Add Stage 4 CSR notes, losing carrier BTN, account number, authorized contact info..."
                              value={stage4Notes}
                              onChange={(e) => setStage4Notes(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </motion.div>
                      </div>
                    ) : (
                      /* Locked banner for Stage 1 & 2 */
                      <div className="p-4 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-slate-200/80 dark:bg-[#1f212c] flex items-center justify-center shrink-0 text-slate-500">
                          <Lock className="w-4 h-4" />
                        </div>
                        <p className="text-xs leading-relaxed">
                          <strong className="text-slate-800 dark:text-slate-200">
                            Task Assignment &amp; Internal Notes
                          </strong>{' '}
                          unlocks at <strong>Stage 3 (Contract signed)</strong> and <strong>Stage 4 (CSR and contract details)</strong>. Once reached, you can assign teammates and log private operational notes for both stages.
                        </p>
                      </div>
                    )}

                    {/* Modal Submit Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                      <button
                        type="button"
                        onClick={() => setShowUnifiedModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingStage || uploadingFiles}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        {updatingStage || uploadingFiles ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          'Save & Apply Updates'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: PDFS & IMAGES GALLERY / UPLOADER */}
              {activeTab === 'MEDIA' && (
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" /> Attached PDFs &amp; Images
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        View, download, delete, and upload LOA, CSR, contracts, and property documents.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] font-semibold text-slate-700 dark:text-slate-300">
                      {existingAttachments.length} Total File{existingAttachments.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="border border-dashed border-indigo-200 dark:border-indigo-800/80 rounded-xl p-5 bg-indigo-50/20 dark:bg-indigo-950/10 text-center hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition">
                    <input
                      type="file"
                      multiple
                      id="media-tab-file-input"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setModalNewFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files || []),
                          ]);
                        }
                      }}
                    />
                    <label
                      htmlFor="media-tab-file-input"
                      className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">
                        Click to upload new PDFs or Images
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Supports PDF, PNG, JPG, JPEG, WEBP, DOCX, CSV (Max 25MB each)
                      </span>
                    </label>
                  </div>

                  {/* New Files Staged for Save */}
                  {modalNewFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                        Files Ready to Upload ({modalNewFiles.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {modalNewFiles.map((file, idx) => {
                          const isPdf = file.name.toLowerCase().endsWith('.pdf');
                          return (
                            <div
                              key={idx}
                              className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {isPdf ? (
                                  <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-blue-500 shrink-0" />
                                )}
                                <div className="truncate">
                                  <p className="font-medium text-slate-900 dark:text-white truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setModalNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Existing Files Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Saved Documents &amp; Media ({existingAttachments.length})
                    </span>

                    {existingAttachments.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430]">
                        <Paperclip className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                        <p>No documents or images attached yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {existingAttachments.map((att, i) => {
                          const isPdf = att.file_name?.toLowerCase().endsWith('.pdf') || att.mime_type === 'application/pdf';
                          const isImg = /\.(png|jpg|jpeg|webp|gif)$/i.test(att.file_name || '') || att.mime_type?.startsWith('image/');

                          return (
                            <div
                              key={att.storage_path || i}
                              className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-800/80 transition"
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isPdf ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' :
                                  isImg ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600' :
                                  'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
                                }`}>
                                  {isPdf ? <FileText className="w-4 h-4" /> : isImg ? <ImageIcon className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                                    {att.file_name}
                                  </p>
                                  <p className="text-[10px] text-slate-400">{formatFileSize(att.file_size)}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(att)}
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer transition"
                                  title="View / Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(att.storage_path)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
                                  title="Delete file"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Save Media Button */}
                  <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={handleSaveMediaSubmit}
                      disabled={uploadingFiles}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      {uploadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Attachments</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE PORTING MODAL (WITH EVERY PROPERTY DETAIL + COMPLIANCE) */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Initialize Porting &amp; Property Record
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter full property details, telecom information, and initial lifecycle stage.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {createError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* 1. BASIC PROPERTY & ORG INFO */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Hotel className="w-4 h-4 text-blue-500" /> Property &amp; Organization Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Management Group / Organization
                      </label>
                      <select
                        value={createForm.organization_id}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, organization_id: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Direct Portfolio (None) --</option>
                        {orgOptions.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Property Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Grand Hotel Downtown"
                        value={createForm.property_name}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, property_name: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Main Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g., (555) 123-4567"
                        value={createForm.property_phone}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, property_phone: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Fax Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (555) 987-6543"
                        value={createForm.fax}
                        onChange={(e) => setCreateForm((p) => ({ ...p, fax: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {isSuperAdmin && (
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Monthly Price ($)
                        </label>
                        <div className="relative">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 249.00"
                            value={createForm.monthly_price}
                            onChange={(e) =>
                              setCreateForm((p) => ({ ...p, monthly_price: e.target.value }))
                            }
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Channel Partner
                      </label>
                      <select
                        value={createForm.partner_id}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const matched = partnerOptions.find((p) => p.id === pId);
                          setCreateForm((p) => ({
                            ...p,
                            partner_id: pId,
                            partner_commission_override: matched && (p.partner_commission_override === '' || p.partner_commission_override === null) ? matched.default_commission_rate : p.partner_commission_override,
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No Partner Assigned</option>
                        {partnerOptions.map((partner) => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} - {partner.default_commission_rate}%
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Partner Revenue Share (% Commission Override)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!createForm.partner_id}
                          value={createForm.partner_commission_override}
                          onChange={(e) => setCreateForm((p) => ({ ...p, partner_commission_override: e.target.value }))}
                          placeholder={
                            createForm.partner_id
                              ? `${partnerOptions.find((p) => p.id === createForm.partner_id)?.default_commission_rate ?? 0}% (Default Rate)`
                              : 'Select a partner first'
                          }
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                      </div>
                      {isSuperAdmin && createForm.partner_id && createForm.monthly_price && Number(createForm.monthly_price) > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          Est. Monthly Partner Payout: $
                          {(
                            (Number(createForm.monthly_price) *
                              Number(
                                createForm.partner_commission_override !== ''
                                  ? createForm.partner_commission_override
                                  : partnerOptions.find((p) => p.id === createForm.partner_id)?.default_commission_rate || 0
                              )) /
                            100
                          ).toFixed(2)}
                          /mo
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Target Cutover Date
                      </label>
                      <input
                        type="date"
                        value={createForm.target_date}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, target_date: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. PHYSICAL LOCATION ADDRESS */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" /> Physical Location &amp; Emergency Address
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-4">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 742 Evergreen Terrace"
                        value={createForm.address}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, address: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Springfield"
                        value={createForm.city}
                        onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., OR"
                        value={createForm.state}
                        onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 97477"
                        value={createForm.zip_code}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, zip_code: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. GENERAL MANAGER / ONSITE CONTACT */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-500" /> General Manager &amp; Onsite Contact
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        GM Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Sarah Connor"
                        value={createForm.general_manager_name}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            general_manager_name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        GM Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g., (555) 345-6789"
                        value={createForm.general_manager_phone}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            general_manager_phone: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        GM Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g., gm@grandhotel.com"
                        value={createForm.general_manager_email}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            general_manager_email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. COMPLIANCE & LIFECYCLE STAGE */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" /> Compliance &amp; Initial Stage
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Initial Lifecycle Stage
                      </label>
                      <select
                        value={createForm.status}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            status: e.target.value as LifecycleStage,
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        {STAGES_ROAD.map((s) => (
                          <option key={s.key} value={s.key}>
                            Stage {s.step}: {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        E911 Compliance Status
                      </label>
                      <select
                        value={createForm.e911_status}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            e911_status: e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED',
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="VERIFIED">PSAP Verified (Compliant)</option>
                        <option value="AUDIT_REQUIRED">Audit Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Ray Baum &amp; Kari&apos;s Law
                      </label>
                      <select
                        value={createForm.ray_baum_status}
                        onChange={(e) =>
                          setCreateForm((p) => ({
                            ...p,
                            ray_baum_status: e.target.value as 'ACTIVE' | 'INACTIVE',
                            ray_baud_and_logs_enabled: e.target.value === 'ACTIVE',
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
                      >
                        <option value="ACTIVE">Active (Compliant)</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Losing Carrier &amp; Porting Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Losing carrier: Verizon, Account #: 987123847, PIN: 1234"
                        value={createForm.carrier_details}
                        onChange={(e) =>
                          setCreateForm((p) => ({ ...p, carrier_details: e.target.value }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. ATTACHMENTS UPLOAD */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-indigo-500" /> Porting Documents &amp; Authorizations (PDFs &amp; Images)
                  </h4>

                  <div className="border border-dashed border-slate-300 dark:border-[#2a2c3a] rounded-xl p-4 bg-slate-50/50 dark:bg-[#111217]/50 text-center hover:bg-slate-50 dark:hover:bg-[#111217] transition">
                    <input
                      type="file"
                      multiple
                      id="create-porting-files"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setCreateFiles((prev) => [
                            ...prev,
                            ...Array.from(e.target.files || []),
                          ]);
                        }
                      }}
                    />
                    <label
                      htmlFor="create-porting-files"
                      className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400"
                    >
                      <Upload className="w-6 h-6 text-blue-500" />
                      <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                        Click to upload LOA, CSR, contracts or billing copies
                      </span>
                      <span className="text-[10px] text-slate-400">
                        PDF, DOCX, CSV, PNG, JPG (Multiple files supported)
                      </span>
                    </label>
                  </div>

                  {createFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        Selected Files ({createFiles.length})
                      </span>
                      <div className="space-y-1">
                        {createFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCreateFiles((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {createLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Initializing...
                      </>
                    ) : (
                      'Initialize Porting'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && recordToDelete && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Delete Porting Request?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Are you sure you want to delete the porting request for{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {recordToDelete.property_name}
                  </strong>
                  ? This will remove all associated porting attachments.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#1f212c] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={deleteLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
