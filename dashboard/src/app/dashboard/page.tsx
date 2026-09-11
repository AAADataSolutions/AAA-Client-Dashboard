'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import {
  ShieldCheck,
  Building2,
  PhoneCall,
  FileCheck2,
  Users,
  LogOut,
  Sparkles,
  Server,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

function DashboardContent() {
  const { user, profile, orgMembership, effectiveRole, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-[#8d97a8]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#4c7cf3] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading workspace...</span>
        </div>
      </div>
    );
  }

  const isClientAdmin = effectiveRole === 'ADMIN';

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#e8ecf2] flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#212833] bg-[#10141b]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#4c7cf3]/15 text-[#6e96f8] flex items-center justify-center border border-[#4c7cf3]/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#e8ecf2]">AAA Data Solutions</span>
              <span className="text-xs px-2 py-0.5 rounded bg-[#151b24] text-[#8d97a8] border border-[#212833]">
                Client Workspace
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#151b24] border border-[#212833]">
            <span
              className={`w-2 h-2 rounded-full ${
                isClientAdmin ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-medium text-[#8d97a8]">
              Role: <strong className="text-[#e8ecf2]">{effectiveRole || 'USER'}</strong>
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#10141b] via-[#151b24] to-[#10141b] border border-[#212833] relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#4c7cf3]/10 text-[#6e96f8] text-xs font-medium border border-[#4c7cf3]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 3 &amp; 4: Active Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e8ecf2]">
              Welcome back, {profile?.full_name || 'Client'}
            </h1>
            <p className="text-sm text-[#8d97a8] leading-relaxed">
              You are authenticated with <strong className="text-[#e8ecf2]">{effectiveRole}</strong> permissions under tenant client scope. Organization operations, services, onboarding, and E911 records are isolated to your organization.
            </p>
          </div>
        </div>

        {/* Operational Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] hover:border-[#2c3542] transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-[#4c7cf3]/10 text-[#6e96f8] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#8d97a8]">Organization</p>
              <h3 className="text-lg font-semibold text-[#e8ecf2] mt-0.5">
                {orgMembership?.organization?.name || 'Pending Onboarding'}
              </h3>
            </div>
            <p className="text-xs text-[#5b6472]">
              {isClientAdmin ? 'Admin settings & member control enabled' : 'Member view access'}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] hover:border-[#2c3542] transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#8d97a8]">Voice &amp; Lines</p>
              <h3 className="text-lg font-semibold text-[#e8ecf2] mt-0.5">Active</h3>
            </div>
            <p className="text-xs text-[#5b6472]">Managed services &amp; properties</p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] hover:border-[#2c3542] transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#8d97a8]">E911 Status</p>
              <h3 className="text-lg font-semibold text-[#e8ecf2] mt-0.5">Compliant</h3>
            </div>
            <p className="text-xs text-[#5b6472]">Verified emergency locations</p>
          </div>

          <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] hover:border-[#2c3542] transition-colors space-y-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#8d97a8]">Tenant Access</p>
              <h3 className="text-lg font-semibold text-[#e8ecf2] mt-0.5">
                {isClientAdmin ? 'Admin Rights' : 'Member Rights'}
              </h3>
            </div>
            <p className="text-xs text-[#5b6472]">Multi-tenant isolation active</p>
          </div>
        </div>

        {/* Role Privileges Card */}
        <div className="p-6 rounded-xl bg-[#10141b] border border-[#212833] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#6e96f8]" />
              <h3 className="font-semibold text-[15px] text-[#e8ecf2]">
                Your Role Privileges ({effectiveRole})
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Verified by RLS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-lg bg-[#151b24] border border-[#212833] space-y-1">
              <p className="text-xs font-medium text-[#e8ecf2]">View Organization Data</p>
              <p className="text-[11px] text-[#8d97a8]">Allowed for all verified members of the organization.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#151b24] border border-[#212833] space-y-1">
              <p className="text-xs font-medium text-[#e8ecf2]">Invite Team Members</p>
              <p className="text-[11px] text-[#8d97a8]">
                {isClientAdmin ? 'Allowed (Client Admin)' : 'Requires Client Admin role'}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#151b24] border border-[#212833] space-y-1">
              <p className="text-xs font-medium text-[#e8ecf2]">Internal AAA Admin Access</p>
              <p className="text-[11px] text-[#8d97a8]">Restricted to Super Admin &amp; Sub-Super Admin.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
