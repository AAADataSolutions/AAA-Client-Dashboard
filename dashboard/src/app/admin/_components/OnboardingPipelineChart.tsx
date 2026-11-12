'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { sectionVariants, OnboardingPipelineData } from './types';

interface OnboardingPipelineChartProps {
  pipeline: OnboardingPipelineData;
}

export default function OnboardingPipelineChart({ pipeline }: OnboardingPipelineChartProps) {
  const stageCounts = pipeline.stageCounts || {
    draft: 0,
    contractSent: 0,
    signed: 0,
    cutSheetReview: 0,
    portingSubmitted: 0,
    focReceived: 0,
    completed: 0,
    total: 0,
  };

  const totalPipelineCount = stageCounts.total || 0;

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
            Onboarding &amp; Porting Pipeline
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#2a2c3a]">
            {totalPipelineCount} Active Total
          </span>
        </div>
        <Link
          href="/admin/porting"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All Porting Requests</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
        Full 7-stage lifecycle progression across all active hospitality property cutovers.
      </p>

      {/* Content Body: Ring Gauge + 2-col Legend + Vertical Divider + Key Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 items-center">
        {/* Left Column: Ring Gauge & 7-Stage Counts (7 cols) */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
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
                  { name: 'Draft', value: stageCounts.draft || 0, color: '#64748b' },
                  { name: 'Sent', value: stageCounts.contractSent || 0, color: '#6366f1' },
                  { name: 'Signed', value: stageCounts.signed || 0, color: '#2563eb' },
                  { name: 'CutSheet', value: stageCounts.cutSheetReview || 0, color: '#a855f7' },
                  { name: 'Porting', value: stageCounts.portingSubmitted || 0, color: '#f59e0b' },
                  { name: 'FOC', value: stageCounts.focReceived || 0, color: '#0ea5e9' },
                  { name: 'Onboarded', value: stageCounts.completed || 0, color: '#10b981' },
                ];
                const total = totalPipelineCount > 0 ? totalPipelineCount : segments.reduce((acc, s) => acc + s.value, 0);
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
                {totalPipelineCount}
              </span>
              <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-1">
                TOTAL
              </span>
            </div>
          </div>

          {/* 2-Column Stages Legend */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-xs w-full">
            {/* Column 1 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
                  1. Draft
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.draft || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  3. Signed
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.signed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  5. Porting Submitted
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.portingSubmitted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  7. Onboarded
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.completed || 0}</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  2. Sent
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.contractSent || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  4. Cut Sheet Review
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.cutSheetReview || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  6. FOC Recv
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stageCounts.focReceived || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Properties in Pipeline (5 cols) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-[#222430] lg:pl-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              KEY PROPERTIES IN PIPELINE
            </span>
            <span className="text-[11px] text-slate-400">
              Last 3 Porting Properties
            </span>
          </div>

          {pipeline.keyProperties && pipeline.keyProperties.length > 0 ? (
            <div className="space-y-2.5">
              {pipeline.keyProperties.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[190px]">
                      {item.propertyName}
                    </span>
                    <span
                      className="text-[10.5px] font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.color || '#2563eb'}18`,
                        color: item.color || '#2563eb',
                      }}
                    >
                      {item.stageName}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percent}%`, backgroundColor: item.color || '#2563eb' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-xs text-slate-400">
              No active properties in porting pipeline.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
