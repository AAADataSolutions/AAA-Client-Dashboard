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
  ArrowLeftRight,
  DollarSign,
  Flame,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface AdminSidebarProps {
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
  statusDot?: string;
  badgeColor?: string;
  superAdminOnly?: boolean;
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizations', href: '/admin/organizations', icon: Building2 },
  { label: 'Properties', href: '/admin/properties', icon: Hotel },
  {
    label: 'Services',
    icon: PhoneCall,
    children: [
      { label: 'Services and Lines', href: '/admin/services', icon: PhoneCall },
      { label: 'Firelines', href: '/admin/firelines', icon: Flame },
      { label: 'Elevator Lines', href: '/admin/elevator-lines', icon: ArrowUpDown },
    ],
  },
  { label: 'Onboarding', href: '/admin/onboarding-porting', icon: GitBranch },
  { label: 'Porting', href: '/admin/porting', icon: ArrowLeftRight },
  { label: "E911 Compliance", href: '/admin/e911', icon: ShieldCheck, statusDot: 'bg-[#facc15]' },
  { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy, badgeColor: 'bg-[#f43f5e] text-white' },
  { label: 'Finances', href: '/admin/finances', icon: DollarSign, superAdminOnly: true },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileClock },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const pathname = usePathname();
  const { signOut, effectiveRole, profile } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const visibleNavItems = navItems.filter((item) => !item.superAdminOnly || isSuperAdmin);

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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#1c1c1f] border-r border-[#27272a] flex flex-col justify-between transition-all duration-300 ease-in-out ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
          }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden cursor-pointer">
              
              <img src="/logo.png" alt="" className='h-8' />
              
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
              className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f5] lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="p-2.5 space-y-1">
            {visibleNavItems.map((item) => {
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
                            isGroupActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                          }`}
                        />
                      </Link>
                    )}

                    {isOpen && servicesExpanded && (
                      <div className="pl-4 ml-3 border-l border-[#2e2e34] space-y-1 my-1">
                        {item.children.map((subItem) => {
                          const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href);
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

              const isActive = item.href ? pathname === item.href : false;

              return (
                <Link
                  key={item.href || item.label}
                  href={item.href || '#'}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  title={!isOpen ? item.label : undefined}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${isActive
                      ? 'bg-[#27272a] text-white shadow-xs'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#222226]'
                    }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                        }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {item.statusDot && !isActive && (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.statusDot}`} />
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
            {/* Quick Footer Links */}
            <div className="flex items-center justify-between px-1 text-[11px] text-[#71717a] pt-1">
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 hover:text-rose-400 transition-colors cursor-pointer"
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
              className="p-2 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-[#222226] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
