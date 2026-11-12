'use client';

import React from 'react';
import {
  CheckCircle2,
  FileText,
  ExternalLink,
  Upload,
  Loader2,
} from 'lucide-react';
import { CIRCUIT_STAGES, type CircuitStatus } from './types';

interface ManageStagesTabProps {
  selectedCircuit: any;
  stageForm: {
    status: CircuitStatus;
    wholesaler_name: string;
    carrier_name: string;
    bandwidth: string;
    circuit_monthly_price: string | number;
    revenue_share_percentage: string | number;
    connectivity_type: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH';
    site_survey_status: string;
    site_survey_notes: string;
    foc_status: string;
    foc_date: string;
    foc_pending_actions_notes: string;
    technical_details: string;
    internal_admin_notes: string;
  };
  setStageForm: React.Dispatch<
    React.SetStateAction<{
      status: CircuitStatus;
      wholesaler_name: string;
      carrier_name: string;
      bandwidth: string;
      circuit_monthly_price: string | number;
      revenue_share_percentage: string | number;
      connectivity_type: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH';
      site_survey_status: string;
      site_survey_notes: string;
      foc_status: string;
      foc_date: string;
      foc_pending_actions_notes: string;
      technical_details: string;
      internal_admin_notes: string;
    }>
  >;
  agreementFile: File | null;
  setAgreementFile: React.Dispatch<React.SetStateAction<File | null>>;
  uploadingPdf: boolean;
  savingStage: boolean;
  handleUploadAgreementPdf: (advanceStage?: boolean) => Promise<void>;
  handleSaveCircuitChanges: (e?: React.FormEvent) => Promise<void>;
  onToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ManageStagesTab({
  selectedCircuit,
  stageForm,
  setStageForm,
  agreementFile,
  setAgreementFile,
  uploadingPdf,
  savingStage,
  handleUploadAgreementPdf,
  handleSaveCircuitChanges,
  onToast,
}: ManageStagesTabProps) {
  return (
    <div className="space-y-6">
      {/* Visual 7-Stage Process Bar */}
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">
          Data Circuit Lifecycle Stages (1 to 7)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {CIRCUIT_STAGES.map((st) => {
            const isCurrent = stageForm.status === st.key;
            const currentStepNum =
              CIRCUIT_STAGES.find((x) => x.key === stageForm.status)?.step || 1;
            const isCompleted = st.step < currentStepNum || stageForm.status === 'INSTALLED';
            const hasPdf = Boolean(
              selectedCircuit.agreement_file_name ||
              selectedCircuit.agreement_storage_path ||
              selectedCircuit.agreement_file_url
            );
            const isLockedByPdf = st.step >= 4 && !hasPdf;

            return (
              <button
                key={st.key}
                type="button"
                onClick={() => {
                  if (isLockedByPdf) {
                    onToast(
                      'Agreement PDF Required First',
                      'Upload the signed Agreement PDF below to advance to Paperwork Signed, Site Survey, FOC, or Installed.',
                      'error'
                    );
                    return;
                  }
                  setStageForm((p) => ({ ...p, status: st.key }));
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-[#282a36] text-slate-500 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase">Step {st.step}</span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
                <p className="font-bold text-[11px] mt-1 leading-snug">{st.label.replace(/^\d+\.\s*/, '')}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 4 GATE: Signed Agreement PDF Upload */}
      <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Step 4 Gate: Signed Agreement PDF (Required Before Site Survey / FOC / Installed)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Once quotation is sent and paperwork is signed by the client, upload the executed Agreement PDF here to unlock subsequent stages.
            </p>
          </div>
          {(selectedCircuit.agreement_file_name || selectedCircuit.agreement_file_url) && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Agreement PDF Uploaded
            </span>
          )}
        </div>

        {selectedCircuit.agreement_file_name && (
          <div className="p-3 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedCircuit.agreement_file_name}
              </span>
            </div>
            {selectedCircuit.agreement_file_url && (
              <a
                href={selectedCircuit.agreement_file_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                Download / View PDF <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
          {agreementFile && (
            <button
              type="button"
              disabled={uploadingPdf}
              onClick={() => handleUploadAgreementPdf(true)}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {uploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload Signed PDF &amp; Mark Paperwork Signed
            </button>
          )}
        </div>
      </div>

      {/* STEP 5 & STEP 6: Site Survey & FOC Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Step 5: Site Survey */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white">Step 5: Site Survey Status &amp; Notes</h4>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              Site Survey Status (Shown on Pipeline Table UI)
            </label>
            <select
              value={stageForm.site_survey_status}
              onChange={(e) => setStageForm((p) => ({ ...p, site_survey_status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-semibold"
            >
              <option value="PENDING">Site Survey: Pending</option>
              <option value="COMPLETED">Site Survey: Done (Completed)</option>
              <option value="NOT_REQUIRED">Not Required</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              Site Survey Notes (Saved to DB &amp; Visible in Property Right Sidebar)
            </label>
            <textarea
              rows={2}
              placeholder="Demarc room verified, conduit ready..."
              value={stageForm.site_survey_notes}
              onChange={(e) => setStageForm((p) => ({ ...p, site_survey_notes: e.target.value }))}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
            />
          </div>
        </div>

        {/* Step 6: FOC Status */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white">
            Step 6: FOC Confirmed or Pending Actions &amp; Notes
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                FOC Status (Shown on Table UI)
              </label>
              <select
                value={stageForm.foc_status}
                onChange={(e) => setStageForm((p) => ({ ...p, foc_status: e.target.value }))}
                className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-semibold"
              >
                <option value="PENDING_ACTIONS">FOC: Pending Actions</option>
                <option value="CONFIRMED">FOC: Confirmed</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">FOC Date</label>
              <input
                type="date"
                value={stageForm.foc_date}
                onChange={(e) => setStageForm((p) => ({ ...p, foc_date: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              FOC / Pending Actions Notes (Saved to DB &amp; Visible in Property Right Sidebar)
            </label>
            <textarea
              rows={2}
              placeholder="Waiting on rack power / CPE delivery..."
              value={stageForm.foc_pending_actions_notes}
              onChange={(e) =>
                setStageForm((p) => ({ ...p, foc_pending_actions_notes: e.target.value }))
              }
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
            />
          </div>
        </div>
      </div>

      {/* Property Connectivity Type & Internal Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
            Property Connectivity Badge (Shown on Admin &amp; Client Properties Page)
          </label>
          <select
            value={stageForm.connectivity_type}
            onChange={(e) =>
              setStageForm((p) => ({
                ...p,
                connectivity_type: e.target.value as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
              }))
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36]"
          >
            <option value="BOTH">Both (Ported &amp; Data Circuited)</option>
            <option value="DATA_CIRCUITED">Data Circuited</option>
            <option value="PORTED">Ported</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
            Internal Admin Notes (Hidden from Client)
          </label>
          <input
            type="text"
            value={stageForm.internal_admin_notes}
            onChange={(e) => setStageForm((p) => ({ ...p, internal_admin_notes: e.target.value }))}
            placeholder="Internal wholesaler tracking notes..."
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <button
          type="button"
          onClick={() => handleSaveCircuitChanges()}
          disabled={savingStage}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          {savingStage && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Stage &amp; Details
        </button>
      </div>
    </div>
  );
}
