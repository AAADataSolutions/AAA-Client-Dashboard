'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import {
  ParsedPortingRow,
  downloadPortingSample,
  parsePortingCsv,
} from './import-modals/portingCsvParser';
import { PortingImportTable } from './import-modals/PortingImportTable';

interface ImportPortingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

  const processFile = (file: File) => {
    setParsingError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows, summary, error } = parsePortingCsv(text);
      if (error) {
        setParsingError(error);
        return;
      }
      setImportSummary(summary);
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

  const handleClearFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setImportSummary(null);
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
              onClick={downloadPortingSample}
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
            <PortingImportTable
              selectedFile={selectedFile}
              parsedRows={parsedRows}
              importSummary={importSummary}
              onClearFile={handleClearFile}
            />
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
