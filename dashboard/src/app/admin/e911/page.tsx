'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminE911Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">E911 Compliance Center</h1>
          <p className="text-sm text-[#8d97a8]">
            Verify emergency responder PSAP addresses and Kari&apos;s Law / RAY BAUM&apos;S Act compliance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>PSAP Address Verification</span>
          </div>
          <p className="text-xs text-[#8d97a8] leading-relaxed">
            124 properties currently verified with active emergency routing tables.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-[#10141b] border border-red-500/30 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Pending Corrections Required</span>
          </div>
          <p className="text-xs text-[#8d97a8] leading-relaxed">
            5 properties have postal address mismatches against carrier PSAP databases.
          </p>
        </div>
      </div>
    </div>
  );
}
