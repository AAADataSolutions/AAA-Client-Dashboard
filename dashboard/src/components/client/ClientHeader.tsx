'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  RefreshCw,
  ChevronDown,
  LogOut,
  X,
  Sun,
  Moon,
  User,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme/theme-context';

interface ClientHeaderProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ onOpenSidebar, isSidebarOpen }) => {
  const router = useRouter();
  const { profile, effectiveRole, orgMembership, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Member';
  const initial = userName.charAt(0).toUpperCase();
  const isClientAdmin = effectiveRole === 'ADMIN';
  const orgName = orgMembership?.organization?.name || 'My Organization';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/dashboard/properties?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="h-15 bg-white dark:bg-[#111217] border-b border-[#e2e8f0] dark:border-[#1f2128] px-5 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, voice lines, DIDs, or tickets..."
            className="w-full bg-[#f8f9fa] dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] focus:border-blue-600 focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-9 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

      {/* Right: Theme Switcher, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Toggle (Sun / Moon) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-200" />
          )}
        </button>

        {/* Sync / Refresh */}
        <button
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
          title="Refresh Operations"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
            title="Operational Alerts"
            aria-label="Open notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
          </button>

          {showNotifications && (
            <>
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40"
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#232530] rounded-xl shadow-xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-75">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Operational Alerts
                  </span>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="p-2.5 bg-slate-50 dark:bg-[#1c1d25] rounded-lg border border-slate-200/80 dark:border-[#252733] flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-200 block font-semibold">
                        E911 Dispatch Verification
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Please review emergency civic addresses across your properties.
                      </p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-[#1c1d25] rounded-lg border border-slate-200/80 dark:border-[#252733] flex items-start gap-2">
                    <LifeBuoy className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-slate-900 dark:text-slate-200 block font-semibold">
                        Support Desk Live
                      </strong>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Our engineering support team is online to assist with any line queries.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-[#222430] text-center">
                  <Link
                    href="/dashboard/tickets"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11.5px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-block cursor-pointer"
                  >
                    View support portal &rarr;
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-[#232530] text-left hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1">
                <span className="truncate max-w-[120px]">{userName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-[120px]">
                {isClientAdmin ? 'Client Admin' : 'Client Member'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div onClick={() => setShowUserMenu(false)} className="fixed inset-0 z-40" />
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#222430]">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                  <p className="text-[10.5px] text-slate-400 truncate">{orgName}</p>
                </div>

                <Link
                  href="/dashboard/account"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" /> Account &amp; Team
                </Link>

                <div className="border-t border-slate-100 dark:border-[#222430] my-0.5"></div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
