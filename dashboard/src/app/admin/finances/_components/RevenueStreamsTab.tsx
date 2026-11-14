'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneCall,
  Network,
  DollarSign,
  PieChart,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import {
  itemVariants,
  formatCurrency,
  type RevenueStreamsData,
  type MonthOption,
} from './types';
import { RevenueStreamsCharts } from './RevenueStreamsCharts';

interface RevenueStreamsTabProps {
  data: RevenueStreamsData | null;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: MonthOption[];
}

export function RevenueStreamsTab({
  data,
  selectedMonth,
  onSelectMonth,
  availableMonths,
}: RevenueStreamsTabProps) {
  const [streamFilter, setStreamFilter] = useState<'ALL' | 'PORTING' | 'CIRCUITS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!data) {
    return (
      <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-12 text-center text-slate-400">
        <p className="text-sm font-semibold">No revenue streams data available for this month.</p>
      </div>
    );
  }

  const { portingRevenue, dataCircuitRevenue, summary } = data;

  // Filtered Items for the Ledger Table
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const rows: Array<{
      id: string;
      sourceType: 'PORTING' | 'DATA_CIRCUIT';
      propertyName: string;
      propertyAddress?: string;
      organizationName?: string;
      providerOrType: string;
      clientBilledPrice: number;
      aaaInflowAmount: number;
      rateOrDetails: string;
      statusBadge: { label: string; isGood: boolean };
    }> = [];

    // Add Porting Items
    if (streamFilter === 'ALL' || streamFilter === 'PORTING') {
      portingRevenue.items.forEach((p) => {
        if (
          !q ||
          p.propertyName.toLowerCase().includes(q) ||
          p.organizationName.toLowerCase().includes(q) ||
          (p.address && p.address.toLowerCase().includes(q))
        ) {
          rows.push({
            id: `port-${p.id}`,
            sourceType: 'PORTING',
            propertyName: p.propertyName,
            propertyAddress: p.address,
            organizationName: p.organizationName,
            providerOrType: p.servicesCount > 0 ? `${p.servicesCount} Voice Lines / Services` : 'Direct Porting Rate',
            clientBilledPrice: p.totalMonthly,
            aaaInflowAmount: p.totalMonthly,
            rateOrDetails: p.monthlyPrice > 0 ? `$${p.monthlyPrice} base + $${p.servicesPrice} svcs` : 'Standard Rate',
            statusBadge: {
              label: p.billingStatus === 'BILLING_DONE' ? 'Billing Done' : 'Billing Pending',
              isGood: p.billingStatus === 'BILLING_DONE',
            },
          });
        }
      });
    }

    // Add Data Circuit Items
    if (streamFilter === 'ALL' || streamFilter === 'CIRCUITS') {
      dataCircuitRevenue.items.forEach((c) => {
        if (
          !q ||
          c.propertyName.toLowerCase().includes(q) ||
          c.wholesalerName.toLowerCase().includes(q) ||
          c.carrierName.toLowerCase().includes(q) ||
          (c.propertyAddress && c.propertyAddress.toLowerCase().includes(q))
        ) {
          rows.push({
            id: `dc-${c.id}`,
            sourceType: 'DATA_CIRCUIT',
            propertyName: c.propertyName,
            propertyAddress: c.propertyAddress,
            organizationName: c.wholesalerName,
            providerOrType: `${c.wholesalerName} • ${c.carrierName} (${c.bandwidth || '1 Gig'})`,
            clientBilledPrice: c.clientMonthlyPrice,
            aaaInflowAmount: c.monthlyCommission,
            rateOrDetails: `${c.revenueSharePercentage}% Commission`,
            statusBadge: {
              label: c.isReceived ? 'Received (Yes)' : 'Pending (No)',
              isGood: c.isReceived,
            },
          });
        }
      });
    }

    return rows;
  }, [portingRevenue.items, dataCircuitRevenue.items, streamFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Month Selector & Stream Filters */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161c] p-4 rounded-2xl border border-slate-200 dark:border-[#222430] shadow-xs"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#282a36] bg-slate-50 dark:bg-[#1a1c24] text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#282a36] hidden sm:block" />

          {/* Stream Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1c1e27] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStreamFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                streamFilter === 'ALL'
                  ? 'bg-white dark:bg-[#15161c] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Streams
            </button>
            <button
              type="button"
              onClick={() => setStreamFilter('PORTING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                streamFilter === 'PORTING'
                  ? 'bg-white dark:bg-[#15161c] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3 h-3" />
              <span>Porting &amp; Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setStreamFilter('CIRCUITS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                streamFilter === 'CIRCUITS'
                  ? 'bg-white dark:bg-[#15161c] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>Circuit Rev Share</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search property, wholesaler, carrier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-xs text-slate-900 dark:text-white focus:outline-hidden w-64"
          />
        </div>
      </motion.div>

      {/* 2. Top 4 KPI Comparison Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Porting Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Porting &amp; Voice MRR
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(portingRevenue.totalPortingMrr)}
              <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {portingRevenue.propertiesCount} Ported Properties • {portingRevenue.servicesCount} Voice Lines
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ {portingRevenue.billingDoneCount} Billing Done
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              • {portingRevenue.billingPendingCount} Pending
            </span>
          </div>
        </div>

        {/* Card 2: Data Circuit Vendor Rev Share */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vendor Circuit Rev Share
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(dataCircuitRevenue.receivedRevShare)}
              <span className="text-xs font-normal text-slate-400 ml-1">received</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Expected: {formatCurrency(dataCircuitRevenue.totalExpectedRevShare)}/mo
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-[11px]">
            <span className="text-slate-600 dark:text-slate-300 font-semibold">
              {dataCircuitRevenue.receivedCount} Paid Circuits
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Pending: {formatCurrency(dataCircuitRevenue.pendingRevShare)}
            </span>
          </div>
        </div>

        {/* Card 3: Total Combined Monthly Inflow */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Total Inflow ({selectedMonth})
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">
              {formatCurrency(summary.totalCombinedInflow)}
            </div>
            <p className="text-[11px] text-blue-200 mt-1">
              Porting MRR + Confirmed Circuit Payouts
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200">
            <span>Annualized Run Rate:</span>
            <span className="font-bold text-white">{formatCurrency(summary.annualizedInflow)}</span>
          </div>
        </div>

        {/* Card 4: Revenue Stream Mix */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Stream Contribution Mix
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between text-xs font-bold">
              <span className="text-blue-600 dark:text-blue-400">{summary.portingPercentage}% Porting</span>
              <span className="text-emerald-600 dark:text-emerald-400">{summary.circuitPercentage}% Circuits</span>
            </div>
            {/* Dual color progress bar */}
            <div className="w-full bg-slate-100 dark:bg-[#1f212c] h-3 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${summary.portingPercentage}%` }}
                className="bg-blue-600 h-full transition-all duration-300"
                title={`Porting & Voice: ${summary.portingPercentage}%`}
              />
              <div
                style={{ width: `${summary.circuitPercentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Circuit Commission: ${summary.circuitPercentage}%`}
              />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-[11px] text-slate-500">
            <span>Primary Driver:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {summary.portingPercentage >= 50 ? 'Porting / Voice' : 'Circuit Rev Share'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. Visual Charts & Leaderboards */}
      <RevenueStreamsCharts data={data} />

      {/* 4. Detailed Breakdown Table */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs"
      >
        <div className="p-4 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Itemized Revenue Stream Ledger ({filteredRows.length} entries)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Active for period: <strong>{selectedMonth}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] uppercase tracking-wider text-black dark:text-white font-black text-[11px]">
                <th className="py-3 px-4">Property / Client</th>
                <th className="py-3 px-4">Stream Type</th>
                <th className="py-3 px-4">Provider / Services</th>
                <th className="py-3 px-4">Client Price</th>
                <th className="py-3 px-4">AAA Revenue</th>
                <th className="py-3 px-4">Commission / Split</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No entries match your search/filter criteria for this month.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{r.propertyName}</div>
                      {r.propertyAddress && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                          {r.propertyAddress}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {r.sourceType === 'PORTING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                          <PhoneCall className="w-3 h-3" /> Porting &amp; Voice
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          <Network className="w-3 h-3" /> Circuit Rev Share
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.providerOrType}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(r.clientBilledPrice)}
                        <span className="text-[10px] font-normal text-slate-400">/mo</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-black ${
                          r.sourceType === 'PORTING'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(r.aaaInflowAmount)}/mo
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-500 font-medium">{r.rateOrDetails}</span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          r.statusBadge.isGood
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        {r.statusBadge.isGood ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{r.statusBadge.label}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

