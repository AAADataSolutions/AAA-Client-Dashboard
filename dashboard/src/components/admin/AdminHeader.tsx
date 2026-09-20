'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  RefreshCw,
  ChevronDown,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  FileClock,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme/theme-context';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenSidebar, isSidebarOpen }) => {
  const { profile, effectiveRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Administrator';
  const userEmail = profile?.email || 'admin@aaasolutions.com';
  const initial = userName.charAt(0).toUpperCase();
  const roleLabel = effectiveRole === 'SUPER_ADMIN' ? 'Superuser / Admin' : 'Sub-super Admin';

  return (
    <header className="h-15 bg-white dark:bg-[#111217] border-b border-[#e2e8f0] dark:border-[#1f2128] px-5 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, voice lines, DIDs, or tickets..."
            className="w-full bg-[#f8f9fa] dark:bg-[#16171d] border border-slate-200 dark:border-[#232530] focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-9 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-[#20222a] px-1.5 py-0.2 rounded border border-slate-200 dark:border-[#2c2e3a] font-medium">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Theme Switcher, Refresh & User Profile Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
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
          title="Refresh Operational State"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Notification Bell */}
        <NotificationBell isAdmin={true} />

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-[#232530] text-left hover:opacity-90 transition-opacity cursor-pointer"
            aria-label="Admin user menu"
          >
            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1">
                <span className="truncate max-w-[130px]">{userName}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    showUserMenu ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                {roleLabel}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div onClick={() => setShowUserMenu(false)} className="fixed inset-0 z-40" />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                {/* User Info Header */}
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 shrink-0">
                      {effectiveRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{userEmail}</p>
                </div>

                {/* Navigation Actions */}
                <Link
                  href="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-500" />
                  <span>System Settings</span>
                </Link>

                <Link
                  href="/admin/audit-logs"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileClock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Audit Logs</span>
                </Link>

                <div className="border-t border-slate-100 dark:border-[#222430] my-0.5" />

                {/* Sign Out Action */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

