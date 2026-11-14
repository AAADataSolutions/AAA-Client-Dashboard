'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { PartnerOption, ServerOption, VendorOption, formatBilledDate } from './types';

interface PropertyOverviewCommercialSectionProps {
  isEditing: boolean;
  monthlyPrice: string;
  setMonthlyPrice: (v: string) => void;
  onboardingDate: string;
  setOnboardingDate: (v: string) => void;
  billingStatus: 'BILLING_DONE' | 'BILLING_PENDING';
  setBillingStatus: (v: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  partnerId: string;
  setPartnerId: (v: string) => void;
  partnerCommOverride: string;
  setPartnerCommOverride: (v: string) => void;
  rayBaumStatus: 'ACTIVE' | 'INACTIVE';
  setRayBaumStatus: (v: 'ACTIVE' | 'INACTIVE') => void;
  e911Status: 'VERIFIED' | 'AUDIT_REQUIRED';
  setE911Status: (v: 'VERIFIED' | 'AUDIT_REQUIRED') => void;
  isRayBaumActive: boolean;
  isE911Verified: boolean;
  e911DisplayText: string;
  propertyDrawerData: any;
  selectedPropForDrawer: PropertyRecord;
  localPartners: PartnerOption[];
  serverId?: string;
  setServerId?: (v: string) => void;
  vendorId?: string;
  setVendorId?: (v: string) => void;
  serverOptions?: ServerOption[];
  vendorOptions?: VendorOption[];
}

export function PropertyOverviewCommercialSection({
  isEditing,
  monthlyPrice,
  setMonthlyPrice,
  onboardingDate,
  setOnboardingDate,
  billingStatus,
  setBillingStatus,
  handleQuickUpdateBillingStatus,
  partnerId,
  setPartnerId,
  partnerCommOverride,
  setPartnerCommOverride,
  rayBaumStatus,
  setRayBaumStatus,
  e911Status,
  setE911Status,
  isRayBaumActive,
  isE911Verified,
  e911DisplayText,
  propertyDrawerData,
  selectedPropForDrawer,
  localPartners,
  serverId = '',
  setServerId,
  vendorId = '',
  setVendorId,
  serverOptions = [],
  vendorOptions = [],
}: PropertyOverviewCommercialSectionProps) {
  return (
    <>
      {/* Section 3: Commercial & Billing Details */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Commercial &amp; Financial Details
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Monthly Price ($)</span>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded text-slate-900 dark:text-white font-black text-sm"
              />
            ) : (
              <span className="text-base font-black text-slate-900 dark:text-white block">
                {propertyDrawerData?.property?.monthly_price !== null && propertyDrawerData?.property?.monthly_price !== undefined
                  ? `$${Number(propertyDrawerData.property.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : selectedPropForDrawer.monthly_price !== null && selectedPropForDrawer.monthly_price !== undefined
                  ? `$${Number(selectedPropForDrawer.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </span>
            )}
            <span className="text-[10px] text-slate-400 block mt-0.5">Recurring revenue</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Onboarding Date</span>
            {isEditing ? (
              <input
                type="date"
                value={onboardingDate}
                onChange={(e) => setOnboardingDate(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded text-slate-900 dark:text-white font-mono text-xs cursor-pointer"
              />
            ) : (
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block">
                {propertyDrawerData?.property?.onboarding_date || selectedPropForDrawer.onboarding_date || '—'}
              </span>
            )}
            <span className="text-[10px] text-slate-400 block mt-0.5">Billing start date</span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Billing Status</span>
            <select
              value={isEditing ? billingStatus : ((propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE' ? 'BILLING_DONE' : 'BILLING_PENDING')}
              onChange={(e) => {
                const val = e.target.value as 'BILLING_DONE' | 'BILLING_PENDING';
                if (isEditing) {
                  setBillingStatus(val);
                } else {
                  handleQuickUpdateBillingStatus(selectedPropForDrawer.id, val);
                }
              }}
              className={`w-full px-2 py-1 rounded text-xs font-bold border cursor-pointer focus:outline-none ${
                (isEditing ? billingStatus : (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status)) === 'BILLING_DONE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              }`}
            >
              <option value="BILLING_DONE">Billing Done</option>
              <option value="BILLING_PENDING">Billing Pending</option>
            </select>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {formatBilledDate(propertyDrawerData?.property?.billed_date || selectedPropForDrawer.onboarding_date) || 'Pending'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Services Cost</span>
            <span className="text-base font-bold text-purple-600 dark:text-purple-400 block">
              ${Number(propertyDrawerData?.stats?.services_monthly_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {propertyDrawerData?.services?.length || 0} active services
            </span>
          </div>
        </div>

        {/* Channel Partner Row */}
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold mb-1">Channel Partner</span>
            {isEditing ? (
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">No Partner Assigned</option>
                {localPartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.company_name ? `(${p.company_name})` : ''} - {p.default_commission_rate}%
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                {propertyDrawerData?.partner?.name || (selectedPropForDrawer as any).partner?.name || 'No Partner Assigned'}
                {propertyDrawerData?.partner?.company_name ? ` (${propertyDrawerData.partner.company_name})` : ''}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-bold mb-1">Partner Commission Rate (%)</span>
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={partnerCommOverride}
                onChange={(e) => setPartnerCommOverride(e.target.value)}
                placeholder="Default / Custom %"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white"
              />
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                {propertyDrawerData?.property?.partner_commission_override !== null && propertyDrawerData?.property?.partner_commission_override !== undefined
                  ? `${propertyDrawerData.property.partner_commission_override}% (Custom Override)`
                  : propertyDrawerData?.partner?.default_commission_rate !== undefined
                  ? `${propertyDrawerData.partner.default_commission_rate}% (Default Rate)`
                  : '—'}
              </span>
            )}
          </div>
        </div>

        {/* Assigned Server & Vendor Row */}
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold mb-1">Assigned Server</span>
            {isEditing && setServerId ? (
              <select
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">No Server Assigned</option>
                {serverOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.provider ? ` (${s.provider})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                {propertyDrawerData?.server?.name || (selectedPropForDrawer as any).server?.name || (selectedPropForDrawer as any).server_name || 'No Server Assigned'}
                {propertyDrawerData?.server?.provider ? ` (${propertyDrawerData.server.provider})` : ''}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-bold mb-1">Assigned Vendor</span>
            {isEditing && setVendorId ? (
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="">No Vendor Assigned</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}{v.category ? ` (${v.category})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                {propertyDrawerData?.vendor?.name || (selectedPropForDrawer as any).vendor?.name || (selectedPropForDrawer as any).vendor_name || 'No Vendor Assigned'}
                {propertyDrawerData?.vendor?.category ? ` (${propertyDrawerData.vendor.category})` : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: System Audit, Compliance & Dates */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5 text-[11.5px]">
        {/* Ray Baum Status row */}
        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">Ray Baum Act &amp; Kari&apos;s Law Compliance:</span>
          {isEditing ? (
            <select
              value={rayBaumStatus}
              onChange={(e) => setRayBaumStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
              className={`font-bold px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                rayBaumStatus === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              }`}
            >
              <option value="ACTIVE">Active (Compliant)</option>
              <option value="INACTIVE">Inactive (Non-Compliant)</option>
            </select>
          ) : isRayBaumActive ? (
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active / Compliant
            </span>
          ) : (
            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Inactive (Non-Compliant)
            </span>
          )}
        </div>

        {/* E911 Registry Status row */}
        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">E911 PSAP Registry Status:</span>
          {isEditing ? (
            <select
              value={e911Status}
              onChange={(e) => setE911Status(e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED')}
              className={`font-bold px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                e911Status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
              }`}
            >
              <option value="VERIFIED">Verified (PSAP Active)</option>
              <option value="AUDIT_REQUIRED">Audit Required (Pending)</option>
            </select>
          ) : (
            <span
              className={`font-bold ${
                isE911Verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {e911DisplayText}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-[#222430]">
          <span className="text-slate-500 font-medium">Record Created At:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {propertyDrawerData?.property?.created_at
              ? new Date(propertyDrawerData.property.created_at).toLocaleString()
              : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-500 font-medium">Last Record Update:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {propertyDrawerData?.property?.updated_at
              ? new Date(propertyDrawerData.property.updated_at).toLocaleString()
              : '—'}
          </span>
        </div>
      </div>
    </>
  );
}
