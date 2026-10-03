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
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

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
  { label: 'Porting', href: '/dashboard/porting', icon: ArrowLeftRight },
  { label: 'Support Tickets', href: '/dashboard/tickets', icon: LifeBuoy },
  { label: 'Account & Team', href: '/dashboard/account', icon: Users },
];

export const ClientSidebar: React.FC<ClientSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { profile, orgMembership, effectiveRole, signOut } = useAuth();

  const orgName = orgMembership?.organization?.name || 'My Organization';
  const isClientAdmin = effectiveRole === 'ADMIN';

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
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#070c1e] border-r border-[#131f42] text-white flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#131f42] flex items-center justify-between shrink-0">
            <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden cursor-pointer">
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
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Tenant Card (when open) */}
          {isOpen && (
            <div className="mx-3 mt-3 p-2.5 rounded-xl bg-[#050918] border border-[#131f42] flex items-center justify-between gap-2 shadow-xs">
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[11px] font-bold text-white truncate block">
                    {orgName}
                  </span>
                </div>
                <span className="text-[10px] text-[#8fa3ca] block pl-3">
                  {isClientAdmin ? 'Admin Access' : 'Member Access'}
                </span>
              </div>
              <span
                className="text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-white/10 text-white border border-white/20"
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
                        className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                          isGroupActive
                            ? 'bg-gradient-to-r from-[#1c367d] via-[#172b68] to-[#12204d] text-white font-semibold shadow-xs border border-white/5'
                            : 'text-[#8fa3ca] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isGroupActive ? 'text-white' : 'text-[#8fa3ca] group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            isGroupActive ? 'text-white' : 'text-[#8fa3ca] group-hover:text-white'
                          } transition-transform duration-200 ${
                            servicesExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.children[0].href}
                        title={item.label}
                        className={`group flex items-center justify-center px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                          isGroupActive
                            ? 'bg-gradient-to-r from-[#1c367d] via-[#172b68] to-[#12204d] text-white shadow-xs border border-white/5'
                            : 'text-[#8fa3ca] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isGroupActive ? 'text-white' : 'text-[#8fa3ca] group-hover:text-white'
                          }`}
                        />
                      </Link>
                    )}

                    {isOpen && servicesExpanded && (
                      <div className="pl-4 ml-3 border-l border-[#18274f] space-y-1 my-1">
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
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-[#1c367d] to-[#12204d] text-white font-semibold shadow-xs'
                                  : 'text-[#8fa3ca] hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <SubIcon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSubActive ? 'text-white' : 'text-[#8fa3ca]'
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
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#1c367d] via-[#172b68] to-[#12204d] text-white font-semibold shadow-xs border border-white/5'
                      : 'text-[#8fa3ca] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-[#8fa3ca] group-hover:text-white'
                      }`}
                    />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </div>

                  {isOpen && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_rgba(56,189,248,0.8)] shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Telemetry Box & Footer (visible when open) */}
        {isOpen ? (
          <div className="p-3 space-y-2.5 border-t border-[#131f42] bg-[#050918] shrink-0">
            {/* Quick Footer Links */}
            <div className="flex items-center justify-between px-1 text-[11px] text-[#8fa3ca] pt-1">
              <span className="text-[10.5px] text-[#8fa3ca] truncate max-w-[130px]">
                {profile?.email}
              </span>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-1.5 text-[#8fa3ca] hover:text-rose-300 hover:bg-white/5 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#131f42] bg-[#050918] flex flex-col items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              title="Sign Out"
              className="p-2 rounded-lg text-[#8fa3ca] hover:text-rose-300 hover:bg-white/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Confirmation Ask Modal for Client Sidebar Logout */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isLoggingOut}
        portalName="Client Dashboard"
      />
    </>
  );
};
