'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Mail, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPassword,
}) => {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError(signInErr.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch user profile and partner record to route properly
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const { data: partnerRec } = await supabase
          .from('partners')
          .select('id')
          .or(`user_id.eq.${data.user.id},email.ilike.${data.user.email?.toLowerCase()}`)
          .maybeSingle();

        const isInternal =
          profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';
        const isPartner =
          profile?.role === 'PARTNER' || Boolean(partnerRec);

        if (isInternal) {
          router.push('/admin');
        } else if (isPartner) {
          router.push('/partner');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto bg-white rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-2xl border border-white/40 text-slate-900">
      {/* 1. Center-Aligned Brand Logo */}
      <div className="flex justify-center items-center mb-6">
        <img
          src="/logo.png"
          alt="AAA Data Solutions Logo"
          className="h-30 w-auto object-contain"
        />
      </div>

      {/* 2. Header */}
      <div className="space-y-1 mb-6 text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Log in
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Welcome back! Please enter your details.
        </p>
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span className="leading-snug font-medium">{error}</span>
        </div>
      )}

      {/* 4. Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
              className="w-full bg-white text-slate-900 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm placeholder-slate-400 outline-none transition-all shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full bg-white text-slate-900 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm placeholder-slate-400 outline-none transition-all shadow-2xs font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex items-center justify-start text-xs pt-0.5">
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Primary Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pt-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="mt-8 text-center text-[11px] text-slate-400 font-normal">
        <span>&copy; 2026 AAA Data Solutions - All rights reserved.</span>
      </div>
    </div>
  );
};
