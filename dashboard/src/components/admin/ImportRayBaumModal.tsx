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
  ShieldCheck,
  Check,
  RefreshCw,
  Table as TableIcon,
  Phone,
  DoorOpen,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface ImportRayBaumModalProps {
  isOpen: boolean;
  propertyId: string;
  propertyName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRayBaumRow {
  phone: string;
  assignedRoom: string;
  location: string;
  isValid: boolean;
  validationError?: string;
  rawObj: Record<string, string>;
}

const REQUIRED_HEADERS = [
  'PHONE NO.',
  'ASSIGNED TO ROOM',
  'LOCATION',
];

export const ImportRayBaumModal: React.FC<ImportRayBaumModalProps> = ({
  isOpen,
  propertyId,
  propertyName = 'Property',
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRayBaumRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    message: string;
    errors?: { row: number; phone: string; reason: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = `${REQUIRED_HEADERS.join(',')}\n` +
      `"+1 (312) 555-0101","Room 101","Building A - 1st Floor"\n` +
      `"+1 (312) 555-0102","Room 102","Building A - 1st Floor"\n` +
      `"+1 (312) 555-0201","Room 201","Building A - 2nd Floor"\n` +
      `"+1 (312) 555-0901","Elevator Lobby 1","West Wing - Ground Floor"\n` +
      `"+1 (312) 555-0902","Front Desk Reception","Main Entrance Lobby"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Ray_Baum_Dispatch_Template_${propertyName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Robust CSV Line Parser
  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('The CSV file is empty or does not contain a header row.');
    }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuote = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === ',' && !insideQuote) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

    // Normalize header lookup
    const getVal = (rowObj: Record<string, string>, aliases: string[]): string => {
      const lowerKeys = Object.keys(rowObj).reduce((acc, k) => {
        acc[k.toLowerCase().trim()] = rowObj[k];
        return acc;
      }, {} as Record<string, string>);

      for (const alias of aliases) {
        const direct = rowObj[alias];
        if (direct !== undefined && direct !== '') return direct;
        const low = lowerKeys[alias.toLowerCase().trim()];
        if (low !== undefined && low !== '') return low;
      }
      return '';
    };

    const parsed: ParsedRayBaumRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCSVLine(lines[i]);
      if (rowValues.length === 0 || rowValues.every((v) => !v)) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = rowValues[idx] ? rowValues[idx].replace(/^["']|["']$/g, '').trim() : '';
      });

      const phone = getVal(rowObj, ['PHONE NO.', 'Phone No', 'Phone number', 'Phone', 'phone', 'PHONE']);
      const assignedRoom = getVal(rowObj, ['ASSIGNED TO ROOM', 'Assigned To Room', 'Room', 'room', 'ROOM', 'Assigned Room']);
      const location = getVal(rowObj, ['LOCATION', 'Location', 'location', 'Address']);

      let isValid = true;
      let validationError: string | undefined;

      if (!phone) {
        isValid = false;
        validationError = 'Missing phone number';
      }

      parsed.push({
        phone,
        assignedRoom,
        location,
        isValid,
        validationError,
        rawObj: rowObj,
      });
    }

    return parsed;
  };

  const handleFileProcess = async (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    try {
      setParseError(null);
      setSelectedFile(file);
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setParseError('No valid data rows found in the CSV file.');
        return;
      }

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;

    try {
      setImporting(true);
      setParseError(null);

      const payload = {
        property_id: propertyId,
        rows: parsedRows.map((r) => ({
          phone_number: r.phone,
          assigned_to_room: r.assignedRoom,
          location: r.location,
        })),
      };

      const res = await fetch('/api/admin/ray-baum/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to import Ray Baum records.');
      }

      setImportResult({
        success: true,
        importedCount: json.importedCount || parsedRows.length,
        failedCount: json.failedCount || 0,
        message: json.message || `Successfully imported ${json.importedCount || parsedRows.length} dispatch records.`,
        errors: json.errors,
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Import Ray Baum &amp; Kari&apos;s Law CSV
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bulk upload E911 dispatchable location records for <strong className="text-slate-700 dark:text-slate-300">{propertyName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {importResult ? (
              /* Success State */
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Import Completed!
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {importResult.message}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {importResult.importedCount} Records Added / Updated
                  </div>
                  {importResult.failedCount > 0 && (
                    <div className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 font-semibold">
                      {importResult.failedCount} Failed
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-center gap-2.5">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a2c3a] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1a1c24] cursor-pointer"
                  >
                    Import Another File
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Done &amp; View Records
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1 & 2 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1: Download Template */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191b22] border border-slate-200 dark:border-[#222430] flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Download Template</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Get the sample CSV formatted with the required headers: <strong>PHONE NO., ASSIGNED TO ROOM, LOCATION</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="w-full py-2.5 px-3 rounded-lg border border-blue-300 dark:border-blue-900/60 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Ray Baum Template</span>
                    </button>
                  </div>

                  {/* Step 2: Upload CSV */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191b22] border border-slate-200 dark:border-[#222430] flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Upload Completed CSV</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {selectedFile ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Loaded: {selectedFile.name} ({parsedRows.length} rows)
                          </span>
                        ) : (
                          'Select your filled Ray Baum CSV file to preview and import records.'
                        )}
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileProcess(e.target.files[0]);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{selectedFile ? 'Select Different File' : 'Browse CSV File'}</span>
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {parseError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-bold text-xs">CSV Parsing Issue</p>
                      <p className="text-[11px] mt-0.5">{parseError}</p>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {parsedRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          Preview Dispatch Records ({parsedRows.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {validCount} Valid
                        </span>
                        {invalidCount > 0 && (
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {invalidCount} Invalid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-[#181920] sticky top-0 border-b border-slate-200 dark:border-[#222430] text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">PHONE NO.</th>
                            <th className="py-2.5 px-3">ASSIGNED TO ROOM</th>
                            <th className="py-2.5 px-3">LOCATION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-[11px]">
                          {parsedRows.slice(0, 50).map((row, idx) => (
                            <tr
                              key={idx}
                              className={
                                row.isValid
                                  ? 'hover:bg-slate-50/60 dark:hover:bg-[#181922]'
                                  : 'bg-rose-50/30 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                              }
                            >
                              <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white font-mono">
                                {row.phone || <span className="text-rose-500 italic">Required</span>}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                {row.assignedRoom || <span className="text-slate-400">—</span>}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                {row.location || <span className="text-slate-400">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parsedRows.length > 50 && (
                        <div className="p-2 text-center text-[10.5px] text-slate-400 bg-slate-50 dark:bg-[#15161c]">
                          Showing first 50 of {parsedRows.length} records. All rows will be imported.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!importResult && (
            <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a2c3a] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {parsedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#2a2c3a] text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={parsedRows.length === 0 || importing}
                  onClick={handleImportSubmit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing {validCount} Records...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Import ({validCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
