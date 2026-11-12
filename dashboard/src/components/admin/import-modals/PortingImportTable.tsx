'use client';

import React from 'react';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ParsedPortingRow } from './portingCsvParser';

interface PortingImportTableProps {
  selectedFile: File;
  parsedRows: ParsedPortingRow[];
  importSummary: {
    total: number;
    valid: number;
    invalid: number;
  } | null;
  onClearFile: () => void;
}

export const PortingImportTable: React.FC<PortingImportTableProps> = ({
  selectedFile,
  parsedRows,
  importSummary,
  onClearFile,
}) => {
  return (
    <div className="space-y-4">
      {/* File Details Bar */}
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
          onClick={onClearFile}
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
  );
};
