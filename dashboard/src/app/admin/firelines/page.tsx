'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  PhoneCall,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface FireLineItem {
  id: string;
  device_type: string;
  phone_number: string;
  serial_number?: string | null;
  description?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  created_at: string;
  updated_at: string;
  property?: { id: string; name: string; city?: string; state?: string } | null;
  service?: { id: string; service_name?: string; phone_number: string } | null;
}

interface PropertyOption {
  id: string;
  name: string;
}

export default function AdminFirelinesPage() {
  const [fireLines, setFireLines] = useState<FireLineItem[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FireLineItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    device_type: '',
    phone_number: '',
    serial_number: '',
    description: '',
    property_id: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (propertyFilter !== 'ALL') params.set('propertyId', propertyFilter);

      const res = await fetch(`/api/admin/fire-lines?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to fetch fire lines');
      setFireLines(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading fire lines');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, propertyFilter]);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const json = await res.json();
      if (json.success && json.data) {
        setPropertyOptions(json.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error('Failed to load properties for dropdown:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      device_type: '',
      phone_number: '',
      serial_number: '',
      description: '',
      property_id: propertyOptions[0]?.id || '',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (item: FireLineItem) => {
    setSelectedItem(item);
    setFormData({
      device_type: item.device_type,
      phone_number: item.phone_number,
      serial_number: item.serial_number || '',
      description: item.description || '',
      property_id: item.property_id || '',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenDelete = (item: FireLineItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.device_type.trim() || !formData.phone_number.trim()) {
      setFormError('Device Type and Phone Number are required.');
      return;
    }
    try {
      setFormLoading(true);
      setFormError(null);
      const res = await fetch('/api/admin/fire-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create fire line');
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Creation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formData.device_type.trim() || !formData.phone_number.trim()) {
      setFormError('Device Type and Phone Number are required.');
      return;
    }
    try {
      setFormLoading(true);
      setFormError(null);
      const res = await fetch('/api/admin/fire-lines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, ...formData }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update fire line');
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Update failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setFormLoading(true);
      const res = await fetch(`/api/admin/fire-lines?id=${selectedItem.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete fire line');
      setShowDeleteModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Delete failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#222430]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Firelines
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Dedicated emergency life safety lines, communicator circuits, and fire alarm monitoring trunks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] border border-slate-200 dark:border-[#27272a] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Fire Line
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#15161c] p-3 rounded-xl border border-slate-200 dark:border-[#222430]">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by device type, phone, serial number, description..."
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

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
        >
          <option value="ALL">All Properties</option>
          {propertyOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table UI with Description Column */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading fireline records...</p>
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
      ) : fireLines.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]">
          <Flame className="w-10 h-10 text-orange-500/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Fire Lines Configured</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add dedicated emergency fire communicator circuits to monitor life-safety alarm trunks.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Fire Line
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden shadow-xs">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">DEVICE TYPE</th>
                  <th className="py-3 px-4">PHONE NUMBER</th>
                  <th className="py-3 px-4">SERIAL NUMBER</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">PROPERTY</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222a] text-xs">
                {fireLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-[#181a22]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span>{line.device_type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {line.phone_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                      {line.serial_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[240px] truncate" title={line.description || ''}>
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
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(line)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#202330] text-slate-500 dark:text-slate-400 hover:text-blue-500 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(line)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-500 dark:text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#282a36] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Add Fire Line
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitCreate} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fire Communicator DACT, Fire Alarm Panel"
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 555-019-2831"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-9812-FL-01"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Description (Shown in Table UI)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Primary life-safety monitoring dialer line for Main Building Fire Riser Room"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Assigned Property</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#1e202a] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Fire Line
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#282a36] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-500" /> Edit Fire Line
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.device_type}
                  onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Serial Number</label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Description (Shown in Table UI)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">Assigned Property</label>
                <select
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {propertyOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#1e202a] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#282a36] shadow-2xl p-5 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Fire Line?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedItem.device_type} ({selectedItem.phone_number})</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-100 dark:hover:bg-[#1e202a] text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={formLoading}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Fire Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
