'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md bg-[#10141b] border border-[#212833] rounded-xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
              <h3 className="text-lg font-semibold text-[#e8ecf2]">Reset Password</h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-[#8d97a8] hover:text-[#e8ecf2] rounded-md hover:bg-[#151b24] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[15px] font-medium text-[#e8ecf2]">Check your email</h4>
                  <p className="text-[13.5px] text-[#8d97a8] max-w-xs mx-auto">
                    We’ve sent a password reset link to <strong className="text-[#e8ecf2]">{email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full mt-4 h-10 rounded-lg bg-[#4c7cf3] hover:bg-[#6e96f8] text-white font-medium text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-[13.5px] text-[#8d97a8] leading-relaxed">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-[13px] text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="block text-[13px] font-semibold text-white">
                    Email address <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full bg-[#131720] border border-[#232936] focus:border-[#1275e2] focus:ring-2 focus:ring-[#1275e2]/25 rounded-xl px-3.5 py-2.5 text-[14px] text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

