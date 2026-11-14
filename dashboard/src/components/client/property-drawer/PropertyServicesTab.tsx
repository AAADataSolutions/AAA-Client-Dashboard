'use client';

import React from 'react';
import { Phone, PhoneCall } from 'lucide-react';

interface PropertyServicesTabProps {
  services: any[];
}

export function PropertyServicesTab({ services = [] }: PropertyServicesTabProps) {
  const safeServices = Array.isArray(services) ? services : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white text-xs">
          Assigned Voice &amp; Telecom Services ({safeServices.length})
        </span>
      </div>

      {safeServices.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
          <PhoneCall className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-800 dark:text-white text-xs">
            No Services Assigned
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            There are no active telecom lines or DIDs currently provisioned for this property location.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeServices.map((svc: any) => (
            <div
              key={svc.id}
              className="p-3 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between hover:border-slate-300 dark:hover:border-[#2d3040] transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
                    {svc.phone_number || 'DID Line'}
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    {svc.service_type?.name || 'Voice Line'}
                    {svc.description ? ` • ${svc.description}` : ''}
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  svc.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                }`}
              >
                {svc.status || 'ACTIVE'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

