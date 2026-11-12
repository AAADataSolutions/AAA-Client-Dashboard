'use client';

import React from 'react';
import {
  Loader2,
  Hotel,
  MapPin,
  ShieldCheck,
  User,
  Save,
} from 'lucide-react';
import { OrgOption, PartnerOption } from './portingTypes';

interface PortingDetailsTabProps {
  detailForm: {
    property_name: string;
    organization_id: string;
    partner_id: string;
    partner_commission_override: string | number;
    property_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    property_phone: string;
    fax: string;
    monthly_price: string | number;
    general_manager_name: string;
    general_manager_phone: string;
    general_manager_email: string;
    e911_status: 'VERIFIED' | 'AUDIT_REQUIRED';
    ray_baud_and_logs_enabled: boolean;
    ray_baum_status: 'ACTIVE' | 'INACTIVE';
    carrier_details: string;
    target_date: string;
    notes: string;
  };
  setDetailForm: React.Dispatch<React.SetStateAction<any>>;
  orgOptions: OrgOption[];
  partnerOptions: PartnerOption[];
  isSuperAdmin: boolean;
  savingDetails: boolean;
  handleSaveDetailsSubmit: (e: React.FormEvent) => void;
}

export function PortingDetailsTab({
  detailForm,
  setDetailForm,
  orgOptions,
  partnerOptions,
  isSuperAdmin,
  savingDetails,
  handleSaveDetailsSubmit,
}: PortingDetailsTabProps) {
  return (
    <form onSubmit={handleSaveDetailsSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
          <Hotel className="w-4 h-4 text-blue-500" /> Comprehensive Property Details (Editable)
        </p>
        <span className="text-[11px] text-slate-400">All fields sync with properties and client dashboard</span>
      </div>

      {/* Section 1: Property & Org Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Property Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={detailForm.property_name}
            onChange={(e) => setDetailForm((p: any) => ({ ...p, property_name: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Client
          </label>
          <select
            value={detailForm.organization_id}
            onChange={(e) => setDetailForm((p: any) => ({ ...p, organization_id: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Unassigned (None) --</option>
            {orgOptions.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Main Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={detailForm.property_phone}
            onChange={(e) => setDetailForm((p: any) => ({ ...p, property_phone: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Fax Number
          </label>
          <input
            type="tel"
            value={detailForm.fax}
            onChange={(e) => setDetailForm((p: any) => ({ ...p, fax: e.target.value }))}
            placeholder="e.g., (555) 987-6543"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {isSuperAdmin && (
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Monthly Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={detailForm.monthly_price}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, monthly_price: e.target.value }))}
              placeholder="e.g., 249.00"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Channel Partner
          </label>
          <select
            value={detailForm.partner_id}
            onChange={(e) => {
              const pId = e.target.value;
              const matched = partnerOptions.find((p) => p.id === pId);
              setDetailForm((p: any) => ({
                ...p,
                partner_id: pId,
                partner_commission_override: matched && (p.partner_commission_override === '' || p.partner_commission_override === null) ? matched.default_commission_rate : p.partner_commission_override,
              }));
            }}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
          >
            <option value="">No Partner Assigned</option>
            {partnerOptions.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} - {partner.default_commission_rate}%
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Partner Revenue Share (% Override)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              disabled={!detailForm.partner_id}
              value={detailForm.partner_commission_override}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, partner_commission_override: e.target.value }))}
              placeholder={
                detailForm.partner_id
                  ? `${partnerOptions.find((p) => p.id === detailForm.partner_id)?.default_commission_rate ?? 0}% (Default Rate)`
                  : 'Select a partner first'
              }
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
          </div>
          {isSuperAdmin && detailForm.partner_id && detailForm.monthly_price && Number(detailForm.monthly_price) > 0 && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              Est. Monthly Partner Payout: $
              {(
                (Number(detailForm.monthly_price) *
                  Number(
                    detailForm.partner_commission_override !== ''
                      ? detailForm.partner_commission_override
                      : partnerOptions.find((p) => p.id === detailForm.partner_id)?.default_commission_rate || 0
                  )) /
                100
              ).toFixed(2)}
              /mo
            </p>
          )}
        </div>

        <div>
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Target Cutover Date
          </label>
          <input
            type="date"
            value={detailForm.target_date ? detailForm.target_date.split('T')[0] : ''}
            onChange={(e) => setDetailForm((p: any) => ({ ...p, target_date: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Section 2: Address */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-500" /> Physical &amp; Emergency Address
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-4">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={detailForm.property_address}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, property_address: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              City
            </label>
            <input
              type="text"
              value={detailForm.city}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              State
            </label>
            <input
              type="text"
              value={detailForm.state}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, state: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              value={detailForm.zip_code}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, zip_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 3: General Manager Contacts */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
          <User className="w-4 h-4 text-purple-500" /> General Manager / Onsite Contact
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Full Name
            </label>
            <input
              type="text"
              value={detailForm.general_manager_name}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, general_manager_name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Phone Number
            </label>
            <input
              type="tel"
              value={detailForm.general_manager_phone}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, general_manager_phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Email Address
            </label>
            <input
              type="email"
              value={detailForm.general_manager_email}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, general_manager_email: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Compliance & Carrier Info */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500" /> Compliance Status &amp; Carrier Notes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              E911 Compliance Status
            </label>
            <select
              value={detailForm.e911_status}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, e911_status: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="VERIFIED">PSAP Verified (Compliant)</option>
              <option value="AUDIT_REQUIRED">Audit Required</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ray Baum &amp; Kari&apos;s Law
            </label>
            <select
              value={detailForm.ray_baum_status}
              onChange={(e) => setDetailForm((p: any) => ({
                ...p,
                ray_baum_status: e.target.value as any,
                ray_baud_and_logs_enabled: e.target.value === 'ACTIVE',
              }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Active (Compliant)</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Carrier Details / Porting Instructions
            </label>
            <textarea
              rows={2}
              value={detailForm.carrier_details}
              onChange={(e) => setDetailForm((p: any) => ({ ...p, carrier_details: e.target.value }))}
              placeholder="Carrier details, losing carrier account number, PIN..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Save Details Button */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430]">
        <button
          type="submit"
          disabled={savingDetails}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {savingDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Property Details</span>
        </button>
      </div>
    </form>
  );
}
