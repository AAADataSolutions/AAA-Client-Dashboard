'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import {
  ShieldCheck,
  Phone,
  DoorOpen,
  MapPin,
  Search,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function ClientRayBaumPropertyPage({
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Client Properties to identify name & address
      const propRes = await fetch('/api/client/properties');
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
      const recRes = await fetch(`/api/client/ray-baum?propertyId=${propertyId}`);
      const recJson = await recRes.json();
      if (recJson.success) {
        setRecords(recJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching Ray Baum data for client:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section (Strictly per spec: Header + Sub-header, No KPI cards) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#222430]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>E911 DISPATCH REGISTER — RAY BAUM &amp; KARY'S LAW</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ray Baum and Kary's Law — {property?.name || 'Property'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{propertyAddress}</span>
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181920] text-slate-600 dark:text-slate-300 transition cursor-pointer self-start sm:self-auto"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>
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
            Total Dispatch Records: <strong className="text-slate-900 dark:text-white">{records.length}</strong>
          </span>
        </div>

        {/* Read-Only Table View */}
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5 whitespace-nowrap">PHONE NO.</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">ASSIGNED TO ROOM</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">LOCATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        <span>Loading dispatchable locations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-600 dark:text-slate-400">
                          No dispatch records registered for this property.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Contact your system administrator to register room-level dispatch extensions.
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
