'use client';

import React from 'react';
import {
  ArrowLeftRight,
  Hotel,
  MoreVertical,
  LifeBuoy,
  RefreshCw,
  Copy,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { type PortingRecordItem, getStageDate } from './types';

interface PortingTableAndMenuProps {
  loading: boolean;
  portings: PortingRecordItem[];
  setSelectedPortingForDrawer: (item: PortingRecordItem | null) => void;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  toast: any;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, record: PortingRecordItem) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  menuPosition: { top?: number; bottom?: number; left: number; record: PortingRecordItem } | null;
  setMenuPosition: (pos: any) => void;
  handleCopyNumbers: (record: PortingRecordItem, e?: React.MouseEvent) => void;
  handleOpenProperty: (propId: string) => void;
  handleRaisePortingTicket: (record: PortingRecordItem) => void;
}

export function PortingTableAndMenu({
  loading,
  portings,
  setSelectedPortingForDrawer,
  copiedId,
  setCopiedId,
  toast,
  handleOpenMenu,
  currentPage,
  setCurrentPage,
  pageSize,
  totalRecords,
  totalPages,
  menuPosition,
  setMenuPosition,
  handleCopyNumbers,
  handleOpenProperty,
  handleRaisePortingTicket,
}: PortingTableAndMenuProps) {
  return (
    <>
      {/* 4. Porting Table — 11 REQUESTED COLUMNS */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-[#222430] bg-white dark:bg-[#15161c] overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY</th>
                <th className="py-3 px-4 whitespace-nowrap">MONTHLY PRICE</th>
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY STATUS</th>
                <th className="py-3 px-4 whitespace-nowrap">PORTING DOCS</th>
                <th className="py-3 px-4 whitespace-nowrap">MAIN PHONE NO.</th>
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
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading porting records...
                  </td>
                </tr>
              ) : portings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No porting records found matching your filter.
                  </td>
                </tr>
              ) : (
                portings.map((item) => {
                  const normalizedStage = (
                    item.status === 'CSR_DETAILS' || item.status === 'CSR_AND_CONTRACT_DETAILS' || (item as any).stage === 'CSR_DETAILS' || (item as any).stage === 'CSR_AND_CONTRACT_DETAILS' ? 'CSR_DETAILS' :
                    item.status === 'SOF_WAITING' ? 'CUT_SHEET_REVIEW' :
                    item.status === 'SUBMITTED' ? 'PORTING_SUBMITTED' :
                    item.status === 'IN_PROGRESS' ? 'PORTING_SUBMITTED' :
                    (item as any).stage || item.status || 'DRAFT'
                  );
                  const badge = {
                    DRAFT: { label: 'Draft initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]' },
                    CONTRACT_SENT: { label: 'Contract sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50' },
                    SIGNED: { label: 'Contract signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50' },
                    CSR_DETAILS: { label: 'CSR and contract details', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/50' },
                    CUT_SHEET_REVIEW: { label: 'Cut sheet review', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50' },
                    PORTING_SUBMITTED: { label: 'Porting submitted', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50' },
                    FOC_RECEIVED: { label: 'FOC Confirm', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50' },
                    COMPLETED: { label: 'Onboarding', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50' },
                  }[normalizedStage] || { label: 'Draft initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]' };

                  const locationStr = item.city
                    ? `${item.city}${item.state ? `, ${item.state}` : ''}`
                    : (item.property_location || item.property_address || '—');
                  const servicesCount = item.services_count !== undefined ? item.services_count : (item.services?.length || 0);

                  const isE911Verified = item.e911_status === 'VERIFIED' || item.ray_baud_and_logs_enabled || item.status === 'COMPLETED';
                  const isE911Correction = item.e911_status === 'CORRECTION_REQUIRED';
                  const isRayBaumCompliant =
                    item.ray_baud_and_logs_enabled === true ||
                    item.ray_baum_status === 'ACTIVE' ||
                    item.ray_baum_status === 'Active' ||
                    item.ray_baum_status === 'VERIFIED' ||
                    (item as any).is_ray_baum_active === true;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedPortingForDrawer(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#191b24] transition cursor-pointer"
                    >
                      {/* 1. Property Name with Address / Location underneath */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.property_name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          {locationStr}
                        </div>
                      </td>

                      {/* 2. Monthly Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {item.monthly_price !== null && item.monthly_price !== undefined && item.monthly_price !== '' ? (
                          <span>${Number(item.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

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
                            {getStageDate(item, normalizedStage)}
                          </span>
                        </div>
                      </td>

                      {/* 3b. Porting Docs */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {item.attachments && item.attachments.length > 0 ? (
                          <button
                            onClick={() => setSelectedPortingForDrawer(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-300/60 dark:border-purple-800 transition cursor-pointer shadow-xs group"
                            title="Click to view porting documents & attachments"
                          >
                            <FileText className="w-3 h-3 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span>{item.attachments.length} {item.attachments.length === 1 ? 'Doc' : 'Docs'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-normal text-xs pl-1">0 Docs</span>
                        )}
                      </td>

                      {/* 4. Main Phone No. */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-mono" onClick={(e) => e.stopPropagation()}>
                        {item.property_phone && item.property_phone !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{item.property_phone}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.property_phone);
                                setCopiedId(`phone_${item.id}`);
                                toast.success('Phone copied');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy Phone"
                            >
                              {copiedId === `phone_${item.id}` ? (
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

                      {/* 5. No. of Services */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                          {servicesCount} {servicesCount === 1 ? 'Service' : 'Services'}
                        </span>
                      </td>

                      {/* 6. E911 Status */}
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

                      {/* 7. Ray Baum and Kari's Law */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRayBaumCompliant ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.property_id) {
                                window.open(`/dashboard/ray-baum/${item.property_id}`, '_blank');
                              } else {
                                setSelectedPortingForDrawer(item);
                              }
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

                      {/* 8. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                        {item.general_manager_name && item.general_manager_name !== 'N/A' && item.general_manager_name !== '—' ? (
                          item.general_manager_name
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 9. GM Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium" onClick={(e) => e.stopPropagation()}>
                        {item.general_manager_email && item.general_manager_email !== 'N/A' && item.general_manager_email !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px]">{item.general_manager_email}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.general_manager_email || '');
                                setCopiedId(`gm_email_${item.id}`);
                                toast.success('GM Email copied');
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedId === `gm_email_${item.id}` ? (
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
                            onClick={() => setSelectedPortingForDrawer(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-xs border border-blue-200/60 dark:border-blue-800/60 cursor-pointer transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, item)}
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
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalRecords)} of{' '}
            {totalRecords} requests
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  currentPage === num
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                }`}
              >
                {num}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer text-xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed 3-Dots Overlay Action Menu */}
      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="z-50 w-56 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#252733]">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                Porting Order
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.record.property_name}
              </span>
            </div>

            <button
              onClick={() => {
                setSelectedPortingForDrawer(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Porting Timeline</span>
            </button>

            <button
              onClick={() => {
                setSelectedPortingForDrawer(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>View Porting Docs ({menuPosition.record.attachments?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                const rec = menuPosition.record;
                setMenuPosition(null);
                handleCopyNumbers(rec);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span>Copy Attached Numbers</span>
            </button>

            {menuPosition.record.property_id && (
              <button
                onClick={() => handleOpenProperty(menuPosition.record.property_id!)}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
              >
                <Hotel className="w-3.5 h-3.5 text-blue-500" />
                <span>View Property 360°</span>
              </button>
            )}

            {menuPosition.record.property_id && (
              menuPosition.record.ray_baud_and_logs_enabled === true ||
              menuPosition.record.ray_baum_status === 'ACTIVE' ||
              menuPosition.record.ray_baum_status === 'Active' ||
              menuPosition.record.ray_baum_status === 'VERIFIED' ||
              (menuPosition.record as any).is_ray_baum_active === true
            ) && (
              <button
                onClick={() => {
                  const propId = menuPosition.record.property_id;
                  setMenuPosition(null);
                  window.open(`/dashboard/ray-baum/${propId}`, '_blank');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Ray Baum&apos;s No.</span>
              </button>
            )}

            <div className="border-t border-slate-100 dark:border-[#252733] my-1" />

            <button
              onClick={() => handleRaisePortingTicket(menuPosition.record)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              <span>Raise Porting Support Ticket</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
