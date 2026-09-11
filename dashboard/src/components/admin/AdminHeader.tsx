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
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onOpenSidebar, isSidebarOpen }) => {
  const { profile, effectiveRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const userName = profile?.full_name || 'Binoy';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header className="h-15 bg-white border-b border-[#e2e8f0] px-5 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Sidebar Toggle & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-[#64748b] hover:text-[#181c22] hover:bg-[#f1f3fc] transition-colors"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties, voice lines, DIDs, or tickets..."
            className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white focus:ring-1 focus:ring-[#1275e2]/15 rounded-lg pl-9 pr-9 py-1.5 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none transition-all"
          />
          <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#94a3b8] bg-[#ebedf7] px-1.5 py-0.2 rounded border border-[#cbd5e1] font-mono font-medium">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Sync/Refresh */}
        <button
          className="p-2 rounded-lg text-[#64748b] hover:text-[#181c22] hover:bg-[#f1f3fc] transition-colors"
          title="Refresh Operational State"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-[#64748b] hover:text-[#181c22] hover:bg-[#f1f3fc] transition-colors"
            title="Operational Alerts"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#c05900]" />
          </button>

          {showNotifications && (
            <>
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-40"
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                  <span className="font-semibold text-xs text-[#181c22]">Operational Triggers</span>
                  <button onClick={() => setShowNotifications(false)} className="text-[#94a3b8]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-[#64748b]">
                  <p className="p-2 bg-[#f8f9fa] rounded-lg border border-[#e2e8f0]">
                    <strong className="text-[#181c22] block">E911 Routing Mismatch</strong>
                    5 properties require civic address correction.
                  </p>
                  <p className="p-2 bg-[#f8f9fa] rounded-lg border border-[#e2e8f0]">
                    <strong className="text-[#181c22] block">FOC Confirmation</strong>
                    Batch #44 cutover scheduled for Sep 14.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#e2e8f0]">
          <div className="w-7 h-7 rounded-full bg-[#f5ebe0] text-[#78350f] font-bold text-xs flex items-center justify-center border border-[#e6ccb2]">
            {initial}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#181c22] leading-tight flex items-center gap-1">
              <span>{userName}</span>
              <ChevronDown className="w-3 h-3 text-[#94a3b8]" />
            </p>
            <p className="text-[10px] text-[#64748b] leading-tight">
              {effectiveRole === 'SUPER_ADMIN' ? 'Superuser / Admin' : 'Sub-super Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
