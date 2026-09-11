'use client';

import React, { useState, useEffect } from 'react';
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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
              Internal AAA Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#181c22] mt-1">
            Team &amp; Invitations
          </h1>
          <p className="text-xs text-[#64748b]">
            Invite Sub-super Admins and manage the Super Admin approval lifecycle.
          </p>
        </div>
      </div>

      {/* Invite Generator Card */}
      <div className="p-5 rounded-xl bg-white border border-[#e2e8f0] shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1275e2]/10 text-[#1275e2] flex items-center justify-center border border-[#1275e2]/20">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#181c22]">Generate Sub-super Admin Invitation Link</h2>
            <p className="text-[11px] text-[#64748b]">
              Invited internal members accept the secure link and enter the Super Admin approval queue.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
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
            className="flex-1 bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white rounded-lg px-3.5 py-2 text-xs text-[#181c22] placeholder-[#94a3b8] outline-none"
          />
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as 'SUB_SUPER_ADMIN')}
            className="bg-[#f8f9fa] border border-[#e2e8f0] rounded-lg px-3.5 py-2 text-xs text-[#181c22] outline-none font-semibold"
          >
            <option value="SUB_SUPER_ADMIN">Sub-super Admin</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#1275e2] hover:bg-[#005cb8] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Generate Link</span>
          </button>
        </form>

        {generatedLink && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Invitation Link Ready
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
            <p className="text-[11px] font-mono text-[#181c22] break-all select-all bg-white p-2 rounded border border-emerald-200">
              {generatedLink}
            </p>
          </div>
        )}
      </div>

      {/* Invitations Table */}
      <div className="rounded-xl bg-white border border-[#e2e8f0] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Invitations &amp; Approval Queue</h2>
          <span className="text-xs text-[#64748b]">{invitations.length} total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#64748b] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Loading records...</span>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-[#64748b] text-xs">
            No invitations created yet. Generate one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#64748b]">
              <thead className="bg-[#f8f9fa] text-[#94a3b8] uppercase font-bold text-[10px] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type / Target Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3fc]">
                {invitations.map((inv) => {
                  const isAccepted = inv.status === 'ACCEPTED';
                  const isPending = inv.status === 'PENDING';

                  return (
                    <tr key={inv.id} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#181c22]">{inv.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#f1f3fc] text-[#465f88] border border-[#e2e8f0] font-medium text-[10.5px]">
                          {inv.target_app_role || inv.target_org_role || inv.invite_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[10.5px] ${
                            inv.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'ACCEPTED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : inv.status === 'PENDING'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(inv.id, 'REJECT')}
                              disabled={actionLoading === inv.id}
                              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors shadow-2xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {isPending && (
                          <button
                            onClick={() => handleReview(inv.id, 'REVOKE')}
                            disabled={actionLoading === inv.id}
                            className="px-2.5 py-1 rounded bg-[#f1f3fc] hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#181c22] text-[11px] font-medium transition-colors border border-[#e2e8f0]"
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
      </div>
    </div>
  );
}
