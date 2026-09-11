'use client';

import React from 'react';
import { LifeBuoy, Plus, Clock, CheckCircle } from 'lucide-react';

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212833]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e8ecf2]">Operational Tickets</h1>
          <p className="text-sm text-[#8d97a8]">
            Manage high-priority carrier outages, porting issues, and client escalation requests.
          </p>
        </div>
      </div>

      <div className="p-10 text-center rounded-xl bg-[#10141b] border border-[#212833] space-y-3">
        <LifeBuoy className="w-8 h-8 text-[#4c7cf3] mx-auto opacity-80" />
        <h3 className="text-base font-semibold text-[#e8ecf2]">Support &amp; Operational Tickets</h3>
        <p className="text-xs text-[#8d97a8] max-w-md mx-auto">
          Central queue for carrier escalations, porting tickets, and client technical inquiries.
        </p>
      </div>
    </div>
  );
}
