'use client';

import React from 'react';
import {
  ShieldCheck,
  Phone,
  DoorOpen,
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  X,
  RefreshCw,
  Upload,
  Download,
} from 'lucide-react';
import { RayBaumRecord, PropertyDetails } from './types';

interface RayBaumTableProps {
  property: PropertyDetails | null;
  propertyAddress: string;
  records: RayBaumRecord[];
  filteredRecords: RayBaumRecord[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  fetchData: () => void;
  handleExportCSV: () => void;
  setShowImportModal: (show: boolean) => void;
  setShowAddModal: (show: boolean) => void;
  handleOpenEdit: (rec: RayBaumRecord) => void;
  setDeletingRecord: (rec: RayBaumRecord | null) => void;
}

export function RayBaumTable({
  property,
  propertyAddress,
  records,
  filteredRecords,
  loading,
  searchQuery,
  setSearchQuery,
  fetchData,
  handleExportCSV,
  setShowImportModal,
  setShowAddModal,
  handleOpenEdit,
  setDeletingRecord,
}: RayBaumTableProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section (Strictly per spec: Header + Sub-header, No KPI cards) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#222430]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>RAY BAUM &amp; KARY&apos;S LAW COMPLIANCE REGISTER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Ray Baum and Kary&apos;s Law — {property?.name || 'Property'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{propertyAddress}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Export all Ray Baum records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-lg border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Import Ray Baum records from CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone number, room, or location..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Total Records: <strong className="text-slate-900 dark:text-white">{records.length}</strong>
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Total Ray Baum Monthly Price:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              ${records.reduce((sum, r) => sum + (Number(r.price) || 0), 0).toFixed(2)}/mo
            </strong>
          </span>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-5 whitespace-nowrap">PHONE NO.</th>
                <th className="py-3.5 px-5 whitespace-nowrap">ASSIGNED TO ROOM</th>
                <th className="py-3.5 px-5 whitespace-nowrap">LOCATION</th>
                <th className="py-3.5 px-5 text-right whitespace-nowrap">MONTHLY PRICE</th>
                <th className="py-3.5 px-5 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span>Loading dispatch records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-400">
                        No dispatch records found.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery
                          ? 'No matches for your search query.'
                          : 'Click "Add Record" to create the first dispatchable location record.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors"
                  >
                    {/* 1. Phone No. */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-mono font-semibold text-slate-900 dark:text-white">
                        <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{rec.phone_number}</span>
                      </div>
                    </td>

                    {/* 2. Assigned to Room */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">
                          {rec.assigned_to_room || <span className="text-slate-400 italic">Unassigned</span>}
                        </span>
                      </div>
                    </td>

                    {/* 3. Location */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 max-w-md">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {rec.location || <span className="text-slate-400 italic">Not specified</span>}
                        </span>
                      </div>
                    </td>

                    {/* 4. Monthly Price */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                      ${Number(rec.price || 0).toFixed(2)}
                    </td>

                    {/* 5. Actions */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          title="Edit record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingRecord(rec)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

