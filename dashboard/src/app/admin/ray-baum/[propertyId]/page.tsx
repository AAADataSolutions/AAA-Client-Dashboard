'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import {
  ShieldCheck,
  Phone,
  DoorOpen,
  MapPin,
  Plus,
  Search,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RayBaumRecord {
  id: string;
  property_id: string;
  phone_number: string;
  assigned_to_room: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export default function AdminRayBaumPropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const resolvedParams = use(params);
  const propertyId = resolvedParams.propertyId;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [records, setRecords] = useState<RayBaumRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    phone_number: '',
    assigned_to_room: '',
    location: '',
  });

  const [editingRecord, setEditingRecord] = useState<RayBaumRecord | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    phone_number: '',
    assigned_to_room: '',
    location: '',
  });

  const [deletingRecord, setDeletingRecord] = useState<RayBaumRecord | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Property Info
      const propRes = await fetch(`/api/admin/properties`);
      const propJson = await propRes.json();
      if (propJson.success && Array.isArray(propJson.data)) {
        const found = propJson.data.find((p: any) => p.id === propertyId);
        if (found) {
          setProperty({
            id: found.id,
            name: found.name,
            address: found.address,
            city: found.city,
            state: found.state,
            zip_code: found.zip_code,
          });
        }
      }

      // 2. Fetch Ray Baum Records
      const recRes = await fetch(`/api/admin/ray-baum?propertyId=${propertyId}`);
      const recJson = await recRes.json();
      if (recJson.success) {
        setRecords(recJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching Ray Baum data:', err);
      showToast('Failed to load Ray Baum records.', 'error');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Create
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.phone_number.trim()) {
      showToast('Phone number is required.', 'error');
      return;
    }
    setSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/ray-baum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          phone_number: addForm.phone_number.trim(),
          assigned_to_room: addForm.assigned_to_room.trim() || null,
          location: addForm.location.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create record');
      }
      showToast('Dispatch record added successfully.');
      setShowAddModal(false);
      setAddForm({ phone_number: '', assigned_to_room: '', location: '' });
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error creating record', 'error');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Edit
  const handleOpenEdit = (rec: RayBaumRecord) => {
    setEditingRecord(rec);
    setEditForm({
      phone_number: rec.phone_number || '',
      assigned_to_room: rec.assigned_to_room || '',
      location: rec.location || '',
    });
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    if (!editForm.phone_number.trim()) {
      showToast('Phone number is required.', 'error');
      return;
    }
    setSubmittingEdit(true);
    try {
      const res = await fetch('/api/admin/ray-baum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          phone_number: editForm.phone_number.trim(),
          assigned_to_room: editForm.assigned_to_room.trim() || null,
          location: editForm.location.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update record');
      }
      showToast('Record updated successfully.');
      setEditingRecord(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error updating record', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete
  const handleDeleteRecord = async () => {
    if (!deletingRecord) return;
    setSubmittingDelete(true);
    try {
      const res = await fetch(`/api/admin/ray-baum?id=${deletingRecord.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete record');
      }
      showToast('Record deleted.');
      setDeletingRecord(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error deleting record', 'error');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.phone_number.toLowerCase().includes(q) ||
      (r.assigned_to_room && r.assigned_to_room.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q))
    );
  });

  const propertyAddress = property
    ? `${property.address || ''}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''} ${property.zip_code || ''}`.trim()
    : 'Property Details Loading...';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d0e12] p-6 lg:p-8 font-sans text-slate-800 dark:text-slate-200">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section (Strictly per spec: Header + Sub-header, No KPI cards) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#222430]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>RAY BAUM &amp; KARY'S LAW COMPLIANCE REGISTER</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ray Baum and Kary's Law — {property?.name || 'Property'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{propertyAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by phone number, room, or location..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Records: <strong className="text-slate-900 dark:text-white">{records.length}</strong>
          </span>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5 whitespace-nowrap">PHONE NO.</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">ASSIGNED TO ROOM</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">LOCATION</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span>Loading dispatch records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">
                          No dispatch records found.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {searchQuery
                            ? 'No matches for your search query.'
                            : 'Click "Add Record" to create the first dispatchable location record.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors"
                    >
                      {/* 1. Phone No. */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono font-semibold text-slate-900 dark:text-white">
                          <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{rec.phone_number}</span>
                        </div>
                      </td>

                      {/* 2. Assigned to Room */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">
                            {rec.assigned_to_room || <span className="text-slate-400 italic">Unassigned</span>}
                          </span>
                        </div>
                      </td>

                      {/* 3. Location */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 max-w-md">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {rec.location || <span className="text-slate-400 italic">Not specified</span>}
                          </span>
                        </div>
                      </td>

                      {/* 4. Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                            title="Edit record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRecord(rec)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal: Add Record */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Dispatchable Location
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addForm.phone_number}
                    onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                    placeholder="e.g. +1 (555) 123-4567"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Assigned to Room
                  </label>
                  <input
                    type="text"
                    value={addForm.assigned_to_room}
                    onChange={(e) => setAddForm({ ...addForm, assigned_to_room: e.target.value })}
                    placeholder="e.g. Room 402, Suite B, Lobby Desk"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Location Description
                  </label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    placeholder="e.g. 4th Floor North Wing, Main Building"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAdd}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAdd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Record</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Record */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Dispatchable Location
                  </h3>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateRecord} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Assigned to Room
                  </label>
                  <input
                    type="text"
                    value={editForm.assigned_to_room}
                    onChange={(e) => setEditForm({ ...editForm, assigned_to_room: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Location Description
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submittingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Update Record</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation */}
      <AnimatePresence>
        {deletingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Record</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete this dispatch record?
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{deletingRecord.phone_number}</span>
                </div>
                {deletingRecord.assigned_to_room && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Room:</span>
                    <span className="text-slate-700 dark:text-slate-300">{deletingRecord.assigned_to_room}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingRecord(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDelete}
                  onClick={handleDeleteRecord}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submittingDelete ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Delete Record</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
