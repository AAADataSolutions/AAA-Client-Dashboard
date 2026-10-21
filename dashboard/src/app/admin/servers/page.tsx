'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Lock,
  Loader2,
  DollarSign,
  Plus,
  Search,
  ArrowLeft,
  Server,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  X,
  Edit2,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminServersPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading: authLoading } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const [servers, setServers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalMonthlyCost: 0,
    costPerActiveProperty: 0,
    activeServersCount: 0,
    activePropertiesCount: 0,
    renewingWithin7DaysCount: 0,
    renewingSoonList: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<any>(null);
  const [serverToDelete, setServerToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [serverForm, setServerForm] = useState({
    name: '',
    provider: 'Cloud',
    purpose: '',
    ip_address: '',
    monthly_cost: '',
    status: 'ACTIVE',
    renewal_date: '',
    notes: '',
  });

  // Strict route protection
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, isSuperAdmin, router]);

  const fetchServers = async () => {
    try {
      setDataLoading(true);
      const res = await fetch('/api/admin/servers');
      const json = await res.json();
      if (json.success) {
        setServers(json.data || []);
        setMetrics(json.metrics || {});
      }
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchServers();
    }
  }, [isSuperAdmin]);

  const handleConfirmDeleteServer = async () => {
    if (!serverToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/servers?id=${serverToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to delete server');
      }
      setServerToDelete(null);
      await fetchServers();
    } catch (err: any) {
      alert(err.message || 'Error deleting server');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const url = '/api/admin/servers';
      const method = editingServer ? 'PATCH' : 'POST';
      const payload = editingServer
        ? { id: editingServer.id, ...serverForm, provider: serverForm.provider || 'Cloud' }
        : { ...serverForm, provider: serverForm.provider || 'Cloud' };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        setEditingServer(null);
        setServerForm({
          name: '',
          provider: 'Cloud',
          purpose: '',
          ip_address: '',
          monthly_cost: '',
          status: 'ACTIVE',
          renewal_date: '',
          notes: '',
        });
        setStatusFilter('');
        await fetchServers();
      } else {
        alert(json.error || 'Failed to save server');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredServers = servers.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ip_address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = !providerFilter || s.provider?.toLowerCase() === providerFilter.toLowerCase();
    const matchesStatus = !statusFilter || s.status?.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const formatCurrency = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getProviderPill = (prov: string) => {
    switch (prov?.toUpperCase()) {
      case 'AWS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'DIGITALOCEAN':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'TWILIO':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'BARE METAL':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">Loading infrastructure servers...</p>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6 pb-16 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Radio className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Servers & Infrastructure
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" />
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#71717a] mt-1">
            Every server and what it costs each month. Decommissioned servers are excluded from active expenses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/finances"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Finances
          </Link>
          <button
            onClick={() => {
              setEditingServer(null);
              setServerForm({
                name: '',
                provider: 'Cloud',
                purpose: '',
                ip_address: '',
                monthly_cost: '',
                status: 'ACTIVE',
                renewal_date: '',
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Server
          </button>
        </div>
      </div>

      {/* Top 3 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Server Cost */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Total Server Cost / Month</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-300">{formatCurrency(metrics.totalMonthlyCost)}</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">{metrics.activeServersCount} active servers provisioned</p>
        </div>

        {/* Cost Per Active Property */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Cost Per Active Property</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.costPerActiveProperty)}</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">Across {metrics.activePropertiesCount} active properties</p>
        </div>

        {/* Renewing within 7 days */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Renewing Within 7 Days</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-rose-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${metrics.renewingWithin7DaysCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
              {metrics.renewingWithin7DaysCount} server{metrics.renewingWithin7DaysCount === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">
            {metrics.renewingWithin7DaysCount > 0 ? 'Action required before lapse' : 'All renewals healthy'}
          </p>
        </div>
      </div>

      {/* 7-Day Renewal Warning Alert Banner */}
      {metrics.renewingWithin7DaysCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold block text-sm">
              ⚠ {metrics.renewingWithin7DaysCount} server{metrics.renewingWithin7DaysCount === 1 ? '' : 's'} renews within 7 days:
            </span>
            <div className="mt-1 space-y-0.5 font-medium">
              {metrics.renewingSoonList.map((s: any) => (
                <div key={s.id}>
                  • <b>{s.name}</b> ({s.provider}) renews in <b>{s.days_left} days</b> ({s.renewal_display}).
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Server Table Card */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222430] pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">All Infrastructure Instances</h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">Voice switches, media gateways, databases, and webhook listeners.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search server..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="">All providers</option>
              <option value="AWS">AWS</option>
              <option value="DigitalOcean">DigitalOcean</option>
              <option value="Twilio">Twilio</option>
              <option value="Bare Metal">Bare Metal</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
            </select>
          </div>
        </div>

        {/* Server Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#222430] text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Server Name</th>
                <th className="py-2.5 px-3">Purpose / Host</th>
                <th className="py-2.5 px-3 text-right">Monthly Cost</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Renews</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
              {filteredServers.length > 0 ? (
                filteredServers.map((s) => {
                  const isDecom = s.status === 'DECOMMISSIONED';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1a1b24]/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-blue-500" />
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        <span className="block truncate max-w-xs">{s.purpose || '—'}</span>
                        {s.ip_address && <span className="text-[10px] font-mono text-slate-400">{s.ip_address}</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.monthly_cost)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDecom
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {s.renewal_display !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            <span>{s.renewal_display}</span>
                            {s.days_until_renewal !== null && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                  s.is_renewing_soon
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                ({s.days_until_renewal} days)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingServer(s);
                              setServerForm({
                                name: s.name,
                                provider: s.provider,
                                purpose: s.purpose || '',
                                ip_address: s.ip_address || '',
                                monthly_cost: String(s.monthly_cost),
                                status: s.status,
                                renewal_date: s.renewal_date || '',
                                notes: s.notes || '',
                              });
                              setShowAddModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition cursor-pointer"
                            title="Edit server"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setServerToDelete(s)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                            title="Delete server"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                    No servers found. Click "Add Server" above to configure your infrastructure instances.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Server Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingServer ? 'Edit Server Instance' : 'Add New Server Instance'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveServer} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Server Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PBX Master Node 01, Database Cluster"
                    value={serverForm.name}
                    onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={serverForm.status}
                      onChange={(e) => setServerForm({ ...serverForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="ACTIVE">ACTIVE (Included in Expenses)</option>
                      <option value="DECOMMISSIONED">DECOMMISSIONED (Excluded)</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Cost ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="100.00"
                      value={serverForm.monthly_cost}
                      onChange={(e) => setServerForm({ ...serverForm, monthly_cost: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Renewal Date</label>
                    <input
                      type="date"
                      value={serverForm.renewal_date}
                      onChange={(e) => setServerForm({ ...serverForm, renewal_date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">IP Address / Host</label>
                    <input
                      type="text"
                      placeholder="54.210.88.12"
                      value={serverForm.ip_address}
                      onChange={(e) => setServerForm({ ...serverForm, ip_address: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Purpose / Role</label>
                  <input
                    type="text"
                    placeholder="Core PBX router, Postgres DB, etc."
                    value={serverForm.purpose}
                    onChange={(e) => setServerForm({ ...serverForm, purpose: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="SSH keys, provider credentials reference, SLA..."
                    value={serverForm.notes}
                    onChange={(e) => setServerForm({ ...serverForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Server
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Server Confirmation Modal */}
      <AnimatePresence>
        {serverToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/40 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Server</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <b className="text-slate-800 dark:text-slate-200">{serverToDelete.name}</b>? This will permanently remove this instance from your infrastructure records. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#20222a]">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setServerToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#282a36] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteServer}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Server
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
