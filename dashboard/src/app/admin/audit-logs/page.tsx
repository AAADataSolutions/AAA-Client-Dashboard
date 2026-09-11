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

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aud-1',
    actor_email: 'binoy@aaasolutions.com',
    actor_role: 'SUPER_ADMIN',
    action: 'E911_VERIFIED',
    entity_type: 'E911_RECORD',
    entity_name: 'Courtyard Richmond Downtown',
    ip_address: '73.149.201.88',
    changes: { status: { from: 'PENDING', to: 'VERIFIED' } },
    created_at: '2025-03-11T16:20:00Z',
  },
  {
    id: 'aud-2',
    actor_email: 'alex.rivera@aaasolutions.com',
    actor_role: 'SUB_SUPER_ADMIN',
    action: 'PORTING_ADVANCED',
    entity_type: 'PORTING_ORDER',
    entity_name: 'Residence Inn Austin Downtown',
    ip_address: '104.28.211.14',
    changes: { status: { from: 'SOF_WAITING', to: 'FOC_RECEIVED' }, target_date: '2025-03-24' },
    created_at: '2025-03-11T14:45:00Z',
  },
  {
    id: 'aud-3',
    actor_email: 'binoy@aaasolutions.com',
    actor_role: 'SUPER_ADMIN',
    action: 'ORGANIZATION_CREATED',
    entity_type: 'ORGANIZATION',
    entity_name: 'Pacific West Hospitality',
    ip_address: '73.149.201.88',
    changes: { name: 'Pacific West Hospitality', status: 'ACTIVE' },
    created_at: '2025-03-10T11:30:00Z',
  },
  {
    id: 'aud-4',
    actor_email: 'sjenkins@shaminhotels.com',
    actor_role: 'CLIENT_ADMIN',
    action: 'TICKET_CREATED',
    entity_type: 'TICKET',
    entity_name: 'TCK-8901 (CNAM Display Mismatch)',
    ip_address: '162.247.74.200',
    changes: { priority: 'URGENT', status: 'OPEN' },
    created_at: '2025-03-10T09:15:00Z',
  },
  {
    id: 'aud-5',
    actor_email: 'binoy@aaasolutions.com',
    actor_role: 'SUPER_ADMIN',
    action: 'INTERNAL_INVITATION_APPROVED',
    entity_type: 'INVITATION',
    entity_name: 'alex.rivera@aaasolutions.com (SUB_SUPER_ADMIN)',
    ip_address: '73.149.201.88',
    changes: { status: 'APPROVED' },
    created_at: '2025-03-08T18:00:00Z',
  },
  {
    id: 'aud-6',
    actor_email: 'alex.rivera@aaasolutions.com',
    actor_role: 'SUB_SUPER_ADMIN',
    action: 'VOICE_LINE_PROVISIONED',
    entity_type: 'SERVICE',
    entity_name: '+1 (415) 555-0899 (SIP Trunk Primary)',
    ip_address: '104.28.211.14',
    changes: { status: 'ACTIVE' },
    created_at: '2025-03-07T13:10:00Z',
  },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor email, action, entity, IP address..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Action:</span>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="E911">E911 Events</option>
              <option value="PORTING">Porting Events</option>
              <option value="ORGANIZATION">Organization Events</option>
              <option value="INVITATION">Invitation Approvals</option>
              <option value="TICKET">Ticket Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Timestamp &amp; Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
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
