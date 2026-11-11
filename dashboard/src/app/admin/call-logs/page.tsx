'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PhoneIncoming,
  PhoneOutgoing,
  ShieldAlert,
  FileClock,
  Search,
  RefreshCw,
  Download,
  Hotel,
  Server,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PhoneForwarded,
} from 'lucide-react';

interface CdrCall {
  id: string;
  phone_number: string;
  date_time: string;
  src: string;
  dst: string;
  duration: number;
  disposition: string;
  property_id: string;
  property_name: string;
  organization_name: string;
  pbx_server_id: number;
  pbx_server_label: string;
  call_type: string;
}

interface DidOption {
  service_id: string;
  phone_number: string;
  normalized_did: string;
  property_id: string;
  property_name: string;
  organization_name: string;
  pbx_server_id: number;
  pbx_server_label: string;
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Number(sec) || 0);
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}m ${String(rem).padStart(2, '0')}s`;
}

export default function AdminCdrLogsPage() {
  const [actionTab, setActionTab] = useState<'incoming_calls' | 'outgoing_calls' | 'e911_calls'>('incoming_calls');
  const [calls, setCalls] = useState<CdrCall[]>([]);
  const [didOptions, setDidOptions] = useState<DidOption[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    missedOrFailedCalls: 0,
    totalDurationSeconds: 0,
  });

  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [didFilter, setDidFilter] = useState('');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCdrLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: actionTab,
        from: fromDate,
        to: toDate,
      });
      if (propertyFilter !== 'ALL') params.set('property_id', propertyFilter);
      if (didFilter) params.set('phone_number', didFilter);
      if (serverFilter !== 'ALL') params.set('server_id', serverFilter);

      const res = await fetch(`/api/admin/cdr-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCalls(json.data || []);
        if (json.didOptions) setDidOptions(json.didOptions);
        if (json.properties) setProperties(json.properties);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch CDR logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionTab, propertyFilter, didFilter, serverFilter, fromDate, toDate]);

  useEffect(() => {
    fetchCdrLogs();
  }, [fetchCdrLogs]);

  const filteredCalls = calls.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.src.toLowerCase().includes(q) ||
      c.dst.toLowerCase().includes(q) ||
      c.phone_number.toLowerCase().includes(q) ||
      c.property_name.toLowerCase().includes(q) ||
      c.disposition.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const headers = ['Date & Time', 'Call Type', 'Property', 'PBX Server', 'DID', 'Source (Caller)', 'Destination (Callee)', 'Duration (sec)', 'Disposition'];
    const rows = filteredCalls.map((c) => [
      c.date_time,
      c.call_type,
      `"${c.property_name.replace(/"/g, '""')}"`,
      `"${c.pbx_server_label}"`,
      c.phone_number,
      c.src,
      c.dst,
      c.duration,
      c.disposition,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cdr_logs_${actionTab}_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <FileClock className="w-3.5 h-3.5" />
            <span>FreePBX Call Detail Records (CDR)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Call Logs &amp; Emergency 911 CDR Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect incoming, outgoing, and emergency (911 / 933 / 988) call records across PBX 115, PBX 142, and PBX 240.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/call-forwarding"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1c24] dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <PhoneForwarded className="w-4 h-4 text-emerald-500" />
            <span>Call Forwarding Control</span>
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={filteredCalls.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchCdrLogs}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Query PBX CDR</span>
          </button>
        </div>
      </div>

      {/* Call Direction Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#222430] pb-3">
        <button
          onClick={() => setActionTab('incoming_calls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            actionTab === 'incoming_calls'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#13151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#222430]'
          }`}
        >
          <PhoneIncoming className="w-4 h-4" />
          <span>Incoming Calls</span>
        </button>

        <button
          onClick={() => setActionTab('outgoing_calls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            actionTab === 'outgoing_calls'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#13151c] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#222430]'
          }`}
        >
          <PhoneOutgoing className="w-4 h-4" />
          <span>Outgoing Calls</span>
        </button>

        <button
          onClick={() => setActionTab('e911_calls')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition ${
            actionTab === 'e911_calls'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#13151c] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency E911 Calls (911 / 933 / 988)</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Calls in Window</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalCalls}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Answered Calls</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{metrics.answeredCalls}</p>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">No Answer / Busy / Failed</span>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{metrics.missedOrFailedCalls}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Total Billable Talk Time</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatDuration(metrics.totalDurationSeconds)}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search caller (src), callee (dst), or property..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs"
          />
        </div>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium"
        >
          <option value="ALL">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={didFilter}
          onChange={(e) => setDidFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium"
        >
          <option value="">All Authorized DIDs</option>
          {didOptions.map((d) => (
            <option key={d.service_id || d.normalized_did} value={d.normalized_did}>
              {d.phone_number} — {d.property_name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs"
          />
        </div>
      </div>

      {/* CDR Table */}
      <div className="rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#222430] bg-slate-50/70 dark:bg-[#171922] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Property &amp; PBX Server</th>
                <th className="py-3.5 px-4">Authorized DID</th>
                <th className="py-3.5 px-4">Source (Caller)</th>
                <th className="py-3.5 px-4">Destination (Callee)</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Disposition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e202b] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Querying CDR logs from FreePBX cluster...
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No call records found for the selected filter window.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const isAnswered = call.disposition === 'ANSWERED';
                  const isEmergency = ['911', '933', '988'].includes(call.dst);
                  return (
                    <tr key={call.id} className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition">
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {call.date_time}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <Hotel className="w-3.5 h-3.5 text-blue-500" />
                          <span>{call.property_name}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Server className="w-3 h-3" />
                          {call.pbx_server_label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {call.phone_number}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {call.src}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {isEmergency ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold">
                            🚨 {call.dst}
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">{call.dst}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDuration(call.duration)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isAnswered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3" />
                            {call.disposition}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            <XCircle className="w-3 h-3" />
                            {call.disposition}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

