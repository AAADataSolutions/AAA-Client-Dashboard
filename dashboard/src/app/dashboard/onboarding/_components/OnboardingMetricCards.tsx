import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { itemVariants } from './types';

interface OnboardingMetricCardsProps {
  metrics: {
    total: number;
    inProgress: number;
    waitingOnClient: number;
    completed: number;
  };
  fallbackTotal: number;
}

export function OnboardingMetricCards({ metrics, fallbackTotal }: OnboardingMetricCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Pipelines */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Total Pipelines
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.total || fallbackTotal}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Properties</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Tracked onboarding properties</p>
      </motion.div>

      {/* Card 2: In Progress */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            In Progress
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.inProgress}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Active</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Active carrier cutover steps</p>
      </motion.div>

      {/* Card 3: Waiting Sign-Off */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Waiting Sign-Off
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.waitingOnClient}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Review</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Contract / SOF Review needed</p>
      </motion.div>

      {/* Card 4: Onboarded */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Onboarded
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.completed}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Complete</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Fully operational properties</p>
      </motion.div>
    </motion.div>
  );
}
