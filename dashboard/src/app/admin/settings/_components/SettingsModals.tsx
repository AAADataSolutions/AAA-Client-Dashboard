'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  UserPlus,
  Trash2,
  Check,
  Copy,
  Loader2,
  X,
  Info,
} from 'lucide-react';

interface SettingsModalsProps {
  showInviteModal: boolean;
  generatedLink: string | null;
  emailStatus: 'SENT' | 'SKIPPED' | 'FAILED' | null;
  lastInvitedEmail: string;
  copied: boolean;
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteRole: 'ADMIN' | 'USER';
  setInviteRole: (val: 'ADMIN' | 'USER') => void;
  sendingInvite: boolean;
  handleCloseInviteModal: () => void;
  handleCopyGeneratedLink: () => void;
  handleResetForAnother: () => void;
  handleSendInvite: (e: React.FormEvent) => void;
  deleteTargetMember: any | null;
  setDeleteTargetMember: (member: any | null) => void;
  deletingMember: boolean;
  handleDeleteMember: () => void;
}

export function SettingsModals({
  showInviteModal,
  generatedLink,
  emailStatus,
  lastInvitedEmail,
  copied,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  sendingInvite,
  handleCloseInviteModal,
  handleCopyGeneratedLink,
  handleResetForAnother,
  handleSendInvite,
  deleteTargetMember,
  setDeleteTargetMember,
  deletingMember,
  handleDeleteMember,
}: SettingsModalsProps) {
  return (
    <AnimatePresence>
      {showInviteModal && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {generatedLink ? (
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                )}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {generatedLink ? 'Invitation Link Ready' : 'Invite Administrator'}
                </h3>
              </div>
              <button
                onClick={handleCloseInviteModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {generatedLink ? (
              <div className="space-y-4 text-xs">
                {emailStatus === 'SENT' ? (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Invitation Email Dispatched!</p>
                      <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                        An automated invitation email has been delivered to <strong>{lastInvitedEmail}</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Invitation Generated for {lastInvitedEmail}</p>
                      <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                        Copy the link below and share it directly via Slack, Teams, WhatsApp or Email.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                    Direct Invitation Link (Valid for 7 Days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-mono text-[11px] select-all outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCopyGeneratedLink}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetForAnother}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer"
                  >
                    + Invite Another Member
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@aaasolutions.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                    Access Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    <option value="ADMIN">Admin (Full System Permissions)</option>
                    <option value="USER">Staff / Operational Support</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseInviteModal}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Invitation</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetMember && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Remove Administrator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to remove{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    {deleteTargetMember.full_name || deleteTargetMember.email}
                  </strong>
                  ? This user will be permanently deleted from the profiles table and their administrative access will be revoked.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{deleteTargetMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {(deleteTargetMember.role || '').toLowerCase().replace(/[-_]/g, '') === 'superadmin' ? 'Super Admin' : 'Sub-Super Admin'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deletingMember}
                onClick={() => setDeleteTargetMember(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingMember}
                onClick={handleDeleteMember}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm transition"
              >
                {deletingMember ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove User</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

