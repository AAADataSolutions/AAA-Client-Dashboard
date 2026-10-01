'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function AuthPage() {
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen w-full relative bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white"
      style={{
        backgroundImage: "url('/AuthBg1.png')",
        backgroundColor: '#0a1a3a',
      }}
    >
      {/* Subtle overlay if needed */}
      <div className="absolute inset-0 bg-blue-950/20 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row items-center justify-between p-4 sm:p-8 lg:p-12 gap-8">
        {/* Left Column: Brand & Feature Presentation */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center order-2 lg:order-1">
          <BrandPanel />
        </div>

        {/* Right Column: Floating Pure White Login Card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center lg:justify-end order-1 lg:order-2 p-2 sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-[440px]"
          >
            <LoginForm
              onForgotPassword={() => setIsForgotModalOpen(true)}
            />
          </motion.div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
