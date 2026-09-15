'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <FileClock size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Security &amp; Audit Logs</h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] hover:bg-slate-50 dark:hover:bg-[#1e1f27] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export Audit Trail (CSV)</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 2. Search & Filter Bar */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actor email, action, entity, IP address..."
            className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Action:</span>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer focus:border-blue-500"
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
      </motion.div>

      {/* 3. Audit Log Table */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
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
                  className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors group cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  {/* Timestamp & Actor */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 dark:text-white">{log.actor_email}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{log.actor_role}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 dark:bg-[#20222a] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#2e313e]">
                      {log.action}
                    </span>
                  </td>

                  {/* Entity */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{log.entity_name}</div>
                    <span className="text-[11px] text-slate-400">{log.entity_type}</span>
                  </td>

                  {/* IP Address */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                    {log.ip_address}
                  </td>

                  {/* Details Button */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-[#282a36] text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 4. Log Inspection Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430] shadow-2xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222430]">
                <div className="flex items-center gap-2">
                  <FileClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430]">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Actor Email</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLog.actor_email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Role</span>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{selectedLog.actor_role}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">State Modifications (JSON)</span>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedLog.changes || {}, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
