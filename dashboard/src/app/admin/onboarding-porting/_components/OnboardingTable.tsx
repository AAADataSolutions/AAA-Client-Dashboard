'use client';

import React from 'react';
import {
  ArrowLeftRight,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Loader2,
  Check,
  Copy,
  Eye,
  GitBranch,
} from 'lucide-react';
import { OnboardingItem, OnboardingRecord } from '@/store/slices/onboardingSlice';
import { getStageBadge, OnboardingStatus } from './onboardingTypes';

interface OnboardingTableProps {
  loading: boolean;
  onboardings: OnboardingRecord[];
  hasActiveFilters: boolean;
  resetAllFilters: () => void;
  onOpenCreateModal: () => void;
  openUnifiedModal: (record: OnboardingItem, defaultTab?: 'DETAILS' | 'STAGE') => void;
  handleCopy: (text: string, label: string) => void;
  copiedField: string | null;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, record: OnboardingItem) => void;
  pagination: {
    currentPage: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  menuPosition: { bottom: number; left: number; record: OnboardingItem } | null;
  setMenuPosition: React.Dispatch<React.SetStateAction<{ bottom: number; left: number; record: OnboardingItem } | null>>;
}

export function OnboardingTable({
  loading,
  onboardings,
  hasActiveFilters,
  resetAllFilters,
  onOpenCreateModal,
  openUnifiedModal,
  handleCopy,
  copiedField,
  handleOpenMenu,
  pagination,
  onPageChange,
  menuPosition,
  setMenuPosition,
}: OnboardingTableProps) {
  return (
    <>
      {/* Main Table / Empty State */}
      {loading && onboardings.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="text-xs font-medium">Loading onboarding pipelines...</p>
        </div>
      ) : onboardings.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1a1c24] flex items-center justify-center mx-auto text-slate-400">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No onboarding records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try clearing active search or stage filters to see all pipelines.'
                : 'Initialize your first onboarding pipeline to start tracking cutover lifecycle stages.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2.5">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onOpenCreateModal}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize Pipeline
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ADDRESS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STAGE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ASSIGNEE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">TARGET CUTOVER DATE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM PHONE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM EMAIL</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {onboardings.map((rec: OnboardingRecord) => {
                  const stageBadge = getStageBadge(((rec as any).stage || rec.status) as OnboardingStatus);
                  const fullAddress = rec.property_address || rec.address
                    ? `${rec.property_address || rec.address}, ${(rec as any).property_city || rec.city || ''} ${(rec as any).property_state || rec.state || ''}`.trim()
                    : 'Pending Address';

                  return (
                    <tr
                      key={rec.id}
                      onClick={() => openUnifiedModal(rec, 'DETAILS')}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Property Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {rec.property_name}
                        </span>
                      </td>

                      {/* 2. Address (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 dark:text-slate-300">{fullAddress}</span>
                          {fullAddress !== 'Pending Address' && (
                            <button
                              onClick={() => handleCopy(fullAddress, `addr-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy Address"
                            >
                              {copiedField === `addr-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. Organization */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {rec.organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 4. Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageBadge.bg} ${stageBadge.text} ${stageBadge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {stageBadge.label}
                        </span>
                      </td>

                      {/* 5. Assignee (Admin Side Only) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.assigned_to_name ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 font-medium text-[11px]">
                            <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">
                              {rec.assigned_to_name.charAt(0).toUpperCase()}
                            </div>
                            <span>{rec.assigned_to_name}</span>
                          </div>
                        ) : ['SIGNED', 'CSR_DETAILS', 'CSR_AND_CONTRACT_DETAILS', 'CUT_SHEET_REVIEW', 'PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED', 'COMPLETED'].includes(rec.stage || rec.status || '') ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium border border-amber-200/50 dark:border-amber-800/40">
                            Ready to Assign
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* 6. Target Cutover Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {rec.target_date ? (
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {new Date(rec.target_date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">TBD</span>
                        )}
                      </td>

                      {/* 7. GM Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {rec.general_manager_name || 'N/A'}
                        </span>
                      </td>

                      {/* 8. GM Phone (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_phone && rec.general_manager_phone !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">{rec.general_manager_phone}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_phone || '', `gm-phone-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Phone"
                            >
                              {copiedField === `gm-phone-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* 9. GM Email (Can Copy) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {rec.general_manager_email && rec.general_manager_email !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300">{rec.general_manager_email}</span>
                            <button
                              onClick={() => handleCopy(rec.general_manager_email || '', `gm-email-${rec.id}`)}
                              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                              title="Copy GM Email"
                            >
                              {copiedField === `gm-email-${rec.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* 10. Actions (Three Dots Only) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenMenu(e, rec)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                          title="Actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} pipelines
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => onPageChange(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pagination.currentPage === num
                      ? 'bg-[#4f46e5] text-white'
                      : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-DOTS ACTION POPUP */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ bottom: `${menuPosition.bottom}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.record.property_name}</p>
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
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Stage &amp; Assignment</span>
            </button>

            <button
              onClick={() => {
                openUnifiedModal(menuPosition.record, 'STAGE');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
              <span>View Stage Road</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
