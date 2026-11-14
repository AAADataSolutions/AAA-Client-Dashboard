'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin,
  Plus,
  Check,
  Copy,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { type OrgDetail, getStageBadge } from './types';

function formatBilledDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const raw = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

interface OrgPropertiesTabProps {
  org: OrgDetail;
  isSuperAdmin: boolean;
  copiedId: string | null;
  handleCopy: (text: string, id: string, e: React.MouseEvent) => void;
  handleOpenAssignModal: () => Promise<void>;
  handleViewPropertyServices: (prop: any) => Promise<void>;
  setActivePropMenu: (menu: { prop: any; bottom: number; left: number } | null) => void;
}

export function OrgPropertiesTab({
  org,
  isSuperAdmin,
  copiedId,
  handleCopy,
  handleOpenAssignModal,
  handleViewPropertyServices,
  setActivePropMenu,
}: OrgPropertiesTabProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs space-y-4">
      <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assigned Properties Directory</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Physical property assets and hotel locations linked to {org.name}.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenAssignModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Assign New Property</span>
        </motion.button>
      </div>

      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
          <thead className="bg-slate-50 dark:bg-[#111217] text-slate-500 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">Property</th>
              {isSuperAdmin && <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[120px]">Monthly Price</th>}
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[130px]">Main Phone No.</th>
              <th className="py-3 px-3.5 font-bold text-center whitespace-nowrap min-w-[100px]">No. of Services</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[120px]">Billing Status</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">E911 Status</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">Ray Baum and Kary's Law</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[130px]">GM Name</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">GM Email</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">Property Status</th>
              <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">Stage</th>
              <th className="py-3 px-3.5 font-bold text-right whitespace-nowrap min-w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
            {org.properties?.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 12 : 11} className="py-12 text-center text-slate-400 text-xs">
                  No properties assigned to this organization yet.
                </td>
              </tr>
            ) : (
              org.properties?.map((prop: any) => (
                <tr key={prop.id || prop.link_id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                  {/* Property with Address underneath */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <Link
                      href={`/admin/properties`}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer block"
                    >
                      {prop.name}
                    </Link>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span>
                        {prop.city
                          ? `${prop.address ? prop.address + ', ' : ''}${prop.city}, ${prop.state || prop.country || ''} ${prop.zip_code || ''}`
                          : (prop.address || '—')}
                      </span>
                    </div>
                  </td>

                  {/* Monthly Price */}
                  {isSuperAdmin && (
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {prop.monthly_price !== null && prop.monthly_price !== undefined
                          ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '—'}
                      </span>
                      {prop.onboarding_date && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5" title="Onboarding Date">
                          Onboarded: {prop.onboarding_date}
                        </span>
                      )}
                    </td>
                  )}

                  {/* Main Phone No. */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {prop.main_phone ? (
                      <button
                        onClick={(e) => handleCopy(prop.main_phone, `main-p-${prop.id}`, e)}
                        className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                      >
                        <span>{prop.main_phone}</span>
                        {copiedId === `main-p-${prop.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* No. of Services */}
                  <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleViewPropertyServices(prop)}
                      className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold cursor-pointer"
                    >
                      {prop.services_count || 0} Lines
                    </button>
                  </td>

                  {/* Billing Status (Next to No. of services with Billed Date underneath) */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      {prop.billing_status === 'BILLING_DONE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Billing Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Billing Pending
                        </span>
                      )}

                      {prop.billing_status === 'BILLING_DONE' ? (
                        <span className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 pl-0.5 flex items-center gap-1">
                          <span>Billed:</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {prop.billed_date
                              ? formatBilledDate(prop.billed_date)
                              : prop.onboarding_date
                              ? formatBilledDate(prop.onboarding_date)
                              : 'Done'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-normal text-slate-400 dark:text-slate-500 pl-0.5 italic">
                          Unbilled
                        </span>
                      )}
                    </div>
                  </td>

                  {/* E911 Status */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-[#1f212a] text-slate-700 dark:text-slate-300">
                      {prop.e911_status || 'Verified'}
                    </span>
                  </td>

                  {/* Ray Baum and Kary's Law: STRICTLY Active / Inactive */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {prop.ray_baum_status === 'Active' || prop.ray_baum_status === 'ACTIVE' ? (
                      <button
                        onClick={() => window.open(`/admin/ray-baum/${prop.id}`, '_blank')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer"
                        title="Open Ray Baum and Kary's Law in new tab"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>View Ray Baum No.s</span>
                        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* GM Name */}
                  <td className="py-3.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {prop.general_manager_name || '—'}
                  </td>

                  {/* GM Email */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {prop.general_manager_email && prop.general_manager_email !== '—' ? (
                      <button
                        onClick={(e) => handleCopy(prop.general_manager_email, `gm-e-${prop.id}`, e)}
                        className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                      >
                        <span>{prop.general_manager_email}</span>
                        {copiedId === `gm-e-${prop.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Property Status */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {prop.status || 'ACTIVE'}
                    </span>
                  </td>

                  {/* Stage */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    {(() => {
                      const rawStage = prop.onboarding_stage || prop.stage;
                      if (!rawStage) return <span className="text-slate-400">—</span>;
                      const badge = getStageBadge(rawStage);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                  </td>

                  {/* Actions: Three Dots Menu (Opens ABOVE) */}
                  <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActivePropMenu({
                          prop,
                          bottom: window.innerHeight - rect.top + 6,
                          left: Math.max(16, rect.left - 150),
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                      title="Property Actions"
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
