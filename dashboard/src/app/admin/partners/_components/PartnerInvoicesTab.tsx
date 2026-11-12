'use client';

import React from 'react';
import {
  Search,
  Trash2,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileText,
  Send,
  Clock,
  Eye,
} from 'lucide-react';
import { PartnerInvoiceItem, EmailQueueState } from './types';
import InvoiceEmailButton from './InvoiceEmailButton';

interface PartnerInvoicesTabProps {
  invoices: PartnerInvoiceItem[];
  invoiceMetrics: {
    totalInvoicesCount: number;
    totalInvoiced: number;
    pendingPayout: number;
    totalPaid: number;
  };
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  loadData: () => void;
  emailQueueMeta: { isProcessing: boolean; pendingCount: number };
  emailQueueStates: Record<string, EmailQueueState>;
  dispatchingEmailIds: Record<string, boolean>;
  handleSendInvoiceEmail: (invoiceIds: string[], contextLabel?: string) => void;
  updatingInvoiceId: string | null;
  handleUpdateInvoiceStatus: (invoiceId: string, newStatus: string) => void;
  setSelectedInvoiceForView: (inv: PartnerInvoiceItem | null) => void;
  isSuperAdmin: boolean;
  deletingInvoiceId: string | null;
  handleDeleteInvoice: (invoiceId: string, invoiceNumber?: string) => void;
}

export default function PartnerInvoicesTab({
  invoices,
  invoiceMetrics,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  loadData,
  emailQueueMeta,
  emailQueueStates,
  dispatchingEmailIds,
  handleSendInvoiceEmail,
  updatingInvoiceId,
  handleUpdateInvoiceStatus,
  setSelectedInvoiceForView,
  isSuperAdmin,
  deletingInvoiceId,
  handleDeleteInvoice,
}: PartnerInvoicesTabProps) {
  return (
    <div className="space-y-6">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL INVOICED
            </span>
            <FileText className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${invoiceMetrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Total</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            {invoiceMetrics.totalInvoicesCount} Total statements submitted by partners
          </p>
        </div>

        {/* Card 2: Pending Approval & Payout */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              PENDING APPROVAL &amp; PAYOUT
            </span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
              ${invoiceMetrics.pendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Pending</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Invoices awaiting review or disbursement
          </p>
        </div>

        {/* Card 3: Total Paid Out */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL CLEARED &amp; PAID
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              ${invoiceMetrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Disbursed</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Lifetime settled partner disbursements
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, partner name, email..."
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
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="REJECTED">Rejected</option>
          </select>
          {(emailQueueMeta.isProcessing || emailQueueMeta.pendingCount > 0) && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Queue Active ({emailQueueMeta.pendingCount} waiting)</span>
            </div>
          )}
          {invoices.length > 0 && (
            <button
              onClick={() => handleSendInvoiceEmail(invoices.map((i) => i.id), `${invoices.length} displayed invoices`)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              title="Queue all currently displayed invoices to be emailed one by one with PDF attachments"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Email All Shown ({invoices.length})</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1e2029] text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-[#15161c] border-b border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">INVOICE #</th>
                <th className="py-3.5 px-4">PARTNER</th>
                <th className="py-3.5 px-4">PERIOD</th>
                <th className="py-3.5 px-4">PROPERTIES</th>
                <th className="py-3.5 px-4">GROSS REVENUE</th>
                <th className="py-3.5 px-4">REVENUE SHARE DUE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No partner invoices found matching criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  let statusBadge = {
                    bg: 'bg-amber-50 dark:bg-amber-950/40',
                    text: 'text-amber-700 dark:text-amber-300',
                    border: 'border-amber-200 dark:border-amber-800',
                    label: inv.status,
                  };
                  if (inv.status === 'PAID') {
                    statusBadge = { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'PAID' };
                  } else if (inv.status === 'APPROVED') {
                    statusBadge = { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'APPROVED' };
                  } else if (inv.status === 'REJECTED') {
                    statusBadge = { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'REJECTED' };
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {inv.partner?.name || 'Partner Account'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {inv.partner?.email || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {inv.period_start} to {inv.period_end}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {inv.total_properties} {inv.total_properties === 1 ? 'Property' : 'Properties'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        ${Number(inv.gross_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        ${Number(inv.commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={inv.status}
                          disabled={updatingInvoiceId === inv.id}
                          onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          <option value="SUBMITTED">SUBMITTED</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="PAID">PAID</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <InvoiceEmailButton
                            inv={inv}
                            compact={false}
                            emailQueueStates={emailQueueStates}
                            dispatchingEmailIds={dispatchingEmailIds}
                            onSendInvoiceEmail={handleSendInvoiceEmail}
                          />
                          <button
                            onClick={() => setSelectedInvoiceForView(inv)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View &amp; Download PDF
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoice_number)}
                              disabled={deletingInvoiceId === inv.id}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 rounded-lg transition cursor-pointer disabled:opacity-50"
                              title="Delete Invoice"
                            >
                              {deletingInvoiceId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
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
