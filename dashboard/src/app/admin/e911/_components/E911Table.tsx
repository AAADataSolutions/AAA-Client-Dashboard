'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  MoreVertical,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { E911Item } from '@/store/slices/e911Slice';
import { E911Status, getStatusBadge } from './types';

interface E911TableProps {
  records: E911Item[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  hasActiveFilters: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onResetFilters: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (record: E911Item) => void;
  onOpenDetails: (record: E911Item, tab: 'DETAILS' | 'NOTES') => void;
}

export default function E911Table({
  records,
  loading,
  error,
  pagination,
  hasActiveFilters,
  onPageChange,
  onRetry,
  onResetFilters,
  onOpenCreate,
  onOpenEdit,
  onOpenDetails,
}: E911TableProps) {
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; record: E911Item } | null>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, rec: E911Item) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const left = Math.max(16, rect.right - menuWidth);
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, record: rec });
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load E911 records</p>
        <p className="text-xs text-slate-400 mt-0.5">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (loading && records.length === 0) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
            <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
            <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800 dark:text-white">No E911 Records Found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {hasActiveFilters
            ? 'No records match the selected filters.'
            : 'Add your first dispatchable location for PSAP verification.'}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add E911 Location
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY NAME</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY ADDRESS</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION NAME</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">EMERGENCY DISPATCH ADDRESS</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STATUS</th>
              <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
            {records.map((rec: E911Item) => {
              const badge = getStatusBadge(rec.status as E911Status);

              return (
                <tr
                  key={rec.id}
                  onClick={() => onOpenDetails(rec, 'DETAILS')}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                >
                  {/* 1. Property Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-black dark:text-white text-sm block">
                      {rec.property_name}
                    </span>
                  </td>

                  {/* 2. Property Address */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-700 dark:text-slate-300">
                      {rec.property_details?.address || rec.emergency_address}
                    </span>
                  </td>

                  {/* 3. Organization Name */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {rec.organization_name || 'Unassigned'}
                    </span>
                  </td>

                  {/* 4. Emergency Dispatch Address */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {rec.emergency_address}
                    </span>
                  </td>

                  {/* 5. Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {badge.label}
                    </span>
                  </td>

                  {/* 6. Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenEdit(rec)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenMenu(e, rec)}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                        title="More Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} records
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

      {/* 3-DOTS ACTION POPUP */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.record.property_name}</p>
              <p className="text-[10px] text-slate-400">E911 Options</p>
            </div>

            <button
              onClick={() => {
                onOpenDetails(menuPosition.record, 'DETAILS');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                onOpenEdit(menuPosition.record);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Record</span>
            </button>

            <button
              onClick={() => {
                onOpenDetails(menuPosition.record, 'NOTES');
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              <span>Correction Notes</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
