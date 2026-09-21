'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Building2,
  Lock,
  User,
  Mail,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';

function InviteAcceptContent({ token }: { token: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [verifying, setVerifying] = useState(true);
  const [inviteData, setInviteData] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form inputs for new user account setup
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verifyToken = async () => {
    try {
      setVerifying(true);
      setVerifyError(null);
      const res = await fetch(`/api/invitations/verify?token=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invalid or expired invitation link.');
      }
      setInviteData(json.data);
      if (json.data?.email) {
        setEmail(json.data.email);
      }
      if (json.data?.contact_name) {
        setFullName(json.data.contact_name);
      }
    } catch (err: any) {
      console.error('Verify error:', err);
      setVerifyError(err.message || 'Failed to verify invitation.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const targetEmail = (email || inviteData?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    // If user is not logged in, require password
    if (!user) {
      if (!password || password.length < 6) {
        setSubmitError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setSubmitError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawToken: token,
          password: password || undefined,
          fullName: fullName.trim() || undefined,
          email: targetEmail,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to accept invitation.');
      }

      setSuccess(true);

      // Sign in automatically with the chosen email and password
      if (password && targetEmail) {
        try {
          await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password,
          });
        } catch (signInErr) {
          console.warn('Auto sign-in error:', signInErr);
        }
      }

      const isInternal = json.type === 'INTERNAL_TEAM' || json.role === 'SUB_SUPER_ADMIN' || json.role === 'SUPER_ADMIN' || inviteData?.invite_type === 'INTERNAL_TEAM';
      const targetDestination = json.redirectTo || (isInternal ? '/admin' : '/dashboard');

      setTimeout(() => {
        window.location.href = targetDestination;
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Error activating account access');
      setSubmitting(false);
    }
  };

  if (verifying || authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-semibold text-slate-300">Verifying secure invitation token...</p>
        </div>
      </div>
    );
  }

  if (verifyError || !inviteData) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col justify-center items-center p-4 font-sans">
        <div className="w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invitation Invalid or Expired</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {verifyError || 'This invitation link is no longer valid or has expired. Please verify the URL or contact your platform administrator to request a new invitation.'}
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              onClick={verifyToken}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Verification</span>
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="w-full py-2.5 border border-slate-200 dark:border-[#2a2c3a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isInternal = inviteData.invite_type === 'INTERNAL_TEAM' || inviteData.target_app_role === 'SUB_SUPER_ADMIN' || inviteData.target_app_role === 'SUPER_ADMIN';
  const orgName = isInternal ? 'AAA Solutions Platform' : (inviteData.organization?.name || 'AAA Data Solutions Client');
  const displayRole = isInternal
    ? (inviteData.target_app_role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub-Super Admin')
    : (inviteData.target_org_role || 'ORGANIZATION ADMIN');

  return (
    <div className="min-h-screen bg-[#0d0e12] text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222834] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-[#222834]">
          <div className="w-10 h-10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            {isInternal ? (
              <ShieldCheck size={36} className="w-full h-full object-contain text-blue-500" />
            ) : (
              <Building2 size={36} className="w-full h-full object-contain" />
            )}
          </div>
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {isInternal ? 'System Administrator Invitation' : 'Client Organization Onboarding'}
            </span>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              {isInternal ? 'Join AAA Solutions Admin Team' : `Join ${orgName}`}
            </h1>
          </div>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Created Successfully!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isInternal ? (
                  <>
                    You are now registered as a <strong className="text-slate-900 dark:text-white">{displayRole}</strong>. Entering Admin Portal...
                  </>
                ) : (
                  <>
                    You are now registered as the administrator for <strong className="text-slate-900 dark:text-white">{orgName}</strong>. Entering your organization workspace...
                  </>
                )}
              </p>
            </div>
            <div className="pt-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-500 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Invited Organization & Role Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c26] border border-slate-200/80 dark:border-[#222834] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isInternal ? 'Scope:' : 'Organization:'}</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{orgName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px]">
                  {displayRole}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Invited Email:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{inviteData.email}</span>
              </div>
            </div>

            {user ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You are currently logged in as <strong className="text-slate-900 dark:text-white">{user.email}</strong>. Click below to accept the invitation and activate your {displayRole} access.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Access...</span>
                    </>
                  ) : (
                    <>
                      <span>{isInternal ? 'Accept & Enter Admin Portal' : 'Accept & Access Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Alex Johnson"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#2a3140] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Login Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#2a3140] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Set Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Set Login Password <span className="text-slate-400 font-normal">(Min 6 chars)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure login password"
                      className="w-full pl-9 pr-9 py-2 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#2a3140] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter login password"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#181c26] border border-slate-200 dark:border-[#2a3140] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  {isInternal
                    ? 'By clicking below, your Sub-Super Administrator account will be registered and you will be redirected to the Admin Portal.'
                    : 'By clicking below, your organization admin account will be created and you will be logged into your workspace.'}
                </p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isInternal ? 'Creating Admin Account...' : 'Creating Account & Entering Workspace...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isInternal ? 'Accept Invite & Enter Admin Portal' : 'Accept Invite & Enter Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  return (
    <AuthProvider>
      <InviteAcceptContent token={resolvedParams.token} />
    </AuthProvider>
  );
}

