'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar,
  CheckCircle2,
  Upload,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { formatCurrency } from './types';

interface RevenueCalendarTabProps {
  selectedCircuit: any;
  onReload: () => void;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export default function RevenueCalendarTab({
  selectedCircuit,
  onReload,
  onToast,
}: RevenueCalendarTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMonth, setEditingMonth] = useState<string | null>(null);
  const [paidDateInput, setPaidDateInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [savingMonth, setSavingMonth] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultShareAmount = useMemo(() => {
    const price = Number(selectedCircuit?.circuit_monthly_price || 0);
    const pct = Number(selectedCircuit?.revenue_share_percentage || 0);
    const stored = Number(selectedCircuit?.monthly_revenue_share_amount || 0);
    return stored > 0 ? stored : Math.round(price * (pct / 100) * 100) / 100;
  }, [selectedCircuit]);

  const fetchHistory = useCallback(async () => {
    if (!selectedCircuit?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/data-circuits/monthly-revenue?data_circuit_id=${encodeURIComponent(selectedCircuit.id)}`
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRows(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCircuit?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const rowsByMonth = useMemo(() => {
    const map = new Map<string, any>();
    rows.forEach((r) => {
      if (r.month_key) map.set(r.month_key, r);
    });
    return map;
  }, [rows]);

  const yearStats = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    const paidInYear = rows.filter((r) => r.revenue_received && String(r.month_key || '').startsWith(yearPrefix));
    const totalYearAmt = paidInYear.reduce((s, r) => s + Number(r.revenue_share_amount || 0), 0);
    const allPaid = rows.filter((r) => r.revenue_received);
    const totalAllAmt = allPaid.reduce((s, r) => s + Number(r.revenue_share_amount || 0), 0);
    return {
      paidMonthsInYear: paidInYear.length,
      totalYearAmt,
      totalPaidMonths: allPaid.length,
      totalAllAmt,
    };
  }, [rows, selectedYear]);

  const handleOpenMonth = (monthIndex: number) => {
    const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const existing = rowsByMonth.get(monthKey);
    setEditingMonth(monthKey);
    const existingDate =
      existing?.paid_date ||
      (existing?.received_at ? String(existing.received_at).slice(0, 10) : `${monthKey}-01`);
    setPaidDateInput(existingDate);
    setAmountInput(
      existing?.revenue_share_amount !== undefined && existing?.revenue_share_amount !== null
        ? String(existing.revenue_share_amount)
        : String(defaultShareAmount.toFixed(2))
    );
    setNotesInput(existing?.notes || '');
  };

  const handleSaveMonth = async (markReceived: boolean) => {
    if (!editingMonth || !selectedCircuit?.id) return;
    try {
      setSavingMonth(true);
      const res = await fetch('/api/admin/data-circuits/monthly-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_circuit_id: selectedCircuit.id,
          month_key: editingMonth,
          revenue_received: markReceived,
          paid_date: markReceived ? paidDateInput : null,
          revenue_share_amount: amountInput !== '' ? Number(amountInput) : defaultShareAmount,
          notes: notesInput.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update payment date');
      }
      onToast(
        markReceived ? 'Payment Date Saved' : 'Marked Unpaid',
        markReceived
          ? `Recorded ${editingMonth} payment on ${paidDateInput}.`
          : `Cleared payment status for ${editingMonth}.`
      );
      setEditingMonth(null);
      await fetchHistory();
      onReload();
    } catch (err: any) {
      onToast('Error', err.message || 'Failed to save month', 'error');
    } finally {
      setSavingMonth(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const csv =
      `Paid Date,Amount,Notes\n` +
      `2024-01-15,${defaultShareAmount.toFixed(2)},Jan 2024 payout\n` +
      `2024-02-15,${defaultShareAmount.toFixed(2)},Feb 2024 payout\n` +
      `2024-03-14,${defaultShareAmount.toFixed(2)},Mar 2024 payout`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_history_sample_${selectedCircuit?.property_name?.replace(/[^a-z0-9]/gi, '_') || 'circuit'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCircuit?.id) return;
    try {
      setImportingCsv(true);
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must include a header row and at least one payment date row.');
      }

      const splitCsvLine = (line: string) =>
        line
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
      const dateIdx = headers.findIndex((h) => h.includes('date'));
      const amtIdx = headers.findIndex((h) => h.includes('amount') || h.includes('revenue'));
      const notesIdx = headers.findIndex((h) => h.includes('note'));

      if (dateIdx === -1) {
        throw new Error('CSV must have a "Paid Date" column (YYYY-MM-DD).');
      }

      const parsedRows = lines.slice(1).map((line) => {
        const cols = splitCsvLine(line);
        return {
          paid_date: cols[dateIdx] || '',
          amount: amtIdx >= 0 ? cols[amtIdx] : undefined,
          notes: notesIdx >= 0 ? cols[notesIdx] : undefined,
        };
      });

      const res = await fetch('/api/admin/data-circuits/monthly-revenue/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_circuit_id: selectedCircuit.id,
          rows: parsedRows,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import payment history CSV.');
      }
      onToast('Payment History Imported', json.message);
      await fetchHistory();
      onReload();
    } catch (err: any) {
      onToast('Import Error', err.message || 'Could not import payment dates', 'error');
    } finally {
      setImportingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary & CSV Upload Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Monthly Revenue Received Calendar</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {selectedYear}: <strong>{yearStats.paidMonthsInYear}/12</strong> months paid ({formatCurrency(yearStats.totalYearAmt)})
            {' • '}
            All-Time: <strong>{yearStats.totalPaidMonths}</strong> months ({formatCurrency(yearStats.totalAllAmt)})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] bg-white dark:bg-[#181a24] text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Sample CSV</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={importingCsv}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {importingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{importingCsv ? 'Importing...' : 'Upload Payment History CSV'}</span>
          </button>
        </div>
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1e202b] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-black text-base text-slate-900 dark:text-white px-2">{selectedYear}</span>
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1e202b] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                selectedYear === yr
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Editor for Selected Month */}
      {editingMonth && (
        <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-xs">
              Update Payment for <span className="font-mono text-blue-600 dark:text-blue-400">{editingMonth}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingMonth(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Paid Date
              </label>
              <input
                type="date"
                value={paidDateInput}
                onChange={(e) => setPaidDateInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Revenue Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Wire #1042"
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {rowsByMonth.get(editingMonth)?.revenue_received && (
              <button
                type="button"
                disabled={savingMonth}
                onClick={() => handleSaveMonth(false)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Mark Unpaid
              </button>
            )}
            <button
              type="button"
              disabled={savingMonth}
              onClick={() => handleSaveMonth(true)}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingMonth && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save &amp; Mark Paid</span>
            </button>
          </div>
        </div>
      )}

      {/* 12-Month Calendar Grid */}
      {loading ? (
        <div className="py-10 text-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
          Loading payment calendar...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {MONTH_NAMES.map((mName, idx) => {
            const monthKey = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
            const rec = rowsByMonth.get(monthKey);
            const isPaid = Boolean(rec?.revenue_received);
            const displayDate =
              rec?.paid_date || (rec?.received_at ? String(rec.received_at).slice(0, 10) : null);

            return (
              <button
                key={monthKey}
                type="button"
                onClick={() => handleOpenMonth(idx)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  editingMonth === monthKey ? 'ring-2 ring-blue-500' : ''
                } ${
                  isPaid
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70 hover:bg-emerald-100/70'
                    : 'bg-white dark:bg-[#181a24] border-slate-200 dark:border-[#222430] hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 dark:text-white text-xs">
                    {mName} {selectedYear}
                  </span>
                  {isPaid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Unpaid</span>
                  )}
                </div>
                {isPaid ? (
                  <div className="mt-2 space-y-0.5">
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      {formatCurrency(Number(rec.revenue_share_amount || defaultShareAmount))}
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                      Paid: {displayDate || monthKey}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-[10.5px] text-slate-400 italic">Click to mark paid</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
