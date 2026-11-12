'use client';

import React from 'react';
import { Users, Plus, RefreshCw, FileText, Loader2 } from 'lucide-react';

interface PartnerPageHeaderAndTabsProps {
  activeTab: 'PARTNERS' | 'INVOICES';
  setActiveTab: (tab: 'PARTNERS' | 'INVOICES') => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  partnerMetrics: { totalPartners: number };
  invoiceMetrics: { pendingPayout: number };
  generatingMonthlyInvoices: boolean;
  handleRunMonthlyInvoices: () => void;
  onAddPartnerClick: () => void;
}

export function PartnerPageHeaderAndTabs({
  activeTab,
  setActiveTab,
  setSearchQuery,
  setStatusFilter,
  partnerMetrics,
  invoiceMetrics,
  generatingMonthlyInvoices,
  handleRunMonthlyInvoices,
  onAddPartnerClick,
}: PartnerPageHeaderAndTabsProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" /> Partners &amp; Revenue Share
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage channel partners, affiliate properties, recurring revenue share, and partner payout invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === 'PARTNERS' && (
            <button
              onClick={onAddPartnerClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          )}
          {activeTab === 'INVOICES' && (
            <button
              onClick={handleRunMonthlyInvoices}
              disabled={generatingMonthlyInvoices}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {generatingMonthlyInvoices ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Generate Monthly Invoices
            </button>
          )}
        </div>
      </div>

      {/* Top Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222430] pb-2">
        <button
          onClick={() => {
            setActiveTab('PARTNERS');
            setSearchQuery('');
            setStatusFilter('ALL');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'PARTNERS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181a24]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Partner Directory</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'PARTNERS' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-[#20222a] text-slate-700 dark:text-slate-300'}`}>
            {partnerMetrics.totalPartners}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('INVOICES');
            setSearchQuery('');
            setStatusFilter('ALL');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'INVOICES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181a24]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Partner Invoices &amp; Payouts</span>
          {invoiceMetrics.pendingPayout > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
              Pending
            </span>
          )}
        </button>
      </div>
    </>
  );
}

