'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
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
    <div className="w-full">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-[1.7rem] font-semibold tracking-[-0.01em] text-[#e8ecf2]">
          Welcome back
        </h2>
        <p className="text-[14.5px] text-[#8d97a8]">
          Sign in to continue to your AAA Data Solutions workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-[13px] text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-[13px] font-medium text-[#8d97a8]">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className="w-full bg-[#151b24] border border-[#212833] focus:border-[#4c7cf3] focus:ring-2 focus:ring-[#4c7cf3]/25 rounded-lg px-3.5 py-2.5 text-[14.5px] text-[#e8ecf2] placeholder-[#5b6472] outline-none transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="block text-[13px] font-medium text-[#8d97a8]">
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
              className="w-full bg-[#151b24] border border-[#212833] focus:border-[#4c7cf3] focus:ring-2 focus:ring-[#4c7cf3]/25 rounded-lg px-3.5 py-2.5 pr-11 text-[14.5px] text-[#e8ecf2] placeholder-[#5b6472] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-[#5b6472] hover:text-[#8d97a8] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-[13px] text-[#8d97a8] hover:text-[#6e96f8] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-1 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] active:scale-[0.99] text-white font-medium text-[14.5px] flex items-center justify-center gap-2 transition-all shadow-md shadow-[#4c7cf3]/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      {/* Switch to Signup */}
      <p className="mt-8 text-center text-[13.5px] text-[#8d97a8]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-[#6e96f8] hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};
