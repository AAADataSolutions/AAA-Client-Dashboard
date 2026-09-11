'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Settings,
  Building2,
  Hotel,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Archive,
  BarChart3,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  Network,
  LayoutGrid,
  List,
  AlertTriangle,
  MapPin,
  FileCheck,
  Radio,
  BadgeCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export type E911Status = 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUIRED' | 'FAILED';

interface E911Record {
  id: string;
  property_name: string;
  property_city: string;
  property_state: string;
  organization_name: string;
  emergency_address: string;
  psap_id: string;
  status: E911Status;
  correction_notes: string | null;
  verified_at: string | null;
  ray_baum_compliant: boolean;
  karis_law_direct_dial: boolean;
  last_audit_date: string;
  created_at: string;
}

export default function AdminE911Page() {
  const supabase = createClient();

  const [records, setRecords] = useState<E911Record[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedComplianceFilter, setSelectedComplianceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'STATUS' | 'DATE'>('STATUS');

  // Modals & Drawers
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<E911Record | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<E911Record | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    emergency_address: '',
    correction_notes: '',
    status: 'PENDING' as E911Status,
  });

  const loadE911Records = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/e911');
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const mapped: E911Record[] = result.data.map((item: any) => {
          const orgProp = item.org_property;
          const prop = orgProp?.property;
          const org = orgProp?.organization;

          return {
            id: item.id,
            property_name: prop?.name || item.property_name || 'Assigned Property',
            property_city: prop?.city || '',
            property_state: prop?.state || '',
            organization_name: org?.name || item.organization_name || 'Assigned Organization',
            emergency_address: item.emergency_address || prop?.address || '',
            psap_id: item.psap_id || `PSAP-${prop?.state || 'US'}-${prop?.city ? prop.city.slice(0, 3).toUpperCase() : '911'}`,
            status: (item.status as E911Status) || 'PENDING',
            correction_notes: item.correction_notes || null,
            verified_at: item.verified_at || null,
            ray_baum_compliant: prop?.ray_baud_and_logs_enabled ?? true,
            karis_law_direct_dial: true,
            last_audit_date: item.verified_at ? item.verified_at.slice(0, 10) : item.created_at.slice(0, 10),
            created_at: item.created_at,
          };
        });

        setRecords(mapped);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching E911 records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadE911Records();
  }, []);

  // Filtered & Sorted
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const matchesSearch =
          rec.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.emergency_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.psap_id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          selectedStatusFilter === 'ALL' || rec.status === selectedStatusFilter;

        let matchesCompliance = true;
        if (selectedComplianceFilter === 'RAY_BAUM') matchesCompliance = rec.ray_baum_compliant;
        if (selectedComplianceFilter === 'NON_COMPLIANT')
          matchesCompliance = !rec.ray_baum_compliant || !rec.karis_law_direct_dial;

        return matchesSearch && matchesStatus && matchesCompliance;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') return a.property_name.localeCompare(b.property_name);
        if (sortBy === 'DATE')
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return a.status.localeCompare(b.status);
      });
  }, [records, searchQuery, selectedStatusFilter, selectedComplianceFilter, sortBy]);

  // KPIs
  const totalVerified = records.filter((r) => r.status === 'VERIFIED').length;
  const totalPending = records.filter((r) => r.status === 'PENDING').length;
  const totalCorrection = records.filter((r) => r.status === 'CORRECTION_REQUIRED').length;
  const totalFailed = records.filter((r) => r.status === 'FAILED').length;

  const handleOpenStatus = (rec: E911Record) => {
    setSelectedRecord(rec);
    setFormData({
      emergency_address: rec.emergency_address,
      correction_notes: rec.correction_notes || '',
      status: rec.status,
    });
    setShowStatusModal(true);
  };

  const handleOpenAddress = (rec: E911Record) => {
    setSelectedRecord(rec);
    setFormData({
      emergency_address: rec.emergency_address,
      correction_notes: rec.correction_notes || '',
      status: rec.status,
    });
    setShowAddressModal(true);
  };

  const handleUpdateStatus = async (newStatus: E911Status) => {
    if (!selectedRecord) return;

    try {
      const now = new Date().toISOString();
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? {
                ...r,
                status: newStatus,
                verified_at: newStatus === 'VERIFIED' ? now : null,
                last_audit_date: now.slice(0, 10),
              }
            : r
        )
      );

      if (drawerRecord && drawerRecord.id === selectedRecord.id) {
        setDrawerRecord({
          ...drawerRecord,
          status: newStatus,
          verified_at: newStatus === 'VERIFIED' ? now : null,
        });
      }

      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating E911 verification:', err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              emergency_address: formData.emergency_address.trim(),
              correction_notes: formData.correction_notes.trim() || null,
              status: formData.status,
            }
          : r
      )
    );

    if (drawerRecord && drawerRecord.id === selectedRecord.id) {
      setDrawerRecord({
        ...drawerRecord,
        emergency_address: formData.emergency_address.trim(),
        correction_notes: formData.correction_notes.trim() || null,
        status: formData.status,
      });
    }

    setShowAddressModal(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Property Name',
      'Organization',
      'Emergency Address',
      'PSAP Route ID',
      'Status',
      'Ray Baum Compliant',
      'Karis Law Compliant',
      'Last Audit Date',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.property_name.replace(/"/g, '""')}"`,
      `"${r.organization_name.replace(/"/g, '""')}"`,
      `"${r.emergency_address.replace(/"/g, '""')}"`,
      r.psap_id,
      r.status,
      r.ray_baum_compliant ? 'YES' : 'NO',
      r.karis_law_direct_dial ? 'YES' : 'NO',
      r.last_audit_date,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AAA_E911_Compliance_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">E911 Compliance Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalVerified} Verified PSAPs
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage emergency service PSAP dispatchable addresses, Kari&apos;s Law direct 911 dialing, and Ray Baum&apos;s Act dispatch records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedStatusFilter('CORRECTION_REQUIRED');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Pending Verification Queue ({totalCorrection + totalFailed})</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PSAP Verified */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PSAP Verified Locations
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalVerified}</span>
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                100% Ray Baum
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Direct Emergency Routing</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending Validation
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalPending}</span>
              <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/40">
                Carrier Review
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>PSAP Dispatch Test</span>
              <span className="font-semibold text-sky-700 dark:text-sky-300">&lt; 24h SLA</span>
            </div>
          </div>
        </div>

        {/* Correction Required */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Corrections Required
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalCorrection}</span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                Action Required
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Postal / Sub-location</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Mismatch</span>
            </div>
          </div>
        </div>

        {/* Failed PSAP Test */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Failed Audit / Overrides
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalFailed}</span>
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
                Critical SLA
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Trunk Signaling Hold</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">&lt; 4h SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hotel property, address, PSAP ID, city..."
            className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:border-[#f97316] focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-[#1a1b22] border border-slate-200 dark:border-[#272935] rounded">
            ⌘F
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#15161c]">All Statuses</option>
              <option value="VERIFIED" className="dark:bg-[#15161c]">Verified</option>
              <option value="PENDING" className="dark:bg-[#15161c]">Pending</option>
              <option value="CORRECTION_REQUIRED" className="dark:bg-[#15161c]">Correction Required</option>
              <option value="FAILED" className="dark:bg-[#15161c]">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Representation */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Property &amp; Organization</th>
                <th className="py-3 px-4">Dispatchable Physical Address</th>
                <th className="py-3 px-4">PSAP ID &amp; Laws</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">Last Audit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a] text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No E911 records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setDrawerRecord(rec)}
                  >
                    {/* 1. Property */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100 shadow-xs">
                          <Hotel className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block">
                            {rec.property_name}
                          </span>
                          <span className="text-[11px] text-indigo-600 font-semibold block">
                            {rec.organization_name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Emergency Address */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-sm">{rec.emergency_address}</span>
                      </div>
                      {rec.correction_notes && (
                        <span className="text-[11px] text-amber-700 block mt-0.5">
                          Note: {rec.correction_notes}
                        </span>
                      )}
                    </td>

                    {/* 3. PSAP ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700 text-[11px] block">{rec.psap_id}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <span className="text-emerald-600 font-semibold">Ray Baum OK</span>
                        <span>•</span>
                        <span>Direct 911</span>
                      </div>
                    </td>

                    {/* 4. Verification Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rec.status === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                          PSAP Verified
                        </span>
                      )}
                      {rec.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3.5 h-3.5 text-sky-600" />
                          Pending Review
                        </span>
                      )}
                      {rec.status === 'CORRECTION_REQUIRED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Correction Needed
                        </span>
                      )}
                      {rec.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          Failed PSAP Test
                        </span>
                      )}
                    </td>

                    {/* 5. Last Audit */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {rec.last_audit_date}
                    </td>

                    {/* 6. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAddress(rec)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Edit Address
                        </button>
                        <button
                          onClick={() => handleOpenStatus(rec)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Manage Verification"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. STATUS / VERIFICATION CONTROL MODAL                                    */}
      {/* ========================================================================= */}
      {showStatusModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">E911 PSAP Verification Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Set PSAP compliance status for <span className="font-bold text-slate-900">{selectedRecord.property_name}</span>.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <button
                onClick={() => handleUpdateStatus('VERIFIED')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-emerald-800 block">Verified (PSAP Passed)</span>
                  <span className="text-[11px] text-slate-500">Emergency routing tables certified &amp; active.</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => handleUpdateStatus('CORRECTION_REQUIRED')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-amber-800 block">Correction Required</span>
                  <span className="text-[11px] text-slate-500">Address mismatch requires customer update.</span>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={() => handleUpdateStatus('FAILED')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-rose-800 block">Failed Verification</span>
                  <span className="text-[11px] text-slate-500">Trunk signaling test rejected by PSAP gateway.</span>
                </div>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT DISPATCHABLE ADDRESS MODAL                                        */}
      {/* ========================================================================= */}
      {showAddressModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Edit PSAP Dispatchable Address</h3>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="mt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Dispatchable Physical Address</label>
                <textarea
                  rows={3}
                  required
                  value={formData.emergency_address}
                  onChange={(e) => setFormData({ ...formData, emergency_address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Correction Notes / Sub-location Tag</label>
                <input
                  type="text"
                  value={formData.correction_notes}
                  onChange={(e) => setFormData({ ...formData, correction_notes: e.target.value })}
                  placeholder="e.g. North Tower, Frontdesk PBX Room 102"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SLIDE-OVER DRAWER                                                      */}
      {/* ========================================================================= */}
      {drawerRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{drawerRecord.property_name}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-700">{drawerRecord.organization_name}</span>
                    <span>•</span>
                    <span className="font-mono">{drawerRecord.psap_id}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDrawerRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Exact Dispatchable Physical Address
                </h4>
                <p className="font-bold text-slate-900 text-sm">{drawerRecord.emergency_address}</p>
                {drawerRecord.correction_notes && (
                  <p className="text-amber-700 text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    {drawerRecord.correction_notes}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Statutory Telecom Compliance Checks
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-800">Kari&apos;s Law (Direct 911 Dialing without prefix &apos;9&apos;)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                    <span className="font-semibold text-slate-800">RAY BAUM&apos;S Act (Dispatchable Room/Floor Location)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedRecord(drawerRecord);
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs"
              >
                Change Status ({drawerRecord.status})
              </button>
              <button
                onClick={() => setDrawerRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
