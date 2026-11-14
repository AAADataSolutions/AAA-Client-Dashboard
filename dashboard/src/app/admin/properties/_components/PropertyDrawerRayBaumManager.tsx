'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Plus,
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { ImportRayBaumModal } from '@/components/admin/ImportRayBaumModal';

interface RayBaumRecord {
  id: string;
  phone_number: string;
  assigned_to_room?: string | null;
  location?: string | null;
  price?: number | null;
  created_at?: string;
}

interface PropertyDrawerRayBaumManagerProps {
  propertyId: string;
  propertyName: string;
  onDataChanged?: () => void;
}

export function PropertyDrawerRayBaumManager({
  propertyId,
  propertyName,
  onDataChanged,
}: PropertyDrawerRayBaumManagerProps) {
  const [records, setRecords] = useState<RayBaumRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form fields
  const [newPhone, setNewPhone] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPrice, setNewPrice] = useState('0.00');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load records
  const loadRecords = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/ray-baum?propertyId=${propertyId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRecords(json.data);
      } else {
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle Add Single Record
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      setFormError('Phone number is required.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      const res = await fetch('/api/admin/ray-baum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          phone_number: newPhone.trim(),
          assigned_to_room: newRoom.trim() || null,
          location: newLocation.trim() || null,
          price: Number(newPrice) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save Ray Baum record.');
      }

      setNewPhone('');
      setNewRoom('');
      setNewLocation('');
      setNewPrice('0.00');
      setShowAddForm(false);
      await loadRecords();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setFormError(err.message || 'Error creating record.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = async (recordId: string, phone: string) => {
    if (!confirm(`Are you sure you want to delete Ray Baum record for ${phone}?`)) return;

    try {
      setDeletingId(recordId);
      const res = await fetch(`/api/admin/ray-baum?id=${recordId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete record.');
      }

      await loadRecords();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('No Ray Baum records to export.');
      return;
    }

    const headers = ['PHONE NO.', 'ASSIGNED TO ROOM', 'LOCATION', 'PRICE'];
    const rows = records.map((r) => [
      `"${(r.phone_number || '').replace(/"/g, '""')}"`,
      `"${(r.assigned_to_room || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${Number(r.price || 0).toFixed(2)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ray_Baum_Records_${propertyName.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMonthlyPrice = records.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

  return (
    <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3.5">
      {/* Header and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60 dark:border-[#222430]">
        <div>
          <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block">
            Ray Baum&apos;s Provisioned Numbers ({records.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Total Monthly Ray Baum Charges: <strong className="text-emerald-600">${totalMonthlyPrice.toFixed(2)}/mo</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Number</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-[#222430] dark:hover:bg-[#2a2d3d] text-slate-800 dark:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-3 bg-white dark:bg-[#181a24] border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-700 dark:text-blue-400 text-xs">Add Ray Baum Dedicated Number</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <p className="text-rose-600 text-[11px] bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg">{formError}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                Assigned Room
              </label>
              <input
                type="text"
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="Room 101 / Suite B"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                Dispatch Location / Floor
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Floor 1, West Wing"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                Monthly Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Record'}
            </button>
          </div>
        </form>
      )}

      {/* Records Table / List */}
      {loading ? (
        <div className="p-6 text-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-xs">Loading Ray Baum numbers...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400">
          <FileSpreadsheet className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">No Ray Baum Numbers Registered</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Add numbers individually or import a CSV file with room numbers &amp; dispatchable locations.
          </p>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#222430] rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#181a24]">
          {records.map((r) => (
            <div key={r.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-[#1f212c] transition">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {r.phone_number}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                    {r.assigned_to_room && <span>Room: <strong>{r.assigned_to_room}</strong></span>}
                    {r.location && <span>• {r.location}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                  ${Number(r.price || 0).toFixed(2)}/mo
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteRecord(r.id, r.phone_number)}
                  disabled={deletingId === r.id}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Delete Record"
                >
                  {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSV Import Modal */}
      <ImportRayBaumModal
        isOpen={showImportModal}
        propertyId={propertyId}
        propertyName={propertyName}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadRecords();
          if (onDataChanged) onDataChanged();
        }}
      />
    </div>
  );
}

