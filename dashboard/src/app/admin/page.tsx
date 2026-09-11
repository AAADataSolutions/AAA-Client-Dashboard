'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  PhoneCall,
  FileCheck2,
  Users,
  LogOut,
  Activity,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';

function AdminContent() {
  const { user, profile, effectiveRole, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-[#8d97a8]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#4c7cf3] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading internal workspace...</span>
        </div>
      </div>
    );
  }

  const isInternal =
    effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SUB_SUPER_ADMIN';

  if (!isInternal) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#10141b] border border-red-500/30 rounded-2xl p-8 space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-[#e8ecf2]">Access Restricted</h2>
          <p className="text-sm text-[#8d97a8] leading-relaxed">
            The internal AAA Operations Admin workspace is reserved strictly for <strong className="text-[#e8ecf2]">Super Admin</strong> and <strong className="text-[#e8ecf2]">Sub-Super Admin</strong> accounts.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4c7cf3] text-white text-sm font-medium hover:bg-[#6e96f8] transition-colors"
            >
              Go to Client Dashboard
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#e8ecf2] flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#212833] bg-[#10141b]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4c7cf3]/20 text-[#6e96f8] flex items-center justify-center border border-[#4c7cf3]/40 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#e8ecf2]">AAA Data Solutions</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                Internal Admin Control
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#151b24] border border-[#212833]">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="text-xs font-medium text-[#8d97a8]">
              Role: <strong className="text-purple-300">{effectiveRole}</strong>
            </span>
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-[#e8ecf2]">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-[11px] text-[#8d97a8]">{user?.email}</p>
          </div>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8d97a8] hover:text-[#e8ecf2] bg-[#151b24] hover:bg-[#212833] border border-[#212833] rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#10141b] via-[#151b24] to-[#10141b] border border-[#212833] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 text-xs font-medium border border-purple-500/20">
              <Activity className="w-3.5 h-3.5" />
              <span>Phase 4 Internal Admin Shell</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e8ecf2]">
              AAA Data Solutions — Global Operations Hub
            </h1>
            <p className="text-sm text-[#8d97a8] leading-relaxed">
              Welcome, <strong className="text-[#e8ecf2]">{profile?.full_name || 'Admin'}</strong>. You have system-wide oversight across all client organizations, properties, porting pipelines, and E911 compliance registries.
            </p>
          </div>
        </div>

        {/* Global Operations KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8d97a8]">Organizations</span>
              <Building2 className="w-4 h-4 text-[#6e96f8]" />
            </div>
            <h3 className="text-2xl font-bold text-[#e8ecf2]">42</h3>
            <p className="text-xs text-emerald-400">↑ 4 new this month</p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8d97a8]">Properties</span>
              <PhoneCall className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-[#e8ecf2]">186</h3>
            <p className="text-xs text-[#8d97a8]">Across 12 regional clusters</p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8d97a8]">Active Porting</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-[#e8ecf2]">27</h3>
            <p className="text-xs text-amber-400">7 due this week</p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8d97a8]">E911 Status</span>
              <FileCheck2 className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-[#e8ecf2]">98.2%</h3>
            <p className="text-xs text-emerald-400">124 Verified</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  );
}
