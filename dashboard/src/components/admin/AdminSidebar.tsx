'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Hotel,
  GitBranch,
  ShieldCheck,
  LifeBuoy,
  FileClock,
  Settings,
  UserPlus,
  Radio,
  BookOpen,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Properties', href: '/admin/properties', icon: Hotel, badge: '186' },
  { label: 'Services & Lines', href: '/admin/services', icon: PhoneCall, badge: '1,842' },
  { label: 'Onboarding & Porting', href: '/admin/onboarding-porting', icon: GitBranch },
  { label: 'E911 Compliance', href: '/admin/e911', icon: ShieldCheck, statusDot: 'bg-[#facc15]' },
  { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy, badge: '14', badgeColor: 'bg-[#f43f5e] text-white' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileClock },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const pathname = usePathname();
  const { signOut } = useAuth();

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
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Radio className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="truncate">
                  <span className="font-semibold text-[13px] text-[#f4f4f5] tracking-tight block leading-tight truncate">
                    AAA Data Solutions
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#71717a] block leading-none mt-0.5">
                    Telecommunications
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

          {/* Nav List */}
          <nav className="p-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

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
                        isActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                      }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                      )}
                      {item.statusDot && !isActive && (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.statusDot}`} />
                      )}
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                            item.badgeColor || 'bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Telemetry Box & Footer (visible when open) */}
        {isOpen ? (
          <div className="p-3 space-y-2.5 border-t border-[#27272a] bg-[#161618] shrink-0">
            {/* SIP/DID CORE MESH Telemetry Card */}
            <div className="p-3 rounded-lg bg-[#222226] border border-[#2c2c32] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#a1a1aa]">
                  SIP / DID Core Mesh
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/25">
                  100% Operational
                </span>
              </div>
              <p className="text-[10.5px] text-[#71717a] leading-tight">
                Multi-region gateway sync: Active across US-East, US-West &amp; EU-Central.
              </p>
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#2a2a2f]">
                <span className="text-[#71717a] font-mono">Latency: 18ms</span>
                <span className="text-[#a1a1aa] hover:text-white flex items-center gap-0.5 cursor-pointer">
                  Status Page <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {/* Quick Footer Links */}
            <div className="flex items-center justify-between px-1 text-[11px] text-[#71717a] pt-1">
              <button className="flex items-center gap-1.5 hover:text-[#f4f4f5] transition-colors">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Knowledge Base</span>
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 hover:text-rose-400 transition-colors"
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
