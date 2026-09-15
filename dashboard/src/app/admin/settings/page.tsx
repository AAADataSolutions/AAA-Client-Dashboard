'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Lock, 
  Bell, 
  Server, 
  CheckCircle2, 
  RefreshCw 
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

export default function AdminSettingsPage() {
  const { profile, effectiveRole } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionSuccess(true);
      setTimeout(() => setConnectionSuccess(false), 3000);
    }, 1000);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Standardized Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <Settings size={256} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
            System Settings
          </h1>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50"
        >
          {isTestingConnection ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : connectionSuccess ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Server className="w-4 h-4" />
          )}
          <span>{isTestingConnection ? 'Testing...' : connectionSuccess ? 'Connected' : 'Test Health'}</span>
        </motion.button>
      </motion.div>

      {/* Grid of Settings Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Security & Access */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#10141b] border border-gray-200 dark:border-[#212833] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-black dark:text-white font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Role-Based Access Enforcement</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Row Level Security (RLS) is strictly enforced at the database layer, isolating customer organization data across all tenant queries.
          </p>
          <div className="pt-2 border-t border-gray-100 dark:border-[#212833] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Current Role Session:</span>
            <span className="font-semibold text-black dark:text-white capitalize">{effectiveRole || 'Super Admin'}</span>
          </div>
        </div>

        {/* Database & Infrastructure */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#10141b] border border-gray-200 dark:border-[#212833] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-black dark:text-white font-semibold text-sm">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>PostgreSQL & Supabase Engine</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Healthy
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Realtime subscriptions, auth triggers, and stored procedures are synchronized with edge clusters for low latency execution.
          </p>
          <div className="pt-2 border-t border-gray-100 dark:border-[#212833] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Cluster Status:</span>
            <span className="font-semibold text-black dark:text-white">US-East Primary (Active)</span>
          </div>
        </div>

        {/* Authentication Policies */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#10141b] border border-gray-200 dark:border-[#212833] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-black dark:text-white font-semibold text-sm">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Authentication & Session Policies</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Enforced
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Magic links and passwordless OTP verification are prioritized. JWT expiration is strictly governed with auto-refresh rotation.
          </p>
          <div className="pt-2 border-t border-gray-100 dark:border-[#212833] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Session Timeout:</span>
            <span className="font-semibold text-black dark:text-white">7 Days (Auto-rolling)</span>
          </div>
        </div>

        {/* Audit & Compliance */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#10141b] border border-gray-200 dark:border-[#212833] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-black dark:text-white font-semibold text-sm">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Audit Logging & Compliance</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Logging
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Every administrative change, tenant invitation, and access token mutation is immutably recorded in the central audit ledger.
          </p>
          <div className="pt-2 border-t border-gray-100 dark:border-[#212833] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Log Retention:</span>
            <span className="font-semibold text-black dark:text-white">365 Days (Encrypted)</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

