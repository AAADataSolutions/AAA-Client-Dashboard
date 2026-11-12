'use client';

import React from 'react';
import {
  Plus,
  Download,
  Check,
  Copy,
  ExternalLink,
  Wifi,
  FileText,
} from 'lucide-react';
import { DrawerTabType } from './types';

interface PropertyMasterDrawerTab4And5Props {
  drawerTab: DrawerTabType;
  propertyDrawerData: any;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
}

export function PropertyMasterDrawerTab4And5({
  drawerTab,
  propertyDrawerData,
  copiedField,
  handleCopy,
}: PropertyMasterDrawerTab4And5Props) {
  return (
    <>
      {/* TAB 4: DATA CIRCUIT ("DATA SUBJECT" / DATA CIRCUIT DETAILS) */}
      {drawerTab === 'DATA_CIRCUIT' && (
        <div className="space-y-4">
          {propertyDrawerData?.data_circuit ? (
            <>
              {/* Circuit Primary Stage Banner */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">Data Circuit Provisioning</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                      Stage: {propertyDrawerData.data_circuit.status?.replace(/_/g, ' ') || 'STARTED'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                  {propertyDrawerData.data_circuit.status || 'STARTED'}
                </span>
              </div>

              {/* Carrier & Client Pricing Specs */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                  Carrier &amp; Pricing Parameters
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Carrier (Client Sees)</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                      {propertyDrawerData.data_circuit.carrier_name || 'Pending Selection'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Bandwidth</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                      {propertyDrawerData.data_circuit.bandwidth || '1 Gig'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Client Monthly Price</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                      $
                      {Number(propertyDrawerData.data_circuit.circuit_monthly_price || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      /mo
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Wholesaler (Hidden)</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm mt-0.5 block">
                      {propertyDrawerData.data_circuit.wholesaler_name || '—'}
                    </span>
                  </div>
                </div>

                {/* Wholesaler Revenue Share Breakdown */}
                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Wholesaler Revenue Share Percentage</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {propertyDrawerData.data_circuit.revenue_share_percentage || 0}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Estimated Monthly Revenue Share</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(propertyDrawerData.data_circuit.monthly_revenue_share_amount || 0).toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Descriptive Technical Details (Entered during creation/provisioning) */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
                    Descriptive Technical Information (WAN IP, IP Address, Gateway, DNS, etc.)
                  </span>
                  {propertyDrawerData.data_circuit.technical_details && (
                    <button
                      onClick={() => handleCopy(propertyDrawerData.data_circuit.technical_details, 'tech-details-copy')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {copiedField === 'tech-details-copy' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Technical Details</span>
                    </button>
                  )}
                </div>

                {propertyDrawerData.data_circuit.technical_details ? (
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                    {propertyDrawerData.data_circuit.technical_details}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
                    No technical details recorded yet for this circuit.
                  </div>
                )}
              </div>

              {/* Lifecycle Milestones & Signed Agreement Gate */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5 text-xs">
                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                  Lifecycle Milestones &amp; Agreement Documents
                </span>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                    <span>Signed Agreement PDF:</span>
                    {propertyDrawerData.data_circuit.agreement_file_url ? (
                      <a
                        href={propertyDrawerData.data_circuit.agreement_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{propertyDrawerData.data_circuit.agreement_file_name || 'View Agreement PDF'}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">Pending Upload</span>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Site Survey Status:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          propertyDrawerData.data_circuit.site_survey_status === 'COMPLETED' ||
                          propertyDrawerData.data_circuit.site_survey_status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : propertyDrawerData.data_circuit.site_survey_status === 'NOT_REQUIRED'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {propertyDrawerData.data_circuit.site_survey_status === 'COMPLETED' ||
                        propertyDrawerData.data_circuit.site_survey_status === 'DONE'
                          ? 'Site Survey: Done'
                          : propertyDrawerData.data_circuit.site_survey_status === 'NOT_REQUIRED'
                          ? 'Not Required'
                          : 'Site Survey: Pending'}
                      </span>
                    </div>
                    {propertyDrawerData.data_circuit.site_survey_notes && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200/70 dark:border-[#252836] text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Site Survey Notes:</span>
                        {propertyDrawerData.data_circuit.site_survey_notes}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">FOC Status &amp; Date:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          propertyDrawerData.data_circuit.foc_status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {propertyDrawerData.data_circuit.foc_status === 'CONFIRMED'
                          ? `FOC Confirmed${propertyDrawerData.data_circuit.foc_date ? ` (${propertyDrawerData.data_circuit.foc_date})` : ''}`
                          : `FOC Pending Actions${propertyDrawerData.data_circuit.foc_date ? ` (${propertyDrawerData.data_circuit.foc_date})` : ''}`}
                      </span>
                    </div>
                    {propertyDrawerData.data_circuit.foc_pending_actions_notes && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200/70 dark:border-[#252836] text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block mb-0.5">FOC / Cutover Notes:</span>
                        {propertyDrawerData.data_circuit.foc_pending_actions_notes}
                      </div>
                    )}
                  </div>

                  {propertyDrawerData.data_circuit.internal_admin_notes && (
                    <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                        Internal Admin Notes:
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {propertyDrawerData.data_circuit.internal_admin_notes}
                      </p>
                    </div>
                  )}

                  {propertyDrawerData.data_circuit.installed_at && (
                    <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                      <span>Installation Completed At:</span>
                      <span className="font-mono text-emerald-600 font-bold">
                        {new Date(propertyDrawerData.data_circuit.installed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Competing Wholesaler Quotes History */}
              {propertyDrawerData.data_circuit.quotes && propertyDrawerData.data_circuit.quotes.length > 0 && (
                <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5">
                  <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                    Wholesaler Quotes History ({propertyDrawerData.data_circuit.quotes.length})
                  </span>
                  <div className="space-y-1.5">
                    {propertyDrawerData.data_circuit.quotes.map((q: any) => (
                      <div
                        key={q.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          q.is_selected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-[#222430] bg-white dark:bg-[#181a24]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{q.wholesaler_name}</span>
                            <span className="text-slate-400">via</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{q.carrier_name}</span>
                            {q.is_selected && (
                              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-600 text-white">
                                FINALIZED
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Bandwidth: {q.bandwidth} • Rev Share: {q.proposed_rev_share_percentage}% ($
                            {Number(q.proposed_rev_share_amount || 0).toFixed(2)}/mo)
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${Number(q.quoted_monthly_price || 0).toFixed(2)}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortcut to Data Circuits Manager */}
              <div className="pt-2 flex justify-end">
                <a
                  href="/admin/data-circuits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>Manage Circuit in Data Circuits Center</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-3">
              <Wifi className="w-8 h-8 mx-auto text-slate-400" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Ported Only — No Data Circuit Attached
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  This property currently has Voice/DID services provisioned without an active dedicated Data Circuit pipeline.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/admin/data-circuits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start Data Circuit for this Property</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PORTING DOCS & IMAGES (VIEW & DOWNLOAD) */}
      {drawerTab === 'PORTING_DOCS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-sm">Porting Documents &amp; Images</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                  All LOAs, CSRs, signed contracts, billing copies &amp; images uploaded during porting
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
              {propertyDrawerData?.porting_attachments?.length || 0} File
              {(propertyDrawerData?.porting_attachments?.length || 0) === 1 ? '' : 's'}
            </span>
          </div>

          {!propertyDrawerData?.porting_attachments || propertyDrawerData.porting_attachments.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-2 text-slate-400">
              <FileText className="w-8 h-8 mx-auto opacity-40" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No Porting Documents or Images Attached
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Documents or images uploaded while creating or managing this property in the Porting section will automatically appear here for viewing and download.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {propertyDrawerData.porting_attachments.map((att: any, idx: number) => {
                const downloadUrl = `/api/admin/porting/attachment?path=${encodeURIComponent(att.storage_path)}`;
                const isImage =
                  (att.mime_type && att.mime_type.startsWith('image/')) ||
                  /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.file_name || '');
                const sizeKb = att.file_size ? `${(Number(att.file_size) / 1024).toFixed(1)} KB` : '';

                return (
                  <div
                    key={att.id || att.storage_path || idx}
                    className="p-3.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl space-y-3 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800/60 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                            {att.file_name || 'Porting Attachment'}
                          </p>
                          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300 font-semibold uppercase text-[9.5px]">
                              {isImage ? 'IMAGE' : 'DOCUMENT / PDF'}
                            </span>
                            {sizeKb && <span>• {sizeKb}</span>}
                            {att.created_at && <span>• {new Date(att.created_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.file_name || true}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download / View</span>
                        </a>
                      </div>
                    </div>

                    {isImage && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] max-h-60 flex items-center justify-center p-2">
                        <img
                          src={downloadUrl}
                          alt={att.file_name || 'Porting Image'}
                          className="max-h-56 w-auto object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

