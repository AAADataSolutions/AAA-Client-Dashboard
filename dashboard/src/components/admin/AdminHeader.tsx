'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme/theme-context';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenSidebar, isSidebarOpen }) => {
  const { profile, effectiveRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const userName = profile?.full_name || 'Jason Smith';
  const initial = userName.charAt(0).toUpperCase();

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

      {/* Right: Theme Switcher, Notifications & User Profile */}
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

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-[#232530]">
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#272935] text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-[#353847]">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight flex items-center gap-1">
              <span>{userName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {effectiveRole === 'SUPER_ADMIN' ? 'Superuser / Admin' : 'Sub-super Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
