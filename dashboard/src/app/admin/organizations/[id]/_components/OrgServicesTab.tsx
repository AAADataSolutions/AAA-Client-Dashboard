'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreVertical } from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgServicesTabProps {
  org: OrgDetail;
  handleOpenAssignServiceModal: () => void;
  setActiveServiceMenu: (menu: { srv: any; bottom: number; left: number } | null) => void;
}

export function OrgServicesTab({
  org,
  handleOpenAssignServiceModal,
  setActiveServiceMenu,
}: OrgServicesTabProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Telecom Services</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Telecom voice trunks, firelines, and elevator lines assigned to {org.name}.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenAssignServiceModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Service</span>
          </motion.button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4 font-bold">Property Location</th>
              <th className="py-3 px-4 font-bold">Service Type</th>
              <th className="py-3 px-4 font-bold">Service Number / DID</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
            {org.services?.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No services assigned yet.
                </td>
              </tr>
            ) : (
              org.services?.map((srv: any) => (
                <tr key={srv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{srv.property_name}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{srv.service_type}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-900 dark:text-white">{srv.phone_number}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {srv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveServiceMenu({
                          srv,
                          bottom: window.innerHeight - rect.top + 6,
                          left: Math.max(16, rect.left - 160),
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                      title="Service Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
