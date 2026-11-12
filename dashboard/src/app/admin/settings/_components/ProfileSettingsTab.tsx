'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { itemVariants } from './types';

interface ProfileSettingsTabProps {
  fullName: string;
  setFullName: (val: string) => void;
  email?: string;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  effectiveRole?: string | null;
  savingProfile: boolean;
  onSaveProfile: (e: React.FormEvent) => void;
}

export default function ProfileSettingsTab({
  fullName,
  setFullName,
  email,
  phoneNumber,
  setPhoneNumber,
  effectiveRole,
  savingProfile,
  onSaveProfile,
}: ProfileSettingsTabProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Profile</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Update your administrator contact information and identity.
        </p>
      </div>

      <form onSubmit={onSaveProfile} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 dark:text-slate-200 block">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Administrator Name"
            disabled={savingProfile}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 dark:text-slate-200 block">
            Email Address (Account Login)
          </label>
          <input
            type="email"
            value={email || ''}
            readOnly
            disabled
            className="w-full px-3 py-2 bg-slate-100 dark:bg-[#1c1d25] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-500 dark:text-slate-400 text-xs select-none"
          />
          <p className="text-[10.5px] text-slate-400">
            Registered Super Admin email address associated with Supabase Auth.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 dark:text-slate-200 block">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            disabled={savingProfile}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-900 dark:text-slate-200 block">
            System Access Tier
          </label>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Global Super Administrator
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Full CRUD privileges across all tenants, telecom services, porting orders, and audit logs.
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
              {effectiveRole || 'ADMIN'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={savingProfile}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Profile</span>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
