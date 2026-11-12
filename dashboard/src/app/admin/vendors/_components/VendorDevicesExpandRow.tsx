'use client';

import React from 'react';
import { Cpu, Trash2, X, Plus, Loader2 } from 'lucide-react';

interface VendorDevicesExpandRowProps {
  v: any;
  deviceDrafts: Record<string, { serial_number: string; device_name: string; cost: string }[]>;
  savingDevicesFor: string | null;
  formatCurrency: (val: number) => string;
  deleteDevice: (deviceId: string) => void;
  updateDraft: (vendorId: string, idx: number, field: string, value: string) => void;
  removeDraftRow: (vendorId: string, idx: number) => void;
  addDraftRow: (vendorId: string) => void;
  saveDevices: (vendorId: string) => void;
}

export function VendorDevicesExpandRow({
  v,
  deviceDrafts,
  savingDevicesFor,
  formatCurrency,
  deleteDevice,
  updateDraft,
  removeDraftRow,
  addDraftRow,
  saveDevices,
}: VendorDevicesExpandRowProps) {
  return (
    <tr className="bg-slate-50/60 dark:bg-[#12131a]">
      <td colSpan={8} className="px-4 py-4">
        <div className="rounded-xl border border-slate-200 dark:border-[#242634] bg-white dark:bg-[#15161c] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" /> Devices under {v.name}
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                {(v.devices || []).length}
              </span>
            </h4>
            <span className="text-[11px] text-slate-500">
              Total device cost:{' '}
              <b className="font-mono text-slate-900 dark:text-white">{formatCurrency(v.devices_total_cost || 0)}</b>
            </span>
          </div>

          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#222430] text-slate-400 font-semibold">
                <th className="py-2 px-2 w-10">#</th>
                <th className="py-2 px-2">Serial Number</th>
                <th className="py-2 px-2">Device Name</th>
                <th className="py-2 px-2 text-right">Cost</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
              {(v.devices || []).length > 0 ? (
                v.devices.map((d: any, i: number) => (
                  <tr key={d.id}>
                    <td className="py-2 px-2 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-2 font-mono text-slate-700 dark:text-slate-300">{d.serial_number || '—'}</td>
                    <td className="py-2 px-2 font-semibold text-slate-900 dark:text-white">{d.device_name}</td>
                    <td className="py-2 px-2 text-right font-mono text-slate-900 dark:text-white">{formatCurrency(Number(d.cost || 0))}</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteDevice(d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                        title="Remove device"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No devices yet. Add devices below.
                  </td>
                </tr>
              )}

              {/* Draft rows for adding new devices */}
              {(deviceDrafts[v.id] || []).map((draft, idx) => (
                <tr key={`draft-${idx}`} className="bg-blue-50/40 dark:bg-blue-950/10">
                  <td className="py-2 px-2 text-blue-500 font-bold">+</td>
                  <td className="py-1.5 px-2">
                    <input
                      value={draft.serial_number}
                      onChange={(e) => updateDraft(v.id, idx, 'serial_number', e.target.value)}
                      placeholder="SN-0001"
                      className="w-full p-1.5 bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      value={draft.device_name}
                      onChange={(e) => updateDraft(v.id, idx, 'device_name', e.target.value)}
                      placeholder="Device name *"
                      className="w-full p-1.5 bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-lg text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <input
                      type="number"
                      step="0.01"
                      value={draft.cost}
                      onChange={(e) => updateDraft(v.id, idx, 'cost', e.target.value)}
                      placeholder="0.00"
                      className="w-full p-1.5 bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-lg text-right text-slate-900 dark:text-white font-mono"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeDraftRow(v.id, idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                      title="Remove draft"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => addDraftRow(v.id)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-[#1f212c] hover:bg-slate-200 dark:hover:bg-[#262836] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Device Row
            </button>
            {(deviceDrafts[v.id] || []).length > 0 && (
              <button
                type="button"
                onClick={() => saveDevices(v.id)}
                disabled={savingDevicesFor === v.id}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {savingDevicesFor === v.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save {(deviceDrafts[v.id] || []).length} Device{(deviceDrafts[v.id] || []).length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

