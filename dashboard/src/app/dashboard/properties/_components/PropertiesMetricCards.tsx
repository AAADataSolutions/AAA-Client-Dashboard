import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, GitBranch, PhoneCall, ShieldCheck } from 'lucide-react';
import { itemVariants } from './types';

interface PropertiesMetricCardsProps {
  metrics: {
    totalProperties: number;
    activeProperties: number;
    onboardingProperties: number;
    totalServices: number;
    e911VerifiedProperties: number;
  };
  fallbackTotal: number;
}

export function PropertiesMetricCards({ metrics, fallbackTotal }: PropertiesMetricCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Properties */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Total Properties
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Hotel className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.totalProperties || fallbackTotal}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Locations</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">{metrics.activeProperties} Live Active properties</p>
      </motion.div>

      {/* Card 2: In Onboarding */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            In Onboarding
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.onboardingProperties}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Pipelines</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Cutover pipelines active</p>
      </motion.div>

      {/* Card 3: Assigned Voice Lines */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Assigned Voice Lines
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.totalServices}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Telecom DIDs</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Active telecom lines provisioned</p>
      </motion.div>

      {/* Card 4: E911 PSAP Verified */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            E911 PSAP Verified
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.e911VerifiedProperties}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Compliant</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Emergency dispatch ready</p>
      </motion.div>
    </motion.div>
  );
}
