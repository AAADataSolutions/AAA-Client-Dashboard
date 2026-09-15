'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface InviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  onSuccess?: () => void;
}

export const InviteManagerModal: React.FC<InviteManagerModalProps> = ({
  isOpen,
  onClose,
  orgId,
  orgName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeInvite, setActiveInvite] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email input if generating fresh invite
  const [customEmail, setCustomEmail] = useState('');

  const fetchInvites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${orgId}/invitations`);
      const json = await res.json();
      if (json.success) {
        setActiveInvite(json.activeInvite || null);
        if (json.activeInvite?.email) {
          setCustomEmail(json.activeInvite.email);
        }
      }
    } catch (err: any) {
      console.error('Error loading invitations:', err);
      setError('Failed to load organization invitation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orgId) {
      fetchInvites();
    }
  }, [isOpen, orgId]);

  const handleCopy = () => {
    if (!activeInvite?.invite_url) return;
    navigator.clipboard.writeText(activeInvite.invite_url);
    setCopied(true);
    setSuccessMsg('Invite URL copied to clipboard.');
    setTimeout(() => {
      setCopied(false);
      setSuccessMsg(null);
    }, 2500);
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/organizations/${orgId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customEmail.trim() || undefined,
          role: 'ADMIN',
          revokePrevious: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to regenerate invitation');
      }

      setActiveInvite(json.data);
      setSuccessMsg('New 7-day invitation link generated successfully.');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error regenerating invite');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          />

          {/* Central Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2.5">
                  <div className="text-black dark:text-white flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Organization Invitation Link
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {orgName} • Admin Activation &amp; Portal Onboarding
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Feedback alerts */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-400">Retrieving invitation status...</span>
                </div>
              ) : activeInvite ? (
                <div className="space-y-4 text-xs">
                  {/* Status Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Invitation Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          activeInvite.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60'
                            : activeInvite.status === 'APPROVED' || activeInvite.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {activeInvite.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-[#222430]">
                      <span className="text-slate-400">Invited Recipient:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {activeInvite.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Expires On:</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(activeInvite.expires_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* URL Display with Copy */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Secure Invitation URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={activeInvite.invite_url || activeInvite.inviteUrl || ''}
                        className="flex-1 px-3 py-2 bg-slate-100 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 text-[11px] select-all"
                      />
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCopy}
                        className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy URL'}</span>
                      </motion.button>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      Send this link to the client admin. They will set their own password upon opening. No admin-managed password required.
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <a
                      href={activeInvite.invite_url || activeInvite.inviteUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-semibold cursor-pointer"
                    >
                      <span>Preview Invite Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold transition cursor-pointer text-xs disabled:opacity-50"
                    >
                      {regenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>Regenerate Link</span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#222430] text-center space-y-2">
                    <Mail className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="font-bold text-slate-800 dark:text-white">No active invitation found</h4>
                    <p className="text-slate-500 text-[11px] max-w-sm mx-auto">
                      Generate an onboarding invitation link for {orgName}. The recipient will receive an invite to set their own password.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Primary Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="admin@hotelchain.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs"
                    />
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRegenerate}
                    disabled={regenerating || !customEmail.trim()}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Invite...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Generate Onboarding Invitation</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
