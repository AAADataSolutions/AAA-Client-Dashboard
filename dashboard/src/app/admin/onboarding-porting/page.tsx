'use client';

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Settings,
  Hotel,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  X,
  Edit2,
  Calendar,
  Kanban,
  CheckCircle,
  Sparkles,
  PhoneCall,
  Check,
  Loader2,
  List,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  organization_name: string;
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
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', pct: 70, color: 'bg-purple-500' },
  { key: 'SOF_WAITING', label: 'SOF Review', pct: 80, color: 'bg-amber-500' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', pct: 90, color: 'bg-sky-500' },
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
];

function getStageBadge(status: OnboardingStatus): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft', bg: 'bg-slate-100 dark:bg-[#20222a]', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-[#2e313d]', pct: 10 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/40', pct: 25 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/40', pct: 40 };
    case 'PORTING_WAITING':
      return { label: 'Waiting for LOA', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/40', pct: 55 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/40', pct: 70 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/40', pct: 80 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/40', pct: 90 };
    case 'COMPLETED':
      return { label: 'Live Cutover', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/40', pct: 100 };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', pct: 0 };
  }
}

export default function AdminOnboardingPortingPage() {
  const [onboardings, setOnboardings] = useState<OnboardingRecord[]>(INITIAL_ONBOARDINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'KANBAN'>('LIST');

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

  const filteredOnboardings = useMemo(() => {
    return onboardings.filter((ob) => {
      const matchesSearch =
        ob.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ob.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ob.brand && ob.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ob.property_city && ob.property_city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStage = selectedStageFilter === 'ALL' || ob.status === selectedStageFilter;
      return matchesSearch && matchesStage;
    });
  }, [onboardings, searchQuery, selectedStageFilter]);

  const activeCount = onboardings.filter((o) => o.status !== 'COMPLETED').length;
  const focConfirmedCount = onboardings.filter((o) => o.status === 'FOC_RECEIVED').length;
  const waitingActionCount = onboardings.filter((o) => o.status === 'PORTING_WAITING' || o.status === 'SOF_WAITING' || o.status === 'CONTRACT_SENT').length;
  const completedCount = onboardings.filter((o) => o.status === 'COMPLETED').length;

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_name.trim()) {
      setFormError('Property name is required.');
      return;
    }

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
  };

  const handleAdvanceStatus = (targetStatus: OnboardingStatus) => {
    if (!selectedOnboarding) return;
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
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#f97316] block">
            OPERATIONS
          </span>
          <div className="flex items-center gap-3 mt-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Onboarding &amp; Porting Pipelines
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-[#f97316] border border-amber-500/30">
              {activeCount} Active Workflows
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track property telecom contract signing, carrier LOA validation, FOC scheduled cutover milestones, and live PBX activation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const headers = ['Property Name', 'Organization', 'Status', 'Progress %', 'Target Date'];
              const rows = filteredOnboardings.map((o) => [`"${o.property_name}"`, `"${o.organization_name}"`, o.status, `${o.progress_pct}%`, o.target_date || 'TBD']);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const link = document.createElement('a');
              link.setAttribute('href', encodeURI(csvContent));
              link.setAttribute('download', `AAA_Onboarding_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] hover:bg-slate-50 dark:hover:bg-[#1e1f27] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedStageFilter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] hover:bg-slate-50 dark:hover:bg-[#1e1f27] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] dark:bg-[#f97316] dark:hover:bg-[#ea580c] text-white font-semibold text-xs transition-all shadow-sm shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Property Onboarding</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Workflows */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#f97316] flex items-center justify-center font-bold">
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Onboardings
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{activeCount}</span>
                <span className="text-[10.5px] font-semibold text-orange-600 dark:text-[#f97316] bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                  4 Due This Week
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Pipeline In-Flight • <span className="font-semibold text-slate-700 dark:text-slate-200">100% On-Schedule</span>
              </div>
            </div>
            {/* Sparkline wave */}
            <svg className="w-16 h-8 text-[#f97316]" viewBox="0 0 64 32" fill="none">
              <path d="M0 26 C16 26, 24 10, 40 18 C48 24, 56 6, 64 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* FOC Date Confirmed */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                FOC Date Confirmed
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{focConfirmedCount}</span>
                <span className="text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  &lt; 3d Target
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Carrier Ready • <span className="font-semibold text-emerald-500">Porting Staged</span>
              </div>
            </div>
            <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 64 32" fill="none">
              <path d="M0 22 C12 28, 28 20, 44 26 C52 28, 58 10, 64 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Waiting Action / LOA */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Waiting Action / LOA
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{waitingActionCount}</span>
                <span className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Action Pending
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Customer / Carrier • <span className="font-semibold text-amber-500">48h SLA Alert</span>
              </div>
            </div>
            <svg className="w-16 h-8 text-amber-500" viewBox="0 0 64 32" fill="none">
              <path d="M0 24 C16 20, 32 30, 48 16 C56 10, 60 18, 64 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Completed Cutovers */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Completed Cutovers
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{completedCount}</span>
                <span className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                  14.2d Avg Velocity
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Production Live • <span className="font-semibold text-purple-400">98.2% Ontime</span>
              </div>
            </div>
            <svg className="w-16 h-8 text-purple-400" viewBox="0 0 64 32" fill="none">
              <path d="M0 26 C16 28, 30 18, 44 22 C52 24, 58 8, 64 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hotel property, franchise organization, city..."
            className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:border-[#f97316] rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-[#1a1b22] border border-slate-200 dark:border-[#272935] rounded">
            ⌘F
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Stage:</span>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#15161c]">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key} className="dark:bg-[#15161c]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-[#111217] p-0.5 rounded-lg border border-slate-200 dark:border-[#232530]">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded ${
                viewMode === 'LIST' ? 'bg-white dark:bg-[#1e1f27] text-[#f97316] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded ${
                viewMode === 'KANBAN' ? 'bg-white dark:bg-[#1e1f27] text-[#f97316] shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table View (Matching Screenshot Exact Look) */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Property &amp; Organization</th>
                <th className="py-3 px-4">Pipeline Milestone Stage</th>
                <th className="py-3 px-4">Completion Progress</th>
                <th className="py-3 px-4">Target Cutover Date</th>
                <th className="py-3 px-4">Phone Lines</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a] text-xs">
              {filteredOnboardings.map((ob) => {
                const stage = getStageBadge(ob.status);

                return (
                  <tr
                    key={ob.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors group cursor-pointer"
                    onClick={() => setDrawerOnboarding(ob)}
                  >
                    {/* Property */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#20222a] flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-[#2d303b]">
                          <Hotel className="w-5 h-5 text-[#f97316]" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors block text-xs">
                            {ob.property_name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                            <span className="text-indigo-600 dark:text-[#f97316] font-semibold">{ob.organization_name}</span> • {ob.property_city}, {ob.property_state}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Milestone Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${stage.bg} ${stage.text} border ${stage.border}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {stage.label}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>Progress</span>
                          <span>{stage.pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#222430] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#f97316] transition-all duration-300"
                            style={{ width: `${stage.pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Target Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{ob.target_date || 'Target Not Set'}</span>
                      </div>
                    </td>

                    {/* Phone Lines */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{ob.dids_count || 12} DIDs</span>
                      <span className="text-[10.5px] text-slate-400 dark:text-slate-500 block">Staged for Port</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdvance(ob)}
                          className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#20222a] hover:bg-slate-200 dark:hover:bg-[#282a36] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-200 dark:border-[#2e313e]"
                        >
                          Advance Stage
                        </button>
                        <button
                          onClick={() => setDrawerOnboarding(ob)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                        >
                          <MoreVertical className="w-4 h-4" />
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

      {/* Advance Modal */}
      {showAdvanceModal && selectedOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430] shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#f97316]" />
                <h3 className="font-bold text-slate-900 dark:text-white">Advance Milestone Stage</h3>
              </div>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
              Advance onboarding pipeline for <strong className="text-slate-900 dark:text-white">{selectedOnboarding.property_name}</strong>.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              {STAGES.map((st) => (
                <button
                  key={st.key}
                  onClick={() => handleAdvanceStatus(st.key)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedOnboarding.status === st.key
                      ? 'border-orange-500 bg-orange-500/10 font-bold text-[#f97316]'
                      : 'border-slate-200 dark:border-[#252733] hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${st.color}`}></span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{st.label}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{st.pct}%</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
