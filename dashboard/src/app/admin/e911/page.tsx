'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Download,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchE911Records,
  setSearchQuery,
  setStatusFilter,
  setComplianceFilter,
  setSortBy,
  setPagination,
  E911Item,
} from '@/store/slices/e911Slice';
import {
  containerVariants,
  itemVariants,
  E911Status,
  PropertyOption,
  Toast,
} from './_components/types';
import E911KpisAndFilters from './_components/E911KpisAndFilters';
import E911Table from './_components/E911Table';
import E911DetailDrawer from './_components/E911DetailDrawer';
import E911Modals from './_components/E911Modals';

export default function AdminE911Page() {
  const dispatch = useAppDispatch();
  const {
    items: records,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.e911);

  const [propertyList, setPropertyList] = useState<PropertyOption[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<E911Item | null>(null);

  // Unified Details & Notes Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<E911Item | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'DETAILS' | 'NOTES'>('DETAILS');
  const [newCorrectionNote, setNewCorrectionNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Form State for Add / Edit
  const [createForm, setCreateForm] = useState({
    property_id: '',
    emergency_address: '',
    status: 'PENDING' as E911Status,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    emergency_address: '',
    status: 'PENDING' as E911Status,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Load all properties for the Add modal dropdown
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/admin/properties?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const props: PropertyOption[] = data.data.map((p: any) => {
            const orgLinks = Array.isArray(p.org_links) ? p.org_links : (p.org_links ? [p.org_links] : []);
            const firstOrg = orgLinks[0]?.organization?.name || p.primary_organization?.name || p.organization_name || 'Unassigned';
            const firstOrgPropId = p.org_property_id || orgLinks[0]?.id || '';

            return {
              id: p.id,
              name: p.name,
              address: p.address,
              city: p.city,
              state: p.state,
              zip_code: p.zip_code,
              org_property_id: firstOrgPropId,
              organization_name: firstOrg,
            };
          });
          setPropertyList(props);
        }
      } catch (err) {
        console.warn('Could not load properties dropdown:', err);
      }
    }
    loadProperties();
  }, []);

  // Fetch E911 Records via Redux
  const loadData = useCallback(() => {
    dispatch(
      fetchE911Records({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        status: filters.selectedStatus,
        compliance: filters.selectedCompliance,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search input handler
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  // Open Details Modal
  const openDetailsModal = (rec: E911Item, tab: 'DETAILS' | 'NOTES' = 'DETAILS') => {
    setSelectedRecordForDetails(rec);
    setModalActiveTab(tab);
    setNewCorrectionNote('');
    setShowDetailsModal(true);
  };

  // Handle Create E911 Record
  const handlePropertySelectInAdd = (propId: string) => {
    const selectedProp = propertyList.find((p) => p.id === propId);
    if (selectedProp) {
      const fullAddr = `${selectedProp.address}, ${selectedProp.city}, ${selectedProp.state} ${selectedProp.zip_code}`.trim();
      setCreateForm({
        ...createForm,
        property_id: propId,
        emergency_address: fullAddr,
      });
    } else {
      setCreateForm({
        ...createForm,
        property_id: propId,
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_id) {
      setCreateError('Please choose a property.');
      return;
    }
    if (!createForm.emergency_address.trim()) {
      setCreateError('Emergency dispatch address is required.');
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);

      const chosenProp = propertyList.find((p) => p.id === createForm.property_id);

      const res = await fetch('/api/admin/e911', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: createForm.property_id,
          organization_property_id: chosenProp?.org_property_id || null,
          emergency_address: createForm.emergency_address.trim(),
          status: createForm.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create E911 record.');

      showToast('E911 Created', `Record registered for ${chosenProp?.name || 'property'}.`, 'success');
      setShowCreateModal(false);
      setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
      loadData();
    } catch (err: any) {
      setCreateError(err.message || 'Creation failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Edit E911 Record
  const handleOpenEdit = (rec: E911Item) => {
    setSelectedRecordForEdit(rec);
    setEditForm({
      emergency_address: rec.emergency_address || '',
      status: (rec.status as E911Status) || 'PENDING',
    });
    setEditError(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForEdit) return;

    if (!editForm.emergency_address.trim()) {
      setEditError('Emergency dispatch address is required.');
      return;
    }

    try {
      setEditLoading(true);
      setEditError(null);

      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForEdit.id,
          emergency_address: editForm.emergency_address.trim(),
          status: editForm.status,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update E911 record.');

      showToast('E911 Updated', 'Record details updated successfully.', 'success');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Update failed.');
      showToast('Error', err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Append Correction Note
  const handleAddCorrectionNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForDetails || !newCorrectionNote.trim()) return;

    try {
      setAddingNote(true);
      const res = await fetch('/api/admin/e911', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRecordForDetails.id,
          append_correction_note: newCorrectionNote.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to add note.');

      showToast('Note Added', 'Correction note appended successfully.', 'success');
      setNewCorrectionNote('');
      setShowDetailsModal(false);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const resetAllFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStatusFilter('ALL'));
    dispatch(setComplianceFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedStatus !== 'ALL' ||
    filters.selectedCompliance !== 'ALL' ||
    filters.sortBy !== 'NEWEST';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-lg flex items-start gap-3 backdrop-blur-md transition-all animate-in slide-in-from-top-3 ${
              t.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/30 text-white'
                : t.type === 'error'
                ? 'bg-slate-900/95 border-rose-500/30 text-white'
                : 'bg-slate-900/95 border-blue-500/30 text-white'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-semibold text-white">{t.title}</p>
              {t.message && <p className="text-slate-300 mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
            <ShieldCheck size={256} className="text-black dark:text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ray Baum and Kary's Law Compliance</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={async () => {
              let exportList: E911Item[] = records;
              try {
                const params = new URLSearchParams({
                  page: '1',
                  limit: '5000',
                  search: filters.searchQuery || '',
                  status: filters.selectedStatus || 'ALL',
                  sortBy: filters.sortBy || 'NEWEST',
                });
                const res = await fetch(`/api/admin/e911?${params.toString()}`);
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                  exportList = json.data;
                }
              } catch {
                // fallback to loaded records
              }
              const headers = ['Property,Property Address,Organization,Emergency Dispatch Address,Status,Ray Baum\n'];
              const rows = exportList.map((r: E911Item) =>
                `"${r.property_name}","${r.emergency_address}","${r.organization_name}","${r.emergency_address}","${r.status}","${r.ray_baum_compliant ? 'Verified' : 'Non-Verified'}"`
              );
              const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `e911-records-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              showToast('Exported', `Exported ${exportList.length} E911 records as CSV.`, 'info');
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={resetAllFilters}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset Filters
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add E911 Location
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards & Filters */}
      <E911KpisAndFilters
        metrics={metrics}
        filters={filters}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onStatusChange={(val) => {
          dispatch(setStatusFilter(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onComplianceChange={(val) => {
          dispatch(setComplianceFilter(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onSortByChange={(val) => {
          dispatch(setSortBy(val));
          dispatch(setPagination({ currentPage: 1 }));
        }}
        onResetFilters={resetAllFilters}
      />

      {/* Main Table View */}
      <E911Table
        records={records}
        loading={loading}
        error={error}
        pagination={pagination}
        hasActiveFilters={hasActiveFilters}
        onPageChange={(page) => dispatch(setPagination({ currentPage: page }))}
        onRetry={loadData}
        onResetFilters={resetAllFilters}
        onOpenCreate={() => {
          setCreateForm({ property_id: '', emergency_address: '', status: 'PENDING' });
          setShowCreateModal(true);
        }}
        onOpenEdit={handleOpenEdit}
        onOpenDetails={openDetailsModal}
      />

      {/* Unified Details & Correction Notes Modal */}
      <E911DetailDrawer
        show={showDetailsModal}
        record={selectedRecordForDetails}
        activeTab={modalActiveTab}
        setActiveTab={setModalActiveTab}
        onClose={() => setShowDetailsModal(false)}
        newCorrectionNote={newCorrectionNote}
        setNewCorrectionNote={setNewCorrectionNote}
        addingNote={addingNote}
        onAddCorrectionNote={handleAddCorrectionNote}
      />

      {/* Add / Edit Modals */}
      <E911Modals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        createForm={createForm}
        setCreateForm={setCreateForm}
        createLoading={createLoading}
        createError={createError}
        propertyList={propertyList}
        onPropertySelectInAdd={handlePropertySelectInAdd}
        onCreateSubmit={handleCreateSubmit}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedRecordForEdit={selectedRecordForEdit}
        editForm={editForm}
        setEditForm={setEditForm}
        editLoading={editLoading}
        editError={editError}
        onEditSubmit={handleEditSubmit}
      />
    </motion.div>
  );
}
