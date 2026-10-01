'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(true);
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
        // Fetch user profile to direct to /admin or /dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        const isInternal =
          profile?.role === 'SUPER_ADMIN' || profile?.role === 'SUB_SUPER_ADMIN';

        router.push(isInternal ? '/admin' : '/dashboard');
        router.refresh();
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto text-slate-900 bg-white">
      {/* 1. Logo */}
      <div className="flex justify-center items-center sm:justify-start mb-8">
        <img
          src="/logo2.png"
          alt="AAA Data Solutions Logo"
          className="w-48 h-30"
        />
      </div>

      {/* 2. Header */}
      <div className="space-y-2 mb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Log in
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Welcome back! Please enter your details.
        </p>
      </div>

      {/* 3. Error Alert */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
          <span className="leading-snug font-medium">{error}</span>
        </div>
      )}

      {/* 4. Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
            className="w-full bg-white text-slate-900 border border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm placeholder-slate-400 outline-none transition-all shadow-xs font-medium"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full bg-white text-slate-900 border border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl pl-4 pr-11 py-3 text-sm placeholder-slate-400 outline-none transition-all shadow-xs font-medium"
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

        {/* Remember me & Forgot password Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          {/* <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Remember for 30 days</span>
          </label> */}

          <button
            type="button"
            onClick={onForgotPassword}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            Forgot password
          </button>
        </div>

        {/* Primary Sign In Button (Vibrant Blue) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
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
      <div className="mt-12 text-center text-[11px] text-slate-400">
        <span>&copy; {new Date().getFullYear()} AAA Data Solutions &bull; All rights reserved.</span>
      </div>
    </div>
  );
};
