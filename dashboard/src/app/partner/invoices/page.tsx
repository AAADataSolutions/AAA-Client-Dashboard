'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react';
import PartnerPersonalMonthlyAnalytics from '@/components/partner/PartnerPersonalMonthlyAnalytics';
import {
  CreateInvoiceModal,
  type PartnerInvoice,
  type PartnerPropertyOption,
} from './_components/CreateInvoiceModal';
import { ViewInvoiceModal, printPartnerInvoice } from './_components/ViewInvoiceModal';

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
    printPartnerInvoice(selectedInvoiceForView, partnerInfo);
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
          @page {
            size: letter portrait;
            margin: 15mm 12mm 15mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            height: auto !important;
            overflow: visible !important;
            font-size: 11px !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-invoice .invoice-header,
          #printable-invoice .invoice-summary-box,
          #printable-invoice .invoice-footer-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-invoice table {
            page-break-inside: auto;
            border-collapse: collapse !important;
          }
          #printable-invoice tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #printable-invoice thead {
            display: table-header-group !important;
          }
          #printable-invoice tfoot {
            display: table-footer-group !important;
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
            Lifetime cleared revenue share payouts
          </p>
        </div>
      </div>

      {/* MONTHLY COMMISSION GRAPH & SELECTED MONTH KPI */}
      <PartnerPersonalMonthlyAnalytics />

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
                <th className="py-3.5 px-4">REVENUE SHARE DUE</th>
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
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {inv.period_start} to {inv.period_end}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {statusBadge.label}
                        </span>
                      </td>
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

      <CreateInvoiceModal
        showGenerateModal={showGenerateModal}
        setShowGenerateModal={setShowGenerateModal}
        generateError={generateError}
        handleSendInvoice={handleSendInvoice}
        periodStart={periodStart}
        setPeriodStart={setPeriodStart}
        periodEnd={periodEnd}
        setPeriodEnd={setPeriodEnd}
        selectedPropIds={selectedPropIds}
        properties={properties}
        handleToggleAllProperties={handleToggleAllProperties}
        handleToggleProperty={handleToggleProperty}
        customTotalAmount={customTotalAmount}
        setCustomTotalAmount={setCustomTotalAmount}
        autoCalculatedGross={autoCalculatedGross}
        autoCalculatedCommission={autoCalculatedCommission}
        notes={notes}
        setNotes={setNotes}
        generating={generating}
      />

      <ViewInvoiceModal
        selectedInvoiceForView={selectedInvoiceForView}
        setSelectedInvoiceForView={setSelectedInvoiceForView}
        handlePrint={handlePrint}
        printRef={printRef}
        partnerInfo={partnerInfo}
      />
    </div>
  );
}
