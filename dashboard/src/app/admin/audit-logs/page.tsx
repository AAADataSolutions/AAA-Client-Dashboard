'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileClock,
  Search,
  Download,
  Filter,
  Shield,
  SlidersHorizontal,
  Clock,
  UserCheck,
  Building2,
  Hotel,
  ShieldCheck,
  PhoneCall,
  GitBranch,
  LifeBuoy,
  X,
  Eye,
  Key,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuditLogRecord {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_name?: string;
  ip_address: string;
  changes?: Record<string, any>;
  created_at: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/audit-logs');
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const mapped: AuditLogRecord[] = result.data.map((item: any) => ({
          id: item.id,
          actor_email: item.actor?.email || item.actor_email || 'admin@aaasolutions.com',
          actor_role: item.actor?.role || item.actor_role || 'SUPER_ADMIN',
          action: item.action || 'ACTIVITY_LOGGED',
          entity_type: item.entity_type || 'SYSTEM',
          entity_name: item.entity_name || item.organization?.name || 'Mesh Entity',
          ip_address: item.ip_address || '127.0.0.1',
          changes: item.changes || undefined,
          created_at: item.created_at,
        }));
        setLogs(mapped);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchesSearch =
        l.actor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.entity_name && l.entity_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        l.ip_address.includes(searchQuery);

      const matchesAction = selectedActionFilter === 'ALL' || l.action.includes(selectedActionFilter);

      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, selectedActionFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor Email', 'Role', 'Action', 'Entity Type', 'Target Name', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      new Date(l.created_at).toISOString(),
      l.actor_email,
      l.actor_role,
      l.action,
      l.entity_type,
      `"${(l.entity_name || '').replace(/"/g, '""')}"`,
      l.ip_address,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AAA_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security &amp; Audit Logs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Immutable Trail
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident operational audit events, Super Admin authorizations, role changes, and system state modifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] hover:bg-slate-50 dark:hover:bg-[#1e1f27] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor email, action, entity, IP address..."
            className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:border-[#f97316] focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Action:</span>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#15161c]">All Actions</option>
              <option value="E911" className="dark:bg-[#15161c]">E911 Events</option>
              <option value="PORTING" className="dark:bg-[#15161c]">Porting Events</option>
              <option value="ORGANIZATION" className="dark:bg-[#15161c]">Organization Events</option>
              <option value="INVITATION" className="dark:bg-[#15161c]">Invitation Approvals</option>
              <option value="TICKET" className="dark:bg-[#15161c]">Ticket Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Audit Log Table */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Timestamp &amp; Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a] text-xs">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Timestamp & Actor */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.actor_email}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-indigo-600 font-semibold">{log.actor_role}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{log.entity_name}</div>
                    <span className="text-[11px] text-slate-400">{log.entity_type}</span>
                  </td>

                  {/* IP Address */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {log.ip_address}
                  </td>

                  {/* Details Button */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileClock className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Audit Event Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Actor Email</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{selectedLog.actor_email}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Role</span>
                  <p className="font-semibold text-indigo-600 mt-0.5">{selectedLog.actor_role}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">State Modifications (JSON)</span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedLog.changes || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
