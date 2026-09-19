'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import {
  DollarSign,
  ShieldAlert,
  Loader2,
  Lock,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function AdminFinancesPage() {
  const router = useRouter();
  const { profile, effectiveRole, loading } = useAuth();

  const isSuperAdmin =
    effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';

  // Strict route protection: immediately redirect unauthorized users
  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [loading, isSuperAdmin, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-[#71717a] font-medium">
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Access Denied guard (if not Super Admin)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#71717a] max-w-sm mt-1 mb-5">
          This section requires Super Admin privileges. You are being redirected to the main dashboard.
        </p>
        <button
          onClick={() => router.replace('/admin')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition cursor-pointer"
        >
          Return to Admin Overview
        </button>
      </div>
    );
  }

  // Super Admin view
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Finances
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" />
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Financial operations, revenue analytics, ledger, and billing streams.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Centered Empty State Section */}
      <motion.div
        variants={itemVariants}
        className="min-h-[420px] rounded-2xl border border-dashed border-slate-300 dark:border-[#27272a] bg-white/40 dark:bg-[#15161c]/40 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1f2029] text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-[#2a2c3a] shadow-inner mb-4">
          <Wallet className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Finances
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#71717a] max-w-md mt-1.5 leading-relaxed">
          No financial data to display right now. Financial telemetry and billing details will appear here.
        </p>
      </motion.div>
    </motion.div>
  );
}
