'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';
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
  MapPin,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

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
  hideForSuperAdmin?: boolean;
  children?: SubNavItem[];
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Management Groups', href: '/admin/organizations', icon: Building2 },
  { label: 'Properties', href: '/admin/properties', icon: Hotel },
  {
    label: 'Services',
    icon: PhoneCall,
    hideForSuperAdmin: true,
    children: [
      { label: 'Services and Lines', href: '/admin/services', icon: PhoneCall },
      { label: 'Firelines', href: '/admin/firelines', icon: Flame },
      { label: 'Elevator Lines', href: '/admin/elevator-lines', icon: ArrowUpDown },
    ],
  },
  { label: 'Porting', href: '/admin/porting', icon: ArrowLeftRight, hideForSuperAdmin: true },
  { label: "E911 Compliance", href: '/admin/e911', icon: ShieldCheck, statusDot: 'bg-[#facc15]', hideForSuperAdmin: true },
  { label: 'Support Tickets', href: '/admin/tickets', icon: LifeBuoy, badgeColor: 'bg-[#f43f5e] text-white', hideForSuperAdmin: true },
  { label: 'Partners', href: '/admin/partners', icon: Users, superAdminOnly: true },
  { label: 'Finances', href: '/admin/finances', icon: DollarSign, superAdminOnly: true },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: FileClock, hideForSuperAdmin: true },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle, onClose }) => {
  const pathname = usePathname();
  const { signOut, effectiveRole, profile } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const visibleNavItems = navItems.filter((item) => {
    if (isSuperAdmin && item.hideForSuperAdmin) return false;
    if (!isSuperAdmin && item.superAdminOnly) return false;
    return true;
  });

  const [servicesExpanded, setServicesExpanded] = React.useState(true);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirmSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

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
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0f3496] border-r border-[#1740ab]/60 text-white flex flex-col justify-between transition-all duration-300 ease-in-out ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
          }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#1740ab]/60 flex items-center justify-between shrink-0">
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden cursor-pointer">
              <img src="/logo3.png" alt="AAA Data Solutions" className="h-8 object-contain" />
              {isOpen && (
                <div className="truncate">
                  <span className="font-bold text-[13px] text-white tracking-tight block leading-tight truncate">
                    AAA Data Solutions
                  </span>
                </div>
              )}
            </Link>

            {/* Close Button for Mobile */}
            <button
              onClick={onClose}
              className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
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
                            ? 'bg-white/20 text-white font-bold'
                            : 'text-white/90 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isGroupActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
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
                            ? 'bg-white/20 text-white shadow-xs'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isGroupActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                          }`}
                        />
                      </Link>
                    )}

                    {isOpen && servicesExpanded && (
                      <div className="pl-4 ml-3 border-l border-white/25 space-y-1 my-1">
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
                                  ? 'bg-white/25 text-white font-bold shadow-xs'
                                  : 'text-white/90 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-white' : 'text-white/80'
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
                      ? 'bg-white/20 text-white font-bold shadow-xs'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
          <div className="p-3 space-y-2.5 border-t border-[#1740ab]/60 bg-[#0b2774] shrink-0">
            {/* Quick Footer Links */}
            <div className="flex items-center justify-between px-1 text-[11px] text-white/80 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 text-white/90 hover:text-rose-300 hover:bg-white/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#1740ab]/60 bg-[#0b2774] flex flex-col items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out"
              className="p-2 rounded-lg text-white/80 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Confirmation Ask Modal for Admin Sidebar Logout */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isLoggingOut}
        portalName="Admin Console"
      />
    </>
  );
};
