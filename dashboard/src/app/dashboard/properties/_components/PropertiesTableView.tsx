'use client';

import React from 'react';
import {
  Hotel,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  MoreVertical,
  AlertCircle,
  User,
  Copy,
  Check,
  ExternalLink,
  Eye,
  FileText,
} from 'lucide-react';
import { getStageBadge } from '@/components/client/OnboardingTimelineModal';
import { PropertyRecord, getCircuitStageBadge, formatBilledDate } from './types';

interface PropertiesTableViewProps {
  properties: PropertyRecord[];
  copiedId: string | null;
  handleOpenPropertyDetails: (
    prop: PropertyRecord,
    tab?: 'OVERVIEW' | 'SERVICES' | 'E911' | 'TICKETS' | 'DATA_CIRCUIT' | 'PORTING_DOCS'
  ) => void;
  handleCopyText: (text: string, id: string, label: string, e: React.MouseEvent) => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyRecord) => void;
}

export const PropertiesTableView: React.FC<PropertiesTableViewProps> = ({
  properties,
  copiedId,
  handleOpenPropertyDetails,
  handleCopyText,
  handleOpenMenu,
}) => {
  return (
    /* TABLE VIEW — Strictly Required Columns */
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                PROPERTY
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                MONTHLY PRICE
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                MAIN PHONE NO.
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                NO. OF SERVICES
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                BILLING STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                E911 STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                RAY BAUM AND KARY'S LAW
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                DATA CIRCUIT STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                GM NAME
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                GM EMAIL
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                PROPERTY STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
            {properties.map((prop) => {
              const gmName = prop.general_manager_name || prop.contact_person_name || '—';
              const gmEmail = prop.general_manager_email || prop.contact_person_email || null;
              const stageKey = prop.stage || prop.onboarding_status || (prop.status === 'ACTIVE' ? 'COMPLETED' : 'DRAFT');
              const stageBadge = getStageBadge(stageKey);

              return (
                <tr
                  key={prop.id}
                  onClick={() => handleOpenPropertyDetails(prop)}
                  className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                >
                  {/* Column 1: PROPERTY with Address & Connectivity / Data Circuit underneath */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {prop.name}
                          </span>
                          {(() => {
                            const connType = (prop as any).connectivity_type || ((prop as any).data_circuit ? 'BOTH' : 'PORTED');
                            if (connType === 'BOTH') {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                                  Ported &amp; Data Circuited
                                </span>
                              );
                            }
                            if (connType === 'DATA_CIRCUITED') {
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                                  Data Circuited
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Ported
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span>
                            {prop.city
                              ? `${prop.address ? prop.address + ', ' : ''}${prop.city}, ${prop.state || prop.country} ${prop.zip_code || ''}`
                              : (prop.address || '—')}
                          </span>
                        </div>
                        {(prop as any).data_circuit && (
                          <div className="flex items-center gap-2 mt-1 text-[10.5px]">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-medium">
                              Carrier: <strong>{(prop as any).data_circuit.carrier_name || 'Pending'}</strong>
                              {(prop as any).data_circuit.bandwidth ? ` (${(prop as any).data_circuit.bandwidth})` : ''}
                              {(prop as any).data_circuit.circuit_monthly_price !== null && (prop as any).data_circuit.circuit_monthly_price !== undefined
                                ? ` • $${Number((prop as any).data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                                : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: MONTHLY PRICE */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                    {prop.monthly_price !== null && prop.monthly_price !== undefined
                      ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '—'}
                  </td>

                  {/* Column 3: MAIN PHONE NO. */}
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                    {prop.main_phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{prop.main_phone}</span>
                        <button
                          onClick={(e) => handleCopyText(prop.main_phone || '', `${prop.id}-main-phone`, 'Main phone', e)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Copy Main Phone"
                        >
                          {copiedId === `${prop.id}-main-phone` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Column 4: NO. OF SERVICES */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPropertyDetails(prop, 'SERVICES');
                      }}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 dark:bg-[#1a1c26] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 hover:border-blue-300 dark:border-[#282a36] dark:hover:border-blue-800/60 transition cursor-pointer"
                      title="Click to view assigned services"
                    >
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {prop.services_count || 0}
                      </span>
                      <span className="font-normal text-[11px] text-slate-400 group-hover:text-blue-500">
                        Services
                      </span>
                    </button>
                  </td>

                  {/* Column 4b: BILLING STATUS (with Billed Date underneath) */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-start gap-1">
                      {(prop as any).billing_status === 'BILLING_DONE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Billing Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Billing Pending
                        </span>
                      )}

                      {(prop as any).billing_status === 'BILLING_DONE' ? (
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pl-1 flex items-center gap-1">
                          <span>Billed:</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {(prop as any).billed_date
                              ? formatBilledDate((prop as any).billed_date)
                              : prop.onboarding_date
                              ? formatBilledDate(prop.onboarding_date)
                              : 'Done'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 pl-1 italic">
                          Unbilled
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Column 5: E911 STATUS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {prop.ray_baud_and_logs_enabled || prop.e911_status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 whitespace-nowrap">
                        <ShieldCheck className="w-3 h-3" /> PSAP Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
                        <AlertCircle className="w-3 h-3" /> Audit Required
                      </span>
                    )}
                  </td>

                  {/* Column 6: RAY BAUM AND KARY'S LAW */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {(prop as any).ray_baum_status === 'Active' || (prop as any).ray_baum_status === 'ACTIVE' || (prop as any).is_ray_baum_active === true ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/dashboard/ray-baum/${prop.id}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                        title="Click to view Ray Baum and Kary's Law dispatch records in a new tab"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>View Ray Baum&apos;s No.</span>
                        <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>

                  {/* Column: DATA CIRCUIT STATUS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {(prop as any).data_circuit ? (
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                            getCircuitStageBadge((prop as any).data_circuit.status).bg
                          } ${getCircuitStageBadge((prop as any).data_circuit.status).text} ${
                            getCircuitStageBadge((prop as any).data_circuit.status).border
                          }`}
                        >
                          {getCircuitStageBadge((prop as any).data_circuit.status).label}
                        </span>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>{(prop as any).data_circuit.carrier_name || 'Carrier Pending'}</span>
                          {(prop as any).data_circuit.bandwidth && (
                            <span>• {(prop as any).data_circuit.bandwidth}</span>
                          )}
                          {(prop as any).data_circuit.agreement_file_url && (
                            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800" title="Signed Agreement Available">
                              <FileText className="w-2.5 h-2.5" /> PDF
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        Ported Only
                      </span>
                    )}
                  </td>

                  {/* Column 7: GM NAME */}
                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[130px]" title={gmName}>
                        {gmName}
                      </span>
                    </div>
                  </td>

                  {/* Column 8: GM EMAIL */}
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {gmEmail && gmEmail !== 'N/A' ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]" title={gmEmail}>
                          {gmEmail}
                        </span>
                        <button
                          onClick={(e) => handleCopyText(gmEmail, `${prop.id}-email`, 'GM email', e)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title="Copy email"
                        >
                          {copiedId === `${prop.id}-email` ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Column 9: PROPERTY STATUS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        prop.status === 'ACTIVE' || prop.status === 'ONBOARDING'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          prop.status === 'ACTIVE' || prop.status === 'ONBOARDING'
                            ? 'bg-emerald-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {prop.status === 'ACTIVE' || prop.status === 'ONBOARDING' ? 'Onboarded' : prop.status}
                    </span>
                  </td>

                  {/* Column 11: ACTIONS */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenPropertyDetails(prop)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={(e) => handleOpenMenu(e, prop)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                        aria-label="More property actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
