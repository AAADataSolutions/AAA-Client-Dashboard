'use client';

import React from 'react';
import { FileText, Download, Upload, RefreshCw } from 'lucide-react';
import { ParsedPropertyRow } from './propertiesCsvParser';

interface PropertiesImportTableProps {
  selectedFile: File | null;
  parsedRows: ParsedPropertyRow[];
  validRowCount: number;
  onDownloadTemplate: () => void;
  onChangeFileClick: () => void;
  onReset: () => void;
}

export const PropertiesImportTable: React.FC<PropertiesImportTableProps> = ({
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
              {parsedRows.length} total rows detected (19 columns format)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#20222a] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3 h-3 text-blue-500" /> Template (19 Cols)
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

      {/* Preview Table Header with Scroll Hint */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          Parsed Properties Preview
        </span>
        <span className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50 flex items-center gap-1.5 font-medium">
          <span className="font-bold">↔</span>
          <span>Scroll horizontally to view all 19 columns</span>
        </span>
      </div>

      {/* Table Container with horizontal scrollbar */}
      <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-x-auto overflow-y-auto max-h-[380px] shadow-2xs [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:bg-slate-400/80 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-[#181920]">
        <table className="w-full min-w-[1500px] text-left text-xs border-collapse">
          <thead className="bg-slate-100 dark:bg-[#181920] text-slate-600 dark:text-slate-400 text-[10.5px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-[#222430] z-10">
            <tr>
              <th className="px-3 py-2.5 whitespace-nowrap">#</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Property Name</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Street Address</th>
              <th className="px-3 py-2.5 whitespace-nowrap">City, State, Zip</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Country</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Main Phone</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Fax</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Organization Name</th>
              <th className="px-3 py-2.5 whitespace-nowrap">GM Contacts</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Monthly Pricing</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Ray Baum Status</th>
              <th className="px-3 py-2.5 whitespace-nowrap">E911 Status</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Onboarding Date</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Billing Status</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Data Subject Status</th>
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
                <td className="px-3 py-2 text-slate-400 font-mono text-[10px] whitespace-nowrap">{idx + 1}</td>
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                  {row.name || (
                    <span className="text-rose-500 font-normal italic">Missing Name</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {row.streetAddress}
                </td>
                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {row.city}, {row.state} {row.zip}
                </td>
                <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{row.country}</td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{row.mainPhone}</td>
                <td className="px-3 py-2 font-mono text-slate-500 whitespace-nowrap">{row.fax}</td>
                <td className="px-3 py-2 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                  {row.organizationName}
                </td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  <div>
                    <span className="font-semibold block">{row.gmName}</span>
                    <span className="text-[10.5px] text-slate-400 block">{row.gmEmail} • {row.gmPhone}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  ${row.monthlyPricing}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.rayBaumStatus === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {row.rayBaumStatus}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.e911Status === 'Verified'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {row.e911Status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono whitespace-nowrap">{row.onboardingDate}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit ${
                        row.billingStatus === 'Billing Done'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {row.billingStatus}
                    </span>
                    {row.billingDate && row.billingDate !== '—' && (
                      <span className="text-[10px] text-slate-400 mt-0.5">{row.billingDate}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    {row.dataSubjectStatus}
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
