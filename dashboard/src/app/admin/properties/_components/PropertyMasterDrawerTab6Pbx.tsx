'use client';

import React from 'react';
import { PhoneCall, FileText } from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';

interface PropertyMasterDrawerTab6PbxProps {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
}

export function PropertyMasterDrawerTab6Pbx({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
}: PropertyMasterDrawerTab6PbxProps) {
  if (drawerTab !== 'CALL_FORWARDING') return null;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm">
              PBX DIDs, Call Forwarding &amp; CDR Call Logs
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-0.5">
              View attached DID numbers, FreePBX cluster servers, live Call Forwarding state, and CDR logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/admin/call-forwarding?property_id=${selectedPropForDrawer.id}`}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Manage Call Forwarding</span>
          </a>
          <a
            href={`/admin/call-logs?property_id=${selectedPropForDrawer.id}`}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View CDR Logs</span>
          </a>
        </div>
      </div>

      {!propertyDrawerData?.services || propertyDrawerData.services.length === 0 ? (
        <div className="p-10 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-2 text-slate-400">
          <PhoneCall className="w-8 h-8 mx-auto opacity-40" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
            No DIDs / Voice Services Attached Yet
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Assign a DID or Voice service in Tab 2 (Services) to control Call Forwarding and view live CDR logs for this property.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {propertyDrawerData.services.map((svc: any) => (
            <div
              key={svc.id}
              className="p-3.5 rounded-xl bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {svc.did_number || svc.normalized_did || svc.service_name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    PBX Server #{svc.pbx_server_id || 1} (
                    {svc.pbx_server_id === 2
                      ? '162.248.187.142'
                      : svc.pbx_server_id === 3
                      ? '162.248.187.240'
                      : '162.248.187.115'}
                    )
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {svc.service_name} • {svc.carrier || 'AAA SIP Trunk'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    svc.call_forwarding_state === 'ON'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {svc.call_forwarding_state === 'ON'
                    ? `FWD ON → ${svc.call_forwarding_destination || 'Active'}`
                    : 'FWD OFF (PBX Normal)'}
                </span>
                <a
                  href={`/admin/call-forwarding?property_id=${selectedPropForDrawer.id}`}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#252836] hover:bg-slate-50 dark:hover:bg-[#222430] text-xs font-bold text-blue-600 dark:text-blue-400"
                >
                  Configure
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

