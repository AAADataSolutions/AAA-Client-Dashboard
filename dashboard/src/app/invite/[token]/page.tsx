'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Building2, UserCheck, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { motion } from 'framer-motion';

function InviteAcceptContent({ token }: { token: string }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    type: 'INTERNAL_TEAM' | 'CLIENT_MEMBER';
    requiresApproval: boolean;
    message: string;
  } | null>(null);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/auth?redirectTo=/invite/${token}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawToken: token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation.');
      }

      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error accepting invitation';
      setError(msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-[#8d97a8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#4c7cf3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="absolute w-[500px] h-[500px] bg-[#4c7cf3]/5 rounded-full filter blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#10141b] border border-[#212833] rounded-2xl p-6 sm:p-10 shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex items-center gap-3 pb-5 border-b border-[#212833]">
          <div className="w-10 h-10 rounded-xl bg-[#4c7cf3]/15 text-[#6e96f8] flex items-center justify-center border border-[#4c7cf3]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#4c7cf3]/10 text-[#6e96f8] border border-[#4c7cf3]/25">
              Secure Invitation
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#e8ecf2] mt-0.5">
              AAA Data Solutions Invitation
            </h1>
          </div>
        </div>

        {result ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#e8ecf2]">
                {result.requiresApproval ? 'Request Submitted' : 'Invitation Accepted!'}
              </h2>
              <p className="text-sm text-[#8d97a8] leading-relaxed max-w-md mx-auto">
                {result.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(result.requiresApproval ? '/auth' : '/dashboard')}
              className="w-full h-11 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white font-medium text-sm transition-colors"
            >
              {result.requiresApproval ? 'Back to Login' : 'Enter Dashboard'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-[#8d97a8] leading-relaxed">
              You have been invited to collaborate on the AAA Data Solutions telecommunications and operations platform.
            </p>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-[13px] text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!user ? (
              <div className="p-4 rounded-xl bg-[#151b24] border border-[#212833] space-y-3 text-center">
                <p className="text-xs text-[#8d97a8]">
                  Please sign in or create an account to accept this invitation.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/auth?redirectTo=/invite/${token}`)}
                  className="w-full h-10 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white text-xs font-semibold uppercase tracking-wider transition-all"
                >
                  Sign in to Accept
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#151b24] border border-[#212833] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#4c7cf3]/20 text-[#6e96f8] flex items-center justify-center font-bold text-xs">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-[#8d97a8]">Accepting as</p>
                    <p className="text-sm font-medium text-[#e8ecf2]">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={submitting}
                  className="w-full h-11 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#4c7cf3]/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying &amp; Joining...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept &amp; Join Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
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
