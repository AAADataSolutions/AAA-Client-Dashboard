'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';

import {
  containerVariants,
  type Toast,
  type WholesalerItem,
  type CircuitMetrics,
} from './_components/types';
import DataCircuitsHeaderAndKpis from './_components/DataCircuitsHeaderAndKpis';
import DataCircuitsTable from './_components/DataCircuitsTable';
import CreateDataCircuitModal from './_components/CreateDataCircuitModal';
import ManageDataCircuitModal from './_components/ManageDataCircuitModal';
import WholesalersDirectoryModal from './_components/WholesalersDirectoryModal';
import DeleteCircuitModal from './_components/DeleteCircuitModal';
import { ImportDataCircuitsModal } from './_components/ImportDataCircuitsModal';
import { exportDataCircuitsToCsv } from './_components/dataCircuitsCsvParser';

export default function DataCircuitsAdminPage({
  initialTab = 'PIPELINE',
  defaultView,
}: {
  initialTab?: 'PIPELINE' | 'INSTALLED';
  defaultView?: 'PIPELINE' | 'INSTALLED';
} = {}) {
  const initial = defaultView || initialTab;
  const [activeViewTab, setActiveViewTab] = useState<'PIPELINE' | 'INSTALLED'>(initial);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab')?.toUpperCase();
      if (tabParam === 'INSTALLED') {
        setActiveViewTab('INSTALLED');
      } else if (tabParam === 'PIPELINE') {
        setActiveViewTab('PIPELINE');
      }
    }
  }, []);

  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthKey);

  // Data state
  const [circuits, setCircuits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [monthlyRevenueRows, setMonthlyRevenueRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<CircuitMetrics>({
    totalCircuits: 0,
    installedCircuits: 0,
    inProgressCircuits: 0,
    expectedMonthlyRevShare: 0,
    receivedMonthlyRevShare: 0,
    pendingMonthlyRevShare: 0,
  });
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Wholesalers Management State
  const [wholesalers, setWholesalers] = useState<WholesalerItem[]>([]);
  const [showWholesalersModal, setShowWholesalersModal] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeViewTab, searchQuery, statusFilter]);

  const pipelineCircuits = useMemo(
    () => circuits.filter((c) => c.status !== 'INSTALLED'),
    [circuits]
  );
  const installedCircuitsList = useMemo(
    () => circuits.filter((c) => c.status === 'INSTALLED'),
    [circuits]
  );
  const displayedCircuits = useMemo(
    () => (activeViewTab === 'INSTALLED' ? installedCircuitsList : pipelineCircuits),
    [activeViewTab, installedCircuitsList, pipelineCircuits]
  );
  const totalPages = Math.max(1, Math.ceil(displayedCircuits.length / pageSize));
  const paginatedCircuits = useMemo(
    () => displayedCircuits.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [displayedCircuits, currentPage]
  );

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCircuit, setSelectedCircuit] = useState<any | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalTab, setModalTab] = useState<'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW'>('PRICING');

  // Toggling Monthly Revenue Received Yes/No
  const [togglingCircuitId, setTogglingCircuitId] = useState<string | null>(null);

  // Delete Confirmation
  const [circuitToDelete, setCircuitToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchWholesalers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data-circuits/wholesalers');
      const json = await res.json();
      if (json.success && json.data) {
        setWholesalers(json.data);
      }
    } catch (err) {
      console.error('Failed to load wholesalers', err);
    }
  }, []);

  useEffect(() => {
    fetchWholesalers();
  }, [fetchWholesalers]);

  const fetchCircuitsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth,
        status: statusFilter,
        search: searchQuery,
      });
      const res = await fetch(`/api/admin/data-circuits?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCircuits(json.data || []);
        setProperties(json.properties || []);
        setMonthlyRevenueRows(json.monthlyRevenueRows || []);
        if (json.metrics) setMetrics(json.metrics);
        setTableMissing(Boolean(json.tableMissing));

        if (selectedCircuit) {
          const refreshed = (json.data || []).find((c: any) => c.id === selectedCircuit.id);
          if (refreshed) setSelectedCircuit(refreshed);
        }
      } else {
        showToast('Error loading Data Circuits', json.error, 'error');
      }
    } catch (err: any) {
      showToast('Failed to load Data Circuits', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter, searchQuery, showToast, selectedCircuit?.id]);

  useEffect(() => {
    fetchCircuitsData();
  }, [selectedMonth, statusFilter, searchQuery]);

  const handleOpenManageModal = (
    circuit: any,
    tab: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW' = 'PRICING'
  ) => {
    setSelectedCircuit(circuit);
    setModalTab(tab);
    setShowManageModal(true);
  };

  const handleToggleMonthlyRevenue = async (circuit: any, currentReceived: boolean) => {
    try {
      setTogglingCircuitId(circuit.id);
      const res = await fetch('/api/admin/data-circuits/monthly-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_circuit_id: circuit.id,
          month_key: selectedMonth,
          revenue_received: !currentReceived,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          'Revenue Status Updated',
          !currentReceived
            ? `Marked as Received for ${selectedMonth}`
            : `Marked as Pending for ${selectedMonth}`
        );
        fetchCircuitsData();
      } else {
        showToast('Update failed', json.error, 'error');
      }
    } catch (err: any) {
      showToast('Error updating revenue status', err.message, 'error');
    } finally {
      setTogglingCircuitId(null);
    }
  };

  const handleDeleteCircuit = async () => {
    if (!circuitToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/data-circuits/${circuitToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Circuit Deleted', 'Data circuit removed successfully.');
        setCircuitToDelete(null);
        if (selectedCircuit?.id === circuitToDelete.id) {
          setShowManageModal(false);
          setSelectedCircuit(null);
        }
        fetchCircuitsData();
      } else {
        showToast('Delete failed', json.error, 'error');
      }
    } catch (err: any) {
      showToast('Error deleting circuit', err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/50 dark:bg-[#0c0d12] p-4 sm:p-6 lg:p-8">
      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className={`p-3.5 rounded-xl border shadow-xl flex items-start gap-3 pointer-events-auto backdrop-blur-md ${
                t.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
                {t.message && <p className="text-slate-600 dark:text-slate-400 mt-0.5">{t.message}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header & KPI Cards */}
        <DataCircuitsHeaderAndKpis
          activeViewTab={activeViewTab}
          setActiveViewTab={setActiveViewTab}
          metrics={metrics}
          loading={loading}
          tableMissing={tableMissing}
          selectedMonth={selectedMonth}
          pipelineCount={circuits.filter((c: any) => c.status !== 'INSTALLED').length}
          installedCount={circuits.filter((c: any) => c.status === 'INSTALLED').length}
          displayedCount={displayedCircuits.length}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          wholesalersCount={wholesalers.length}
          onOpenWholesalers={() => setShowWholesalersModal(true)}
          onRefresh={fetchCircuitsData}
          onOpenCreate={() => setShowCreateModal(true)}
          onOpenImport={() => setShowImportModal(true)}
          onExportCsv={() => {
            exportDataCircuitsToCsv(
              displayedCircuits,
              activeViewTab === 'INSTALLED' ? 'data-circuits-installed' : 'data-circuits-pipeline'
            );
            showToast(
              'Exported CSV',
              `Exported ${displayedCircuits.length} ${activeViewTab === 'INSTALLED' ? 'installed' : 'pipeline'} data circuit(s).`
            );
          }}
        />

        {/* Circuits Table */}
        <DataCircuitsTable
          displayedCircuits={paginatedCircuits}
          totalCount={displayedCircuits.length}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          activeViewTab={activeViewTab}
          loading={loading}
          selectedMonth={selectedMonth}
          togglingCircuitId={togglingCircuitId}
          onToggleMonthlyRevenue={(id, rec) => handleToggleMonthlyRevenue({ id }, rec)}
          onOpenManageModal={handleOpenManageModal}
          onDeleteCircuit={(c: any) => setCircuitToDelete(c)}
          onOpenCreate={() => setShowCreateModal(true)}
        />
      </motion.div>

      {/* Create Circuit Modal */}
      <CreateDataCircuitModal
        showCreateModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        properties={properties}
        onSuccess={(circuit) => {
          fetchCircuitsData();
          handleOpenManageModal(circuit, 'PRICING');
        }}
        onToast={showToast}
      />

      {/* Manage Circuit Modal */}
      <ManageDataCircuitModal
        showManageModal={showManageModal}
        onClose={() => setShowManageModal(false)}
        selectedCircuit={selectedCircuit}
        modalTab={modalTab}
        setModalTab={setModalTab}
        wholesalers={wholesalers}
        onReload={fetchCircuitsData}
        onToast={showToast}
      />

      {/* Wholesalers Directory Modal */}
      <WholesalersDirectoryModal
        showWholesalersModal={showWholesalersModal}
        onClose={() => setShowWholesalersModal(false)}
        wholesalers={wholesalers}
        fetchWholesalers={fetchWholesalers}
        onToast={showToast}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCircuitModal
        circuitToDelete={circuitToDelete}
        onClose={() => setCircuitToDelete(null)}
        onDelete={handleDeleteCircuit}
        deleting={deleting}
      />

      {/* Import Data Circuits CSV Modal */}
      <ImportDataCircuitsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingCircuitPropertyNames={circuits.map((c) => c.property_name).filter(Boolean)}
        onSuccess={() => {
          fetchCircuitsData();
          fetchWholesalers();
        }}
      />
    </div>
  );
}

export const AdminDataCircuitsPage = DataCircuitsAdminPage;
