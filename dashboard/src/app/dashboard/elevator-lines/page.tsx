'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpDown,
  Search,
  Building2,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ElevatorLineItem {
  id: string;
  phone_number: string;
  extension?: string | null;
  description?: string | null;
  status: string;
  property_id?: string | null;
  created_at: string;
  property?: { id: string; name: string; city?: string; state?: string } | null;
}

export default function ClientElevatorLinesPage() {
  const [lines, setLines] = useState<ElevatorLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/client/elevator-lines?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch elevator lines');
      setLines(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading elevator lines');
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
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <ArrowUpDown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Elevator Lines
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Dedicated elevator emergency phone lines and monitoring circuits assigned to your organization.
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
            placeholder="Search by phone, extension, description..."
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
          <p className="text-xs text-slate-400">Loading elevator circuits...</p>
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
      ) : lines.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]">
          <ArrowUpDown className="w-10 h-10 text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Elevator Lines Registered</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            There are no elevator emergency dialer lines registered for your properties yet. Contact support if you need provisioning.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden shadow-xs">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">PHONE NUMBER</th>
                  <th className="py-3 px-4">EXTENSION</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">PROPERTY</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222a] text-xs">
                {lines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-[#181a22]/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{line.phone_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {line.extension || '—'}
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
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                        {line.status}
                      </span>
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
