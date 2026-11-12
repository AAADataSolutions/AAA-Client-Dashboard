'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Loader2,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { VendorModals } from './_components/VendorModals';
import { VendorsKpis } from './_components/VendorsKpis';
import { VendorsTable } from './_components/VendorsTable';

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

  const formatCurrency = (val: number) => {
    const isNeg = val < 0;
    return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleEditVendor = (v: any) => {
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
              Vendors &amp; Equipment Ledger
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
      <VendorsKpis metrics={metrics} formatCurrency={formatCurrency} />

      {/* Main Vendor Ledger Table */}
      <VendorsTable
        vendors={vendors}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        marginFilter={marginFilter}
        setMarginFilter={setMarginFilter}
        selectedVendorId={selectedVendorId}
        expandedVendorIds={expandedVendorIds}
        toggleVendorExpand={toggleVendorExpand}
        formatCurrency={formatCurrency}
        onEditVendor={handleEditVendor}
        onDeleteVendor={(v) => setVendorToDelete(v)}
        deviceDrafts={deviceDrafts}
        savingDevicesFor={savingDevicesFor}
        deleteDevice={deleteDevice}
        updateDraft={updateDraft}
        removeDraftRow={removeDraftRow}
        addDraftRow={addDraftRow}
        saveDevices={saveDevices}
      />

      {/* Add / Edit / Delete Modals */}
      <VendorModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        editingVendor={editingVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        formSubmitting={formSubmitting}
        handleSaveVendor={handleSaveVendor}
        vendorToDelete={vendorToDelete}
        setVendorToDelete={setVendorToDelete}
        deleteLoading={deleteLoading}
        handleConfirmDeleteVendor={handleConfirmDeleteVendor}
      />
    </div>
  );
}
