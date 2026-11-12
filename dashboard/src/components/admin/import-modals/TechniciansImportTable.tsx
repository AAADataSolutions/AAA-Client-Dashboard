'use client';

import React from 'react';
import { FileText, Download, Upload, RefreshCw, MapPin, Phone } from 'lucide-react';
import { ParsedTechnicianRow } from './techniciansCsvParser';

interface TechniciansImportTableProps {
  selectedFile: File | null;
  parsedRows: ParsedTechnicianRow[];
  validRowCount: number;
  onDownloadTemplate: () => void;
  onChangeFileClick: () => void;
  onReset: () => void;
}

export const TechniciansImportTable: React.FC<TechniciansImportTableProps> = ({
  selectedFile,
  parsedRows,
  validRowCount,
  onDownloadTemplate,
  onChangeFileClick,
  onReset,
}) => {
  return (
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
            onClick={onDownloadTemplate}
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#20222a] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-blue-500" /> Template
          </button>
          <button
            type="button"
            onClick={onChangeFileClick}
            className="px-2.5 py-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3 h-3" /> Change CSV
          </button>
          <button
            type="button"
            onClick={onReset}
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
  );
};
