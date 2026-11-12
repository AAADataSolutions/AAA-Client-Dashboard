'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings, X, Loader2 } from 'lucide-react';
import { PropertyItem } from '@/store/slices/propertiesSlice';
import { OrgOption, PartnerOption, PropertyFormData } from './types';

interface EditPropertyModalProps {
  showEditModal: boolean;
  setShowEditModal: (show: boolean) => void;
  selectedPropForEdit: PropertyItem | null;
  formData: PropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  formError: string | null;
  formLoading: boolean;
  handleSaveEdit: (e: React.FormEvent) => void;
  orgOptions: OrgOption[];
  partnerOptions: PartnerOption[];
  isSuperAdmin: boolean;
}

export function EditPropertyModal({
  showEditModal,
  setShowEditModal,
  selectedPropForEdit,
  formData,
  setFormData,
  formError,
  formLoading,
  handleSaveEdit,
  orgOptions,
  partnerOptions,
  isSuperAdmin,
}: EditPropertyModalProps) {
  return (
    <AnimatePresence>
      {showEditModal && selectedPropForEdit && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Property Details</h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">
                    Property Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Client</label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Client (Optional)</option>
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Main Phone No.</label>
                  <input
                    type="tel"
                    value={formData.main_phone}
                    onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Fax Number</label>
                  <input
                    type="tel"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    placeholder="+1 (555) 019-2835"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                {isSuperAdmin && (
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Base Monthly Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_price}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_price: e.target.value, base_price: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Total monthly rate will automatically include attached services
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Onboarding Date</label>
                  <input
                    type="date"
                    value={formData.onboarding_date}
                    onChange={(e) => setFormData({ ...formData, onboarding_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">Date from which monthly revenue begins</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Channel Partner</label>
                  <select
                    value={formData.partner_id}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const matched = partnerOptions.find((p) => p.id === pId);
                      setFormData({
                        ...formData,
                        partner_id: pId,
                        partner_commission_override: pId ? (matched ? matched.default_commission_rate : '') : '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No Partner Assigned</option>
                    {partnerOptions.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} {partner.company_name ? `(${partner.company_name})` : ''} -{' '}
                        {partner.default_commission_rate}%
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-black dark:text-white block">Partner Revenue Share (%)</label>
                    {formData.partner_id && (
                      <span className="text-[10px] text-slate-500 font-normal">
                        Partner Base: {partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10}%
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={!formData.partner_id}
                      value={formData.partner_commission_override}
                      onChange={(e) => setFormData({ ...formData, partner_commission_override: e.target.value })}
                      placeholder={
                        formData.partner_id
                          ? `${partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 0}% (Enter custom % to override)`
                          : 'Select a partner first'
                      }
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                  </div>
                  {isSuperAdmin && formData.partner_id && formData.monthly_price && Number(formData.monthly_price) > 0 && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>
                        Est. Monthly Partner Payout: $
                        {(
                          (Number(formData.monthly_price) *
                            Number(
                              formData.partner_commission_override !== '' && formData.partner_commission_override !== null
                                ? formData.partner_commission_override
                                : partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate || 0
                            )) /
                          100
                        ).toFixed(2)}
                        /mo
                      </span>
                      {formData.partner_commission_override !== '' &&
                        formData.partner_commission_override !== null &&
                        Number(formData.partner_commission_override) !==
                          (partnerOptions.find((p) => p.id === formData.partner_id)?.default_commission_rate ?? 10) && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[9.5px]">
                            Custom Override Applied
                          </span>
                        )}
                    </p>
                  )}
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-black dark:text-white block">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">
                    State &amp; ZIP <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">GM Full Name</label>
                  <input
                    type="text"
                    value={formData.general_manager_name}
                    onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">GM Phone Number</label>
                  <input
                    type="tel"
                    value={formData.general_manager_phone}
                    onChange={(e) => setFormData({ ...formData, general_manager_phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-black dark:text-white block">GM Email</label>
                  <input
                    type="email"
                    value={formData.general_manager_email}
                    onChange={(e) => setFormData({ ...formData, general_manager_email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">E911 Compliance Status</label>
                  <select
                    value={formData.e911_status}
                    onChange={(e) => {
                      const val = e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED';
                      setFormData({
                        ...formData,
                        e911_status: val,
                        ray_baud_and_logs_enabled: val === 'VERIFIED',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="VERIFIED">PSAP Verified (Active)</option>
                    <option value="AUDIT_REQUIRED">Audit Required (Pending)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Ray Baum and Kari&apos;s Law</label>
                  <select
                    value={formData.ray_baum_status}
                    onChange={(e) => {
                      const val = e.target.value as 'ACTIVE' | 'INACTIVE';
                      setFormData({
                        ...formData,
                        ray_baum_status: val,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Active (Compliant)</option>
                    <option value="INACTIVE">Inactive (Non-Compliant)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Billing Status</label>
                  <select
                    value={formData.billing_status}
                    onChange={(e) =>
                      setFormData({ ...formData, billing_status: e.target.value as 'BILLING_DONE' | 'BILLING_PENDING' })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="BILLING_DONE">Billing Done (Billed)</option>
                    <option value="BILLING_PENDING">Billing Pending</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-black dark:text-white block">Property Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222430] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

