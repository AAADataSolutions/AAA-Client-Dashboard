'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Search,
  Building2,
  PhoneCall,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface FireLineItem {
  id: string;
  device_type: string;
  phone_number: string;
  serial_number?: string | null;
  description?: string | null;
  property_id?: string | null;
  created_at: string;
  property?: { id: string; name: string; city?: string; state?: string } | null;
}

export default function ClientFirelinesPage() {
  const [fireLines, setFireLines] = useState<FireLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/client/fire-lines?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch fire lines');
      setFireLines(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading fire lines');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#222430]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Firelines
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Dedicated emergency life safety lines and communicator circuits assigned to your organization.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] border border-slate-200 dark:border-[#27272a] transition cursor-pointer self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white dark:bg-[#15161c] p-3 rounded-xl border border-slate-200 dark:border-[#222430]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by device type, phone, serial number, description..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table UI with Description Column */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading fireline circuits...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="text-xs underline font-semibold cursor-pointer">
            Retry
          </button>
        </div>
      ) : fireLines.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]">
          <Flame className="w-10 h-10 text-orange-500/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Fire Lines Registered</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            There are no fire alarm or emergency communicator circuits registered for your properties yet. Contact support if you need provisioning.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden shadow-xs">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">DEVICE TYPE</th>
                  <th className="py-3 px-4">PHONE NUMBER</th>
                  <th className="py-3 px-4">SERIAL NUMBER</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">PROPERTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222a] text-xs">
                {fireLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-[#181a22]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{line.device_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {line.phone_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {line.serial_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[260px] truncate" title={line.description || ''}>
                      {line.description || <span className="text-slate-400 italic">No description</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {line.property?.name ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{line.property.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
