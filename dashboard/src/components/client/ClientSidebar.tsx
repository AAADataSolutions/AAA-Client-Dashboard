'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Hotel,
  PhoneCall,
  ShieldCheck,
  GitBranch,
  LifeBuoy,
  Users,
  Radio,
  LogOut,
  X,
  ArrowRight,
  Sparkles,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface ClientSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/dashboard/properties', icon: Hotel },
  { label: 'Services & Lines', href: '/dashboard/services', icon: PhoneCall },
  { label: 'E911 Compliance', href: '/dashboard/e911', icon: ShieldCheck },
  { label: 'Onboarding Tracker', href: '/dashboard/onboarding', icon: GitBranch },
  { label: 'Porting Tracker', href: '/dashboard/porting', icon: ArrowLeftRight },
  { label: 'Support Tickets', href: '/dashboard/tickets', icon: LifeBuoy },
  { label: 'Account & Team', href: '/dashboard/account', icon: Users },
];

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { profile, orgMembership, effectiveRole, signOut } = useAuth();

  const orgName = orgMembership?.organization?.name || 'My Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#1c1c1f] border-r border-[#27272a] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Radio className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="truncate">
                  <span className="font-semibold text-[13px] text-[#f4f4f5] tracking-tight block leading-tight truncate">
                    AAA Data Solutions
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400 block leading-none mt-0.5">
                    Client Portal
                  </span>
                </div>
              )}
            </Link>

            {/* Close Button for Mobile */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Tenant Card (when open) */}
          {isOpen && (
            <div className="mx-3 mt-3 p-2.5 rounded-xl bg-[#242429] border border-[#2e2e36] flex items-center justify-between gap-2">
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-semibold text-white truncate block">
                    {orgName}
                  </span>
                </div>
                <span className="text-[10px] text-[#a1a1aa] block pl-3">
                  {isClientAdmin ? 'Admin Access' : 'Member Access'}
                </span>
              </div>
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isClientAdmin
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                }`}
              >
                {isClientAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
          )}

          {/* Nav List */}
          <nav className="p-2.5 space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Match root `/dashboard` exactly, or subroutes starting with href
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  title={!isOpen ? item.label : undefined}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#27272a] text-white shadow-xs'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                      }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Telemetry Box & Footer (visible when open) */}
        {isOpen ? (
          <div className="p-3 space-y-2.5 border-t border-[#27272a] bg-[#161618] shrink-0">
            {/* Telecom Network Health */}
            <div className="p-3 rounded-lg bg-[#222226] border border-[#2c2c32] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#a1a1aa] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" /> Network Status
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                  Live &amp; Healthy
                </span>
              </div>
              <p className="text-[10.5px] text-[#71717a] leading-tight">
                All voice gateways and emergency PSAP routes operating normally.
              </p>
            </div>

            {/* Quick Footer Links */}
            <div className="flex items-center justify-between px-1 text-[11px] text-[#71717a] pt-1">
              <span className="text-[10.5px] text-[#71717a] truncate max-w-[130px]">
                {profile?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#27272a] bg-[#161618] flex flex-col items-center gap-3 shrink-0">
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-[#222226] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
