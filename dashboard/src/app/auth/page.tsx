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
      {/* Luminous Organic White Splash on the Left Side (fades naturally into hotel lobby image) */}
      <div className="absolute left-0 top-0 bottom-0 w-full lg:w-[70%] bg-[radial-gradient(ellipse_at_25%_45%,_rgba(255,255,255,0.96)_0%,_rgba(255,255,255,0.88)_40%,_rgba(255,255,255,0.45)_70%,_transparent_100%)] pointer-events-none" />
      <div className="absolute left-0 top-0 bottom-0 w-full lg:w-[55%] bg-gradient-to-r from-white/60 via-white/30 to-transparent pointer-events-none" />

      {/* Main Container Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[56%_44%] gap-8 lg:gap-12 items-center py-6">
        {/* Left Brand Panel */}
        <BrandPanel />

        {/* Right Floating Glassmorphism Form Card */}
        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-[#0c101b]/85 backdrop-blur-2xl border border-white/10 rounded-[30px] p-6 sm:p-8 shadow-2xl shadow-black/80">
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
