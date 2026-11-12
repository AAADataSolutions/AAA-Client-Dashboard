import React from 'react';
import {
  PhoneForwarded,
  Hotel,
  Loader2,
} from 'lucide-react';
import { ClientDidItem } from './types';

interface CallForwardingTableViewProps {
  loading: boolean;
  filteredItems: ClientDidItem[];
  submitting: boolean;
  onDisableForwarding: (item: ClientDidItem) => void;
  onOpenModal: (item: ClientDidItem) => void;
}

export function CallForwardingTableView({
  loading,
  filteredItems,
  submitting,
  onDisableForwarding,
  onOpenModal,
}: CallForwardingTableViewProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-[#222430] bg-slate-50/70 dark:bg-[#171922] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Phone Number (DID)</th>
              <th className="py-3.5 px-4">Property</th>
              <th className="py-3.5 px-4">Call Forwarding Status</th>
              <th className="py-3.5 px-4">Forwarded To</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1e202b] text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Loading your phone lines...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No phone lines found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isOn = item.call_forwarding_state === 'ON';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isOn
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                              : 'bg-slate-100 dark:bg-[#1f222e] text-slate-500'
                          }`}
                        >
                          <PhoneForwarded className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white font-mono">
                            {item.phone_number}
                          </p>
                          <span className="text-[10px] text-slate-400">{item.service_type}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                        <Hotel className="w-3.5 h-3.5 text-blue-500" />
                        <span>{item.property_name}</span>
                      </div>
                      {item.property_location && (
                        <span className="text-[11px] text-slate-400 block">{item.property_location}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isOn ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          FORWARDING ON
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          OFF (Normal Hotel Routing)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {isOn && item.active_forwarding_numbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.active_forwarding_numbers.map((t, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-medium text-emerald-800 dark:text-emerald-200"
                            >
                              {t.name}: <strong className="font-mono">{t.number}</strong>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Hotel Front Desk / Default PBX</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isOn && (
                          <button
                            onClick={() => onDisableForwarding(item)}
                            disabled={submitting}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold text-[11px] cursor-pointer transition"
                          >
                            Turn OFF
                          </button>
                        )}
                        <button
                          onClick={() => onOpenModal(item)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer transition"
                        >
                          {isOn ? 'Edit Forwarding' : 'Forward Calls'}
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
    </div>
  );
}
