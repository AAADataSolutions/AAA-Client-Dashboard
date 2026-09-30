'use client';

import React, { useState, useEffect } from 'react';
import {
  Hotel,
  Search,
  MapPin,
  Phone,
  DollarSign,
  Percent,
  TrendingUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface PartnerProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  main_phone?: string | null;
  monthly_price: number | null;
  status: string;
  effective_commission_rate: number;
  monthly_commission: number;
}

export default function PartnerPropertiesPage() {
  const [properties, setProperties] = useState<PartnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const res = await fetch('/api/partner/properties');
        const json = await res.json();
        if (json.success) {
          setProperties(json.data || []);
        }
      } catch (err) {
        console.error('Failed to load partner properties:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  const filtered = properties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMonthlyCommission = filtered
    .reduce((sum, p) => sum + (p.monthly_commission || 0), 0);

  const totalMonthlyGross = filtered
    .reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);

  const activeCount = filtered.filter((p) => p.status === 'ACTIVE' || p.status === 'ONBOARDED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Hotel className="w-6 h-6 text-blue-600" /> Assigned Properties &amp; Commission
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Properties affiliated with your partner account and itemized revenue shares.
          </p>
        </div>
      </div>

      {/* 3 KPI Cards — BLUE VARIANT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Affiliated Properties */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              AFFILIATED PROPERTIES
            </span>
            <Hotel className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {filtered.length}
            </span>
            <span className="text-xs font-semibold text-blue-200">
              {activeCount > 0 ? `${activeCount} Active` : `${filtered.length} Active`}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Properties linked to your partner account
          </p>
        </div>

        {/* Card 2: Total Monthly Gross */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL MONTHLY GROSS
            </span>
            <DollarSign className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${totalMonthlyGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Combined monthly recurring client billing
          </p>
        </div>

        {/* Card 3: Your Monthly Commission */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[130px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              YOUR MONTHLY COMMISSION
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-300" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
              ${totalMonthlyCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Estimated monthly commission payout
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search assigned properties by name, city, state, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">PROPERTY</th>
                <th className="py-3.5 px-4">MAIN PHONE</th>
                <th className="py-3.5 px-4">MONTHLY PRICE</th>
                <th className="py-3.5 px-4">COMMISSION RATE</th>
                <th className="py-3.5 px-4">YOUR MONTHLY SHARE</th>
                <th className="py-3.5 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading assigned properties...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No properties currently assigned to your partner account.
                  </td>
                </tr>
              ) : (
                filtered.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                    {/* Property with Address underneath */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block">
                        {prop.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>
                          {prop.city
                            ? `${prop.address ? prop.address + ', ' : ''}${prop.city}, ${prop.state} ${prop.zip_code || ''}`
                            : (prop.address || '—')}
                        </span>
                      </div>
                    </td>

                    {/* Main Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {prop.main_phone || '—'}
                    </td>

                    {/* Monthly Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                      {prop.monthly_price !== null && prop.monthly_price !== undefined
                        ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>

                    {/* Commission Rate */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                      {prop.effective_commission_rate}%
                    </td>

                    {/* Monthly Share */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      ${prop.monthly_commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {prop.status === 'ACTIVE' || prop.status === 'ONBOARDED' || prop.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {prop.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
