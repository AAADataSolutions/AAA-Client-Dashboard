'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup'>('signup');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-x-hidden bg-cover bg-center bg-no-repeat selection:bg-blue-600 selection:text-white"
      style={{ backgroundImage: "url('/authbg.png')" }}
    >
      {/* Dark gradient overlay for contrast and legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-black/25 to-black/55 pointer-events-none" />

      {/* Main Container Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[56%_44%] gap-8 lg:gap-12 items-center py-6">
        {/* Left Brand Panel */}
        <BrandPanel />

        {/* Right Floating Glassmorphism Form Card */}
        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-[#0c101b]/80 backdrop-blur-2xl border border-white/10 rounded-[30px] p-6 sm:p-8 shadow-2xl shadow-black/80">
            <AnimatePresence mode="wait">
              {view === 'login' ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <LoginForm
                    onSwitchToSignup={() => setView('signup')}
                    onForgotPassword={() => setIsForgotModalOpen(true)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <SignupForm onSwitchToLogin={() => setView('login')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>



      {/* Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
