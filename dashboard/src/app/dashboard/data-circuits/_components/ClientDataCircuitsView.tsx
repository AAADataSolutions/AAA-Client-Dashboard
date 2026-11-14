'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  CheckCircle2,
  Clock,
  Search,
  X,
  Filter,
  Eye,
  MapPin,
  RefreshCw,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  containerVariants,
  itemVariants,
  getCircuitStageBadge,
  formatCurrency,
  CIRCUIT_STAGES,
} from '../types';
import ClientDataCircuitDetailModal from './ClientDataCircuitDetailModal';

interface ClientDataCircuitsViewProps {
  mode: 'PIPELINE' | 'INSTALLED';
}

export default function ClientDataCircuitsView({ mode }: ClientDataCircuitsViewProps) {
  const isInstalledView = mode === 'INSTALLED';

  const [circuits, setCircuits] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalCircuits: 0,
    installedCircuits: 0,
    inProgressCircuits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCircuit, setSelectedCircuit] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [mode, searchQuery, statusFilter]);

  const fetchCircuits = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/data-circuits');
      const json = await res.json();
      if (json.success) {
        setCircuits(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err) {
      console.error('Failed to load client data circuits', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCircuits();
  }, [fetchCircuits]);

  const viewCircuits = useMemo(() => {
    return circuits.filter((c) =>
      isInstalledView ? c.status === 'INSTALLED' : c.status !== 'INSTALLED'
    );
  }, [circuits, isInstalledView]);

  const filteredCircuits = useMemo(() => {
    return viewCircuits.filter((c) => {
      if (!isInstalledView && statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.property_name?.toLowerCase().includes(q);
        const matchesAddress = c.property_address?.toLowerCase().includes(q);
        const matchesCarrier = c.carrier_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesCarrier) return false;
      }
      return true;
    });
  }, [viewCircuits, isInstalledView, statusFilter, searchQuery]);

  const totalMrc = useMemo(() => {
    return viewCircuits.reduce((acc, c) => acc + (Number(c.circuit_monthly_price) || 0), 0);
  }, [viewCircuits]);

  const totalPages = Math.max(1, Math.ceil(filteredCircuits.length / pageSize));
  const paginatedCircuits = useMemo(() => {
    return filteredCircuits.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredCircuits, currentPage]);
  const startItem = filteredCircuits.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(filteredCircuits.length, currentPage * pageSize);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. Page Header (Admin Style Gradient Box & Typography) */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            {isInstalledView ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Network className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isInstalledView ? 'Data Circuit Installed' : 'Data Circuit Pipeline'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isInstalledView
                ? 'Active, verified enterprise broadband circuits live across your properties.'
                : 'Track dedicated enterprise broadband connections, carrier lifecycle status, and technical configurations for your assigned properties.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchCircuits}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1d1f29] transition cursor-pointer self-start sm:self-auto shadow-xs disabled:opacity-50"
          title="Refresh Circuits"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* 2. KPI Cards — 4 Deep Blue Gradient Cards (1:1 Admin Styling) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Data Circuits */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Total Data Circuits
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalCircuits}</span>
            <span className="text-xs text-blue-200 font-medium">
              ({metrics.inProgressCircuits} in pipeline)
            </span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Dedicated property connections
          </p>
        </div>

        {/* Card 2: Active Pipeline (In Progress) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Active Pipeline
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">
              {metrics.inProgressCircuits}
            </span>
            <span className="text-xs text-blue-200 font-medium">stages 1–6</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Requirements, pricing &amp; FOC
          </p>
        </div>

        {/* Card 3: Installed & Live */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Installed &amp; Live
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">
              {metrics.installedCircuits}
            </span>
            <span className="text-xs text-blue-200 font-medium">live properties</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Synced &amp; operational circuits
          </p>
        </div>

        {/* Card 4: Total Monthly Investment (MRC) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              {isInstalledView ? 'Installed Monthly MRC' : 'Total Monthly MRC'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-200" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{formatCurrency(totalMrc)}</span>
            <span className="text-[11px] text-blue-200">/ month</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Active recurring bandwidth charge
          </p>
        </div>
      </motion.div>

      {/* 3. Filter & Search Bar with Left View Pill Badge */}
      <motion.div
        variants={itemVariants}
        className="p-3 bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-center gap-2">
          {isInstalledView ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Installed Data Circuits ({filteredCircuits.length})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
              <Network className="w-4 h-4" />
              <span>Pipeline Circuits ({filteredCircuits.length})</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-lg justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search property, carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isInstalledView && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:border-blue-500 font-bold"
            >
              <option value="ALL">All Pipeline Stages (1–6)</option>
              {CIRCUIT_STAGES.filter((s) => s.key !== 'INSTALLED').map((s) => (
                <option key={s.key} value={s.key}>
                  {s.step}. {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </motion.div>

      {/* 4. Table UI matching Admin Styling */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">PROPERTY</th>
                <th className="py-3 px-4 whitespace-nowrap">CARRIER NETWORK</th>
                <th className="py-3 px-4 whitespace-nowrap">BANDWIDTH</th>
                <th className="py-3 px-4 whitespace-nowrap">MONTHLY PRICE (MRC)</th>
                <th className="py-3 px-4 whitespace-nowrap">LIFECYCLE STAGE</th>
                <th className="py-3 px-4 whitespace-nowrap">SITE SURVEY</th>
                <th className="py-3 px-4 whitespace-nowrap">FOC CUTOVER DATE</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]/60">
              {loading && circuits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading data circuits...
                  </td>
                </tr>
              ) : filteredCircuits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    {isInstalledView ? (
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                    ) : (
                      <Network className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                    )}
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                      No circuits found
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isInstalledView
                        ? 'No data circuits are currently marked as Installed & Live for your properties.'
                        : 'No active pipeline circuits match your current filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCircuits.map((item) => {
                  const badge = getCircuitStageBadge(item.status);
                  const mrcVal =
                    item.circuit_monthly_price !== null && item.circuit_monthly_price !== undefined
                      ? `$${Number(item.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                      : '—';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedCircuit(item)}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#191b24] transition cursor-pointer"
                    >
                      {/* Property */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {item.property_name || 'Property'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span>{item.property_address || 'Address pending'}</span>
                        </div>
                      </td>

                      {/* Carrier */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                        {item.carrier_name || <span className="text-slate-400 font-normal italic">Pending</span>}
                      </td>

                      {/* Bandwidth */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {item.bandwidth || '1 Gig'}
                      </td>

                      {/* Monthly Price (MRC) */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400">
                        {mrcVal}
                      </td>

                      {/* Lifecycle Stage */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {badge.label}
                        </span>
                      </td>

                      {/* Site Survey */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.site_survey_status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Passed
                          </span>
                        ) : item.site_survey_status === 'SCHEDULED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            Scheduled
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Pending</span>
                        )}
                      </td>

                      {/* FOC Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-mono">
                        {item.foc_date ? new Date(item.foc_date).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCircuit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition font-bold text-xs cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredCircuits.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-[#222430] bg-slate-50/70 dark:bg-[#111217] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-900 dark:text-white">{startItem}</span>–
              <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> of{' '}
              <span className="font-bold text-slate-900 dark:text-white">{filteredCircuits.length}</span> circuits
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1e202b] flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-[#1e202b] flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Client Read-Only Right-Side Detail Drawer */}
      <ClientDataCircuitDetailModal
        isOpen={Boolean(selectedCircuit)}
        circuit={selectedCircuit}
        onClose={() => setSelectedCircuit(null)}
      />
    </div>
  );
}

