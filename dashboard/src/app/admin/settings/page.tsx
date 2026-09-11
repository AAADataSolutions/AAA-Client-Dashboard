'use client';

import React from 'react';
import { Settings, ShieldCheck, Database, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminSettingsPage() {
  const { profile, effectiveRole } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">System Settings</h1>
          <p className="text-sm text-[#8d97a8]">
            Configure platform security parameters, database connections, and operational policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
          <div className="flex items-center gap-2 text-[#6e96f8] font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Role-Based Access Enforcement</span>
          </div>
          <p className="text-xs text-[#8d97a8]">
            Row Level Security (RLS) is currently active and guarding multi-tenant isolation.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Database className="w-4 h-4" />
            <span>Supabase PostgreSQL Engine</span>
          </div>
          <p className="text-xs text-[#8d97a8]">
            Connected directly via Supabase Auth and Database functions.
          </p>
        </div>
      </div>
    </div>
  );
}
