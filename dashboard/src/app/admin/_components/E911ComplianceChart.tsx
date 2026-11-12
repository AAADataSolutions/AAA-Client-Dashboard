'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { sectionVariants, E911ComplianceData } from './types';

interface E911ComplianceChartProps {
  compliance: E911ComplianceData;
}

export default function E911ComplianceChart({ compliance }: E911ComplianceChartProps) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className="rounded-2xl bg-white dark:bg-[#15161c] border border-slate-200/90 dark:border-[#222430] p-6 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            E911 Emergency Compliance Overview
          </h3>
          <span className="px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10.5px] font-bold">
            Regulatory Mandate
          </span>
        </div>
        <Link
          href="/admin/e911"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Full Compliance Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
        KARY&apos;S Law and RAY BAUM&apos;S Act location dispatch verification status across all properties.
      </p>

      {/* Content Body: Ring Gauge + Legend + Warning Banner Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 items-center">
        {/* Left Column: Ring Gauge & Status Legend (5 cols) */}
        <div className="lg:col-span-5 flex items-center gap-6">
          {/* Multi-segment Donut Chart */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-100 dark:stroke-[#20222a]"
                strokeWidth="8"
                fill="none"
              />
              {/* Dynamic Colored Segments */}
              {(() => {
                const segments = [
                  { name: 'Verified', value: compliance.verified || 0, color: '#10b981' },
                  { name: 'Pending', value: compliance.pending || 0, color: '#0ea5e9' },
                  { name: 'Correction', value: (compliance.correctionRequired || 0) + (compliance.failed || 0), color: '#f59e0b' },
                ];
                const total = compliance.total > 0 ? compliance.total : segments.reduce((acc, s) => acc + s.value, 0);
                if (total === 0) return null;

                let runningOffset = 0;
                return segments
                  .filter((s) => s.value > 0)
                  .map((s) => {
                    const fraction = s.value / total;
                    const dashLength = fraction * 251.327;
                    const offset = -runningOffset;
                    runningOffset += dashLength;
                    return (
                      <circle
                        key={s.name}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={s.color}
                        strokeWidth="8"
                        strokeDasharray={`${dashLength} ${251.327 - dashLength}`}
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                        fill="none"
                        className="transition-all duration-700"
                      />
                    );
                  });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                {compliance.verified}
              </span>
              <span className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider mt-1">
                VERIFIED
              </span>
            </div>
          </div>

          {/* Status Legend */}
          <div className="space-y-2.5 text-xs w-full">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                PSAP Verified
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{compliance.verified}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                Pending Test
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{compliance.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                Correction Req.
              </span>
              <span className="font-bold text-slate-900 dark:text-white">{compliance.correctionRequired}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Alert Callout Banner (7 cols) */}
        <div className="lg:col-span-7">
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {compliance.correctionRequired + compliance.failed > 0
                    ? `${compliance.correctionRequired + compliance.failed} locations require address correction`
                    : 'All emergency dispatch routes verified'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                  Dispatchable location address fields are cross-referenced with civic PSAP and MSAG databases.
                </p>
              </div>
            </div>

            <Link
              href="/admin/e911"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              Review E911 Locations &rarr;
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
