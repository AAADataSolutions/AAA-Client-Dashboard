'use client';

import React from 'react';
import {
  Wrench,
  Plus,
  Upload,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Technician } from './types';

interface TechniciansTableProps {
  error: string | null;
  loading: boolean;
  technicians: Technician[];
  hasActiveFilters: boolean;
  copiedId: string | null;
  loadTechnicians: () => void;
  setShowImportModal: (val: boolean) => void;
  onOpenCreate: () => void;
  handleCopyPhone: (text: string, id: string) => void;
  handleOpenEdit: (tech: Technician) => void;
  onOpenDelete: (tech: Technician) => void;
}

export function TechniciansTable({
  error,
  loading,
  technicians,
  hasActiveFilters,
  copiedId,
  loadTechnicians,
  setShowImportModal,
  onOpenCreate,
  handleCopyPhone,
  handleOpenEdit,
  onOpenDelete,
}: TechniciansTableProps) {
  if (error) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load technicians</p>
        <p className="text-xs text-slate-400 mt-0.5">{error}</p>
        <button
          onClick={loadTechnicians}
          className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
            <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-28"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (technicians.length === 0) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-3 border border-blue-200/40 dark:border-blue-900/40">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {hasActiveFilters ? 'No technicians match your filters' : 'No technicians added yet'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {hasActiveFilters
            ? 'Try adjusting your search query or area filter.'
            : 'Add your field technicians to designate area coverage and direct contact numbers.'}
        </p>
        <div className="flex items-center justify-center gap-2.5 mt-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#181920] text-slate-700 dark:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" /> Import CSV
          </button>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Technician
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap w-12">
                #
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                TECHNICIAN NAME
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                SERVICE AREA
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                PHONE NUMBER
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                STATUS
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                ADDED DATE
              </th>
              <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#20222a] text-xs">
            {technicians.map((tech, idx) => (
              <tr
                key={tech.id}
                className="hover:bg-slate-50/80 dark:hover:bg-[#181920]/70 transition-colors"
              >
                {/* Index */}
                <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                  {idx + 1}
                </td>

                {/* Technician Name */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {tech.name ? tech.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {tech.name}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Service Area */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#181920] text-slate-700 dark:text-slate-300 font-medium text-[11.5px] border border-slate-200/60 dark:border-[#222430]">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{tech.area_name}</span>
                  </span>
                </td>

                {/* Phone Number */}
                <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{tech.phone_no}</span>
                    </span>
                    <button
                      onClick={() => handleCopyPhone(tech.phone_no, tech.id)}
                      title="Copy phone number"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    >
                      {copiedId === tech.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                      (tech.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50'
                        : 'bg-slate-100 dark:bg-[#1c1d27] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2c2d3a]'
                    }`}
                  >
                    {(tech.status || 'ACTIVE').toUpperCase()}
                  </span>
                </td>

                {/* Added Date */}
                <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {tech.created_at ? tech.created_at.slice(0, 10) : '—'}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(tech)}
                      title="Edit technician details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDelete(tech)}
                      title="Delete technician"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

