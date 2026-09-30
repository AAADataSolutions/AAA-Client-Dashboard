'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrandPanel } from '@/components/auth/BrandPanel';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function AuthPage() {
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Left Column: Blue KPI Dashboard Graphic Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center order-2 lg:order-1">
        <BrandPanel />
      </div>

      {/* Right Column: STRICT Pure White Background with Login Form (No dark mode black) */}
      <div className="w-full lg:w-1/2 bg-white relative flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 min-h-[580px] lg:min-h-screen order-1 lg:order-2 border-b lg:border-b-0 lg:border-l border-slate-200">
        {/* Login Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[420px]"
        >
          <LoginForm
            onForgotPassword={() => setIsForgotModalOpen(true)}
          />
        </motion.div>
      </div>

      {/* Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
}
