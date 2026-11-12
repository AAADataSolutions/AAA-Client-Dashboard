'use client';

import React from 'react';
import { type OrgDetail } from './types';

interface OrgE911TabProps {
  org: OrgDetail;
}

export function OrgE911Tab({ org }: OrgE911TabProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">E911 Emergency Location Compliance</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4 font-bold">Property</th>
              <th className="py-3 px-4 font-bold">Emergency Dispatch Address</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Verified Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
            {org.e911?.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                  No E911 records configured yet.
                </td>
              </tr>
            ) : (
              org.e911?.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{rec.property_name}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{rec.emergency_address}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {rec.verified_at ? new Date(rec.verified_at).toLocaleDateString() : 'Pending Validation'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
