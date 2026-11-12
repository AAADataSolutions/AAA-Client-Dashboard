'use client';

import React from 'react';
import { DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';

interface VendorsKpisProps {
  metrics: {
    totalPaid: number;
    totalEarned: number;
    netProfit: number;
    activeVendorsCount: number;
    totalDevicesInstalled?: number;
  };
  formatCurrency: (val: number) => string;
}

export function VendorsKpis({ metrics, formatCurrency }: VendorsKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Paid to Vendors */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Paid to Vendors / Month</span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-amber-300">{formatCurrency(metrics.totalPaid)}</span>
        </div>
        <p className="text-[11px] text-blue-200 mt-1">Across {metrics.activeVendorsCount} active vendors</p>
      </div>

      {/* Earned from Vendors */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Earned from Vendors / Month</span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-white">{formatCurrency(metrics.totalEarned)}</span>
        </div>
        <p className="text-[11px] text-blue-200 mt-1">Billed to clients through vendor services</p>
      </div>

      {/* Net Vendor Profit */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#2b2a7a] text-white border border-blue-700/50 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Net Vendor Profit</span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20 backdrop-blur-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <span className={`text-2xl font-black ${metrics.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {formatCurrency(metrics.netProfit)}
          </span>
        </div>
        <p className="text-[11px] text-blue-200 mt-1">Earned − paid across all services</p>
      </div>
    </div>
  );
}
