'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, Filter, ArrowUpRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface OrgItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  status: string;
  created_at: string;
}

export default function AdminOrganizationsPage() {
  const supabase = createClient();
  const [organizations, setOrganizations] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadOrgs() {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setOrganizations(data as OrgItem[]);
      }
      setLoading(false);
    }
    loadOrgs();
  }, []);

  const filtered = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.city && o.city.toLowerCase().includes(search.toLowerCase())) ||
    (o.email && o.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">Organizations</h1>
          <p className="text-sm text-[#8d97a8]">
            Manage client tenant organizations, property counts, and active services.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white font-medium text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5b6472] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter organizations by name, location, email..."
            className="w-full bg-[#151b24] border border-[#212833] focus:border-[#4c7cf3] focus:ring-1 focus:ring-[#4c7cf3]/25 rounded-lg pl-9 pr-4 py-2 text-xs text-[#e8ecf2] placeholder-[#5b6472] outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl bg-[#10141b] border border-[#212833] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#8d97a8] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading organizations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#8d97a8] text-xs">
            No organizations matching the filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#8d97a8]">
              <thead className="bg-[#151b24] text-[#8d97a8] uppercase font-semibold text-[10.5px]">
                <tr>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212833]">
                {filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-[#151b24]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#e8ecf2]">{org.name}</td>
                    <td className="px-4 py-3">{org.email || org.phone || '—'}</td>
                    <td className="px-4 py-3">{org.city ? `${org.city}, ${org.state || ''}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(org.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
