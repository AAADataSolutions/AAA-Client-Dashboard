'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Lock,
  Loader2,
  DollarSign,
  Plus,
  Search,
  ArrowLeft,
  Server,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  X,
  Edit2,
  Trash2,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminVendorsPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading: authLoading } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  const [vendors, setVendors] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalPaid: 0,
    totalEarned: 0,
    netProfit: 0,
    activeVendorsCount: 0,
    totalDevicesInstalled: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [marginFilter, setMarginFilter] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Expandable vendor rows + device drafts
  const [expandedVendorIds, setExpandedVendorIds] = useState<Set<string>>(new Set());
  const emptyDevice = () => ({ serial_number: '', device_name: '', cost: '' });
  const [deviceDrafts, setDeviceDrafts] = useState<Record<string, { serial_number: string; device_name: string; cost: string }[]>>({});
  const [savingDevicesFor, setSavingDevicesFor] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [vendorToDelete, setVendorToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form states
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Telecom',
    monthly_cost: '',
    monthly_billed: '',
    status: 'ACTIVE',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  });

  const [allocForm, setAllocForm] = useState({
    location_name: '',
    devices_count: '1',
    unit_cost_monthly: '',
    unit_billed_monthly: '',
  });

  // Strict route protection
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [authLoading, isSuperAdmin, router]);

  const fetchVendors = async () => {
    try {
      setDataLoading(true);
      const res = await fetch('/api/admin/vendors');
      const json = await res.json();
      if (json.success) {
        setVendors(json.data || []);
        setMetrics(json.metrics || {});
        if (json.data?.length > 0 && !selectedVendorId) {
          setSelectedVendorId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchVendors();
    }
  }, [isSuperAdmin]);

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      const url = '/api/admin/vendors';
      const method = editingVendor ? 'PATCH' : 'POST';
      const payload = editingVendor ? { id: editingVendor.id, ...vendorForm } : vendorForm;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setShowAddModal(false);
        setEditingVendor(null);
        setVendorForm({
          name: '',
          category: 'Telecom',
          monthly_cost: '',
          monthly_billed: '',
          status: 'ACTIVE',
          contact_person: '',
          contact_email: '',
          contact_phone: '',
          notes: '',
        });
        await fetchVendors();
      } else {
        alert(json.error || 'Failed to save vendor');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleVendorExpand = (id: string) => {
    setSelectedVendorId((prev) => (prev === id ? null : id));
    setExpandedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateDraft = (vendorId: string, idx: number, field: string, value: string) => {
    setDeviceDrafts((prev) => {
      const rows = [...(prev[vendorId] || [])];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, [vendorId]: rows };
    });
  };

  const addDraftRow = (vendorId: string) => {
    setDeviceDrafts((prev) => ({ ...prev, [vendorId]: [...(prev[vendorId] || []), emptyDevice()] }));
  };

  const removeDraftRow = (vendorId: string, idx: number) => {
    setDeviceDrafts((prev) => ({ ...prev, [vendorId]: (prev[vendorId] || []).filter((_, i) => i !== idx) }));
  };

  const saveDevices = async (vendorId: string) => {
    const rows = (deviceDrafts[vendorId] || []).filter((d) => d.device_name.trim());
    if (rows.length === 0) {
      alert('Enter at least one device name.');
      return;
    }
    try {
      setSavingDevicesFor(vendorId);
      const res = await fetch('/api/admin/vendors/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: vendorId, devices: rows }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Failed to add devices');
        return;
      }
      setDeviceDrafts((prev) => ({ ...prev, [vendorId]: [] }));
      await fetchVendors();
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setSavingDevicesFor(null);
    }
  };

  const deleteDevice = async (deviceId: string) => {
    if (!confirm('Remove this device?')) return;
    const res = await fetch(`/api/admin/vendors/devices?id=${deviceId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) {
      alert(json.error || 'Failed to delete device');
      return;
    }
    await fetchVendors();
  };

  const handleConfirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/vendors?id=${vendorToDelete.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to delete vendor');
      }
      setVendorToDelete(null);
      await fetchVendors();
    } catch (err: any) {
      alert(err.message || 'Error deleting vendor');
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const formatCurrency = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">Loading vendor ledger...</p>
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
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Vendors & Equipment Ledger
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Lock className="w-2.5 h-2.5" />
              Super Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#71717a] mt-1">
            What you pay each vendor, what you earn from it, and the profit per device across property locations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/finances"
            className="px-3 py-2 bg-white dark:bg-[#15161c] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#222430] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Finances
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingVendor(null);
              setVendorForm({
                name: '',
                category: 'Telecom',
                monthly_cost: '',
                monthly_billed: '',
                status: 'ACTIVE',
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Vendor
          </button>
        </div>
      </div>

      {/* Top 3 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Paid to Vendors */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Paid to Vendors / Month</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-300">{formatCurrency(metrics.totalPaid)}</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">Across {metrics.activeVendorsCount} active vendors</p>
        </div>

        {/* Earned from Vendors */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Earned from Vendors / Month</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.totalEarned)}</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">Billed to clients through vendor services</p>
        </div>

        {/* Net Vendor Profit */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Net Vendor Profit</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {formatCurrency(metrics.netProfit)}
            </span>
          </div>
          <p className="text-[11px] text-blue-200 mt-1">Earned − paid across all services</p>
        </div>
      </div>

      {/* Main Vendor Ledger Card */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222430] pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">All Vendors & Subscriptions</h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">Monthly recurring payables and billables. Click any row for location details.</p>
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
                            onClick={() => {
                              setEditingVendor(v);
                              setVendorForm({
                                name: v.name,
                                category: v.category,
                                monthly_cost: String(v.monthly_cost),
                                monthly_billed: String(v.monthly_billed),
                                status: v.status,
                                contact_person: v.contact_person || '',
                                contact_email: v.contact_email || '',
                                contact_phone: v.contact_phone || '',
                                notes: v.notes || '',
                              });
                              setShowAddModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition cursor-pointer"
                            title="Edit vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVendorToDelete(v)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded devices dropdown */}
                    {expandedVendorIds.has(v.id) && (
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
                    )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-xs text-slate-400">
                    No vendors found. Click "Add Vendor" above to register a new vendor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vendor Modal */}
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
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveVendor} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VOLA, Bandwidth.com"
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={vendorForm.category}
                      onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="Telecom">Telecom</option>
                      <option value="Software">Software</option>
                      <option value="Fireline Equipment">Fireline Equipment</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Logistics">Logistics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                    <select
                      value={vendorForm.status}
                      onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Cost Paid ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={vendorForm.monthly_cost}
                      onChange={(e) => setVendorForm({ ...vendorForm, monthly_cost: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Monthly Billed ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={vendorForm.monthly_billed}
                      onChange={(e) => setVendorForm({ ...vendorForm, monthly_billed: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={vendorForm.contact_person}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_person: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="rep@vendor.com"
                      value={vendorForm.contact_email}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (800)..."
                      value={vendorForm.contact_phone}
                      onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Contract terms, renewal rules, etc."
                    value={vendorForm.notes}
                    onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Vendor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Vendor Confirmation Modal */}
      <AnimatePresence>
        {vendorToDelete && (
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
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Vendor</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Are you sure you want to delete <b className="text-slate-800 dark:text-slate-200">{vendorToDelete.name}</b>? This will permanently delete the vendor record and remove all associated equipment and allocations. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#20222a]">
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={() => setVendorToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1f212c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#282a36] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteLoading}
                  onClick={handleConfirmDeleteVendor}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Vendor
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
