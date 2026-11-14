'use client';

import React from 'react';
import {
  MapPin,
  Check,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { PropertyItem, PropertyRecord } from '@/store/slices/propertiesSlice';
import { formatBilledDate } from './types';

export interface PropertyTableRowProps {
  prop: PropertyRecord;
  isSuperAdmin: boolean;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleOpenPropertyDrawer: (prop: PropertyRecord | PropertyItem) => void;
  handleOpenServicesModal: (prop: PropertyItem) => void;
  handleQuickUpdateStatus: (propId: string, newStatus: string) => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  handleOpenEdit: (prop: PropertyItem) => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyItem) => void;
}

export function PropertyTableRow({
  prop,
  isSuperAdmin,
  copiedField,
  handleCopy,
  handleOpenPropertyDrawer,
  handleOpenServicesModal,
  handleQuickUpdateStatus,
  handleQuickUpdateBillingStatus,
  handleOpenEdit,
  handleOpenMenu,
}: PropertyTableRowProps) {
  const connType = prop.connectivity_type || (prop.data_circuit ? 'BOTH' : 'PORTED');

  return (
    <tr
      onClick={() => handleOpenPropertyDrawer(prop)}
      className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition cursor-pointer group"
    >
      {/* 1. Property Name with Address & Connectivity / Data Circuit underneath */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black dark:text-white text-sm">{prop.name}</span>
          {connType === 'BOTH' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-sans">
              Ported &amp; Data Circuited
            </span>
          ) : connType === 'DATA_CIRCUITED' ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-sans">
              Data Circuited
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-sans">
              Ported
            </span>
          )}
        </div>
        {prop.data_circuit && (
          <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 font-medium">
              Carrier: <strong>{prop.data_circuit.carrier_name || 'Pending'}</strong>
              {prop.data_circuit.bandwidth ? ` (${prop.data_circuit.bandwidth})` : ''}
              {prop.data_circuit.circuit_monthly_price !== null && prop.data_circuit.circuit_monthly_price !== undefined
                ? ` • $${Number(prop.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                : ''}
            </span>
          </div>
        )}
        <span className="hidden">{prop.name}</span>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span>
            {prop.city
              ? `${prop.address ? prop.address + ', ' : ''}${prop.city}, ${prop.state || prop.country} ${prop.zip_code || ''}`
              : prop.address || '—'}
          </span>
        </div>
      </td>

      {/* 2. Monthly Price (Super Admin Only) */}
      {isSuperAdmin && (
        <td className="py-3.5 px-4 whitespace-nowrap">
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
            {prop.monthly_price !== null && prop.monthly_price !== undefined
              ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'}
          </span>
          {prop.onboarding_date && (
            <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono block mt-0.5" title="Onboarding Date">
              Onboarded: {prop.onboarding_date}
            </span>
          )}
        </td>
      )}

      {/* 3. Main Phone No. (with Copy) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {prop.main_phone ? (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{prop.main_phone}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(prop.main_phone || '', `main-phone-${prop.id}`);
              }}
              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
              title="Copy Main Phone"
            >
              {copiedField === `main-phone-${prop.id}` ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">—</span>
        )}
      </td>

      {/* 4. Client (formerly Management Group) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {(prop.organization_name && prop.organization_name !== 'Unassigned') ||
        prop.primary_organization ||
        (prop.organizations && prop.organizations.length > 0) ? (
          <div className="inline-flex items-center gap-2">
            <a
              href={`/admin/organizations/${prop.primary_organization?.id || prop.organizations?.[0]?.id || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>
                {prop.organization_name && prop.organization_name !== 'Unassigned'
                  ? prop.organization_name
                  : prop.primary_organization?.name || prop.organizations?.[0]?.name}
              </span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
            {(prop as any).organization_type === 'INDIVIDUAL' ||
            prop.primary_organization?.type === 'INDIVIDUAL' ||
            prop.organizations?.[0]?.type === 'INDIVIDUAL' ? (
              <span
                className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0 shadow-2xs ring-2 ring-blue-500/20"
                title="Individual Client"
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-2xs ring-2 ring-emerald-500/20"
                title="Group Client"
              />
            )}
          </div>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-900/40">
            Unassigned
          </span>
        )}
      </td>

      {/* 5. No. of Associated Services (Dynamic) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenServicesModal(prop);
          }}
          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 dark:bg-[#1a1c26] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 hover:border-blue-300 dark:border-[#282a36] dark:hover:border-blue-800/60 transition cursor-pointer"
          title="Click to view & manage assigned services"
        >
          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {prop.services_count || 0}
          </span>
          <span className="font-normal text-[11px] text-slate-400 group-hover:text-blue-500">Services</span>
        </button>
      </td>

      {/* 6. Billing Status (Next to No. of services with Billed Date underneath) */}
      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col items-start gap-1">
          <select
            value={(prop as any).billing_status === 'BILLING_DONE' ? 'BILLING_DONE' : 'BILLING_PENDING'}
            onChange={(e) =>
              handleQuickUpdateBillingStatus(prop.id, e.target.value as 'BILLING_DONE' | 'BILLING_PENDING')
            }
            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
              (prop as any).billing_status === 'BILLING_DONE'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
          >
            <option value="BILLING_DONE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">
              Billing Done (Billed)
            </option>
            <option value="BILLING_PENDING" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">
              Billing Pending
            </option>
          </select>

          {(prop as any).billing_status === 'BILLING_DONE' ? (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 pl-1 flex items-center gap-1">
              <span>Billed:</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {(prop as any).billed_date
                  ? formatBilledDate((prop as any).billed_date)
                  : prop.onboarding_date
                  ? formatBilledDate(prop.onboarding_date)
                  : 'Today'}
              </span>
            </span>
          ) : (
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 pl-1 italic">
              Unbilled
            </span>
          )}
        </div>
      </td>

      {/* 6. E911 Status */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {prop.ray_baud_and_logs_enabled ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" /> PSAP Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 whitespace-nowrap">
            <AlertCircle className="w-3 h-3" /> Audit Required
          </span>
        )}
      </td>

      {/* 7. Ray Baum and Kary's Law (Active / Inactive) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {prop.ray_baum_status === 'Active' || prop.ray_baum_status === 'ACTIVE' ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/admin/ray-baum/${prop.id}`, '_blank');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
            title="Open Ray Baum and Kary's Law in a new tab"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>View Ray Baum No.s</span>
            <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 cursor-not-allowed">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Inactive</span>
          </span>
        )}
      </td>

      {/* 8. GM Name */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span className="font-semibold text-slate-800 dark:text-white">
          {prop.general_manager_name || prop.contact_person_name || 'N/A'}
        </span>
      </td>

      {/* 9. GM Email (with Copy) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {prop.general_manager_email || prop.contact_person_email ? (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 dark:text-slate-300">
              {prop.general_manager_email || prop.contact_person_email}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(prop.general_manager_email || prop.contact_person_email || '', `gm-email-${prop.id}`);
              }}
              className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
              title="Copy GM Email"
            >
              {copiedField === `gm-email-${prop.id}` ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-slate-400 text-xs">N/A</span>
        )}
      </td>

      {/* 10. Property Status (Inline Select) */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <select
          onClick={(e) => e.stopPropagation()}
          value={prop.status === 'ONBOARDING' ? 'ACTIVE' : prop.status || 'ACTIVE'}
          onChange={(e) => handleQuickUpdateStatus(prop.id, e.target.value)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition ${
            prop.status === 'ACTIVE' || prop.status === 'ONBOARDING'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40'
              : prop.status === 'ARCHIVED'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40'
          }`}
        >
          <option value="ACTIVE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">
            Onboarded
          </option>
          <option value="INACTIVE" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">
            Inactive
          </option>
          <option value="ARCHIVED" className="bg-white dark:bg-[#1e2029] text-slate-800 dark:text-slate-100">
            Archived
          </option>
        </select>
      </td>



      {/* 12. Actions */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEdit(prop);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
            title="Edit Property"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenMenu(e, prop);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
            title="More Actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

