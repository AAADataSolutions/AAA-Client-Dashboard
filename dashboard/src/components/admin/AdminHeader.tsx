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
import { LogoutConfirmModal } from '@/components/common/LogoutConfirmModal';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenSidebar, isSidebarOpen }) => {
  const { profile, effectiveRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Administrator';
  const userEmail = profile?.email || 'admin@aaasolutions.com';
  const initial = userName.charAt(0).toUpperCase();
  const roleLabel = effectiveRole === 'SUPER_ADMIN' ? 'Superuser / Admin' : 'Sub-super Admin';

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
    <header className="h-15 bg-white dark:bg-[#111217] border-b border-[#e2e8f0] dark:border-[#1f2128] px-5 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, organizations, tickets..."
            className="w-full bg-slate-50 dark:bg-[#17181f] border border-slate-200 dark:border-[#222430] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Theme, User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Notification Bell with Live Drawer */}
        <NotificationBell />

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1b22] border border-transparent hover:border-slate-200 dark:hover:border-[#222430] transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {initial}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                {roleLabel}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#16171e] border border-slate-200 dark:border-[#262835] rounded-xl shadow-xl py-1.5 z-40 text-xs font-sans text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#222430]">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Platform Settings</span>
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

                {/* Sign Out Action with Modal Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutModal(true);
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

      {/* Confirmation Ask Modal for Admin Logout */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmSignOut}
        isLoading={isLoggingOut}
        portalName="Admin Console"
      />
    </header>
  );
};
