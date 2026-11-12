'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LifeBuoy, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { sectionVariants, TicketAnalyticsData } from './types';

interface SupportTicketsChartProps {
  ticketAnalytics: TicketAnalyticsData;
}

export default function SupportTicketsChart({ ticketAnalytics }: SupportTicketsChartProps) {
  const maxTicketVal = Math.max(
    ...ticketAnalytics.last7Days.map((d: any) => Math.max(d.created || 0, d.resolved || 0, 1)),
    4
  );

  const createdPoints = ticketAnalytics.last7Days
    .map((d: any, idx: number) => {
      const x = (idx / 6) * 190 + 5;
      const y = 35 - ((d.created || 0) / maxTicketVal) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  const resolvedPoints = ticketAnalytics.last7Days
    .map((d: any, idx: number) => {
      const x = (idx / 6) * 190 + 5;
      const y = 35 - ((d.resolved || 0) / maxTicketVal) * 26;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] p-6 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Support Tickets
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10.5px] font-extrabold uppercase tracking-wide">
          {ticketAnalytics.urgent > 0 ? `${ticketAnalytics.urgent} URGENT` : 'NORMAL QUEUE'}
        </span>
      </div>

      {/* Content Body: Active Queue + Stats boxes + 7-Day Trend Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2 items-center">
        {/* Left Column: Active Queue & Response Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              ACTIVE QUEUE
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {ticketAnalytics.open} Open
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Average response: &lt; 15 minutes
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Avg Response
              </span>
              <strong className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                &lt; 15 mins
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                Open Priority
              </span>
              <strong className="text-xs font-black text-slate-900 dark:text-white block mt-0.5">
                {ticketAnalytics.urgent} Urgent
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column: 7-Day Trend SVG Graph (7 cols) */}
        <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430] lg:pl-8 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Ticket Activity (Last 7 Days)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Created
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          {/* SVG Trend Line Graph */}
          <div className="pt-2">
            <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={createdPoints || '0,35 200,35'}
              />
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                points={resolvedPoints || '0,35 200,35'}
              />
            </svg>
            <div className="flex justify-between text-[10px] text-slate-400 px-0.5 mt-1">
              {ticketAnalytics.last7Days.map((d: any, idx: number) => (
                <span key={idx}>{d.dayName}</span>
              ))}
            </div>
          </div>

          <div className="pt-1 text-right">
            <Link
              href="/admin/tickets"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open Ticket Dispatch Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
