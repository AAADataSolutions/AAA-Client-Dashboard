'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Building2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin }) => {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (selectedRole === 'USER' && !organizationId.trim()) {
      setError('Please enter the Organization ID to join.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            initial_org_role: selectedRole,
            role: 'CLIENT_USER',
            target_org_id: selectedRole === 'USER' ? organizationId.trim() : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // If user session is immediate (or email auto-confirmed)
      if (data?.session) {
        if (selectedRole === 'USER' && organizationId.trim()) {
          try {
            const joinRes = await fetch('/api/organizations/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ organization_id: organizationId.trim() }),
            });
            const joinJson = await joinRes.json();
            if (!joinRes.ok || !joinJson.success) {
              console.warn('Join organization warning:', joinJson.error);
            }
          } catch (e) {
            console.warn('Could not auto-join organization:', e);
          }
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
        router.refresh();
      } else if (data?.user) {
        setNeedsEmailConfirmation(true);
        setLoading(false);
      }
    } catch {
      setError('An error occurred during account creation. Please try again.');
      setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <div className="w-full space-y-6 text-center py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Check your email</h3>
          <p className="text-[14px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            We sent a verification link to <strong className="text-white font-semibold">{email}</strong>. Please confirm your email to activate your account and access your workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
        >
          Proceed to Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 3D Glassmorphic Logo Component */}
      <div className="flex justify-center mb-6">
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-white/15 via-white/5 to-white/0 border border-white/20 p-3 shadow-2xl shadow-blue-500/20 backdrop-blur-md flex items-center justify-center group transform transition duration-300 hover:scale-105">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#1275e2]/30 to-indigo-500/0 opacity-60 pointer-events-none" />
          <img
            src="/logo.png"
            alt="AAA Data Solutions Logo"
            className="w-full h-full object-contain relative z-10 drop-shadow-md"
          />
        </div>
      </div>

      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Create your account
        </h2>
        <p className="text-[14px] text-slate-400">
          Get started with AAA Data Solutions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-[13px] text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-[13px] font-semibold text-white">
            I want to <span className="text-blue-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#131720] p-1.5 rounded-xl border border-[#232936]">
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('USER')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'USER'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Join Organization</span>
            </button>
          </div>
        </div>

        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="block text-[13px] font-semibold text-white">
            Full name <span className="text-blue-400">*</span>
          </label>
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jordan Blake"
            autoComplete="name"
            required
            className="w-full bg-[#131720] border border-[#232936] focus:border-[#1275e2] focus:ring-2 focus:ring-[#1275e2]/25 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-[13px] font-semibold text-white">
            Email address <span className="text-blue-400">*</span>
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="w-full bg-[#131720] border border-[#232936] focus:border-[#1275e2] focus:ring-2 focus:ring-[#1275e2]/25 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-[13px] font-semibold text-white">
            Password <span className="text-blue-400">*</span>
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              className="w-full bg-[#131720] border border-[#232936] focus:border-[#1275e2] focus:ring-2 focus:ring-[#1275e2]/25 rounded-xl px-3.5 py-2.5 pr-11 text-[14px] text-white placeholder-slate-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Join Organization: Organization ID Field */}
        {selectedRole === 'USER' && (
          <div className="space-y-1.5 p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 animate-in fade-in duration-200">
            <label htmlFor="signup-org-id" className="block text-[13px] font-semibold text-white">
              Organization ID <span className="text-blue-400">*</span>
            </label>
            <input
              id="signup-org-id"
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              required
              className="w-full bg-[#131720] border border-blue-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 rounded-xl px-3.5 py-2.5 text-[13px] text-white font-mono placeholder-slate-500 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 leading-snug mt-1">
              Ask your team administrator for their Organization ID from their dashboard top navbar.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{selectedRole === 'USER' ? 'Joining Organization...' : 'Creating account...'}</span>
            </>
          ) : (
            selectedRole === 'USER' ? 'Join Organization & Continue' : 'Continue to Organization Setup'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="mt-6 text-center text-[13px] text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
