'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wrench,
  Check,
  RefreshCw,
  HelpCircle,
  MapPin,
  Phone,
} from 'lucide-react';

interface ImportTechniciansModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedTechnicianRow {
  name: string;
  area_name: string;
  phone_no: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

const REQUIRED_HEADERS = ['Name', 'Area Name', 'Phone No'];

export const ImportTechniciansModal: React.FC<ImportTechniciansModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTechnicianRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    errors?: Array<{ row: number; name: string; reason: string }>;
    message: string;
  } | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Name,Area Name,Phone No\n' +
      'John Doe,Chicago Metro,+1 (312) 555-0143\n' +
      'Sarah Connor,Miami Beach Metro,+1 (305) 555-0188\n' +
      'Marcus Vance,Dallas North Metro,+1 (214) 555-0199\n' +
      'Elena Rostova,New York Downtown,+1 (212) 555-0177\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'technicians_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse CSV Text
  const parseCSVText = (text: string) => {
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParseError('The uploaded CSV file is empty or missing data rows.');
        setParsedRows([]);
        return;
      }

      const parseRow = (rowStr: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

      const getVal = (rowObj: Record<string, string>, possibleKeys: string[]) => {
        const normalized: Record<string, string> = {};
        for (const [k, v] of Object.entries(rowObj)) {
          const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          normalized[cleanK] = v;
        }
        for (const k of possibleKeys) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalized[normK] !== undefined && normalized[normK] !== '') {
            return normalized[normK];
          }
        }
        return '';
      };

      const rows: ParsedTechnicianRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseRow(lines[i]);
        if (cells.every((c) => !c)) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((h, colIdx) => {
          rowObj[h] = cells[colIdx] ? cells[colIdx].replace(/^["']|["']$/g, '').trim() : '';
        });

        const name = getVal(rowObj, ['Name', 'Technician Name', 'technician_name', 'technician', 'Full Name']);
        const area_name = getVal(rowObj, ['Area Name', 'AreaName', 'area_name', 'Area', 'Location', 'City', 'Region']);
        const phone_no = getVal(rowObj, ['Phone No', 'PhoneNo', 'phone_no', 'Phone', 'Phone Number', 'Mobile', 'Tel']);

        let isValid = true;
        let validationError: string | undefined;

        if (!name.trim()) {
          isValid = false;
          validationError = 'Missing Technician Name';
        } else if (!area_name.trim()) {
          isValid = false;
          validationError = 'Missing Area Name';
        } else if (!phone_no.trim()) {
          isValid = false;
          validationError = 'Missing Phone Number';
        }

        rows.push({
          name,
          area_name,
          phone_no,
          isValid,
          validationError,
          rawObj: rowObj,
        });
      }

      setParsedRows(rows);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  // 3. File Selection & Drag Events
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
        parseCSVText(text);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setParseError('Please upload a valid .csv file.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSVText(text);
      };
      reader.readAsText(file);
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

  // 4. Submit Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setParseError('No valid technician records to import.');
      return;
    }

    try {
      setImporting(true);
      setParseError(null);

      const payload = {
        rows: validRows.map((r) => ({
          name: r.name,
          area_name: r.area_name,
          phone_no: r.phone_no,
        })),
      };

      const res = await fetch('/api/admin/technicians/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import technicians.');
      }

      setImportResult({
        importedCount: data.importedCount,
        errors: data.errors,
        message: data.message || `Successfully imported ${data.importedCount} technicians.`,
      });

      onSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Import failed. Please check table configuration.');
    } finally {
      setImporting(false);
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
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#222430] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/40">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Import Technicians via CSV
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bulk upload field technicians with their name, service area, and contact phone number.
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {importResult ? (
                /* Success View */
                <div className="space-y-4 text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Technicians Imported Successfully!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                      {importResult.message}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>{importResult.importedCount} Technicians Added to Directory</span>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-left text-xs max-w-xl mx-auto space-y-1">
                      <span className="font-bold block">Rows with warnings / skipped:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>
                            <strong>Row {err.row} ({err.name}):</strong> {err.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] transition cursor-pointer"
                    >
                      Import More Technicians
                    </button>
                    <button
                      onClick={handleModalClose}
                      className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
                    >
                      Done &amp; View Technicians
                    </button>
                  </div>
                </div>
              ) : parsedRows.length === 0 ? (
                /* Step 1 & 2 Upload View */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Download Template */}
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
                          Get an empty template formatted with Name, Area Name, and Phone No headers.
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadTemplate}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#2a2d3d] bg-white dark:bg-[#181920] hover:bg-slate-100 dark:hover:bg-[#20222c] text-slate-800 dark:text-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Download Template (.csv)</span>
                      </motion.button>
                    </div>

                    {/* Option 2: Upload CSV */}
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
                          Fill in your technicians roster and upload the file below for instant verification.
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Instant validation &amp; active status setup</span>
                      </div>
                    </div>
                  </div>

                  {/* Drag & Drop Upload Zone */}
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
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {selectedFile ? selectedFile.name : 'Click to upload or drag & drop technicians CSV'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB • Click to change file`
                            : 'Supports standard CSV format (Name, Area Name, Phone No)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {parseError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  {/* Required Column Headers Pill Bar */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Required CSV Column Headers
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {REQUIRED_HEADERS.map((h, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-[11px] font-medium text-slate-700 dark:text-slate-300"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Parsed Preview View */
                <div className="space-y-3.5">
                  {/* File Details Bar */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {selectedFile?.name || 'Uploaded CSV'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            {validRowCount} Ready to Import
                          </span>
                          {parsedRows.length - validRowCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                              {parsedRows.length - validRowCount} Warnings
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB • ` : ''}
                          {parsedRows.length} total rows detected
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#20222a] flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-blue-500" /> Template
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3" /> Change CSV
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20222a] flex items-center gap-1 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Parsed Technicians Preview
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Verify records before importing to directory
                    </span>
                  </div>

                  {/* Table Box */}
                  <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-x-auto overflow-y-auto max-h-[360px] shadow-2xs [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:bg-slate-400/80 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-[#181920]">
                    <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-[#181920] text-slate-600 dark:text-slate-400 text-[10.5px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-[#222430] z-10">
                        <tr>
                          <th className="px-3.5 py-2.5 whitespace-nowrap">#</th>
                          <th className="px-3.5 py-2.5 whitespace-nowrap">Technician Name</th>
                          <th className="px-3.5 py-2.5 whitespace-nowrap">Service Area</th>
                          <th className="px-3.5 py-2.5 whitespace-nowrap">Phone Number</th>
                          <th className="px-3.5 py-2.5 whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-[11.5px]">
                        {parsedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/50 dark:hover:bg-[#181a24] ${
                              !row.isValid ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                              {idx + 1}
                            </td>
                            <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {row.name || (
                                <span className="text-rose-500 font-normal italic">Missing Name</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{row.area_name || <span className="text-rose-500 italic">Missing Area</span>}</span>
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{row.phone_no || <span className="text-rose-500 italic">Missing Phone</span>}</span>
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {row.isValid ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                  Ready
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300" title={row.validationError}>
                                  {row.validationError}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!importResult && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Records will be automatically set to Active status.</span>
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
                    disabled={importing || validRowCount === 0}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing Technicians...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import {validRowCount > 0 ? `${validRowCount} Technicians` : 'Technicians'}</span>
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
