'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // After user signup, route directly to onboarding to set up organization
      if (data?.session) {
        router.push('/onboarding');
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
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-500/25">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[#181c22]">Check your email</h3>
          <p className="text-[14px] text-[#64748b] max-w-sm mx-auto leading-relaxed">
            We sent a verification link to <strong className="text-[#181c22]">{email}</strong>. Please confirm your email to activate your account and proceed to Organization setup.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="h-10 px-6 rounded-lg bg-[#1275e2] hover:bg-[#005cb8] text-white font-medium text-sm transition-colors shadow-2xs"
        >
          Proceed to Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-[#181c22]">
          Create your account
        </h2>
        <p className="text-[14px] text-[#64748b]">
          Get started with AAA Data Solutions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-[13px] text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="block text-[12.5px] font-semibold text-[#181c22]">
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jordan Blake"
            autoComplete="name"
            required
            className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white focus:ring-2 focus:ring-[#1275e2]/15 rounded-lg px-3.5 py-2.5 text-[13.5px] text-[#181c22] placeholder-[#94a3b8] outline-none transition-all"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-[12.5px] font-semibold text-[#181c22]">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white focus:ring-2 focus:ring-[#1275e2]/15 rounded-lg px-3.5 py-2.5 text-[13.5px] text-[#181c22] placeholder-[#94a3b8] outline-none transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-[12.5px] font-semibold text-[#181c22]">
            Password
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
              className="w-full bg-[#f8f9fa] border border-[#e2e8f0] focus:border-[#1275e2] focus:bg-white focus:ring-2 focus:ring-[#1275e2]/15 rounded-lg px-3.5 py-2.5 pr-11 text-[13.5px] text-[#181c22] placeholder-[#94a3b8] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-[#94a3b8] hover:text-[#181c22] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Role Selector */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-[12.5px] font-semibold text-[#181c22]">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#f1f3fc] p-1 rounded-lg border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-[#1275e2] shadow-xs'
                  : 'text-[#64748b] hover:text-[#181c22]'
              }`}
            >
              Admin (Create Organization)
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('USER')}
              className={`py-2 text-xs font-semibold rounded-md transition-all ${
                selectedRole === 'USER'
                  ? 'bg-white text-[#1275e2] shadow-xs'
                  : 'text-[#64748b] hover:text-[#181c22]'
              }`}
            >
              User (Join Organization)
            </button>
          </div>
          <p className="text-[11px] text-[#64748b]">
            Admins will proceed directly to create and register their company profile.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 rounded-lg bg-[#1275e2] hover:bg-[#005cb8] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Continue to Organization Setup'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="mt-6 text-center text-[13px] text-[#64748b]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-[#1275e2] hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
