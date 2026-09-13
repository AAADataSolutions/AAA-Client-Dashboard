'use client';

import React, { useState } from 'react';
import { X, UserPlus, Loader2, AlertCircle, Copy, Check, Link2, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from './ClientToast';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { orgMembership } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [targetOrgRole, setTargetOrgRole] = useState<'ADMIN' | 'USER'>('USER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setGeneratedInviteLink(null);

    try {
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          invite_type: 'CLIENT_MEMBER',
          organization_id: orgMembership?.organization_id,
          target_org_role: targetOrgRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invitation.');
      }

      setGeneratedInviteLink(data.inviteUrl);
      setEmail('');
      toast.success('Invitation link generated successfully.');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invitation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    toast.success('Invitation link copied to clipboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invite Team Member</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add an administrator or member to your organization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Invite Link Banner */}
        {generatedInviteLink ? (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-xs">
              <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Invitation Link Ready</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Share this secure link with your team member. It will allow them to join your organization directly.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-[#111217] border border-indigo-200 dark:border-indigo-900/60 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 font-mono select-all outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shrink-0 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/30 flex justify-end">
              <button
                type="button"
                onClick={() => setGeneratedInviteLink(null)}
                className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Invite Another Member &rarr;
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateInvite} className="space-y-4 text-xs">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Member Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@yourcompany.com"
                disabled={submitting}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Role Radio Group */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Assigned Role
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => setTargetOrgRole('USER')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    targetOrgRole === 'USER'
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#181920]'
                  }`}
                >
                  <div className="font-semibold text-xs">Client Member</div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    View properties, services, and raise support tickets.
                  </p>
                </div>

                <div
                  onClick={() => setTargetOrgRole('ADMIN')}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    targetOrgRole === 'ADMIN'
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-500 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#181920]'
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-500" /> Client Admin
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Full management, member invitations, and porting orders.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1e27] font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Link...</span>
                  </>
                ) : (
                  <span>Generate Invite Link</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
