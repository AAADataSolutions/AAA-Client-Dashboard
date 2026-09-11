'use client';

import React from 'react';
import { GitBranch, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export default function AdminOnboardingPortingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">Onboarding &amp; Porting Pipelines</h1>
          <p className="text-sm text-[#8d97a8]">
            Track carrier cutover milestones, FOC dates, and DID porting lifecycles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
          <span className="text-xs font-semibold text-amber-400">Porting Pending</span>
          <h3 className="text-2xl font-bold text-[#e8ecf2]">8</h3>
          <p className="text-xs text-[#8d97a8]">Carrier LOA awaiting validation</p>
        </div>
        <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
          <span className="text-xs font-semibold text-[#6e96f8]">FOC Confirmed</span>
          <h3 className="text-2xl font-bold text-[#e8ecf2]">12</h3>
          <p className="text-xs text-[#8d97a8]">Scheduled for upcoming cutover</p>
        </div>
        <div className="p-5 rounded-xl bg-[#10141b] border border-[#212833] space-y-2">
          <span className="text-xs font-semibold text-emerald-400">Completed Ports</span>
          <h3 className="text-2xl font-bold text-[#e8ecf2]">64</h3>
          <p className="text-xs text-[#8d97a8]">Successfully activated</p>
        </div>
      </div>
    </div>
  );
}
