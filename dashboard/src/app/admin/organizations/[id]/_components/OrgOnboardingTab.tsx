'use client';

import React from 'react';
import {
  Hotel,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  Download,
  SlidersHorizontal,
  Plus,
  Search,
  X,
  Check,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { type OrgDetail, STAGES_ROAD, getStageBadge } from './types';

interface OrgOnboardingTabProps {
  org: OrgDetail;
  onbSearchInput: string;
  setOnbSearchInput: (val: string) => void;
  onbStageFilter: string;
  setOnbStageFilter: (val: string) => void;
  onbSortBy: string;
  setOnbSortBy: (val: string) => void;
  handleExportOnbCSV: () => void;
  setInitOnbError: (val: string | null) => void;
  setShowInitOnbModal: (show: boolean) => void;
  openUnifiedOnboardingModal: (record: any, tab?: 'DETAILS' | 'STAGE') => void;
  handleCopy: (text: string, id: string, e?: React.MouseEvent) => void;
  copiedId: string | null;
  setOnboardingMenuPosition: (pos: { onb: any; bottom: number; left: number } | null) => void;
}

export function OrgOnboardingTab({
  org,
  onbSearchInput,
  setOnbSearchInput,
  onbStageFilter,
  setOnbStageFilter,
  onbSortBy,
  setOnbSortBy,
  handleExportOnbCSV,
  setInitOnbError,
  setShowInitOnbModal,
  openUnifiedOnboardingModal,
  handleCopy,
  copiedId,
  setOnboardingMenuPosition,
}: OrgOnboardingTabProps) {
  const totalOnb = org.onboardings?.length || 0;
  const inFlightOnb = (org.onboardings || []).filter((o: any) =>
    ['PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED'].includes(o.stage || o.status)
  ).length;
  const draftPendingOnb = (org.onboardings || []).filter((o: any) =>
    ['DRAFT', 'CONTRACT_SENT', 'SIGNED'].includes(o.stage || o.status)
  ).length;
  const completedOnb = (org.onboardings || []).filter((o: any) =>
    ['COMPLETED', 'LIVE_CUTOVER'].includes(o.stage || o.status)
  ).length;

  const filteredOnboardings = (org.onboardings || []).filter((onb: any) => {
    const q = onbSearchInput.trim().toLowerCase();
    if (q) {
      const nameMatch = onb.property_name?.toLowerCase().includes(q);
      const addrMatch = (onb.property_address || onb.property_location)?.toLowerCase().includes(q);
      const gmMatch = onb.general_manager_name?.toLowerCase().includes(q);
      const gmEmailMatch = onb.general_manager_email?.toLowerCase().includes(q);
      if (!nameMatch && !addrMatch && !gmMatch && !gmEmailMatch) return false;
    }
    if (onbStageFilter !== 'ALL') {
      if ((onb.stage || onb.status) !== onbStageFilter) return false;
    }
    return true;
  });

  filteredOnboardings.sort((a: any, b: any) => {
    if (onbSortBy === 'PROP_ASC') {
      return (a.property_name || '').localeCompare(b.property_name || '');
    } else if (onbSortBy === 'STATUS') {
      return (a.stage || a.status || '').localeCompare(b.stage || b.status || '');
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const hasActiveOnbFilters = onbSearchInput.trim() !== '' || onbStageFilter !== 'ALL' || onbSortBy !== 'NEWEST';

  return (
    <div className="space-y-5">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-4 rounded-2xl shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Onboarding &amp; Porting Pipelines</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Track 7-stage property cutover schedules and carrier porting status for {org.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportOnbCSV}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => {
              setOnbSearchInput('');
              setOnbStageFilter('ALL');
              setOnbSortBy('NEWEST');
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset
          </button>
          <button
            onClick={() => {
              setInitOnbError(null);
              setShowInitOnbModal(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Initialize Onboarding
          </button>
        </div>
      </div>

      {/* 4 Real KPI Cards (Matches Onboarding Page Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Total Pipelines</span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Hotel size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">{totalOnb}</span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Properties</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Active &amp; completed lifecycles</p>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Porting In-Flight</span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <ArrowLeftRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">{inFlightOnb}</span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Orders</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">LOA, SOF &amp; FOC carrier stages</p>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Draft &amp; Pending</span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">{draftPendingOnb}</span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Pending</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Awaiting contract signing</p>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Cutover Complete</span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">{completedOnb}</span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Active</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">100% migrated &amp; operational</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by property, address, GM name, email..."
              value={onbSearchInput}
              onChange={(e) => setOnbSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {onbSearchInput && (
              <button onClick={() => setOnbSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={onbStageFilter}
              onChange={(e) => setOnbStageFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Stage: All Stages</option>
              {STAGES_ROAD.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <select
              value={onbSortBy}
              onChange={(e) => setOnbSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NEWEST">Sort: Recently Added</option>
              <option value="PROP_ASC">Sort: Property (A-Z)</option>
              <option value="STATUS">Sort: Stage Progress</option>
            </select>
          </div>
        </div>

        {hasActiveOnbFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {onbSearchInput && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                "{onbSearchInput}"
                <button onClick={() => setOnbSearchInput('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onbStageFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Stage: {onbStageFilter}
                <button onClick={() => setOnbStageFilter('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setOnbSearchInput('');
                setOnbStageFilter('ALL');
                setOnbSortBy('NEWEST');
              }}
              className="text-slate-500 hover:text-blue-600 text-xs font-medium underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left text-xs min-w-[1100px]">
            <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[160px]">Property Name</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[180px]">Address</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[140px]">Organization</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[130px]">Stage</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[130px]">Target Cutover Date</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[120px]">GM Name</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[120px]">GM Phone</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[160px]">GM Email</th>
                <th className="py-3 px-4 font-bold text-right whitespace-nowrap min-w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
              {filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    {hasActiveOnbFilters
                      ? 'No onboarding records match the selected filters.'
                      : 'No onboarding pipelines recorded for this organization.'}
                  </td>
                </tr>
              ) : (
                filteredOnboardings.map((onb: any) => {
                  const stageBadge = getStageBadge(onb.stage || onb.status || 'DRAFT');
                  const fullAddress = onb.property_address || onb.property_location || 'Pending Address';

                  return (
                    <tr
                      key={onb.id}
                      onClick={() => openUnifiedOnboardingModal(onb, 'DETAILS')}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {onb.property_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span>{fullAddress}</span>
                          {fullAddress !== 'Pending Address' && (
                            <button
                              onClick={() => handleCopy(fullAddress, `onb-addr-${onb.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy Address"
                            >
                              {copiedId === `onb-addr-${onb.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                        {org.name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageBadge.bg} ${stageBadge.text} ${stageBadge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {stageBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                        {onb.target_date ? new Date(onb.target_date).toLocaleDateString() : 'TBD'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {onb.general_manager_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {onb.general_manager_phone || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {onb.general_manager_email || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOnboardingMenuPosition({
                              onb,
                              bottom: window.innerHeight - rect.top + 6,
                              left: Math.max(16, rect.left - 150),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                          title="Onboarding Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
