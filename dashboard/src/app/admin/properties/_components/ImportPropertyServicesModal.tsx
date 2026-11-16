'use client';

import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  Loader2,
  Check,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface ImportPropertyServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  existingServices: any[];
  onSuccess: () => void;
}

const SERVICE_CSV_HEADERS = [
  'Service Type',
  'Phone Number',
  'Service Name',
  'Monthly Price',
  'Description',
  'Status',
  'Service ID',
  'Device Type',
  'Serial Number',
];

interface ParsedServiceRow {
  serviceType: string;
  phoneNumber: string;
  serviceName: string;
  price: number;
  description: string;
  status: string;
  serviceId: string;
  deviceType: string;
  serialNumber: string;
  isValid: boolean;
  rawObj: Record<string, string>;
}

export function ImportPropertyServicesModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  existingServices,
  onSuccess,
}: ImportPropertyServicesModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedServiceRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    importedCount: number;
    failedCount: number;
    message: string;
    errors?: { row: number; phone: string; reason: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingPhones = useMemo(
    () =>
      new Set(
        (existingServices || [])
          .map((s) => String(s.phone_number || '').trim().toLowerCase())
          .filter(Boolean)
      ),
    [existingServices]
  );

  const rowsWithFlags = useMemo(() => {
    const counts = new Map<string, number>();
    parsedRows.forEach((r) => {
      const k = r.phoneNumber.trim().toLowerCase();
      if (k) counts.set(k, (counts.get(k) || 0) + 1);
    });
    return parsedRows.map((r) => {
      const k = r.phoneNumber.trim().toLowerCase();
      const existsInDb = Boolean(k && existingPhones.has(k));
      const dupInCsv = Boolean(k && (counts.get(k) || 0) > 1);
      return { ...r, existsInDb, dupInCsv };
    });
  }, [parsedRows, existingPhones]);

  const dupInCsvCount = useMemo(
    () => rowsWithFlags.filter((r) => r.dupInCsv).length,
    [rowsWithFlags]
  );

  const handleDownloadSample = () => {
    const csv =
      `${SERVICE_CSV_HEADERS.join(',')}\n` +
      `"Voice Trunk / DID","+1 (555) 100-2001","Main Lobby Line",45.00,"Front desk main voice line","ACTIVE","","",""\n` +
      `"Fire Line","+1 (555) 100-2002","North Wing Fire Panel",65.00,"Primary fire alarm dialer","ACTIVE","","Fire Communicator DACT","SN-FL-1001"\n` +
      `"Elevator Line","+1 (555) 100-2003","Guest Elevator 1",55.00,"Main passenger elevator emergency line","ACTIVE","","Elevator Emergency Phone","SN-EL-2001"`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_sample_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setParseError(null);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setParseError('CSV must have a header row and at least one service row.');
        setParsedRows([]);
        return;
      }

      const splitLine = (line: string) =>
        line
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const headers = splitLine(lines[0]);
      const rows: ParsedServiceRow[] = lines.slice(1).map((line) => {
        const cols = splitLine(line);
        const rawObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rawObj[h] = cols[idx] ?? '';
        });

        const getVal = (keys: string[]) => {
          for (const k of keys) {
            const matchKey = Object.keys(rawObj).find(
              (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
            );
            if (matchKey && rawObj[matchKey].trim()) return rawObj[matchKey].trim();
          }
          return '';
        };

        const phoneNumber = getVal(['Phone Number', 'Phone', 'DID', 'Number', 'phone_number']);
        const serviceType = getVal(['Service Type', 'Type', 'service_type']) || 'Voice Trunk / DID';
        const serviceName = getVal(['Service Name', 'Name', 'service_name']);
        const priceNum = parseFloat(getVal(['Monthly Price', 'Price', 'price']).replace(/[^0-9.]/g, '')) || 0;
        const description = getVal(['Description', 'Notes', 'description']);
        const status = getVal(['Status', 'status']).toUpperCase() || 'ACTIVE';
        const serviceId = getVal(['Service ID', 'Custom Service ID', 'custom_service_id']);
        const deviceType = getVal(['Device Type', 'device_type']);
        const serialNumber = getVal(['Serial Number', 'Serial', 'serial_number']);

        return {
          serviceType,
          phoneNumber,
          serviceName,
          price: priceNum,
          description,
          status,
          serviceId,
          deviceType,
          serialNumber,
          isValid: Boolean(phoneNumber),
          rawObj,
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV file.');
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0 || dupInCsvCount > 0) return;

    try {
      setImporting(true);
      setParseError(null);
      const res = await fetch(`/api/admin/properties/${propertyId}/services/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows.map((r) => r.rawObj) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Import failed.');
      }
      setResult(json);
      onSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Failed to import services.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    setResult(null);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative z-10 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Import Services via CSV — {propertyName}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Common CSV format for Voice, Fire Line, Elevator Line, and Custom services
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1e202b] hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sample CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {result ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Import Completed</h4>
                  <p className="text-slate-600 dark:text-slate-300">{result.message}</p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430]">
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Common CSV Columns ({SERVICE_CSV_HEADERS.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SERVICE_CSV_HEADERS.map((h) => (
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
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{parseError}</span>
                    </div>
                  )}

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-[#2b2e3d] hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 dark:bg-[#111217]/50"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedFile ? selectedFile.name : 'Click to upload Services .csv file'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Existing phone numbers will only have blank columns updated.
                    </p>
                  </div>

                  {rowsWithFlags.length > 0 && (
                    <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-x-auto max-h-60">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] sticky top-0">
                          <tr>
                            <th className="py-2 px-3 font-bold">Remove</th>
                            <th className="py-2 px-3 font-bold">Phone Number</th>
                            <th className="py-2 px-3 font-bold">Service Type</th>
                            <th className="py-2 px-3 font-bold">Service Name</th>
                            <th className="py-2 px-3 font-bold">Price</th>
                            <th className="py-2 px-3 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                          {rowsWithFlags.map((r, idx) => (
                            <tr key={idx} className={r.dupInCsv ? 'bg-rose-50/50' : ''}>
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={() => setParsedRows((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1 text-rose-500 hover:bg-rose-100 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                              <td className="py-2 px-3 font-mono font-bold">
                                <span>{r.phoneNumber || 'Missing'}</span>
                                {r.dupInCsv ? (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                                    Duplicate in CSV
                                  </span>
                                ) : r.existsInDb ? (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                                    Fill Blanks
                                  </span>
                                ) : null}
                              </td>
                              <td className="py-2 px-3">{r.serviceType}</td>
                              <td className="py-2 px-3">{r.serviceName || '—'}</td>
                              <td className="py-2 px-3 font-mono">${r.price.toFixed(2)}</td>
                              <td className="py-2 px-3">{r.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && (
                <button
                  type="button"
                  disabled={importing || parsedRows.filter((r) => r.isValid).length === 0 || dupInCsvCount > 0}
                  onClick={handleImport}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Import {parsedRows.filter((r) => r.isValid).length} Service(s)</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
