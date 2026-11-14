'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  Loader2,
  Check,
  Table as TableIcon,
  HelpCircle,
} from 'lucide-react';
import {
  ParsedPropertyRow,
  REQUIRED_HEADERS,
  downloadPropertiesTemplate,
  parsePropertiesCsv,
} from './import-modals/propertiesCsvParser';
import { PropertiesImportTable } from './import-modals/PropertiesImportTable';
import { PropertiesImportResultView } from './import-modals/PropertiesImportResultView';

interface ImportPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportPropertiesModal: React.FC<ImportPropertiesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPropertyRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    message: string;
    errors?: { row: number; propertyName: string; reason: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingPropertyNames, setExistingPropertyNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/admin/properties?limit=2000')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const names = new Set<string>(
            json.data.map((p: any) => String(p.name || '').trim().toLowerCase()).filter(Boolean)
          );
          setExistingPropertyNames(names);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const rowsWithDuplicateFlags = useMemo(() => {
    const csvCounts = new Map<string, number>();
    parsedRows.forEach((r) => {
      const k = r.name.trim().toLowerCase();
      if (k) csvCounts.set(k, (csvCounts.get(k) || 0) + 1);
    });

    return parsedRows.map((r) => {
      const k = r.name.trim().toLowerCase();
      const existsInDb = Boolean(k && existingPropertyNames.has(k));
      const dupInCsv = Boolean(k && (csvCounts.get(k) || 0) > 1);
      const isDuplicate = existsInDb || dupInCsv;
      const duplicateReason = existsInDb
        ? 'Already exists in Properties'
        : dupInCsv
        ? 'Duplicate in CSV'
        : undefined;
      return { ...r, isDuplicate, duplicateReason };
    });
  }, [parsedRows, existingPropertyNames]);

  const duplicateCount = useMemo(
    () => rowsWithDuplicateFlags.filter((r) => r.isDuplicate).length,
    [rowsWithDuplicateFlags]
  );

  const handleRemoveRow = (rowIndex: number) => {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  const handleProcessText = (text: string) => {
    const { rows, error } = parsePropertiesCsv(text);
    setParsedRows(rows);
    setParseError(error);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setParseError('Please upload a valid .csv file.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setParseError('Please upload a valid .csv file.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0 || duplicateCount > 0) return;

    setImporting(true);
    setParseError(null);

    try {
      const payloadRows = parsedRows.map((r) => r.rawObj);
      const res = await fetch('/api/admin/properties/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payloadRows }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import properties.');
      }

      setImportResult({
        success: true,
        importedCount: data.importedCount || parsedRows.length,
        failedCount: data.failedCount || 0,
        message: data.message || `Successfully imported ${data.importedCount} properties as Onboarded.`,
        errors: data.errors || [],
      });

      onSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const validRowCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#222430] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/40">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Import Properties via CSV
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bulk upload hospitality properties with automatic management group linking &amp; Onboarded status.
                  </p>
                </div>
              </div>
              <button
                onClick={handleModalClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
              {importResult ? (
                <PropertiesImportResultView
                  importResult={importResult}
                  onReset={handleReset}
                  onClose={handleModalClose}
                />
              ) : parsedRows.length === 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217] flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Step 1
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Download CSV Template
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Get an empty template with all required headers matching your database and UI.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadPropertiesTemplate}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#2a2d3d] bg-white dark:bg-[#181920] hover:bg-slate-100 dark:hover:bg-[#20222c] text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Download Template (.csv)</span>
                      </motion.button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217] flex flex-col justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Step 2
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            Upload Completed CSV
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Fill in your properties data and upload the file below for instant verification.
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Auto-creates Onboarded status</span>
                      </div>
                    </div>
                  </div>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : selectedFile
                        ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-slate-300 dark:border-[#262836] hover:border-slate-400 dark:hover:border-[#383b4e] bg-slate-50/40 dark:bg-[#111217]/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedFile ? selectedFile.name : 'Click to upload or drag & drop CSV file'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB • Click to change file`
                            : 'Supports standard CSV format with comma separation'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {parseError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Required CSV Column Headers
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {REQUIRED_HEADERS.map((h, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-[10.5px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <PropertiesImportTable
                  selectedFile={selectedFile}
                  parsedRows={rowsWithDuplicateFlags}
                  validRowCount={validRowCount}
                  duplicateCount={duplicateCount}
                  onRemoveRow={handleRemoveRow}
                  onDownloadTemplate={downloadPropertiesTemplate}
                  onChangeFileClick={() => fileInputRef.current?.click()}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Footer Actions */}
            {!importResult && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Missing management groups will be automatically created.</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={importing}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExecuteImport}
                    disabled={importing || validRowCount === 0 || duplicateCount > 0}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing Properties...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import {validRowCount > 0 ? `${validRowCount} Properties` : 'Properties'}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
