'use client';

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Flame, ShieldAlert, PhoneCall } from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function AdminFirelinesPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Firelines
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#71717a] mt-0.5">
              Dedicated emergency life safety lines, fire alarm communicator circuits, and monitoring trunks.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Centered Empty State Section */}
      <motion.div
        variants={itemVariants}
        className="min-h-[420px] rounded-2xl border border-dashed border-slate-300 dark:border-[#27272a] bg-white/40 dark:bg-[#15161c]/40 backdrop-blur-xs flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1f2029] text-slate-400 dark:text-slate-500 flex items-center justify-center border border-slate-200 dark:border-[#2a2c3a] shadow-inner mb-4">
          <Flame className="w-8 h-8 opacity-60 text-orange-500" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Firelines
        </h3>
        <p className="text-xs text-slate-500 dark:text-[#71717a] max-w-md mt-1.5 leading-relaxed">
          No fireline circuits configured yet. Emergency life-safety trunks, monitoring lines, and communicator channels will be listed here.
        </p>
      </motion.div>
    </motion.div>
  );
}
