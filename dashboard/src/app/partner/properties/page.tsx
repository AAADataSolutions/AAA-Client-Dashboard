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
    .filter((p) => p.status === 'ACTIVE')
    .reduce((sum, p) => sum + p.monthly_commission, 0);

  const totalMonthlyGross = filtered
    .filter((p) => p.status === 'ACTIVE')
    .reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Hotel className="w-6 h-6 text-blue-600" /> Assigned Properties & Commission
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Properties affiliated with your partner account and itemized revenue shares.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Affiliated Properties</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{filtered.length}</span>
            <span className="text-xs text-slate-400 font-semibold">{filtered.filter((p) => p.status === 'ACTIVE').length} Active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Monthly Gross</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ${totalMonthlyGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Monthly Commission</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${totalMonthlyCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                        prop.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                      }`}>
                        {prop.status}
                      </span>
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
