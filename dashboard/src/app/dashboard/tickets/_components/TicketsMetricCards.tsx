import React from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { itemVariants } from './types';

interface TicketsMetricCardsProps {
  metrics: {
    total: number;
    open: number;
    waitingOnClient: number;
    resolvedOrClosed: number;
    last24Hours: number;
  };
}

export function TicketsMetricCards({ metrics }: TicketsMetricCardsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* Card 1: Total Tickets */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Total Tickets
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <LifeBuoy className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.total}
          </span>
        </div>
        <p className="text-[11px] text-slate-200 mt-1">Total Support Inquiries</p>
      </motion.div>

      {/* Card 2: Active / Open */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Active / Open
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.open}
          </span>
        </div>
        <p className="text-[11px] text-slate-200 mt-1">{metrics.last24Hours} opened in last 24h</p>
      </motion.div>

      {/* Card 3: Waiting On Client */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Waiting On Client
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.waitingOnClient}
          </span>
        </div>
        <p className="text-[11px] text-slate-200 mt-1">Pending Your Response</p>
      </motion.div>

      {/* Card 4: Resolved & Closed */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
        className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg border border-blue-700/40 flex flex-col justify-between cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
            Resolved &amp; Closed
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-bold text-white">
            {metrics.resolvedOrClosed}
          </span>
        </div>
        <p className="text-[11px] text-slate-200 mt-1">Successfully Completed</p>
      </motion.div>
    </motion.div>
  );
}
