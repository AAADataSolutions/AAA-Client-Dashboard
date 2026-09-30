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
  Check,
  TrendingUp,
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

interface PartnerPropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  main_phone?: string | null;
  monthly_price: number | null;
  status: string;
  effective_commission_rate: number;
  monthly_commission: number;
}

export default function PartnerInvoicesPage() {
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [properties, setProperties] = useState<PartnerPropertyOption[]>([]);
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
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([]);
  const [customTotalAmount, setCustomTotalAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resInv, resOverview, resProps] = await Promise.all([
        fetch('/api/partner/invoices'),
        fetch('/api/partner/overview'),
        fetch('/api/partner/properties'),
      ]);
      const jsonInv = await resInv.json();
      const jsonOverview = await resOverview.json();
      const jsonProps = await resProps.json();

      if (jsonInv.success) setInvoices(jsonInv.data || []);
      if (jsonOverview.success) setPartnerInfo(jsonOverview.data?.partner || null);
      if (jsonProps.success) {
        const propsList = jsonProps.data || [];
        setProperties(propsList);
        // By default, select all properties
        setSelectedPropIds(propsList.map((p: any) => p.id));
      }
    } catch (err) {
      console.error('Failed to load invoice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default total amount when property selection changes
  const selectedPropertiesList = properties.filter((p) => selectedPropIds.includes(p.id));
  const autoCalculatedGross = selectedPropertiesList.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);
  const autoCalculatedCommission = selectedPropertiesList.reduce((sum, p) => sum + (p.monthly_commission || 0), 0);

  const handleOpenCreateModal = () => {
    // Reset selections
    const allIds = properties.map((p) => p.id);
    setSelectedPropIds(allIds);
    const initialCommission = properties.reduce((sum, p) => sum + (p.monthly_commission || 0), 0);
    setCustomTotalAmount(initialCommission > 0 ? initialCommission.toFixed(2) : '');
    setGenerateError(null);
    setShowGenerateModal(true);
  };

  const handleToggleProperty = (propId: string) => {
    setSelectedPropIds((prev) => {
      const next = prev.includes(propId) ? prev.filter((id) => id !== propId) : [...prev, propId];
      // Update custom total to match new sum if user hasn't typed a completely arbitrary value
      const updatedList = properties.filter((p) => next.includes(p.id));
      const updatedCommission = updatedList.reduce((sum, p) => sum + (p.monthly_commission || 0), 0);
      setCustomTotalAmount(updatedCommission.toFixed(2));
      return next;
    });
  };

  const handleToggleAllProperties = () => {
    if (selectedPropIds.length === properties.length) {
      setSelectedPropIds([]);
      setCustomTotalAmount('0.00');
    } else {
      const allIds = properties.map((p) => p.id);
      setSelectedPropIds(allIds);
      const totalComm = properties.reduce((sum, p) => sum + (p.monthly_commission || 0), 0);
      setCustomTotalAmount(totalComm.toFixed(2));
    }
  };

  const handleSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPropIds.length === 0) {
      setGenerateError('Please select at least one property to include in the invoice.');
      return;
    }

    setGenerating(true);
    setGenerateError(null);

    try {
      const lineItems = selectedPropertiesList.map((p) => ({
        property_id: p.id,
        property_name: p.name,
        property_location: `${p.city || ''}${p.state ? `, ${p.state}` : ''}`,
        monthly_price: Number(p.monthly_price || 0),
        commission_rate: p.effective_commission_rate,
        commission_amount: p.monthly_commission,
      }));

      const res = await fetch('/api/partner/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          selected_property_ids: selectedPropIds,
          custom_amount: customTotalAmount ? Number(customTotalAmount) : autoCalculatedCommission,
          line_items: lineItems,
          notes,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create invoice.');
      }

      setShowGenerateModal(false);
      loadData();
      setSelectedInvoiceForView(result.data);
    } catch (err: any) {
      setGenerateError(err.message || 'Invoice generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);
  const totalPaid = invoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);
  const pendingPayout = invoices.filter((inv) => inv.status === 'SUBMITTED' || inv.status === 'APPROVED').reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6 font-sans">
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
            padding: 30px;
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
            <FileText className="w-6 h-6 text-blue-600" /> Invoices &amp; Revenue Statements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create customized partner invoices, select affiliate properties, enter custom payout amounts, and send directly to AAA Solutions.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* 3 KPI Cards — ROYAL BLUE VARIANT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL INVOICED
            </span>
            <FileText className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            {invoices.length} Total statements submitted
          </p>
        </div>

        {/* Card 2: Pending Payout */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              PENDING PAYOUT
            </span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
              ${pendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Submitted &amp; awaiting disbursement
          </p>
        </div>

        {/* Card 3: Total Paid Out */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL CLEARED &amp; PAID
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Lifetime cleared commission payouts
          </p>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
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
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No revenue statements created yet. Click &quot;Create Invoice&quot; to select properties and send your first statement.
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
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {inv.total_properties} {inv.total_properties === 1 ? 'Property' : 'Properties'}
                        </span>
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusBadge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View &amp; Download PDF
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

      {/* CREATE INVOICE MODAL WITH PROPERTY SELECTION AND CUSTOM TOTAL AMOUNT */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Create &amp; Send Partner Invoice
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select properties to include, review calculated shares, or enter a custom invoice total amount.
                </p>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            <form onSubmit={handleSendInvoice} className="space-y-4 text-xs">
              {/* Billing Period Start & End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Period Start
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Period End
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Property Selection List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Hotel className="w-4 h-4 text-blue-600" />
                    Select Properties for Invoice ({selectedPropIds.length} of {properties.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAllProperties}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer text-[11px]"
                  >
                    {selectedPropIds.length === properties.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217] divide-y divide-slate-100 dark:divide-[#20222c]">
                  {properties.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No assigned properties found.
                    </div>
                  ) : (
                    properties.map((prop) => {
                      const isChecked = selectedPropIds.includes(prop.id);
                      return (
                        <label
                          key={prop.id}
                          className={`flex items-center justify-between p-3 cursor-pointer transition ${
                            isChecked
                              ? 'bg-blue-50/50 dark:bg-blue-950/20'
                              : 'hover:bg-slate-100/60 dark:hover:bg-[#181a24]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleProperty(prop.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {prop.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-normal">
                                {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address || '—'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                              ${prop.monthly_commission.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (${Number(prop.monthly_price || 0).toFixed(2)} @ {prop.effective_commission_rate}%)
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Enter Custom / Total Amount */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block font-black text-slate-900 dark:text-white text-xs">
                      Total Invoice Amount ($ USD)
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Auto-calculated from selected properties, or enter a custom amount.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={customTotalAmount}
                      onChange={(e) => setCustomTotalAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-[#111217] border border-slate-300 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white font-extrabold text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-200/50 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                  <span>Selected Properties Gross: <strong>${autoCalculatedGross.toFixed(2)}</strong></span>
                  <span>Calculated Share: <strong>${autoCalculatedCommission.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Notes & Payment Details */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Notes &amp; Payment Remittance Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes, Bank Name, Wire/ACH Routing #, Account #, or PayPal..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-xl text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1f212c]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || selectedPropIds.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT / DOWNLOAD PDF STATEMENT MODAL */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Top Actions */}
            <div className="no-print flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Partner Statement Preview</span>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {selectedInvoiceForView.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Download / Print PDF
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
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <img src="/logo.png" alt="AAA Data Solutions" className="h-10 mb-2" />
                  <h2 className="font-black text-base text-slate-900 dark:text-white">AAA Data Solutions</h2>
                  <p className="text-slate-500 text-[11px]">Telecommunications &amp; Voice Line Services</p>
                  <p className="text-slate-500 text-[11px]">billing@aaadatasolutions.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    PARTNER INVOICE
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

              {/* Partner & Summary Box */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#222430]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    PAYABLE TO (PARTNER):
                  </span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {partnerInfo?.name || 'Channel Partner'}
                  </p>
                  {partnerInfo?.company_name && (
                    <p className="text-slate-600 dark:text-slate-300 font-medium">{partnerInfo.company_name}</p>
                  )}
                  <p className="text-slate-500">{partnerInfo?.email || 'partner@aaadatasolutions.com'}</p>
                  {partnerInfo?.phone && <p className="text-slate-500">{partnerInfo.phone}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    INVOICE SUMMARY:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Properties Included: <strong className="text-slate-900 dark:text-white">{selectedInvoiceForView.total_properties}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Total Gross Revenue: <strong className="text-slate-900 dark:text-white">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Payment Terms: <strong className="text-slate-900 dark:text-white">Net 30 Days</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Line Items Table */}
              <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
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
                          {selectedInvoiceForView.total_properties} Properties itemized in billing cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    REMITTANCE NOTES:
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {selectedInvoiceForView.notes || 'Standard electronic payout remittance.'}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gross Volume:</span>
                    <span className="font-semibold">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-[#222430] pt-1.5 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Total Amount Payable:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ${Number(selectedInvoiceForView.commission_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 text-center">
                <p>AAA Data Solutions Partner Network • All Rights Reserved</p>
                <p className="mt-0.5">Disbursements are processed upon review and approval by AAA Accounts.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
