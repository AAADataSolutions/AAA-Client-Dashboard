import React from 'react';
import { motion } from 'framer-motion';
import { PhoneCall, Radio, Clock, Layers } from 'lucide-react';
import { itemVariants } from './types';

interface ServicesMetricCardsProps {
  metrics: {
    totalServices: number;
    activeServices: number;
    pendingPortingServices: number;
    disconnectedServices: number;
  };
  fallbackTotal: number;
}

export function ServicesMetricCards({ metrics, fallbackTotal }: ServicesMetricCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Services */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Total Services
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.totalServices || fallbackTotal}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Provisioned</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Total voice lines &amp; telecom DIDs</p>
      </motion.div>

      {/* Card 2: Active Lines */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Active Lines
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.activeServices}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Live</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Active routing and provisioned lines</p>
      </motion.div>

      {/* Card 3: Porting / Pending */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Porting / Pending
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.pendingPortingServices}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">In Transit</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Carrier cutover window</p>
      </motion.div>

      {/* Card 4: Disconnected */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Disconnected
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.disconnectedServices}
          </span>
          <span className="text-xs text-slate-200 ml-1.5 font-medium">Inactive</span>
        </div>
        <p className="text-[11px] text-slate-200 mt-2">Deactivated services</p>
      </motion.div>
    </motion.div>
  );
}
