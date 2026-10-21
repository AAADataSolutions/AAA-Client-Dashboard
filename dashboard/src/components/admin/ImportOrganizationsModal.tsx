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
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

interface ImportOrganizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedOrgRow {
  name: string;
  type: string;
  primaryContact: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  isValid: boolean;
  validationError?: string;
}

const REQUIRED_HEADERS = [
  'Management Group Name',
  'Type',
  'Primary Contact',
  'Email',
  'Phone',
  'Status',
  'Created At',
  'Street Address',
  'City',
  'State',
  'Zip Code',
];

export const ImportOrganizationsModal: React.FC<ImportOrganizationsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedOrgRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust CSV Line Parser supporting quoted commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        REQUIRED_HEADERS.join(','),
        'Paramount Hospitality Group,GROUP,Marcus Vance,admin@paramounthotels.com,(312) 555-0142,ACTIVE,2026-01-15,100 N Michigan Ave,Chicago,IL,60601',
        'David Miller Real Estate,INDIVIDUAL,David Miller,david@millerholding.com,(312) 555-0199,ACTIVE,2026-02-01,450 W Grand Ave,Chicago,IL,60654',
        'Apex Luxury Hotels,GROUP,Sarah Jenkins,sjenkins@apexresorts.com,(312) 555-0188,ACTIVE,2026-03-10,222 S Riverside Plaza,Chicago,IL,60606',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_management_groups.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setParsingError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParsingError('Empty file provided.');
        return;
      }

      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setParsingError('CSV must have a header row and at least one data row.');
        return;
      }

      const headerLine = parseCSVLine(lines[0]);
      const headerMap: Record<string, number> = {};
      headerLine.forEach((h, idx) => {
        headerMap[h.toLowerCase().trim().replace(/[^a-z0-9]/g, '')] = idx;
      });

      const getVal = (rowArr: string[], aliases: string[]) => {
        for (const alias of aliases) {
          const key = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (headerMap[key] !== undefined && rowArr[headerMap[key]] !== undefined) {
            return rowArr[headerMap[key]].replace(/^"|"$/g, '').trim();
          }
        }
        return '';
      };

      const rows: ParsedOrgRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length === 1 && !rowArr[0]) continue;

        const name = getVal(rowArr, ['Management Group Name', 'Management Group', 'Group Name', 'Name', 'Organization']);
        const typeRaw = getVal(rowArr, ['Type', 'Group Type', 'Org Type']);
        const type = typeRaw.toUpperCase() === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GROUP';
        const primaryContact = getVal(rowArr, ['Primary Contact', 'Contact Name', 'Contact', 'PrimaryContact']);
        const email = getVal(rowArr, ['Email', 'Contact Email', 'E-mail']);
        const phone = getVal(rowArr, ['Phone', 'Phone Number', 'Main Phone']);
        const statusRaw = getVal(rowArr, ['Status', 'Org Status']);
        const status = ['INACTIVE', 'PENDING'].includes(statusRaw.toUpperCase()) ? statusRaw.toUpperCase() : 'ACTIVE';
        const createdAt = getVal(rowArr, ['Created At', 'CreatedAt', 'Creation Date', 'Date']);
        const streetAddress = getVal(rowArr, ['Street Address', 'Address', 'Street']);
        const city = getVal(rowArr, ['City']);
        const state = getVal(rowArr, ['State']);
        const zip = getVal(rowArr, ['Zip', 'Zip Code', 'Zipcode', 'Postal Code']);

        let isValid = true;
        let validationError = '';

        if (!name) {
          isValid = false;
          validationError = 'Missing Management Group Name';
        } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          isValid = false;
          validationError = 'Invalid Email format';
        }

        rows.push({
          name,
          type,
          primaryContact,
          email,
          phone,
          status,
          createdAt,
          streetAddress,
          city,
          state,
          zip,
          isValid,
          validationError,
        });
      }

      const validCount = rows.filter((r) => r.isValid).length;
      setImportSummary({
        total: rows.length,
        valid: validCount,
        invalid: rows.length - validCount,
      });
      setParsedRows(rows);
    };

    reader.onerror = () => {
      setParsingError('Failed to read file.');
    };

    reader.readAsText(file);
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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/organizations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            name: r.name,
            type: r.type,
            primary_contact: r.primaryContact,
            email: r.email,
            phone: r.phone,
            status: r.status,
            created_at: r.createdAt || undefined,
            street_address: r.streetAddress,
            city: r.city,
            state: r.state,
            zip: r.zip,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Import failed.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setParsingError(err.message || 'Import execution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#20222a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Import Management Groups from CSV
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload client organizations with primary contacts, addresses, and group types.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Sample Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                Need the standard import format?
              </span>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Includes Management Group Name, Type (GROUP/INDIVIDUAL), Primary Contact, Email, Phone, Status, Created At, Street Address, City, State, and Zip.
              </p>
            </div>
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-white dark:bg-[#1a1b24] hover:bg-slate-50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Sample CSV
            </button>
          </div>

          {/* Upload Drop Area */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-[#2a2d3d] hover:border-blue-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag and drop your CSV file here
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports standard CSV exports</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details bar */}
              <div className="p-3 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedRows([]);
                    setImportSummary(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Choose different file
                </button>
              </div>

              {/* Import Summary Badges */}
              {importSummary && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] flex items-center justify-between">
                    <span className="text-xs text-slate-500">Total Rows</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {importSummary.total}
                    </span>
                  </div>
                  <div className="flex-1 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                      Ready to Import
                    </span>
                    <span className="text-sm font-black text-emerald-600">
                      {importSummary.valid}
                    </span>
                  </div>
                  {importSummary.invalid > 0 && (
                    <div className="flex-1 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
                      <span className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                        Errors / Skipped
                      </span>
                      <span className="text-sm font-black text-rose-600">
                        {importSummary.invalid}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Parsed Preview Table with All Details */}
              <div className="border border-slate-200 dark:border-[#282a36] rounded-xl overflow-hidden max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[1050px]">
                  <thead className="bg-slate-100 dark:bg-[#1a1b24] text-[10px] font-bold uppercase text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">Validation</th>
                      <th className="p-2.5 whitespace-nowrap">Management Group Name</th>
                      <th className="p-2.5 whitespace-nowrap">Type</th>
                      <th className="p-2.5 whitespace-nowrap">Status</th>
                      <th className="p-2.5 whitespace-nowrap">Primary Contact</th>
                      <th className="p-2.5 whitespace-nowrap">Email</th>
                      <th className="p-2.5 whitespace-nowrap">Phone</th>
                      <th className="p-2.5 whitespace-nowrap">Street Address</th>
                      <th className="p-2.5 whitespace-nowrap">City</th>
                      <th className="p-2.5 whitespace-nowrap">State</th>
                      <th className="p-2.5 whitespace-nowrap">Zip Code</th>
                      <th className="p-2.5 whitespace-nowrap">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#20222a]">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={!r.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-[#1a1b24]/50'}>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span
                              title={r.validationError}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600"
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> {r.validationError}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {r.name}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.type === 'GROUP'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {r.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.primaryContact || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {r.email || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {r.phone || '—'}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.streetAddress || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {r.city || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {r.state || '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono text-[11px]">
                          {r.zip || '—'}
                        </td>
                        <td className="p-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                          {r.createdAt || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {parsingError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parsingError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-[#20222a] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={!importSummary || importSummary.valid === 0 || isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <span>Import {importSummary?.valid || 0} Management Groups</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
