import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { itemVariants } from './types';

interface E911MetricCardsProps {
  metrics: {
    total: number;
    verified: number;
    pending: number;
    actionRequired: number;
  };
  fallbackTotal: number;
}

export function E911MetricCards({ metrics, fallbackTotal }: E911MetricCardsProps) {
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
            {metrics.total || fallbackTotal}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Locations</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">E911 endpoints tracked</p>
      </motion.div>

      {/* Card 2: Verified & Live */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Verified &amp; Live
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.verified}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Verified</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">PSAP MSAG locked &amp; routing</p>
      </motion.div>

      {/* Card 3: Pending Review */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Pending Review
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.pending}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Pending</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Awaiting PSAP validation</p>
      </motion.div>

      {/* Card 4: Action Required */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Action Required
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.actionRequired || 0}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Attention</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Discrepancy detected</p>
      </motion.div>
    </motion.div>
  );
}
