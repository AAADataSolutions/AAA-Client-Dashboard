'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Hotel,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface PartnerInvoice {
  id: string;
  partner_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_properties: number;
  gross_revenue: number;
  commission_amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  paid_at?: string | null;
  payment_reference?: string | null;
  line_items?: any[];
  notes?: string | null;
  created_at: string;
}

export default function PartnerInvoicesPage() {
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState<any>(null);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<PartnerInvoice | null>(null);

  // Generate form state
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [resInv, resOverview] = await Promise.all([
        fetch('/api/partner/invoices'),
        fetch('/api/partner/overview'),
      ]);
      const jsonInv = await resInv.json();
      const jsonOverview = await resOverview.json();

      if (jsonInv.success) setInvoices(jsonInv.data || []);
      if (jsonOverview.success) setPartnerInfo(jsonOverview.data?.partner || null);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/partner/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          notes,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate invoice.');
      }

      setShowGenerateModal(false);
      loadInvoices();
      setSelectedInvoiceForView(result.data);
    } catch (err: any) {
      setGenerateError(err.message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-600" /> Invoices & Revenue Statements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate customized AAA Solutions statements, review payout milestones, and export PDF statements.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Statement
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">INVOICE #</th>
                <th className="py-3.5 px-4">PERIOD</th>
                <th className="py-3.5 px-4">PROPERTIES</th>
                <th className="py-3.5 px-4">GROSS REVENUE</th>
                <th className="py-3.5 px-4">COMMISSION DUE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No revenue statements generated yet. Click &quot;Create New Statement&quot; to generate your first invoice.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoice_number}
                    </td>

                    {/* Period */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {inv.period_start} to {inv.period_end}
                    </td>

                    {/* Total Properties */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.total_properties} Properties
                    </td>

                    {/* Gross */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      ${Number(inv.gross_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Commission Due */}
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ${Number(inv.commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                          : inv.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-[#1e2029] hover:bg-slate-200 dark:hover:bg-[#282a36] text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View & Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate Partner Revenue Statement
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                {generateError}
              </div>
            )}

            <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Period Start</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Billing Period End</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Statement Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional billing reference, wire details, or payout notes..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-xl text-blue-700 dark:text-blue-300">
                <p className="font-bold">Automated Calculation Notice:</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  All active hotel properties assigned to your account will be itemized automatically based on their monthly subscriptions and your agreed commission percentages.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Generate Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View & Print Branded Invoice Modal */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Actions Bar (hidden in print) */}
            <div className="no-print flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Revenue Statement Preview</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedInvoiceForView.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Document */}
            <div id="printable-invoice" ref={printRef} className="space-y-6 text-slate-800 dark:text-slate-200 text-xs">
              {/* Top Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <img src="/logo.png" alt="AAA Data Solutions" className="h-10 mb-2" />
                  <h2 className="font-black text-base text-slate-900 dark:text-white">AAA Data Solutions</h2>
                  <p className="text-slate-500 text-[11px]">Telecommunications & Voice Line Services</p>
                  <p className="text-slate-500 text-[11px]">support@aaadatasolutions.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    REVENUE SHARE STATEMENT
                  </h3>
                  <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedInvoiceForView.invoice_number}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Date: {new Date(selectedInvoiceForView.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Period: {selectedInvoiceForView.period_start} to {selectedInvoiceForView.period_end}
                  </p>
                </div>
              </div>

              {/* Partner & Billing Info */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#222430]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    PAYABLE TO (PARTNER):
                  </span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {partnerInfo?.name || 'Partner Account'}
                  </p>
                  {partnerInfo?.company_name && (
                    <p className="text-slate-600 dark:text-slate-300 font-medium">{partnerInfo.company_name}</p>
                  )}
                  <p className="text-slate-500">{partnerInfo?.email || 'partner@aaadatasolutions.com'}</p>
                  {partnerInfo?.phone && <p className="text-slate-500">{partnerInfo.phone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    SUMMARY:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Properties Included: <strong className="text-slate-900 dark:text-white">{selectedInvoiceForView.total_properties}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Total Gross Managed: <strong className="text-slate-900 dark:text-white">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Payment Terms: <strong className="text-slate-900 dark:text-white">Net 30 Days</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">PROPERTY / LOCATION</th>
                      <th className="py-2.5 px-3 text-right">MONTHLY SUBSCRIPTION</th>
                      <th className="py-2.5 px-3 text-right">COMMISSION RATE</th>
                      <th className="py-2.5 px-3 text-right">COMMISSION AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                    {selectedInvoiceForView.line_items && selectedInvoiceForView.line_items.length > 0 ? (
                      selectedInvoiceForView.line_items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{item.property_name}</span>
                            <span className="text-[10px] text-slate-400">{item.property_location}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            ${Number(item.monthly_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                            {item.commission_rate}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            ${Number(item.commission_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          {selectedInvoiceForView.total_properties} Active Properties included in billing cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Box */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gross Recurring Volume:</span>
                    <span className="font-semibold">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-[#222430] pt-1.5 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Total Commission Due:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ${Number(selectedInvoiceForView.commission_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer notes */}
              <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 text-center">
                <p>Thank you for your partnership with AAA Data Solutions.</p>
                <p className="mt-0.5">Disbursements are processed within Net 30 days of statement verification.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
