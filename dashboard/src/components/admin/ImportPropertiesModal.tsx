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
  Building2,
  Check,
  RefreshCw,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface ImportPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedPropertyRow {
  name: string;
  location: string;
  monthlyPrice: string;
  mainPhone: string;
  managementGroup: string;
  e911Status: string;
  rayBaumStatus: string;
  gmName: string;
  gmEmail: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

const REQUIRED_HEADERS = [
  'Property Name',
  'Property Location',
  'Monthly price',
  'Main Phone no',
  'Management group',
  'E911 Status',
  'Ray Baum and Kari\'s law',
  'GM Name',
  'GM email',
];

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

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = `${REQUIRED_HEADERS.join(',')}\n` +
      `"Grand Hyatt Downtown","123 Michigan Ave, Chicago, IL 60601",1450.00,"+1 (312) 555-0199","Marriott Hospitality Group","Verified","Active","John Doe","jdoe@hotelchain.com"\n` +
      `"Hilton Garden Inn Airport","456 Airport Way, Miami, FL 33142",1200.00,"+1 (305) 555-0188","Hilton Worldwide","Verified","Active","Sarah Smith","ssmith@hilton.com"\n` +
      `"Marriott Resort & Spa","789 Ocean Blvd, San Diego, CA 92109",1850.00,"+1 (619) 555-0177","Marriott Hospitality Group","Verified","Active","Robert Taylor","rtaylor@marriott.com"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'properties_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Parse CSV Text
  const parseCSVText = (text: string) => {
    try {
      const lines: string[] = [];
      let currentLine = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentLine += '""'; // keep escaped quote for the row parser
            i++;
          } else {
            inQuotes = !inQuotes;
            currentLine += char; // keep quote so row parser knows the cell is quoted
          }
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          if (currentLine.trim()) {
            lines.push(currentLine);
          }
          currentLine = '';
        } else {
          currentLine += char;
        }
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }

      if (lines.length < 2) {
        setParseError('The uploaded file must contain a header row and at least one property data row.');
        setParsedRows([]);
        return;
      }

      const parseRow = (line: string): string[] => {
        const cells: string[] = [];
        let currentCell = '';
        let inQ = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQ && nextChar === '"') {
              currentCell += '"';
              i++;
            } else {
              inQ = !inQ;
            }
          } else if (char === ',' && !inQ) {
            cells.push(currentCell.trim());
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell.trim());
        return cells;
      };

      const headers = parseRow(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

      const getVal = (rowObj: Record<string, string>, possibleKeys: string[]) => {
        const normalized = Object.keys(rowObj).reduce((acc, k) => {
          acc[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = rowObj[k];
          return acc;
        }, {} as Record<string, string>);

        for (const k of possibleKeys) {
          const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (normalized[normK] !== undefined && normalized[normK] !== '') {
            return normalized[normK];
          }
        }
        return '';
      };

      const rows: ParsedPropertyRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = parseRow(lines[i]);
        if (cells.every((c) => !c)) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((h, colIdx) => {
          rowObj[h] = cells[colIdx] ? cells[colIdx].replace(/^["']|["']$/g, '').trim() : '';
        });

        const name = getVal(rowObj, ['Property Name', 'PropertyName', 'property_name', 'Name', 'name']);
        const location = getVal(rowObj, ['Property Location', 'PropertyLocation', 'property_location', 'Location', 'location', 'Address', 'address']);
        const monthlyPrice = getVal(rowObj, ['Monthly price', 'MonthlyPrice', 'monthly_price', 'Price', 'price', 'MRR']);
        const mainPhone = getVal(rowObj, ['Main Phone no', 'Main Phone No', 'MainPhoneNo', 'main_phone_no', 'Main Phone', 'Phone']);
        const managementGroup = getVal(rowObj, ['Management group', 'Management Group', 'ManagementGroup', 'management_group', 'Organization', 'Group']);
        const e911Status = getVal(rowObj, ['E911 Status', 'E911Status', 'e911_status', 'E911']);
        const rayBaumStatus = getVal(rowObj, ['Ray Baum and Kari\'s law', 'Ray Baum and Kary\'s law', 'ay Baum and Kary\'s law', 'Ray Baum', 'ray_baum']);
        const gmName = getVal(rowObj, ['GM Name', 'GMName', 'gm_name', 'General Manager Name']);
        const gmEmail = getVal(rowObj, ['GM email', 'GMEmail', 'gm_email', 'General Manager Email']);

        const isValid = Boolean(name.trim());
        const validationError = !name.trim() ? 'Missing Property Name' : undefined;

        rows.push({
          name,
          location: location || 'Address pending',
          monthlyPrice: monthlyPrice || '—',
          mainPhone: mainPhone || '—',
          managementGroup: managementGroup || 'Unassigned',
          e911Status: e911Status || 'Verified',
          rayBaumStatus: rayBaumStatus || 'Active',
          gmName: gmName || '—',
          gmEmail: gmEmail || '—',
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

  // 3. Handle File Selection
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
        parseCSVText(text);
      };
      reader.readAsText(file);
    }
  };

  // 4. Submit Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

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
            className="relative w-full max-w-4xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430] shrink-0">
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
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {importResult ? (
                /* Success Result View */
                <div className="space-y-4 text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Properties Imported Successfully!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                      {importResult.message}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 mt-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>{importResult.importedCount} Properties set to Onboarded</span>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-left text-xs max-w-xl mx-auto space-y-1">
                      <span className="font-bold block">Rows with warnings / skipped:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>
                            <strong>Row {err.row} ({err.propertyName}):</strong> {err.reason}
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
                      Import More Properties
                    </button>
                    <button
                      onClick={handleModalClose}
                      className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
                    >
                      Done &amp; View Properties
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Two Options Section: Download Template & Upload CSV */}
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
                          Get an empty template with all required headers matching your database and UI.
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

                    {/* Option 2: Upload CSV Header Info */}
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

                  {/* Error Notification */}
                  {parseError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  {/* Required Headers Reference Pill Badge Bar */}
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

                  {/* Parsed Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Parsed Properties Preview
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                            {validRowCount} Ready to Import
                          </span>
                        </div>
                        <button
                          onClick={handleReset}
                          className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Clear
                        </button>
                      </div>

                      <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 dark:bg-[#181920] text-slate-600 dark:text-slate-400 text-[10.5px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-[#222430]">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Property Name</th>
                              <th className="px-3 py-2">Location</th>
                              <th className="px-3 py-2">Monthly Price</th>
                              <th className="px-3 py-2">Main Phone</th>
                              <th className="px-3 py-2">Management Group</th>
                              <th className="px-3 py-2">E911 / Ray Baum</th>
                              <th className="px-3 py-2">General Manager</th>
                              <th className="px-3 py-2">Status</th>
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
                                <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">
                                  {row.name || (
                                    <span className="text-rose-500 font-normal italic">Missing Name</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300 max-w-[140px] truncate" title={row.location}>
                                  {row.location}
                                </td>
                                <td className="px-3 py-2 text-slate-700 dark:text-slate-200 font-mono">
                                  {row.monthlyPrice !== '—' ? `$${row.monthlyPrice}` : '—'}
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">
                                  {row.mainPhone}
                                </td>
                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">
                                  {row.managementGroup}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                    {row.e911Status} / {row.rayBaumStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                  {row.gmName} {row.gmEmail !== '—' ? `<${row.gmEmail}>` : ''}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                    Onboarded
                                  </span>
                                </td>
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

            {/* Footer Actions */}
            {!importResult && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
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
                    disabled={importing || validRowCount === 0}
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
