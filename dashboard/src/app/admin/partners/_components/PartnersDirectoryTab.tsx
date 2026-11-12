'use client';

import React from 'react';
import {
  Users,
  Search,
  DollarSign,
  Hotel,
  Loader2,
  RefreshCw,
  Mail,
  Copy,
  Check,
  MoreVertical,
} from 'lucide-react';
import PartnerMonthlyAnalytics from '@/components/admin/PartnerMonthlyAnalytics';
import { Partner } from './types';

interface PartnersDirectoryTabProps {
  partners: Partner[];
  partnerMetrics: {
    totalPartners: number;
    activePartners: number;
    totalCommissionPayout: number;
    assignedPropertiesCount: number;
  };
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  loadData: () => void;
  copiedPhoneId: string | null;
  setCopiedPhoneId: (val: string | null) => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  handleOpenViewProperties: (partner: Partner) => void;
  updatingPartnerStatusId: string | null;
  handleTogglePartnerStatus: (partnerId: string, currentStatus: string) => void;
  handleOpenMenu: (e: React.MouseEvent, partner: Partner) => void;
}

export default function PartnersDirectoryTab({
  partners,
  partnerMetrics,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  loadData,
  copiedPhoneId,
  setCopiedPhoneId,
  showToast,
  handleOpenViewProperties,
  updatingPartnerStatusId,
  handleTogglePartnerStatus,
  handleOpenMenu,
}: PartnersDirectoryTabProps) {
  return (
    <div className="space-y-6">
      {/* 3 KPI Cards — ROYAL BLUE VARIANT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL PARTNERS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL PARTNERS
            </span>
            <Users className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {partnerMetrics.totalPartners}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Partners</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            {partnerMetrics.activePartners} Active channel partners
          </p>
        </div>

        {/* Card 2: ASSIGNED PROPERTIES */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              ASSIGNED PROPERTIES
            </span>
            <Hotel className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {partnerMetrics.assignedPropertiesCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Properties</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Hospitality locations with revenue share
          </p>
        </div>

        {/* Card 3: EST. MONTHLY COMMISSION / RUN RATE */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              MONTHLY RUN RATE
            </span>
            <DollarSign className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              ${partnerMetrics.totalCommissionPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-white ml-2">/ Month</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Combined monthly commission revenue share
          </p>
        </div>
      </div>

      {/* REQUESTED COMPONENT: MONTHLY REVENUE GRAPH (LEFT) & SELECTED MONTH KPI (RIGHT) */}
      <PartnerMonthlyAnalytics
        currentMonthlyRunRate={partnerMetrics.totalCommissionPayout}
        onRefreshNeeded={loadData}
      />

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search partner name, email, company, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1e2029] text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EXACT REQUESTED 8 TABLE COLUMNS */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-[#15161c] border-b border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">PARTNER</th>
                <th className="py-3.5 px-4 whitespace-nowrap">EMAIL</th>
                <th className="py-3.5 px-4 whitespace-nowrap">PHONE NO.</th>
                <th className="py-3.5 px-4 whitespace-nowrap">SHARE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">NO. OF PROPERTIES ASSIGNED</th>
                <th className="py-3.5 px-4 whitespace-nowrap">MONTHLY RUN RATE</th>
                <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No partner records found matching your filter.
                  </td>
                </tr>
              ) : (
                partners.map((partner) => {
                  const isActive = partner.status === 'ACTIVE';

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      {/* 1. PARTNER (Name + Company underneath) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {partner.name}
                        </span>
                        {partner.company_name && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal mt-0.5">
                            {partner.company_name}
                          </span>
                        )}
                      </td>

                      {/* 2. EMAIL */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{partner.email}</span>
                        </div>
                      </td>

                      {/* 3. PHONE NO. */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                        {partner.phone && partner.phone !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{partner.phone}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(partner.phone || '');
                                setCopiedPhoneId(partner.id);
                                showToast('Copied', 'Phone copied to clipboard');
                                setTimeout(() => setCopiedPhoneId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedPhoneId === partner.id ? (
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

                      {/* 4. SHARE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-xs">
                            {partner.share_display || `${partner.effective_share_rate ?? partner.default_commission_rate}%`}
                          </span>
                          {partner.has_custom_override && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80">
                              Override
                            </span>
                          )}
                        </div>
                        {partner.total_properties_count > 0 && partner.has_custom_override && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-normal">
                            Base: {partner.default_commission_rate}%
                          </span>
                        )}
                      </td>

                      {/* 5. NO. OF PROPERTIES ASSIGNED */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenViewProperties(partner)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px] cursor-pointer transition"
                          title="Click to view assigned properties list"
                        >
                          <Hotel className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{partner.total_properties_count} {partner.total_properties_count === 1 ? 'Property' : 'Properties'}</span>
                        </button>
                      </td>

                      {/* 6. MONTHLY RUN RATE */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${partner.monthly_commission_estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 7. STATUS */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={partner.status}
                            disabled={updatingPartnerStatusId === partner.id}
                            onChange={(e) => {
                              const targetStatus = e.target.value;
                              if (targetStatus !== partner.status) {
                                handleTogglePartnerStatus(partner.id, partner.status);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none transition ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <option value="ACTIVE">● Active</option>
                            <option value="INACTIVE">● Inactive</option>
                          </select>
                          {updatingPartnerStatusId === partner.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          )}
                        </div>
                      </td>

                      {/* 8. THREE DOTS FOR ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenMenu(e, partner)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#20222a] border border-transparent hover:border-slate-200 dark:hover:border-[#2a2c38] transition cursor-pointer"
                          title="Partner Actions"
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
