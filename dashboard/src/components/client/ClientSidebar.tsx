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
  Flame,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface ClientSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Properties', href: '/dashboard/properties', icon: Hotel },
  {
    label: 'Services',
    icon: PhoneCall,
    children: [
      { label: 'Services and Lines', href: '/dashboard/services', icon: PhoneCall },
      { label: 'Firelines', href: '/dashboard/firelines', icon: Flame },
      { label: 'Elevator Lines', href: '/dashboard/elevator-lines', icon: ArrowUpDown },
    ],
  },
  { label: "E911 Compliance", href: '/dashboard/e911', icon: ShieldCheck },
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

  const [servicesExpanded, setServicesExpanded] = React.useState(true);

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
          {/* Organization Logo (above brand header, if uploaded) */}
          {orgMembership?.organization?.logo_url && (
            <div className={`px-4 pt-3 pb-2 border-b border-[#27272a] flex items-center ${isOpen ? 'justify-start' : 'justify-center'} bg-[#161619]`}>
              <img
                src={orgMembership.organization.logo_url}
                alt={orgName}
                className="max-h-9 max-w-full object-contain rounded"
              />
            </div>
          )}

          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Radio className="w-4 h-4 text-white" />
              </div>
              {isOpen && (
                <div className="truncate">
                  <span className="font-semibold text-[13px] text-[#f4f4f5] tracking-tight block leading-tight truncate">
                    AAA Data Solutions
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-blue-400 block leading-none mt-0.5">
                    Client Portal
                  </span>
                </div>
              )}
            </Link>

            {/* Close Button for Mobile */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] lg:hidden cursor-pointer"
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
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
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

              // If item has nested sub-routes
              if (item.children) {
                const isGroupActive = item.children.some(
                  (c) => pathname === c.href || pathname.startsWith(c.href)
                );

                return (
                  <div key={item.label} className="space-y-1">
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => setServicesExpanded(!servicesExpanded)}
                        className={`w-full group flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                          isGroupActive
                            ? 'bg-[#27272a]/70 text-white'
                            : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isGroupActive ? 'text-blue-400' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#71717a] transition-transform duration-200 ${
                            servicesExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.children[0].href}
                        title={item.label}
                        className={`group flex items-center justify-center px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                          isGroupActive
                            ? 'bg-[#27272a] text-white shadow-xs'
                            : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isGroupActive ? 'text-blue-400' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                          }`}
                        />
                      </Link>
                    )}

                    {isOpen && servicesExpanded && (
                      <div className="pl-4 ml-3 border-l border-[#2e2e34] space-y-1 my-1">
                        {item.children.map((subItem) => {
                          const isSubActive =
                            pathname === subItem.href || pathname.startsWith(subItem.href);
                          const SubIcon = subItem.icon || PhoneCall;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                              }}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                isSubActive
                                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                  : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                              }`}
                            >
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-white' : 'text-[#71717a]'
                                }`}
                              />
                              <span className="truncate">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Match root `/dashboard` exactly, or subroutes starting with href
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : item.href
                  ? pathname.startsWith(item.href)
                  : false;

              return (
                <Link
                  key={item.href || item.label}
                  href={item.href || '#'}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  title={!isOpen ? item.label : undefined}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#27272a] text-white shadow-xs'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                      }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
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
