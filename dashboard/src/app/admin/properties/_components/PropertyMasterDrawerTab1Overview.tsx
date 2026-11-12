'use client';

import React from 'react';
import { Mail, Phone, ShieldCheck, Check, Copy, ExternalLink } from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';

export interface PropertyMasterDrawerTab1OverviewProps {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
}

export function PropertyMasterDrawerTab1Overview({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  copiedField,
  handleCopy,
  handleQuickUpdateBillingStatus,
}: PropertyMasterDrawerTab1OverviewProps) {
  if (drawerTab !== 'OVERVIEW') return null;

  return (
    <div className="space-y-5">
      {/* Section 1: Property Identity & Primary Info */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Property Name
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
              {propertyDrawerData?.property?.name || selectedPropForDrawer.name}
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Street Address
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.address || selectedPropForDrawer.address || '—'}
            </p>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              City, State &amp; ZIP
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.city || selectedPropForDrawer.city},{' '}
              {propertyDrawerData?.property?.state || selectedPropForDrawer.state}{' '}
              {propertyDrawerData?.property?.zip_code || selectedPropForDrawer.zip_code}
            </p>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Country
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.country || selectedPropForDrawer.country || 'USA'}
            </p>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Main Phone Number
            </label>
            <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>{propertyDrawerData?.property?.main_phone || selectedPropForDrawer.main_phone || '—'}</span>
              {selectedPropForDrawer.main_phone && (
                <button
                  onClick={() => handleCopy(selectedPropForDrawer.main_phone || '', 'drawer-main-phone')}
                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  {copiedField === 'drawer-main-phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Fax Number
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.fax || selectedPropForDrawer.fax || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Client & Administration */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Client &amp; Management Administration
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Client / Organization
            </label>
            <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
              {propertyDrawerData?.organization ? (
                <a
                  href={`/admin/organizations/${propertyDrawerData.organization.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{propertyDrawerData.organization.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <span className="text-slate-400">Unassigned (Direct Property)</span>
              )}
              {propertyDrawerData?.organization && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300">
                  {propertyDrawerData.organization.type || 'GROUP'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              General Manager Name
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
              {propertyDrawerData?.property?.general_manager_name || selectedPropForDrawer.general_manager_name || '—'}
            </p>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              General Manager Email
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{propertyDrawerData?.property?.general_manager_email || selectedPropForDrawer.general_manager_email || '—'}</span>
            </p>
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              General Manager Phone
            </label>
            <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {propertyDrawerData?.property?.general_manager_phone ||
                  selectedPropForDrawer.general_manager_phone ||
                  propertyDrawerData?.property?.main_phone ||
                  '—'}
              </span>
            </p>
          </div>
        </div>

        {/* Property Contacts List */}
        {propertyDrawerData?.contacts && propertyDrawerData.contacts.length > 0 && (
          <div className="pt-2">
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1.5">
              Saved Property Contacts ({propertyDrawerData.contacts.length})
            </label>
            <div className="space-y-1.5">
              {propertyDrawerData.contacts.map((c: any) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#222430] text-slate-600 dark:text-slate-300">
                        {c.role || 'Contact'}
                      </span>
                      {c.is_primary && (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Commercial & Billing Details */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Commercial &amp; Financial Details
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Monthly Price</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {propertyDrawerData?.property?.monthly_price !== null && propertyDrawerData?.property?.monthly_price !== undefined
                ? `$${Number(propertyDrawerData.property.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : selectedPropForDrawer.monthly_price !== null && selectedPropForDrawer.monthly_price !== undefined
                ? `$${Number(selectedPropForDrawer.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Recurring revenue</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Base Price</span>
            <span className="text-base font-bold text-slate-700 dark:text-slate-300">
              {propertyDrawerData?.property?.base_price !== null && propertyDrawerData?.property?.base_price !== undefined
                ? `$${Number(propertyDrawerData.property.base_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Before added services</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Services Cost</span>
            <span className="text-base font-bold text-purple-600 dark:text-purple-400">
              ${Number(propertyDrawerData?.stats?.services_monthly_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {propertyDrawerData?.services?.length || 0} active services
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Onboarding Date</span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.onboarding_date || selectedPropForDrawer.onboarding_date || '—'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Billing start date</span>
          </div>
        </div>

        {/* Billing Status Quick Selector Inside Overview Drawer */}
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Property Billing Status</span>
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              Change billing status between Billing Done and Billing Pending anytime
            </span>
          </div>
          <select
            value={
              (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                ? 'BILLING_DONE'
                : 'BILLING_PENDING'
            }
            onChange={(e) =>
              handleQuickUpdateBillingStatus(
                selectedPropForDrawer.id,
                e.target.value as 'BILLING_DONE' | 'BILLING_PENDING'
              )
            }
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${
              (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            }`}
          >
            <option value="BILLING_DONE">Billing Done (Billed)</option>
            <option value="BILLING_PENDING">Billing Pending</option>
          </select>
        </div>

        {/* Channel Partner Row */}
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Channel Partner</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {propertyDrawerData?.partner?.name || (selectedPropForDrawer as any).partner?.name || 'No Partner Assigned'}
              {propertyDrawerData?.partner?.company_name ? ` (${propertyDrawerData.partner.company_name})` : ''}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Partner Commission Rate</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {propertyDrawerData?.property?.partner_commission_override !== null && propertyDrawerData?.property?.partner_commission_override !== undefined
                ? `${propertyDrawerData.property.partner_commission_override}% (Custom Override)`
                : propertyDrawerData?.partner?.default_commission_rate !== undefined
                ? `${propertyDrawerData.partner.default_commission_rate}% (Default Rate)`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: System Audit & Dates */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2 text-[11.5px]">
        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">Ray Baum Act &amp; Kari&apos;s Law Compliance:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {propertyDrawerData?.property?.ray_baud_and_logs_enabled ? 'Active / Compliant' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">E911 Registry Status:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {propertyDrawerData?.e911?.property_e911_status || 'VERIFIED'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">Record Created At:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {propertyDrawerData?.property?.created_at ? new Date(propertyDrawerData.property.created_at).toLocaleString() : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium">Last Record Update:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {propertyDrawerData?.property?.updated_at ? new Date(propertyDrawerData.property.updated_at).toLocaleString() : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

