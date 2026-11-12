'use client';

import React from 'react';
import {
  Hotel,
  DollarSign,
  MapPin,
  User,
  ShieldCheck,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import { LifecycleStage, OrgOption, PartnerOption, STAGES_ROAD, formatFileSize } from './portingTypes';

interface PortingCreateFormFieldsProps {
  createForm: any;
  setCreateForm: React.Dispatch<React.SetStateAction<any>>;
  createFiles: File[];
  setCreateFiles: React.Dispatch<React.SetStateAction<File[]>>;
  orgOptions: OrgOption[];
  partnerOptions: PartnerOption[];
  isSuperAdmin: boolean;
}

export function PortingCreateFormFields({
  createForm,
  setCreateForm,
  createFiles,
  setCreateFiles,
  orgOptions,
  partnerOptions,
  isSuperAdmin,
}: PortingCreateFormFieldsProps) {
  return (
    <>
      {/* 1. BASIC PROPERTY & ORG INFO */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Hotel className="w-4 h-4 text-blue-500" /> Property &amp; Organization Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Client
            </label>
            <select
              value={createForm.organization_id}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, organization_id: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Unassigned (None) --</option>
              {orgOptions.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Property Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Grand Hotel Downtown"
              value={createForm.property_name}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, property_name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Main Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., (555) 123-4567"
              value={createForm.property_phone}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, property_phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Fax Number
            </label>
            <input
              type="tel"
              placeholder="e.g., (555) 987-6543"
              value={createForm.fax}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, fax: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {isSuperAdmin && (
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Monthly Price ($)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 249.00"
                  value={createForm.monthly_price}
                  onChange={(e) => setCreateForm((p: any) => ({ ...p, monthly_price: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Channel Partner
            </label>
            <select
              value={createForm.partner_id}
              onChange={(e) => {
                const pId = e.target.value;
                const matched = partnerOptions.find((p) => p.id === pId);
                setCreateForm((p: any) => ({
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
                disabled={!createForm.partner_id}
                value={createForm.partner_commission_override}
                onChange={(e) => setCreateForm((p: any) => ({ ...p, partner_commission_override: e.target.value }))}
                placeholder={
                  createForm.partner_id
                    ? `${partnerOptions.find((p) => p.id === createForm.partner_id)?.default_commission_rate ?? 0}% (Default Rate)`
                    : 'Select a partner first'
                }
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
            </div>
            {isSuperAdmin && createForm.partner_id && createForm.monthly_price && Number(createForm.monthly_price) > 0 && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                Est. Monthly Partner Payout: $
                {(
                  (Number(createForm.monthly_price) *
                    Number(
                      createForm.partner_commission_override !== ''
                        ? createForm.partner_commission_override
                        : partnerOptions.find((p) => p.id === createForm.partner_id)?.default_commission_rate || 0
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
              value={createForm.target_date}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, target_date: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 2. PHYSICAL LOCATION ADDRESS */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-500" /> Physical Location &amp; Emergency Address
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-4">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Street Address
            </label>
            <input
              type="text"
              placeholder="e.g., 742 Evergreen Terrace"
              value={createForm.address}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, address: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              City
            </label>
            <input
              type="text"
              placeholder="e.g., Springfield"
              value={createForm.city}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              State
            </label>
            <input
              type="text"
              placeholder="e.g., OR"
              value={createForm.state}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, state: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ZIP Code
            </label>
            <input
              type="text"
              placeholder="e.g., 97477"
              value={createForm.zip_code}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, zip_code: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 3. GENERAL MANAGER / ONSITE CONTACT */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-purple-500" /> General Manager &amp; Onsite Contact
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Full Name
            </label>
            <input
              type="text"
              placeholder="e.g., Sarah Connor"
              value={createForm.general_manager_name}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, general_manager_name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g., (555) 345-6789"
              value={createForm.general_manager_phone}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, general_manager_phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              GM Email Address
            </label>
            <input
              type="email"
              placeholder="e.g., gm@grandhotel.com"
              value={createForm.general_manager_email}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, general_manager_email: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. COMPLIANCE & LIFECYCLE STAGE */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500" /> Compliance &amp; Initial Stage
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Initial Lifecycle Stage
            </label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, status: e.target.value as LifecycleStage }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {STAGES_ROAD.map((s) => (
                <option key={s.key} value={s.key}>Stage {s.step}: {s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              E911 Compliance Status
            </label>
            <select
              value={createForm.e911_status}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, e911_status: e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED' }))}
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
              value={createForm.ray_baum_status}
              onChange={(e) => setCreateForm((p: any) => ({
                ...p,
                ray_baum_status: e.target.value as 'ACTIVE' | 'INACTIVE',
                ray_baud_and_logs_enabled: e.target.value === 'ACTIVE',
              }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-semibold cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Active (Compliant)</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Losing Carrier &amp; Porting Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Losing carrier: Verizon, Account #: 987123847, PIN: 1234"
              value={createForm.carrier_details}
              onChange={(e) => setCreateForm((p: any) => ({ ...p, carrier_details: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 5. ATTACHMENTS UPLOAD */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-[#222430]">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="w-4 h-4 text-indigo-500" /> Porting Documents &amp; Authorizations (PDFs &amp; Images)
        </h4>

        <div className="border border-dashed border-slate-300 dark:border-[#2a2c3a] rounded-xl p-4 bg-slate-50/50 dark:bg-[#111217]/50 text-center hover:bg-slate-50 dark:hover:bg-[#111217] transition">
          <input
            type="file"
            multiple
            id="create-porting-files"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) {
                setCreateFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
              }
            }}
          />
          <label
            htmlFor="create-porting-files"
            className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-600 dark:text-slate-400"
          >
            <Upload className="w-6 h-6 text-blue-500" />
            <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
              Click to upload LOA, CSR, contracts or billing copies
            </span>
            <span className="text-[10px] text-slate-400">
              PDF, DOCX, CSV, PNG, JPG (Multiple files supported)
            </span>
          </label>
        </div>

        {createFiles.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Selected Files ({createFiles.length})
            </span>
            <div className="space-y-1">
              {createFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
