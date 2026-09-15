'use client';

import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  UserPlus,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

interface InvitationItem {
  id: string;
  email: string;
  invite_type: 'INTERNAL_TEAM' | 'CLIENT_MEMBER';
  target_app_role?: string;
  target_org_role?: string;
  status: 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
  created_at: string;
  expires_at: string;
  token_hash: string;
}

export default function AdminInvitationsPage() {
  const { effectiveRole } = useAuth();
  const supabase = createClient();

  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';

  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'SUB_SUPER_ADMIN'>('SUB_SUPER_ADMIN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchErr && data) {
        setInvitations(data as InvitationItem[]);
      }
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmitting(true);
    setError(null);
    setGeneratedLink(null);

    try {
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          invite_type: 'INTERNAL_TEAM',
          target_app_role: targetRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invitation.');
      }

      setGeneratedLink(data.inviteUrl);
      setInviteEmail('');
      await fetchInvitations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating invite';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (invitationId: string, action: 'APPROVE' | 'REJECT' | 'REVOKE') => {
    setActionLoading(invitationId);
    try {
      const res = await fetch('/api/invitations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review invitation.');
      }

      await fetchInvitations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
          <UserPlus size={256} className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
          Team &amp; Invitations
        </h1>
      </motion.div>

      {/* Invite Generator Card */}
      <motion.div variants={itemVariants} className="p-5 rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Generate Sub-super Admin Invitation Link</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Invited internal members accept the secure link and enter the Super Admin approval queue.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateInvite} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="team.member@company.com"
            required
            className="flex-1 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1a1b22] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as 'SUB_SUPER_ADMIN')}
            className="bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none font-semibold cursor-pointer focus:border-blue-500"
          >
            <option value="SUB_SUPER_ADMIN" className="dark:bg-[#15161c]">Sub-super Admin</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Generate Link</span>
          </motion.button>
        </form>

        {generatedLink && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Invitation Link Ready
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-900 dark:text-white break-all select-all bg-white dark:bg-[#15161c] p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              {generatedLink}
            </p>
          </div>
        )}
      </motion.div>

      {/* Invitations Table */}
      <motion.div variants={itemVariants} className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Invitations &amp; Approval Queue</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{invitations.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            No invitations created yet. Generate one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#222430]">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type / Target Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {invitations.map((inv) => {
                  const isAccepted = inv.status === 'ACCEPTED';
                  const isPending = inv.status === 'PENDING';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{inv.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-medium text-[10.5px]">
                          {inv.target_app_role || inv.target_org_role || inv.invite_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10.5px] ${
                            inv.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                              : inv.status === 'ACCEPTED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 animate-pulse'
                              : inv.status === 'PENDING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                          }`}
                        >
                          {inv.status === 'ACCEPTED' ? 'Approval Requested' : inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {isAccepted && isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleReview(inv.id, 'APPROVE')}
                              disabled={actionLoading === inv.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(inv.id, 'REJECT')}
                              disabled={actionLoading === inv.id}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleReview(inv.id, 'REVOKE')}
                            disabled={actionLoading === inv.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#20222a] dark:hover:bg-[#282a36] text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors border border-slate-200 dark:border-[#2e313e] cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
