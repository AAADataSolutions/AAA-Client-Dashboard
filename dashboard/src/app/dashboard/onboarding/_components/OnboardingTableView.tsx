import React from 'react';
import {
  Hotel,
  GitBranch,
  Calendar,
  User,
  Phone,
  Mail,
  Copy,
  Check,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getStageBadge } from '@/components/client/OnboardingTimelineModal';
import { OnboardingRecordItem } from './types';

interface OnboardingTableViewProps {
  paginatedRecords: OnboardingRecordItem[];
  totalRecords: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (val: number | ((p: number) => number)) => void;
  copiedId: string | null;
  onOpenTimeline: (record: OnboardingRecordItem) => void;
  onOpenEditGM: (record: OnboardingRecordItem) => void;
  onCopyText: (text: string, id: string, label: string, e: React.MouseEvent) => void;
}

export function OnboardingTableView({
  paginatedRecords,
  totalRecords,
  pageSize,
  currentPage,
  totalPages,
  setCurrentPage,
  copiedId,
  onOpenTimeline,
  onOpenEditGM,
  onCopyText,
}: OnboardingTableViewProps) {
  return (
    <>
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  PROPERTY NAME
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  ADDRESS
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  STAGE
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  TARGET CUTOVER DATE
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  GM NAME
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  GM PHONE
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  GM EMAIL
                </th>
                <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
              {paginatedRecords.map((item) => {
                const stageBadge = getStageBadge(item.stage || item.status);
                const gmName = item.general_manager_name || item.contact_person_name || '—';
                const gmPhone = item.general_manager_phone || item.property_phone || null;
                const gmEmail = item.general_manager_email || null;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onOpenTimeline(item)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors cursor-pointer group"
                  >
                    {/* Column 1: PROPERTY NAME */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <span>{item.property_name}</span>
                      </div>
                    </td>

                    {/* Column 2: ADDRESS */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="truncate max-w-[200px] block" title={item.property_address || item.property_location}>
                        {item.property_address || item.property_location || 'Address pending'}
                      </span>
                    </td>

                    {/* Column 3: STAGE */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${stageBadge.bg} ${stageBadge.text} border ${stageBadge.border}`}>
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{stageBadge.label}</span>
                      </span>
                    </td>

                    {/* Column 4: TARGET CUTOVER DATE */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {item.target_date
                            ? new Date(item.target_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Pending Schedule'}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: GM NAME */}
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]" title={gmName}>
                          {gmName}
                        </span>
                      </div>
                    </td>

                    {/* Column 6: GM PHONE */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {gmPhone && gmPhone !== 'N/A' ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{gmPhone}</span>
                          <button
                            onClick={(e) => onCopyText(gmPhone, `${item.id}-phone`, 'GM phone', e)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Copy phone"
                          >
                            {copiedId === `${item.id}-phone` ? (
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

                    {/* Column 7: GM EMAIL */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {gmEmail && gmEmail !== 'N/A' ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]" title={gmEmail}>
                            {gmEmail}
                          </span>
                          <button
                            onClick={(e) => onCopyText(gmEmail, `${item.id}-email`, 'GM email', e)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Copy email"
                          >
                            {copiedId === `${item.id}-email` ? (
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

                    {/* Column 8: ACTIONS */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenTimeline(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-semibold transition cursor-pointer border border-blue-200 dark:border-blue-900/40"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>View Timeline</span>
                        </button>
                        <button
                          onClick={() => onOpenEditGM(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#20222d] hover:bg-slate-200 dark:hover:bg-[#282a3a] text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                          title="Edit GM Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Edit GM</span>
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

      {/* Pagination */}
      {totalRecords > pageSize && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] px-4 py-3 rounded-xl shadow-xs flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, totalRecords)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> pipelines
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
