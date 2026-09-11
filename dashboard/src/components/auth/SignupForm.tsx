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
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'USER'>('USER');
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
            role: 'CLIENT_USER', // Explicitly keep client users in CLIENT_USER global role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      // Check if session was immediately established or email confirmation is required
      if (data?.session) {
        router.push('/dashboard');
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
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/25">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[#e8ecf2]">Check your email</h3>
          <p className="text-[14px] text-[#8d97a8] max-w-sm mx-auto leading-relaxed">
            We sent a verification link to <strong className="text-[#e8ecf2]">{email}</strong>. Please confirm your email to activate your AAA Data Solutions account.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="h-10 px-6 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white font-medium text-sm transition-colors"
        >
          Proceed to Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-[1.7rem] font-semibold tracking-[-0.01em] text-[#e8ecf2]">
          Create your account
        </h2>
        <p className="text-[14.5px] text-[#8d97a8]">
          Get started with AAA Data Solutions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-[13px] text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="block text-[13px] font-medium text-[#8d97a8]">
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
            className="w-full bg-[#151b24] border border-[#212833] focus:border-[#4c7cf3] focus:ring-2 focus:ring-[#4c7cf3]/25 rounded-lg px-3.5 py-2.5 text-[14.5px] text-[#e8ecf2] placeholder-[#5b6472] outline-none transition-all"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-[13px] font-medium text-[#8d97a8]">
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
            className="w-full bg-[#151b24] border border-[#212833] focus:border-[#4c7cf3] focus:ring-2 focus:ring-[#4c7cf3]/25 rounded-lg px-3.5 py-2.5 text-[14.5px] text-[#e8ecf2] placeholder-[#5b6472] outline-none transition-all"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-[13px] font-medium text-[#8d97a8]">
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

        {/* Role Selector Pill */}
        <div className="space-y-2 pt-1">
          <label className="block text-[13px] font-medium text-[#8d97a8]">
            Role
          </label>
          <div className="relative grid grid-cols-2 bg-[#151b24] border border-[#212833] rounded-lg p-1 select-none">
            {/* Sliding Pill Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#4c7cf3] rounded-md transition-all duration-300 ease-out shadow-sm ${
                selectedRole === 'ADMIN' ? 'left-1' : 'left-[calc(50%+2px)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`relative z-10 py-2 text-[13.5px] font-medium rounded-md transition-colors text-center ${
                selectedRole === 'ADMIN' ? 'text-[#0a0d12] font-semibold' : 'text-[#8d97a8] hover:text-[#e8ecf2]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('USER')}
              className={`relative z-10 py-2 text-[13.5px] font-medium rounded-md transition-colors text-center ${
                selectedRole === 'USER' ? 'text-[#0a0d12] font-semibold' : 'text-[#8d97a8] hover:text-[#e8ecf2]'
              }`}
            >
              User
            </button>
          </div>
          <p className="text-[12px] leading-normal text-[#5b6472]">
            Determines your permissions in the workspace. This can be adjusted by organization administrators.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] active:scale-[0.99] text-white font-medium text-[14.5px] flex items-center justify-center gap-2 transition-all shadow-md shadow-[#4c7cf3]/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <p className="mt-6 text-center text-[13.5px] text-[#8d97a8]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-[#6e96f8] hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
