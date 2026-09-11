'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GitBranch,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Settings,
  ShieldCheck,
  Building2,
  Hotel,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Archive,
  BarChart3,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  Network,
  LayoutGrid,
  List,
  PhoneCall,
  Calendar,
  FileCheck,
  Send,
  Kanban,
  CheckCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'PORTING_WAITING'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

interface OnboardingRecord {
  id: string;
  organization_property_id?: string;
  organization_id?: string;
  organization_name: string;
  property_id?: string;
  property_name: string;
  property_city?: string;
  property_state?: string;
  brand?: string;
  status: OnboardingStatus;
  target_date: string | null;
  contract_sent_at?: string | null;
  signed_at?: string | null;
  porting_waiting_at?: string | null;
  porting_submitted_at?: string | null;
  sof_waiting_at?: string | null;
  foc_received_at?: string | null;
  completed_at?: string | null;
  progress_pct: number;
  open_tickets_count?: number;
  dids_count?: number;
  created_at: string;
}

const STAGES: { key: OnboardingStatus; label: string; pct: number; color: string }[] = [
  { key: 'DRAFT', label: 'Draft', pct: 10, color: 'bg-slate-500' },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', pct: 25, color: 'bg-indigo-500' },
  { key: 'SIGNED', label: 'Signed', pct: 40, color: 'bg-blue-500' },
  { key: 'PORTING_WAITING', label: 'Waiting for LOA', pct: 55, color: 'bg-amber-500' },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', pct: 70, color: 'bg-sky-500' },
  { key: 'SOF_WAITING', label: 'SOF Review', pct: 80, color: 'bg-purple-500' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', pct: 90, color: 'bg-teal-500' },
  { key: 'COMPLETED', label: 'Live Cutover', pct: 100, color: 'bg-emerald-500' },
];

const INITIAL_ONBOARDINGS: OnboardingRecord[] = [
  {
    id: 'ob-1',
    organization_name: 'Shamin Hotels',
    property_name: 'Courtyard Richmond Downtown',
    property_city: 'Richmond',
    property_state: 'VA',
    brand: 'Courtyard by Marriott',
    status: 'COMPLETED',
    target_date: '2025-02-15',
    contract_sent_at: '2025-01-15T09:00:00Z',
    signed_at: '2025-01-18T14:30:00Z',
    porting_submitted_at: '2025-01-22T10:00:00Z',
    foc_received_at: '2025-02-05T16:00:00Z',
    completed_at: '2025-02-14T11:00:00Z',
    progress_pct: 100,
    open_tickets_count: 0,
    dids_count: 36,
    created_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'ob-2',
    organization_name: 'Summit Hospitality Partners',
    property_name: 'Residence Inn Austin Downtown',
    property_city: 'Austin',
    property_state: 'TX',
    brand: 'Residence Inn',
    status: 'FOC_RECEIVED',
    target_date: '2025-03-24',
    contract_sent_at: '2025-02-28T10:00:00Z',
    signed_at: '2025-03-02T11:30:00Z',
    porting_submitted_at: '2025-03-05T15:00:00Z',
    foc_received_at: '2025-03-12T09:00:00Z',
    progress_pct: 90,
    open_tickets_count: 0,
    dids_count: 24,
    created_at: '2025-02-28T10:00:00Z',
  },
  {
    id: 'ob-3',
    organization_name: 'Pacific West Hospitality',
    property_name: 'Westin Seattle Waterfront',
    property_city: 'Seattle',
    property_state: 'WA',
    brand: 'Westin Hotels',
    status: 'PORTING_SUBMITTED',
    target_date: '2025-03-30',
    contract_sent_at: '2025-03-01T14:00:00Z',
    signed_at: '2025-03-04T16:00:00Z',
    porting_submitted_at: '2025-03-10T12:00:00Z',
    progress_pct: 70,
    open_tickets_count: 1,
    dids_count: 60,
    created_at: '2025-03-01T14:00:00Z',
  },
  {
    id: 'ob-4',
    organization_name: 'XYZ Hotel Management',
    property_name: 'Hyatt Regency Chicago Loop',
    property_city: 'Chicago',
    property_state: 'IL',
    brand: 'Hyatt Regency',
    status: 'SOF_WAITING',
    target_date: '2025-04-05',
    contract_sent_at: '2025-03-05T11:00:00Z',
    signed_at: '2025-03-08T09:30:00Z',
    porting_submitted_at: '2025-03-11T14:00:00Z',
    sof_waiting_at: '2025-03-11T14:00:00Z',
    progress_pct: 80,
    open_tickets_count: 0,
    dids_count: 85,
    created_at: '2025-03-05T11:00:00Z',
  },
  {
    id: 'ob-5',
    organization_name: 'ABC Hospitality',
    property_name: 'Marriott Marquis San Francisco',
    property_city: 'San Francisco',
    property_state: 'CA',
    brand: 'Marriott Hotels',
    status: 'CONTRACT_SENT',
    target_date: '2025-04-18',
    contract_sent_at: '2025-03-11T15:30:00Z',
    progress_pct: 25,
    open_tickets_count: 0,
    dids_count: 120,
    created_at: '2025-03-11T15:30:00Z',
  },
  {
    id: 'ob-6',
    organization_name: 'Crestview Luxury Resorts',
    property_name: 'Crestview Ocean Grand Resort',
    property_city: 'Miami Beach',
    property_state: 'FL',
    brand: 'Independent Luxury',
    status: 'SIGNED',
    target_date: '2025-04-12',
    contract_sent_at: '2025-03-06T10:00:00Z',
    signed_at: '2025-03-09T18:00:00Z',
    progress_pct: 40,
    open_tickets_count: 0,
    dids_count: 70,
    created_at: '2025-03-06T10:00:00Z',
  },
];

function getStageBadge(status: OnboardingStatus): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', pct: 10 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', pct: 25 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', pct: 40 };
    case 'PORTING_WAITING':
      return { label: 'Waiting for LOA', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', pct: 55 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', pct: 70 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', pct: 80 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', pct: 90 };
    case 'COMPLETED':
      return { label: 'Live Cutover', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', pct: 100 };
    default:
      return { label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', pct: 0 };
  }
}

export default function AdminOnboardingPortingPage() {
  const supabase = createClient();

  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>(INITIAL_ONBOARDINGS);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState<OnboardingRecord | null>(null);
  const [drawerOnboarding, setDrawerOnboarding] = useState<OnboardingRecord | null>(null);

  // Form State
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    property_name: '',
    organization_name: 'Shamin Hotels',
    brand: 'Courtyard by Marriott',
    status: 'CONTRACT_SENT' as OnboardingStatus,
    target_date: '',
    dids_count: 24,
  });

  // Filtered
  const filteredOnboardings = useMemo(() => {
    return onboardings.filter((ob) => {
      const matchesSearch =
        ob.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ob.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ob.brand && ob.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ob.property_city && ob.property_city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStage = selectedStageFilter === 'ALL' || ob.status === selectedStageFilter;
      const matchesOrg = selectedOrgFilter === 'ALL' || ob.organization_name.includes(selectedOrgFilter);

      return matchesSearch && matchesStage && matchesOrg;
    });
  }, [onboardings, searchQuery, selectedStageFilter, selectedOrgFilter]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredOnboardings.length / itemsPerPage) || 1;
  const paginatedOnboardings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOnboardings.slice(start, start + itemsPerPage);
  }, [filteredOnboardings, currentPage, itemsPerPage]);

  // KPIs
  const activeCount = onboardings.filter((o) => o.status !== 'COMPLETED').length;
  const focConfirmedCount = onboardings.filter((o) => o.status === 'FOC_RECEIVED').length;
  const waitingActionCount = onboardings.filter((o) => o.status === 'PORTING_WAITING' || o.status === 'SOF_WAITING' || o.status === 'CONTRACT_SENT').length;
  const completedCount = onboardings.filter((o) => o.status === 'COMPLETED').length;

  // Actions
  const handleOpenCreate = () => {
    setFormData({
      property_name: '',
      organization_name: 'Shamin Hotels',
      brand: 'Courtyard by Marriott',
      status: 'CONTRACT_SENT',
      target_date: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      dids_count: 24,
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenAdvance = (ob: OnboardingRecord) => {
    setSelectedOnboarding(ob);
    setShowAdvanceModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_name.trim()) {
      setFormError('Property name is required.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const stageInfo = getStageBadge(formData.status);
      const newOb: OnboardingRecord = {
        id: `ob-${Date.now()}`,
        property_name: formData.property_name.trim(),
        organization_name: formData.organization_name,
        brand: formData.brand,
        property_city: 'Richmond',
        property_state: 'VA',
        status: formData.status,
        target_date: formData.target_date || null,
        contract_sent_at: new Date().toISOString(),
        progress_pct: stageInfo.pct,
        open_tickets_count: 0,
        dids_count: Number(formData.dids_count) || 12,
        created_at: new Date().toISOString(),
      };

      setOnboardings([newOb, ...onboardings]);
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create onboarding');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAdvanceStatus = async (targetStatus: OnboardingStatus) => {
    if (!selectedOnboarding) return;

    try {
      const stageInfo = getStageBadge(targetStatus);
      const now = new Date().toISOString();

      setOnboardings((prev) =>
        prev.map((o) =>
          o.id === selectedOnboarding.id
            ? {
                ...o,
                status: targetStatus,
                progress_pct: stageInfo.pct,
                signed_at: targetStatus === 'SIGNED' ? now : o.signed_at,
                porting_submitted_at: targetStatus === 'PORTING_SUBMITTED' ? now : o.porting_submitted_at,
                foc_received_at: targetStatus === 'FOC_RECEIVED' ? now : o.foc_received_at,
                completed_at: targetStatus === 'COMPLETED' ? now : o.completed_at,
              }
            : o
        )
      );

      if (drawerOnboarding && drawerOnboarding.id === selectedOnboarding.id) {
        setDrawerOnboarding({
          ...drawerOnboarding,
          status: targetStatus,
          progress_pct: stageInfo.pct,
        });
      }

      setShowAdvanceModal(false);
    } catch (err) {
      console.error('Error advancing milestone:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Property Name',
      'Organization',
      'Brand',
      'Status Stage',
      'Progress %',
      'Target Date',
      'DIDs Count',
      'Created Date',
    ];

    const rows = filteredOnboardings.map((o) => [
      `"${o.property_name.replace(/"/g, '""')}"`,
      `"${o.organization_name.replace(/"/g, '""')}"`,
      `"${(o.brand || '').replace(/"/g, '""')}"`,
      o.status,
      `${o.progress_pct}%`,
      o.target_date || 'TBD',
      o.dids_count || 0,
      new Date(o.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AAA_Onboarding_Pipelines_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Onboarding &amp; Porting Pipelines</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {activeCount} Active Workflows
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track property telecom contract signing, carrier LOA validation, FOC scheduled cutover milestones, and live PBX activation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedStageFilter('ALL');
              setSelectedOrgFilter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Property Onboarding</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workflows */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Onboardings
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{activeCount}</span>
              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                4 Due This Week
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Pipeline In-Flight</span>
              <span className="font-semibold text-slate-700">100% On-Schedule</span>
            </div>
          </div>
        </div>

        {/* FOC Confirmed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              FOC Date Confirmed
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{focConfirmedCount}</span>
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                &lt; 3d Target
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Carrier Ready</span>
              <span className="font-semibold text-teal-700">Porting Staged</span>
            </div>
          </div>
        </div>

        {/* Action Required / SOF Waiting */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Waiting Action / LOA
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{waitingActionCount}</span>
              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Action Pending
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Customer / Carrier</span>
              <span className="font-semibold text-amber-600">48h SLA Alert</span>
            </div>
          </div>
        </div>

        {/* Live Cutover Completed */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed Cutovers
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{completedCount}</span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                14.2d Avg Velocity
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Production Live</span>
              <span className="font-semibold text-emerald-600">98.2% Ontime</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search hotel property, franchise organization, city..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ⌘F
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Stage Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Stage:</span>
            <select
              value={selectedStageFilter}
              onChange={(e) => {
                setSelectedStageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} ({s.pct}%)
                </option>
              ))}
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded ${
                viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded ${
                viewMode === 'KANBAN' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table / Kanban Representation */}
      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Property &amp; Organization</th>
                  <th className="py-3 px-4">Pipeline Milestone Stage</th>
                  <th className="py-3 px-4">Completion Progress</th>
                  <th className="py-3 px-4">Target Cutover Date</th>
                  <th className="py-3 px-4">Phone Lines</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOnboardings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No onboarding workflows matching criteria</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Create a new property onboarding or clear filter parameters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOnboardings.map((ob) => {
                    const stage = getStageBadge(ob.status);

                    return (
                      <tr
                        key={ob.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setDrawerOnboarding(ob)}
                      >
                        {/* 1. Property & Organization */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100 shadow-xs">
                              <Hotel className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                                {ob.property_name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-semibold text-indigo-700">{ob.organization_name}</span>
                                <span>•</span>
                                <span>
                                  {ob.property_city}, {ob.property_state}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Milestone Stage */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${stage.bg} ${stage.text} border ${stage.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {stage.label}
                          </span>
                        </td>

                        {/* 3. Progress Bar */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                              <span>Progress</span>
                              <span>{stage.pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#4338ca] transition-all duration-300"
                                style={{ width: `${stage.pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Target Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ob.target_date || 'Target Not Set'}</span>
                          </div>
                        </td>

                        {/* 5. Phone Lines */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800">{ob.dids_count || 12} DIDs</span>
                          <span className="text-[11px] text-slate-400 block">Staged for Port</span>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenAdvance(ob)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors border border-indigo-200"
                            >
                              Advance Stage
                            </button>
                            <button
                              onClick={() => setDrawerOnboarding(ob)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Details"
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

          {/* Pagination Footer */}
          <div className="py-3 px-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {filteredOnboardings.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredOnboardings.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredOnboardings.length}</span>{' '}
              workflows
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-[#4338ca] text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {STAGES.slice(1, 7).map((stage) => {
            const stageOnboardings = filteredOnboardings.filter((o) => o.status === stage.key);

            return (
              <div key={stage.key} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800">{stage.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                    {stageOnboardings.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {stageOnboardings.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No workflows in this stage
                    </div>
                  ) : (
                    stageOnboardings.map((ob) => (
                      <div
                        key={ob.id}
                        onClick={() => setDrawerOnboarding(ob)}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {ob.property_name}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{ob.organization_name}</div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>Target: {ob.target_date || 'TBD'}</span>
                          <span className="font-bold text-slate-700">{ob.dids_count || 12} DIDs</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE ONBOARDING WORKFLOW MODAL                                       */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Initiate Property Onboarding</h2>
                  <p className="text-xs text-slate-500">
                    Launch telecom contract execution, LOA submission, and porting pipeline for a hotel property.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Property Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.property_name}
                  onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                  placeholder="e.g. Hilton Garden Inn Glen Allen"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Organization Tenant</label>
                  <select
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Shamin Hotels">Shamin Hotels</option>
                    <option value="ABC Hospitality">ABC Hospitality</option>
                    <option value="Summit Hospitality Partners">Summit Hospitality Partners</option>
                    <option value="XYZ Hotel Management">XYZ Hotel Management</option>
                    <option value="Crestview Luxury Resorts">Crestview Luxury Resorts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hotel Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Hilton Garden Inn"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Target Cutover Date</label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Total DIDs / Phone Lines</label>
                  <input
                    type="number"
                    value={formData.dids_count}
                    onChange={(e) => setFormData({ ...formData, dids_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold disabled:opacity-50 shadow-sm"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Launch Pipeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADVANCE MILESTONE STAGE MODAL                                          */}
      {/* ========================================================================= */}
      {showAdvanceModal && selectedOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Advance Milestone Stage</h3>
              </div>
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Advance onboarding pipeline for{' '}
              <span className="font-bold text-slate-900">{selectedOnboarding.property_name}</span>.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              {STAGES.map((st) => (
                <button
                  key={st.key}
                  onClick={() => handleAdvanceStatus(st.key)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedOnboarding.status === st.key
                      ? 'border-indigo-500 bg-indigo-50/50 font-bold text-indigo-900'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                    <span className="font-semibold text-slate-800">{st.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{st.pct}%</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SINGLE-ONBOARDING WORKFLOW SLIDE-OVER DRAWER                           */}
      {/* ========================================================================= */}
      {drawerOnboarding && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{drawerOnboarding.property_name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-700">{drawerOnboarding.organization_name}</span>
                    <span>•</span>
                    <span>{drawerOnboarding.brand}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAdvance(drawerOnboarding)}
                  className="px-3 py-1.5 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  Advance Stage
                </button>
                <button
                  onClick={() => setDrawerOnboarding(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Progress Tracker */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Milestone Progress ({drawerOnboarding.progress_pct}%)
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      getStageBadge(drawerOnboarding.status).bg
                    } ${getStageBadge(drawerOnboarding.status).text}`}
                  >
                    {getStageBadge(drawerOnboarding.status).label}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4338ca] transition-all duration-300"
                    style={{ width: `${drawerOnboarding.progress_pct}%` }}
                  ></div>
                </div>
              </div>

              {/* Milestone Timeline */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Execution Milestone History
                </h4>
                <div className="space-y-2">
                  {STAGES.map((st, i) => {
                    const isPassed = drawerOnboarding.progress_pct >= st.pct;
                    const isCurrent = drawerOnboarding.status === st.key;

                    return (
                      <div
                        key={st.key}
                        className={`p-3 rounded-xl border flex items-center justify-between ${
                          isCurrent
                            ? 'bg-indigo-50/60 border-indigo-300'
                            : isPassed
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isPassed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isPassed ? <Check className="w-3.5 h-3.5" /> : i + 1}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{st.label}</span>
                            <span className="text-[10.5px] text-slate-500">
                              {isPassed ? 'Completed & Logged' : 'Pending Milestone Step'}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">{st.pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Document & Porting Checklist */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Telecom Document Checklist
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Master Telecommunications Agreement (Signed)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Letter of Authorization (LOA) for {drawerOnboarding.dids_count || 12} DIDs</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Service Order Form (SOF) &amp; Carrier Rate Schedule</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedOnboarding(drawerOnboarding);
                  setShowAdvanceModal(true);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
              >
                Change Stage
              </button>
              <button
                onClick={() => setDrawerOnboarding(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
