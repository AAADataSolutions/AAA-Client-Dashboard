'use client';

import React from 'react';
import { FileClock, Shield } from 'lucide-react';

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">Security &amp; Audit Logs</h1>
          <p className="text-sm text-[#8d97a8]">
            Immutable record of all access events, Super Admin approvals, and system state modifications.
          </p>
        </div>
      </div>

      <div className="p-10 text-center rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
        <FileClock className="w-8 h-8 text-[#6e96f8] mx-auto opacity-80" />
        <h3 className="text-base font-semibold text-[#e8ecf2]">System Activity Audit Trail</h3>
        <p className="text-xs text-[#8d97a8] max-w-md mx-auto">
          Tracks team member authorizations, role escalations, and critical configuration changes.
        </p>
      </div>
    </div>
  );
}
