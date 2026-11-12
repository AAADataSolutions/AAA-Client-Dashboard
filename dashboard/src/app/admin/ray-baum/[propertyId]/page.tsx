'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImportRayBaumModal } from '@/components/admin/ImportRayBaumModal';
import { RayBaumRecord, PropertyDetails, RayBaumFormState } from './_components/types';
import { RayBaumTable } from './_components/RayBaumTable';
import { RayBaumModals } from './_components/RayBaumModals';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState<RayBaumFormState>({
    phone_number: '',
    assigned_to_room: '',
    location: '',
    price: '',
  });

  const [editingRecord, setEditingRecord] = useState<RayBaumRecord | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState<RayBaumFormState>({
    phone_number: '',
    assigned_to_room: '',
    location: '',
    price: '',
  });

  const [deletingRecord, setDeletingRecord] = useState<RayBaumRecord | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Export CSV Function (Headers: PHONE NO., ASSIGNED TO ROOM, LOCATION, PRICE)
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No dispatch records available to export.', 'error');
      return;
    }

    const headers = ['PHONE NO.', 'ASSIGNED TO ROOM', 'LOCATION', 'PRICE'];
    const rows = records.map((rec) => [
      `"${(rec.phone_number || '').replace(/"/g, '""')}"`,
      `"${(rec.assigned_to_room || '').replace(/"/g, '""')}"`,
      `"${(rec.location || '').replace(/"/g, '""')}"`,
      `"${Number(rec.price || 0).toFixed(2)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = (property?.name || propertyId).replace(/[^a-zA-Z0-9_-]/g, '_');
    link.setAttribute('download', `Ray_Baum_Records_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Successfully exported ${records.length} records to CSV.`);
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
      const parsedPrice = addForm.price !== '' ? parseFloat(addForm.price) || 0 : 0;
      const res = await fetch('/api/admin/ray-baum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          phone_number: addForm.phone_number.trim(),
          assigned_to_room: addForm.assigned_to_room.trim() || null,
          location: addForm.location.trim() || null,
          price: parsedPrice,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create record');
      }
      showToast('Dispatch record added successfully.');
      setShowAddModal(false);
      setAddForm({ phone_number: '', assigned_to_room: '', location: '', price: '' });
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
      price: rec.price !== undefined && rec.price !== null ? String(rec.price) : '0.00',
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
      const parsedPrice = editForm.price !== '' ? parseFloat(editForm.price) || 0 : 0;
      const res = await fetch('/api/admin/ray-baum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRecord.id,
          phone_number: editForm.phone_number.trim(),
          assigned_to_room: editForm.assigned_to_room.trim() || null,
          location: editForm.location.trim() || null,
          price: parsedPrice,
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

      <RayBaumTable
        property={property}
        propertyAddress={propertyAddress}
        records={records}
        filteredRecords={filteredRecords}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        fetchData={fetchData}
        handleExportCSV={handleExportCSV}
        setShowImportModal={setShowImportModal}
        setShowAddModal={setShowAddModal}
        handleOpenEdit={handleOpenEdit}
        setDeletingRecord={setDeletingRecord}
      />

      <RayBaumModals
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        addForm={addForm}
        setAddForm={setAddForm}
        submittingAdd={submittingAdd}
        handleCreateRecord={handleCreateRecord}
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        editForm={editForm}
        setEditForm={setEditForm}
        submittingEdit={submittingEdit}
        handleUpdateRecord={handleUpdateRecord}
        deletingRecord={deletingRecord}
        setDeletingRecord={setDeletingRecord}
        submittingDelete={submittingDelete}
        handleDeleteRecord={handleDeleteRecord}
      />

      {/* Modal: Import CSV */}
      <ImportRayBaumModal
        isOpen={showImportModal}
        propertyId={propertyId}
        propertyName={property?.name}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
