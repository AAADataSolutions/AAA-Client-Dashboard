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
  ArrowLeftRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface ImportPortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedPortingRow {
  client: string;
  propertyName: string;
  propertyPhone: string;
  fax: string;
  monthlyPrice: string;
  channelPartner: string;
  partnerRevShare: string;
  targetDate: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  gmName: string;
  gmPhone: string;
  gmEmail: string;
  stage: string;
  e911Status: string;
  rayBaumStatus: string;
  carrierDetails: string;
  isValid: boolean;
  validationError?: string;
}

const REQUIRED_HEADERS = [
  'Client',
  'Property Name',
  'Main Phone Number',
  'Fax Number',
  'Monthly Price ($)',
  'Channel Partner',
  'Partner Revenue Share (%)',
  'Target Cutover Date',
  'Street Address',
  'City',
  'State',
  'ZIP Code',
  'GM Full Name',
  'GM Phone Number',
  'GM Email Address',
  'Initial Lifecycle Stage',
  'E911 Compliance Status',
  "Ray Baum & Kari's Law",
  'Losing Carrier & Porting Notes',
];

export const ImportPortingModal: React.FC<ImportPortingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPortingRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    valid: number;
    invalid: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // CSV Line Parser supporting quoted values with commas
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
        'Paramount Hospitality Group,Grand Hotel Downtown,(555) 123-4567,(555) 987-6543,249.00,Apex Telecom,15,2026-11-15,742 Evergreen Terrace,Springfield,OR,97477,Sarah Connor,(555) 345-6789,gm@grandhotel.com,Stage 1: Draft initialized,PSAP Verified (Compliant),Active (Compliant),"Losing carrier: Verizon, Account #: 987123847, PIN: 1234"',
        '-- Unassigned (None) --,Magnolia Suites Austin,(512) 555-8822,,189.00,No Partner Assigned,,2026-12-01,100 Congress Ave,Austin,TX,78701,Michael Scott,(512) 555-8833,michael@magnolia.com,Stage 2: Contract sent,Audit Required,Active (Compliant),"Losing carrier: AT&T, PIN: 4321"',
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_porting_records.csv');
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

      const rows: ParsedPortingRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rowArr = parseCSVLine(lines[i]);
        if (rowArr.length === 1 && !rowArr[0]) continue;

        const client = getVal(rowArr, ['Client', 'Management Group', 'Organization', 'Group']);
        const propertyName = getVal(rowArr, ['Property Name', 'Property', 'Name']);
        const propertyPhone = getVal(rowArr, ['Main Phone Number', 'Main Phone', 'Phone Number', 'Phone']);
        const fax = getVal(rowArr, ['Fax Number', 'Fax']);
        const monthlyPrice = getVal(rowArr, ['Monthly Price ($)', 'Monthly Price', 'Monthly', 'Price']);
        const channelPartner = getVal(rowArr, ['Channel Partner', 'Partner', 'Partner Name']);
        const partnerRevShare = getVal(rowArr, ['Partner Revenue Share (%)', 'Partner Revenue Share', 'Partner Share', 'Revenue Share', 'Commission']);
        const targetDate = getVal(rowArr, ['Target Cutover Date', 'Target Date', 'Cutover Date']);
        const streetAddress = getVal(rowArr, ['Street Address', 'Address', 'Street']);
        const city = getVal(rowArr, ['City']);
        const state = getVal(rowArr, ['State']);
        const zipCode = getVal(rowArr, ['ZIP Code', 'Zip Code', 'Zip', 'Zipcode', 'Postal Code']);
        const gmName = getVal(rowArr, ['GM Full Name', 'GM Name', 'General Manager Name', 'General Manager', 'Contact Name']);
        const gmPhone = getVal(rowArr, ['GM Phone Number', 'GM Phone', 'General Manager Phone']);
        const gmEmail = getVal(rowArr, ['GM Email Address', 'GM Email', 'General Manager Email']);
        const stage = getVal(rowArr, ['Initial Lifecycle Stage', 'Lifecycle Stage', 'Stage', 'Status']) || 'Stage 1: Draft initialized';
        const e911Status = getVal(rowArr, ['E911 Compliance Status', 'E911 Status', 'E911']) || 'PSAP Verified (Compliant)';
        const rayBaumStatus = getVal(rowArr, ["Ray Baum & Kari's Law", 'Ray Baum Status', 'Ray Baum']) || 'Active (Compliant)';
        const carrierDetails = getVal(rowArr, ['Losing Carrier & Porting Notes', 'Porting Notes', 'Carrier Details', 'Notes']);

        let isValid = true;
        let validationError = '';

        if (!propertyName) {
          isValid = false;
          validationError = 'Missing Property Name';
        } else if (!propertyPhone) {
          isValid = false;
          validationError = 'Missing Main Phone Number';
        } else if (gmEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmEmail)) {
          isValid = false;
          validationError = 'Invalid GM Email format';
        }

        rows.push({
          client,
          propertyName,
          propertyPhone,
          fax,
          monthlyPrice,
          channelPartner,
          partnerRevShare,
          targetDate,
          streetAddress,
          city,
          state,
          zipCode,
          gmName,
          gmPhone,
          gmEmail,
          stage,
          e911Status,
          rayBaumStatus,
          carrierDetails,
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
      const res = await fetch('/api/admin/porting/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map((r) => ({
            client: r.client,
            property_name: r.propertyName,
            property_phone: r.propertyPhone,
            fax: r.fax,
            monthly_price: r.monthlyPrice,
            channel_partner: r.channelPartner,
            partner_revenue_share: r.partnerRevShare,
            target_date: r.targetDate,
            street_address: r.streetAddress,
            city: r.city,
            state: r.state,
            zip_code: r.zipCode,
            general_manager_name: r.gmName,
            general_manager_phone: r.gmPhone,
            general_manager_email: r.gmEmail,
            status: r.stage,
            e911_status: r.e911Status,
            ray_baum_status: r.rayBaumStatus,
            carrier_details: r.carrierDetails,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Porting import failed.');
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
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#20222a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Import Porting Records from CSV
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk upload porting properties with client assignment, telecom details, and compliance.
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
                Need the standard Porting CSV template?
              </span>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Includes all 19 fields: Client, Property Name, Main Phone, Fax, Monthly Price, Partner, Rev Share, Cutover Date, Address, GM Info, Stage, and Compliance.
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
                Click to browse or drag and drop your Porting CSV here
              </p>
              <p className="text-xs text-slate-400 mt-1">Supports standard CSV exports</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
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

              {/* Parsed Preview Table */}
              <div className="border border-slate-200 dark:border-[#282a36] rounded-xl overflow-hidden max-h-64 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead className="bg-slate-100 dark:bg-[#1a1b24] text-[10px] font-bold uppercase text-slate-500 sticky top-0">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">Status</th>
                      <th className="p-2.5 whitespace-nowrap">Property Name</th>
                      <th className="p-2.5 whitespace-nowrap">Main Phone</th>
                      <th className="p-2.5 whitespace-nowrap">Client</th>
                      <th className="p-2.5 whitespace-nowrap">Monthly Price</th>
                      <th className="p-2.5 whitespace-nowrap">Partner &amp; Share</th>
                      <th className="p-2.5 whitespace-nowrap">Street Address</th>
                      <th className="p-2.5 whitespace-nowrap">City, State, Zip</th>
                      <th className="p-2.5 whitespace-nowrap">GM Contact</th>
                      <th className="p-2.5 whitespace-nowrap">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#20222a]">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={!r.isValid ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
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
                          {r.propertyName}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                          {r.propertyPhone}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.client && !r.client.toLowerCase().includes('unassigned')
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {r.client || 'Unassigned'}
                          </span>
                        </td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {r.monthlyPrice ? `$${Number(r.monthlyPrice).toFixed(2)}` : '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div>{r.channelPartner || 'None'}</div>
                          {r.partnerRevShare && (
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              {r.partnerRevShare}% Share
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {r.streetAddress || '—'}
                        </td>
                        <td className="p-2.5 text-slate-500 whitespace-nowrap">
                          {r.city ? `${r.city}, ${r.state || ''} ${r.zipCode || ''}`.trim() : '—'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div>{r.gmName || '—'}</div>
                          {r.gmEmail && <div className="text-[10px] text-slate-400">{r.gmEmail}</div>}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {r.stage}
                          </span>
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
            className="px-4 py-2 border border-slate-200 dark:border-[#282a36] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f212d] cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteImport}
              disabled={isSubmitting || !importSummary || importSummary.valid === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Importing...'
                  : `Import ${importSummary ? importSummary.valid : 0} Records`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
