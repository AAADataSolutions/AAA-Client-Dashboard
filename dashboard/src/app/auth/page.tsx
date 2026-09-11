'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[55%_45%] bg-[#0a0d12]">
      {/* Left Brand Panel */}
      <BrandPanel />

      {/* Right Form Column */}
      <section className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#0a0d12]">
        <div className="w-full max-w-[390px]">
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <LoginForm
                  onSwitchToSignup={() => setView('signup')}
                  onForgotPassword={() => setIsForgotModalOpen(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <SignupForm onSwitchToLogin={() => setView('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
