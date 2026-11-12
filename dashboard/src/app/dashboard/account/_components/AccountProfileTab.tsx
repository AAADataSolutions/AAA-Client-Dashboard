'use client';

import React from 'react';
import {
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Loader2,
  Upload,
  Building2,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

interface AccountProfileTabProps {
  itemVariants: Variants;
  handleSaveProfile: (e: React.FormEvent) => void;
  fullName: string;
  setFullName: (val: string) => void;
  savingProfile: boolean;
  profile: any;
  handleCopyText: (text: string, id: string, label: string) => void;
  copiedId: string | null;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  isClientAdmin: boolean;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadLogo: (file: File) => void;
  currentLogoUrl: string | null;
  orgName: string;
  uploadingLogo: boolean;
  removingLogo: boolean;
  handleRemoveLogo: () => void;
}

export function AccountProfileTab({
  itemVariants,
  handleSaveProfile,
  fullName,
  setFullName,
  savingProfile,
  profile,
  handleCopyText,
  copiedId,
  phoneNumber,
  setPhoneNumber,
  isClientAdmin,
  logoInputRef,
  handleUploadLogo,
  currentLogoUrl,
  orgName,
  uploadingLogo,
  removingLogo,
  handleRemoveLogo,
}: AccountProfileTabProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Profile</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Update your contact details and communication identity.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={savingProfile}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Email Address (Account Login)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-[#1c1d25] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-500 dark:text-slate-400 text-xs select-none"
              />
              {profile?.email && (
                <button
                  type="button"
                  onClick={() => handleCopyText(profile.email, 'my-email', 'email')}
                  className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Copy email"
                >
                  {copiedId === 'my-email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-[10.5px] text-slate-400">
              To change your registered email, please contact AAA Support.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              disabled={savingProfile}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 block">
              Organization Role
            </label>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {isClientAdmin ? 'Client Administrator' : 'Client Member'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isClientAdmin
                    ? 'Full organization management & member invitations.'
                    : 'Operational property & support tickets access.'}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                {isClientAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex justify-end">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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

      {/* Organization Branding & Logo Card */}
      <motion.div variants={itemVariants} className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization Branding</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload your organization logo to appear in the client top navbar and sidebar. Max 2MB (PNG, JPG, SVG, WebP).
          </p>
        </div>

        <input
          type="file"
          ref={logoInputRef}
          accept="image/jpeg,image/png,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadLogo(file);
          }}
        />

        {currentLogoUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg bg-white dark:bg-[#12131a] border border-slate-200 dark:border-[#222430] p-2 flex items-center justify-center overflow-hidden shadow-xs">
                <img
                  src={currentLogoUrl}
                  alt={orgName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <span className="font-semibold text-xs text-slate-900 dark:text-white block">{orgName} Logo</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Displayed on Navigation Bar
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={uploadingLogo || removingLogo}
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Change Logo</span>
              </button>
              <button
                type="button"
                disabled={uploadingLogo || removingLogo}
                onClick={handleRemoveLogo}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {removingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Remove</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !uploadingLogo && logoInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleUploadLogo(file);
            }}
            className="border-2 border-dashed border-slate-200 dark:border-[#2a2c3a] hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-[#181920]/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2">
              {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {uploadingLogo ? 'Uploading logo...' : 'Upload your organization logo'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Drag and drop or click to browse. Supported: JPG, PNG, SVG, WebP (max 2MB)
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
