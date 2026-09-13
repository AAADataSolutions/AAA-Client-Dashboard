'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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

  // Form inputs for new user password setup
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      try {
        setVerifying(true);
        setVerifyError(null);
        const res = await fetch(`/api/invitations/verify?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Invalid or expired invitation link.');
        }
        setInviteData(json.data);
      } catch (err: any) {
        console.error('Verify error:', err);
        setVerifyError(err.message || 'Failed to verify invitation.');
      } finally {
        setVerifying(false);
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

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
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to accept invitation.');
      }

      setSuccess(true);

      // If user was created with password, sign in automatically
      if (!user && password && inviteData?.email) {
        try {
          await supabase.auth.signInWithPassword({
            email: inviteData.email,
            password: password,
          });
        } catch (signInErr) {
          console.warn('Auto sign-in error:', signInErr);
        }
      }

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Error processing activation');
      setSubmitting(false);
    }
  };

  if (verifying || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-xs font-semibold text-slate-300">Verifying secure invitation token...</p>
        </div>
      </div>
    );
  }

  if (verifyError || !inviteData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Invitation Invalid or Expired</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {verifyError || 'This invitation link is no longer valid or has expired. Please contact your administrator to request a new invitation.'}
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const orgName = inviteData.organization?.name || 'AAA Data Solutions Client';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[600px] h-[600px] bg-orange-600/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#11141b] border border-[#222834] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#222834]">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Admin Onboarding &amp; Activation
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white mt-1">
              Join {orgName}
            </h1>
          </div>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Account Activated Successfully!</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                You are now registered as the administrator for <strong className="text-white">{orgName}</strong>. Redirecting to your client dashboard...
              </p>
            </div>
            <div className="pt-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Invited Organization & Role Info */}
            <div className="p-3.5 rounded-xl bg-[#171b24] border border-[#222834] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Organization:</span>
                <span className="font-bold text-white text-xs">{orgName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Assigned Role:</span>
                <span className="font-semibold text-orange-400 uppercase text-[11px]">
                  {inviteData.target_org_role || 'ADMIN'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Invited Email:</span>
                <span className="font-mono text-slate-300">{inviteData.email}</span>
              </div>
            </div>

            {user ? (
              <div className="space-y-4 pt-2">
                <p className="text-xs text-slate-400">
                  You are currently logged in as <strong className="text-white">{user.email}</strong>. Click below to accept the invitation and link your account.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Access...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept &amp; Access Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Alex Smith"
                      className="w-full pl-9 pr-3 py-2 bg-[#171b24] border border-[#2a3140] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Set Your Password <span className="text-slate-400 font-normal">(Min 6 chars)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full pl-9 pr-9 py-2 bg-[#171b24] border border-[#2a3140] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2 bg-[#171b24] border border-[#2a3140] rounded-lg text-white placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 text-xs"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  By activating, you agree to the AAA Data Solutions platform terms and operational guidelines.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 mt-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account &amp; Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate Account &amp; Join</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
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
