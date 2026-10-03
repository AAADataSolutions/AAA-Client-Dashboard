'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) {
        setError(updateErr.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth');
        }, 2500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-white font-sans selection:bg-blue-600 selection:text-white">
      {/* Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-slate-200/90 rounded-[28px] sm:rounded-[32px] p-7 sm:p-9 shadow-xl text-slate-900"
      >
        {/* Logo Header */}
        <div className="flex justify-center items-center mb-6">
          <img
            src="/logo.png"
            alt="AAA Data Solutions Logo"
            className="h-28 sm:h-30 w-auto object-contain"
          />
        </div>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900">Password Updated!</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Your password has been successfully updated. Redirecting you to the login page...
              </p>
            </div>
            <button
              onClick={() => router.push('/auth')}
              className="mt-3 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Set new password
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Please choose a strong password with at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  New Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm placeholder-slate-400 outline-none transition-all shadow-2xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Confirm New Password <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm placeholder-slate-400 outline-none transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold py-3 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
