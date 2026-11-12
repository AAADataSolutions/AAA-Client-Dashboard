'use client';

import React from 'react';
import { CheckCircle2, Check } from 'lucide-react';

interface ImportResultData {
  success: boolean;
  importedCount: number;
  failedCount: number;
  message: string;
  errors?: { row: number; propertyName: string; reason: string }[];
}

interface PropertiesImportResultViewProps {
  importResult: ImportResultData;
  onReset: () => void;
  onClose: () => void;
}

export const PropertiesImportResultView: React.FC<PropertiesImportResultViewProps> = ({
  importResult,
  onReset,
  onClose,
}) => {
  return (
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
          onClick={onReset}
          className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] transition cursor-pointer"
        >
          Import More Properties
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs cursor-pointer"
        >
          Done &amp; View Properties
        </button>
      </div>
    </div>
  );
};
