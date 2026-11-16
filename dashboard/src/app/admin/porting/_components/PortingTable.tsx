'use client';

import React from 'react';
import {
  ArrowLeftRight,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Copy,
  PhoneCall,
  Eye,
  GitBranch,
  Trash2,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { PortingItem } from '@/store/slices/portingSlice';
import { getStageBadge, getStageDate, normalizeStageKey } from './portingTypes';

interface PortingTableProps {
  isSuperAdmin: boolean;
  loading: boolean;
  portings: PortingItem[];
  openUnifiedModal: (record: PortingItem, defaultTab?: 'DETAILS' | 'STAGE' | 'MEDIA') => void;
  handleCopy: (text: string, label: string) => void;
  copiedField: string | null;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, record: PortingItem) => void;
  pagination: {
    currentPage: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  menuPosition: { bottom: number; left: number; record: PortingItem } | null;
  setMenuPosition: React.Dispatch<React.SetStateAction<{ bottom: number; left: number; record: PortingItem } | null>>;
  handleOpenAssignServices: (record: PortingItem) => void;
  onRequestDelete: (record: PortingItem) => void;
}

export function PortingTable({
  isSuperAdmin,
  loading,
  portings,
  openUnifiedModal,
  handleCopy,
  copiedField,
  handleOpenMenu,
  pagination,
  onPageChange,
  menuPosition,
  setMenuPosition,
  handleOpenAssignServices,
  onRequestDelete,
}: PortingTableProps) {
  return (
    <>
      {/* MAIN DATA TABLE — 11 REQUESTED COLUMNS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY</th>
                {isSuperAdmin && <th className="py-3 px-4 whitespace-nowrap">VOICE MONTHLY PRICE</th>}
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">MAIN PHONE NO.</th>
                <th className="py-3 px-4 whitespace-nowrap">CLIENT</th>
                <th className="py-3 px-4 whitespace-nowrap">NO. OF SERVICES</th>
                <th className="py-3 px-4 whitespace-nowrap">E911 STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">RAY BAUM AND KARY&apos;S LAW</th>
                <th className="py-3 px-4 whitespace-nowrap">GM NAME</th>
                <th className="py-3 px-4 whitespace-nowrap">GM EMAIL</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/60">
              {loading && portings.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading porting records...
                  </td>
                </tr>
              ) : portings.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 11 : 10} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No porting records found matching your filter.
                  </td>
                </tr>
              ) : (
                portings.map((rec) => {
                  const badge = getStageBadge(rec.status || rec.stage || 'DRAFT');
                  const locationStr = rec.city
                    ? `${rec.city}${rec.state ? `, ${rec.state}` : ''}`
                    : rec.property_address || '—';
                  const servicesCount = rec.services_count !== undefined ? rec.services_count : (rec.services?.length || 0);

                  const isE911Verified = rec.e911_status === 'VERIFIED' || rec.ray_baud_and_logs_enabled || rec.status === 'COMPLETED';
                  const isE911Correction = rec.e911_status === 'CORRECTION_REQUIRED';
                  const isRayBaumCompliant = rec.ray_baud_and_logs_enabled ?? (rec.ray_baum_status === 'ACTIVE' || rec.status === 'COMPLETED');

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openUnifiedModal(rec, 'STAGE')}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#191b24] transition cursor-pointer"
                    >
                      {/* 1. Property Name with Address / Location underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rec.property_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {locationStr}
                        </div>
                      </td>

                      {/* 2. Monthly Price */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          {rec.monthly_price !== null && rec.monthly_price !== undefined && rec.monthly_price !== '' ? (
                            <span>${Number(rec.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* 3. Property Status (Badge + Date underneath) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {badge.label}
                          </span>
                          <span className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 pl-1">
                            {getStageDate(rec, rec.status || rec.stage)}
                          </span>
                          {(() => {
                            const curStageKey = normalizeStageKey(rec.status || rec.stage || 'DRAFT');
                            const curAssignee = (rec as any).stage_assignments?.[curStageKey]?.assigned_to_name || (curStageKey === 'SIGNED' ? (rec as any).stage3_assigned_to_name : curStageKey === 'CSR_DETAILS' ? (rec as any).stage4_assigned_to_name : '') || rec.assigned_to_name;
                            if (!curAssignee) return null;
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[10px] font-semibold">
                                👤 {curAssignee}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* 4. Main Phone No. */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-mono" onClick={(e) => e.stopPropagation()}>
                        {rec.property_phone && rec.property_phone !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{rec.property_phone}</span>
                            <button
                              onClick={() => handleCopy(rec.property_phone || '', `prop_phone_${rec.id}`)}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedField === `prop_phone_${rec.id}` ? (
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

                      {/* 5. Client (formerly Management Group) with Green / Blue dot */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium" onClick={(e) => e.stopPropagation()}>
                        {rec.organization_name && rec.organization_name !== 'Unassigned' && rec.organization_name !== 'Unassigned Organization' && rec.organization_name !== 'Direct Portfolio' && rec.organization_name !== 'Organization' ? (
                          <div className="inline-flex items-center gap-2">
                            {rec.organization_id ? (
                              <a
                                href={`/admin/organizations/${rec.organization_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                              >
                                <span>{rec.organization_name}</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{rec.organization_name}</span>
                            )}
                            {rec.organization_type === 'INDIVIDUAL' ? (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-2xs ring-2 ring-blue-500/20"
                                title="Individual Client"
                              />
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-2xs ring-2 ring-emerald-500/20"
                                title="Group Client"
                              />
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold">Unassigned</span>
                        )}
                      </td>

                      {/* 6. No. of Services */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {servicesCount} {servicesCount === 1 ? 'Service' : 'Services'}
                        </span>
                      </td>

                      {/* 7. E911 Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isE911Verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Verified
                          </span>
                        ) : isE911Correction ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Correction Req
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10.5px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 8. Ray Baum and Kari's Law */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRayBaumCompliant ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = rec.property_id || rec.organization_property_id || rec.id;
                              window.open(`/admin/ray-baum/${targetId}`, '_blank');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
                            title="Click to view Ray Baum and Kari's Law dispatch records in a new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>View Ray Baum No.s</span>
                            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* 9. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                        {rec.general_manager_name && rec.general_manager_name !== 'N/A' && rec.general_manager_name !== '—' ? (
                          rec.general_manager_name
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 10. GM Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_email && rec.general_manager_email !== 'N/A' && rec.general_manager_email !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{rec.general_manager_email}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_email || '', `gm_email_${rec.id}`)}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedField === `gm_email_${rec.id}` ? (
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

                      {/* 11. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openUnifiedModal(rec, 'DETAILS')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200/60 dark:border-blue-800/60 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, rec)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} requests
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage <= 1 || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  pagination.currentPage === num
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-DOTS ACTION POPUP (OPENS STRICTLY ABOVE) */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ bottom: `${menuPosition.bottom}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuPosition.record.property_name}
              </p>
              <p className="text-[10px] text-slate-400">Pipeline Actions</p>
            </div>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'DETAILS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View &amp; Edit Details</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <GitBranch className="w-3.5 h-3.5 text-amber-500" />
              <span>Stage Tracking Roadmap</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'MEDIA');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>PDFs &amp; Images ({menuPosition.record.attachments?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                handleOpenAssignServices(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
              <span>Assign Services</span>
            </button>

            <button
              onClick={() => {
                onRequestDelete(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-medium border-t border-slate-100 dark:border-[#222430]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Porting Record</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
