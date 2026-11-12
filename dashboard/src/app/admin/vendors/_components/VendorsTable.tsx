'use client';

import React from 'react';
import { Search, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { VendorDevicesExpandRow } from './VendorDevicesExpandRow';

interface VendorsTableProps {
  vendors: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  marginFilter: string;
  setMarginFilter: (val: string) => void;
  selectedVendorId: string | null;
  expandedVendorIds: Set<string>;
  toggleVendorExpand: (id: string) => void;
  formatCurrency: (val: number) => string;
  onEditVendor: (v: any) => void;
  onDeleteVendor: (v: any) => void;
  deviceDrafts: Record<string, { serial_number: string; device_name: string; cost: string }[]>;
  savingDevicesFor: string | null;
  deleteDevice: (deviceId: string) => void;
  updateDraft: (vendorId: string, idx: number, field: string, value: string) => void;
  removeDraftRow: (vendorId: string, idx: number) => void;
  addDraftRow: (vendorId: string) => void;
  saveDevices: (vendorId: string) => void;
}

export function VendorsTable({
  vendors,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  marginFilter,
  setMarginFilter,
  selectedVendorId,
  expandedVendorIds,
  toggleVendorExpand,
  formatCurrency,
  onEditVendor,
  onDeleteVendor,
  deviceDrafts,
  savingDevicesFor,
  deleteDevice,
  updateDraft,
  removeDraftRow,
  addDraftRow,
  saveDevices,
}: VendorsTableProps) {
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      !searchQuery ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || v.category?.toLowerCase() === categoryFilter.toLowerCase();

    let matchesMargin = true;
    if (marginFilter === 'profitable') matchesMargin = v.net_margin > 0;
    else if (marginFilter === 'loss') matchesMargin = v.net_margin < 0;
    else if (marginFilter === 'pure_expense') matchesMargin = v.monthly_billed === 0;

    return matchesSearch && matchesCategory && matchesMargin;
  });

  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222430] pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">All Vendors &amp; Subscriptions</h3>
          <p className="text-xs text-slate-500 dark:text-[#71717a]">
            Monthly recurring payables and billables. Click any row for location details.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="">All categories</option>
            <option value="Telecom">Telecom</option>
            <option value="Software">Software</option>
            <option value="Fireline Equipment">Fireline Equipment</option>
            <option value="Hardware">Hardware</option>
          </select>

          <select
            value={marginFilter}
            onChange={(e) => setMarginFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="">All margins</option>
            <option value="profitable">Profitable</option>
            <option value="loss">Loss-making</option>
            <option value="pure_expense">Pure expense</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#222430] text-slate-400 font-semibold">
              <th className="py-2.5 px-3">Vendor</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Devices</th>
              <th className="py-2.5 px-3 text-right">You Pay</th>
              <th className="py-2.5 px-3 text-right">You Earn</th>
              <th className="py-2.5 px-3 text-right">Net Profit</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
            {filteredVendors.length > 0 ? (
              filteredVendors.map((v) => {
                const isSelected = v.id === selectedVendorId;
                const isLoss = v.net_margin < 0;
                const isPureExpense = v.monthly_billed === 0;

                return (
                  <React.Fragment key={v.id}>
                    <tr
                      onClick={() => toggleVendorExpand(v.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-900/20 font-medium'
                          : 'hover:bg-slate-50/80 dark:hover:bg-[#1a1b24]/50'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              expandedVendorIds.has(v.id) ? 'rotate-180 text-blue-600' : ''
                            }`}
                          />
                          <span className="font-bold text-slate-900 dark:text-white">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{v.category}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {v.devices_list_count || v.devices_count || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(v.monthly_cost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(v.monthly_billed)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] ${
                            isPureExpense
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : isLoss
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatCurrency(v.net_margin)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onEditVendor(v)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition cursor-pointer"
                            title="Edit vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteVendor(v)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedVendorIds.has(v.id) && (
                      <VendorDevicesExpandRow
                        v={v}
                        deviceDrafts={deviceDrafts}
                        savingDevicesFor={savingDevicesFor}
                        formatCurrency={formatCurrency}
                        deleteDevice={deleteDevice}
                        updateDraft={updateDraft}
                        removeDraftRow={removeDraftRow}
                        addDraftRow={addDraftRow}
                        saveDevices={saveDevices}
                      />
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                  No vendors found. Click &quot;Add Vendor&quot; above to register a new vendor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
