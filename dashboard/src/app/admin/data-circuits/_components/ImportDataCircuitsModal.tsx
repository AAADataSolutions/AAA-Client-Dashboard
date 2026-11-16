'use client';

import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Check,
  Table as TableIcon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  ParsedDataCircuitRow,
  DATA_CIRCUIT_PIPELINE_CSV_HEADERS,
  DATA_CIRCUIT_INSTALLED_CSV_HEADERS,
  downloadDataCircuitsTemplate,
  parseDataCircuitsCsv,
} from './dataCircuitsCsvParser';
import { formatCurrency } from './types';

interface ImportDataCircuitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeViewTab?: 'PIPELINE' | 'INSTALLED';
  existingCircuitPropertyNames?: string[];
}

export function ImportDataCircuitsModal({
  isOpen,
  onClose,
  onSuccess,
  activeViewTab = 'INSTALLED',
  existingCircuitPropertyNames = [],
}: ImportDataCircuitsModalProps) {
  const activeHeaders =
    activeViewTab === 'PIPELINE'
      ? DATA_CIRCUIT_PIPELINE_CSV_HEADERS
      : DATA_CIRCUIT_INSTALLED_CSV_HEADERS;
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedDataCircuitRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    totalRevenueAdded: number;
    message: string;
    errors?: { row: number; propertyName: string; reason: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingNamesSet = useMemo(
    () => new Set(existingCircuitPropertyNames.map((n) => String(n || '').trim().toLowerCase()).filter(Boolean)),
    [existingCircuitPropertyNames]
  );

  const rowsWithDuplicateFlags = useMemo(() => {
    const csvCounts = new Map<string, number>();
    parsedRows.forEach((r) => {
      const k = r.propertyName.trim().toLowerCase();
      if (k) csvCounts.set(k, (csvCounts.get(k) || 0) + 1);
    });

    return parsedRows.map((r) => {
      const k = r.propertyName.trim().toLowerCase();
      const existsInDb = Boolean(k && existingNamesSet.has(k));
      const dupInCsv = Boolean(k && (csvCounts.get(k) || 0) > 1);
      const isDuplicate = dupInCsv;
      const duplicateReason = dupInCsv
        ? 'Duplicate in CSV'
        : existsInDb
        ? 'Exists — blank fields will be updated'
        : undefined;
      return { ...r, existsInDb, isDuplicate, duplicateReason };
    });
  }, [parsedRows, existingNamesSet]);

  const duplicateCount = useMemo(
    () => rowsWithDuplicateFlags.filter((r) => r.isDuplicate).length,
    [rowsWithDuplicateFlags]
  );

  const existingMatchCount = useMemo(
    () => rowsWithDuplicateFlags.filter((r) => r.existsInDb && !r.isDuplicate).length,
    [rowsWithDuplicateFlags]
  );

  const handleRemoveRow = (rowIndex: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleProcessText = (text: string) => {
    const { rows, error } = parseDataCircuitsCsv(text);
    setParsedRows(rows);
    setParseError(error);
  };

  const readFileText = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a valid .csv file.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => handleProcessText((event.target?.result as string) || '');
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFileText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFileText(file);
  };

  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0 || duplicateCount > 0) return;

    try {
      setImporting(true);
      setParseError(null);
      const res = await fetch('/api/admin/data-circuits/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows.map((r) => r.rawObj) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Import failed.');
      }
      setImportResult(json);
      onSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Failed to import data circuits.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const totalRevenuePreview = parsedRows
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + r.totalRevenueAdded, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative z-10 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Import Data Circuits via CSV
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bulk import circuits &amp; automatically credit paid monthly revenue shares
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadDataCircuitsTemplate(activeViewTab)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1e202b] hover:bg-slate-200 dark:hover:bg-[#262938] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Download {activeViewTab === 'PIPELINE' ? 'Pipeline' : 'Installed'} Sample CSV
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {importResult ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Import Completed
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{importResult.message}</p>
                  <div className="flex items-center justify-center gap-4 pt-2 text-xs font-bold">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      Imported: {importResult.importedCount}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      Revenue Added: {formatCurrency(importResult.totalRevenueAdded)}
                    </span>
                    {importResult.failedCount > 0 && (
                      <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                        Failed: {importResult.failedCount}
                      </span>
                    )}
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 text-left bg-white dark:bg-[#111217] p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 max-h-40 overflow-y-auto">
                      {importResult.errors.map((err, idx) => (
                        <p key={idx} className="text-[11px] text-rose-600 dark:text-rose-400">
                          Row {err.row} ({err.propertyName}): {err.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Required Columns Banner */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430]">
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {activeViewTab === 'PIPELINE' ? 'Pipeline' : 'Installed'} CSV Columns ({activeHeaders.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeHeaders.map((h) => (
                        <span
                          key={h}
                          className="px-2 py-0.5 rounded bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {parseError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  {/* Dropzone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-300 dark:border-[#2b2e3d] hover:border-blue-400 bg-slate-50/50 dark:bg-[#111217]/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag & drop your .csv file'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Formula: Revenue Added = (Client Price × Revenue Share %) × Number of Times Monthly Revenue Paid
                    </p>
                  </div>

                  {/* Preview Table */}
                  {rowsWithDuplicateFlags.length > 0 && (
                    <div className="space-y-2">
                      {duplicateCount > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>
                            {duplicateCount} duplicate row{duplicateCount === 1 ? '' : 's'} within this CSV file. Remove duplicate rows from the preview table below to enable import.
                          </span>
                        </div>
                      )}
                      {existingMatchCount > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2 font-semibold">
                          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>
                            {existingMatchCount} row{existingMatchCount === 1 ? '' : 's'} already exist — only blank fields will be updated; filled fields will stay unchanged.
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <TableIcon className="w-4 h-4 text-blue-600" />
                          Preview ({validCount} valid of {rowsWithDuplicateFlags.length} rows)
                        </span>
                        {activeViewTab === 'INSTALLED' && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                            Total Revenue to Add: {formatCurrency(totalRevenuePreview)}
                          </span>
                        )}
                      </div>

                      <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-x-auto max-h-64">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] sticky top-0">
                            <tr>
                              <th className="py-2 px-3 font-bold">Action</th>
                              <th className="py-2 px-3 font-bold">Property</th>
                              <th className="py-2 px-3 font-bold">Wholesaler</th>
                              <th className="py-2 px-3 font-bold">Carrier / BW</th>
                              <th className="py-2 px-3 font-bold">Client Price</th>
                              <th className="py-2 px-3 font-bold">Rev Share</th>
                              <th className="py-2 px-3 font-bold">Stage</th>
                              {activeViewTab === 'INSTALLED' && (
                                <>
                                  <th className="py-2 px-3 font-bold">Times Paid</th>
                                  <th className="py-2 px-3 font-bold text-right">Revenue Added</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                            {rowsWithDuplicateFlags.map((row, idx) => (
                              <tr
                                key={idx}
                                className={
                                  row.isDuplicate
                                    ? 'bg-rose-50/60 dark:bg-rose-950/30'
                                    : !row.isValid
                                    ? 'bg-rose-50/30 dark:bg-rose-950/20'
                                    : ''
                                }
                              >
                                <td className="py-2 px-3">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(idx)}
                                    className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
                                    title="Remove row from import"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                                <td className="py-2 px-3 font-semibold">
                                  <div className="flex items-center gap-1.5">
                                    <span>{row.propertyName || <span className="text-rose-500">Missing</span>}</span>
                                    {row.isDuplicate ? (
                                      <span
                                        className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9.5px] font-bold uppercase tracking-wide"
                                        title={row.duplicateReason}
                                      >
                                        Duplicate
                                      </span>
                                    ) : row.existsInDb ? (
                                      <span
                                        className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-bold uppercase tracking-wide"
                                        title={row.duplicateReason}
                                      >
                                        Fill Blanks
                                      </span>
                                    ) : null}
                                  </div>
                                  {(row.isDuplicate || row.existsInDb) && row.duplicateReason && (
                                    <span
                                      className={`block text-[10px] font-normal ${
                                        row.isDuplicate
                                          ? 'text-rose-600 dark:text-rose-400'
                                          : 'text-blue-600 dark:text-blue-400'
                                      }`}
                                    >
                                      {row.duplicateReason}
                                    </span>
                                  )}
                                  {row.city && <span className="block text-[10px] text-slate-400">{row.city}, {row.country}</span>}
                                </td>
                                <td className="py-2 px-3">{row.wholesalerName || '—'}</td>
                                <td className="py-2 px-3">
                                  {row.carrier || '—'}
                                  {row.bandwidth && <span className="block text-[10px] text-slate-400">{row.bandwidth}</span>}
                                </td>
                                <td className="py-2 px-3 font-mono">{formatCurrency(row.clientPrice)}</td>
                                <td className="py-2 px-3 font-mono">
                                  {row.revenueSharePct}% ({formatCurrency(row.monthlyRevShareAmt)}/mo)
                                </td>
                                <td className="py-2 px-3 font-semibold">{row.stage}</td>
                                {activeViewTab === 'INSTALLED' && (
                                  <>
                                    <td className="py-2 px-3 font-mono">{row.timesPaid}x</td>
                                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(row.totalRevenueAdded)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-[#1e202b] cursor-pointer"
              >
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && (
                <button
                  type="button"
                  disabled={importing || validCount === 0 || duplicateCount > 0}
                  onClick={handleImportSubmit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Import {validCount} Circuit{validCount === 1 ? '' : 's'}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

