'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  RefreshCw,
  ChevronDown,
  LogOut,
  X,
  Sun,
  Moon,
  User,
  ShieldCheck,
  LifeBuoy,
  Copy,
  Check,
  Building2,
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

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  const userName = profile?.full_name || profile?.email?.split('@')[0] || 'Member';
  const initial = userName.charAt(0).toUpperCase();
  const isClientAdmin = effectiveRole === 'ADMIN';
  const orgName = orgMembership?.organization?.name || 'My Organization';
  const orgId = orgMembership?.organization_id || orgMembership?.organization?.id;

  const handleCopyOrgId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedOrgId(true);
    setTimeout(() => setCopiedOrgId(false), 2000);
  };

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

      {/* Right: Org ID Pill, Theme Switcher, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Organization ID Display & 1-Click Copy */}
        {orgId && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161822] border border-slate-200 dark:border-[#232536] text-xs">
            <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="flex items-center gap-1 text-[11.5px] font-mono">
              <span className="hidden md:inline text-slate-500 dark:text-slate-400 font-sans">Org ID:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {orgId.length > 8 ? `${orgId.substring(0, 8)}...` : orgId}
              </span>
            </div>
            <button
              onClick={handleCopyOrgId}
              className={`p-1 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                copiedOrgId
                  ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#202330]'
              }`}
              title="Copy Organization ID to share with team"
              aria-label="Copy Organization ID"
            >
              {copiedOrgId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[10px] font-sans font-medium text-emerald-500 hidden lg:inline">Copied!</span>
                </>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}

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
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-[#222430]">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{userName}</p>
                  <p className="text-[10.5px] text-slate-400 truncate">{orgName}</p>
                  {orgId && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-[#222430]/60 flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400 font-mono truncate max-w-[140px]">ID: {orgId}</span>
                      <button
                        onClick={handleCopyOrgId}
                        className="text-blue-500 hover:text-blue-400 flex items-center gap-0.5 cursor-pointer font-medium"
                        title="Copy Org ID"
                      >
                        {copiedOrgId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedOrgId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
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
                  className="w-full px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
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
