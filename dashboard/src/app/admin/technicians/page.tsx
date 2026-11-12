'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench,
  Search,
  Plus,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { ImportTechniciansModal } from '@/components/admin/ImportTechniciansModal';
import { Technician, Toast } from './_components/types';
import { TechniciansTable } from './_components/TechniciansTable';
import { TechnicianModals } from './_components/TechnicianModals';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25 },
  },
};

export default function TechniciansPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  // Technicians State
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [metrics, setMetrics] = useState({
    totalTechnicians: 0,
    totalAreas: 0,
    activeTechnicians: 0,
  });
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  // Filters & Search
  const [searchInput, setSearchInput] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTechForEdit, setSelectedTechForEdit] = useState<Technician | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    area_name: '',
    phone_no: '',
    status: 'ACTIVE',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Technicians
  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchInput.trim()) params.set('search', searchInput.trim());
      if (selectedArea !== 'ALL') params.set('area', selectedArea);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      params.set('sortBy', sortBy);
      params.set('page', String(currentPage));
      params.set('limit', String(pageSize));

      const res = await fetch(`/api/admin/technicians?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch technicians');
      }

      setTechnicians(json.data || []);
      if (json.metrics) setMetrics(json.metrics);
      if (json.areas) setAvailableAreas(json.areas);
      setTableMissing(Boolean(json.tableMissing));
    } catch (err: any) {
      console.error('Failed to load technicians:', err);
      setError(err.message || 'Error loading technicians directory.');
    } finally {
      setLoading(false);
    }
  }, [searchInput, selectedArea, selectedStatus, sortBy, currentPage]);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  // Copy Phone Helper
  const handleCopyPhone = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to Clipboard', text, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (tech: Technician) => {
    setSelectedTechForEdit(tech);
    setFormData({
      name: tech.name,
      area_name: tech.area_name,
      phone_no: tech.phone_no,
      status: tech.status || 'ACTIVE',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Submit Create Technician
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.area_name.trim() || !formData.phone_no.trim()) {
      setFormError('Technician Name, Area Name, and Phone Number are required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch('/api/admin/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add technician');
      }

      showToast('Technician Added', `${formData.name} added to directory.`, 'success');
      setShowCreateModal(false);
      setFormData({ name: '', area_name: '', phone_no: '', status: 'ACTIVE' });
      loadTechnicians();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Technician
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechForEdit) return;

    if (!formData.name.trim() || !formData.area_name.trim() || !formData.phone_no.trim()) {
      setFormError('Technician Name, Area Name, and Phone Number are required.');
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);

      const res = await fetch(`/api/admin/technicians/${selectedTechForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update technician');
      }

      showToast('Technician Updated', `${formData.name} details saved.`, 'success');
      setShowEditModal(false);
      setSelectedTechForEdit(null);
      loadTechnicians();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm Delete Technician
  const handleDeleteConfirm = async () => {
    if (!techToDelete) return;

    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/technicians/${techToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete technician');
      }

      showToast('Technician Deleted', `${techToDelete.name} was removed from the directory.`, 'info');
      setShowDeleteModal(false);
      setTechToDelete(null);
      loadTechnicians();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (technicians.length === 0) {
      showToast('No Technicians', 'There are no technicians to export.', 'info');
      return;
    }

    const headers = 'ID,Name,Area Name,Phone No,Status,Created At\n';
    const rows = technicians.map(
      (t) =>
        `"${t.id}","${t.name.replace(/"/g, '""')}","${t.area_name.replace(/"/g, '""')}","${t.phone_no.replace(/"/g, '""')}","${t.status || 'ACTIVE'}","${t.created_at || ''}"`
    );

    const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `technicians-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Successful', `Exported ${technicians.length} technicians as CSV.`, 'success');
  };

  const hasActiveFilters =
    searchInput.trim() !== '' ||
    selectedArea !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    sortBy !== 'NAME_ASC';

  const resetAllFilters = () => {
    setSearchInput('');
    setSelectedArea('ALL');
    setSelectedStatus('ALL');
    setSortBy('NAME_ASC');
    setCurrentPage(1);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      {/* Toast Notification Container */}
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
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

      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/40 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Technicians</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Field telecommunications technician roster with service area coverage and direct contact numbers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Import CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setFormData({ name: '', area_name: '', phone_no: '', status: 'ACTIVE' });
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Technician
          </motion.button>
        </div>
      </motion.div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technicians by name, service area, phone number..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Area Filter */}
            <select
              value={selectedArea}
              onChange={(e) => {
                setSelectedArea(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by service area"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Area: All Areas</option>
              {availableAreas.map((area, idx) => (
                <option key={idx} value={area}>
                  {area}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by technician status"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort technicians"
              className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="NAME_ASC">Sort: Name (A-Z)</option>
              <option value="NAME_DESC">Sort: Name (Z-A)</option>
              <option value="AREA_ASC">Sort: Area (A-Z)</option>
              <option value="NEWEST">Sort: Recently Added</option>
            </select>
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {searchInput && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                "{searchInput}"
                <button onClick={() => setSearchInput('')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedArea !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Area: {selectedArea}
                <button onClick={() => setSelectedArea('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('ALL')} className="cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-slate-500 hover:text-blue-600 text-xs font-medium underline ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      <TechniciansTable
        error={error}
        loading={loading}
        technicians={technicians}
        hasActiveFilters={hasActiveFilters}
        copiedId={copiedId}
        loadTechnicians={loadTechnicians}
        setShowImportModal={setShowImportModal}
        onOpenCreate={() => {
          setFormData({ name: '', area_name: '', phone_no: '', status: 'ACTIVE' });
          setFormError(null);
          setShowCreateModal(true);
        }}
        handleCopyPhone={handleCopyPhone}
        handleOpenEdit={handleOpenEdit}
        onOpenDelete={(tech) => {
          setTechToDelete(tech);
          setShowDeleteModal(true);
        }}
      />

      <TechnicianModals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        selectedTechForEdit={selectedTechForEdit}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        techToDelete={techToDelete}
        deleteLoading={deleteLoading}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        formError={formError}
        handleCreateSubmit={handleCreateSubmit}
        handleEditSubmit={handleEditSubmit}
        handleDeleteConfirm={handleDeleteConfirm}
      />

      {/* Import CSV Modal */}
      <ImportTechniciansModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadTechnicians();
        }}
      />
    </motion.div>
  );
}
