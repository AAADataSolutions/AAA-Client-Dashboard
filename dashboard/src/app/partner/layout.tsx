'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Hotel,
  FileText,
  LogOut,
  Sparkles,
  ExternalLink,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  const navLinks = [
    { label: 'Overview', href: '/partner', icon: LayoutDashboard },
    { label: 'Properties & Share', href: '/partner/properties', icon: Hotel },
    { label: 'Invoices & Payouts', href: '/partner/invoices', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1015] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#15161c]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#222430]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Partner Badge */}
          <div className="flex items-center gap-4">
            <Link href="/partner" className="flex items-center gap-3">
              <img src="/logo.png" alt="AAA Data Solutions" className="h-8" />
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight block leading-tight">
                  AAA Data Solutions
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block leading-none">
                  Partner Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a1c24]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {profile?.full_name || 'Channel Partner'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                {profile?.email || 'partner@aaadatasolutions.com'}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-200/80 dark:border-[#222430] py-2 bg-slate-50/50 dark:bg-[#111217]/50">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 pb-12">{children}</main>
    </div>
  );
}
