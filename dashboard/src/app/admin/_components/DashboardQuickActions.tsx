'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Layers, RefreshCw } from 'lucide-react';
import { itemVariants } from './types';

interface DashboardQuickActionsProps {
  isSuperAdmin: boolean;
  loading: boolean;
  onRefresh: () => void;
}

export default function DashboardQuickActions({
  isSuperAdmin,
  loading,
  onRefresh,
}: DashboardQuickActionsProps) {
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#222430]"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Super Admin Executive Overview
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#1c1e27] text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>
    </motion.div>
  );
}
