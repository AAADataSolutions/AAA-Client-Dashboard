'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Building2, ShieldCheck, X } from 'lucide-react';
import { PropertyItem } from '@/store/slices/propertiesSlice';

interface PropertyViewDetailsModalProps {
  showDetailsModal: boolean;
  setShowDetailsModal: (show: boolean) => void;
  selectedPropForDetails: PropertyItem | null;
  isSuperAdmin: boolean;
}

export function PropertyViewDetailsModal({
  showDetailsModal,
  setShowDetailsModal,
  selectedPropForDetails,
  isSuperAdmin,
}: PropertyViewDetailsModalProps) {
  return (
    <AnimatePresence>
      {showDetailsModal && selectedPropForDetails && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Property Overview</h3>
                  <p className="text-xs text-slate-500">{selectedPropForDetails.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs">
              {/* 2-Column Grid with Pure Black Bold Labels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.name}
                  </p>
                </div>
                {isSuperAdmin && (
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block text-xs">Monthly Price</label>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                      {selectedPropForDetails.monthly_price !== null && selectedPropForDetails.monthly_price !== undefined
                        ? `$${Number(selectedPropForDetails.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : 'Not set'}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Client</label>
                  <div className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>
                      {selectedPropForDetails.organization_name ||
                        (selectedPropForDetails as any).primary_organization?.name ||
                        (selectedPropForDetails as any).organizations?.[0]?.name ||
                        'Unassigned'}
                    </span>
                    {selectedPropForDetails.organization_name &&
                      selectedPropForDetails.organization_name !== 'Unassigned' &&
                      ((selectedPropForDetails as any).organization_type === 'INDIVIDUAL' ||
                      (selectedPropForDetails as any).primary_organization?.type === 'INDIVIDUAL' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Individual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Group
                        </span>
                      ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Channel Partner</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {(selectedPropForDetails as any).partner?.name ||
                      (selectedPropForDetails as any).partner_name ||
                      'No Partner Assigned'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Partner Revenue Share</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                    {(selectedPropForDetails as any).partner_commission_override !== null &&
                    (selectedPropForDetails as any).partner_commission_override !== undefined &&
                    (selectedPropForDetails as any).partner_commission_override !== ''
                      ? `${(selectedPropForDetails as any).partner_commission_override}% (Custom Override)`
                      : (selectedPropForDetails as any).partner?.default_commission_rate !== undefined
                      ? `${(selectedPropForDetails as any).partner.default_commission_rate}% (Default Rate)`
                      : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Main Phone Number</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.main_phone || (selectedPropForDetails as any).phone || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Fax Number</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.fax || (selectedPropForDetails as any).fax_number || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Street Address</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.address}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">City, State &amp; ZIP</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.city}, {selectedPropForDetails.state} {selectedPropForDetails.zip_code}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.general_manager_name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.general_manager_phone || selectedPropForDetails.main_phone || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {selectedPropForDetails.general_manager_email || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Property Status</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedPropForDetails.status === 'ACTIVE' || selectedPropForDetails.status === 'ONBOARDING'
                      ? 'Onboarded'
                      : selectedPropForDetails.status}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    Ray Baum Act Compliance: {selectedPropForDetails.ray_baud_and_logs_enabled ? 'Verified' : 'Not-Verified'}
                  </span>
                </div>
                <div className="text-slate-500 font-medium">
                  Services: {selectedPropForDetails.services_count || 0} active
                </div>
              </div>

              {/* Connectivity & Data Circuit Details Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
                    Connectivity &amp; Data Circuit
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                    {(() => {
                      const ct =
                        selectedPropForDetails.connectivity_type ||
                        (selectedPropForDetails.data_circuit ? 'BOTH' : 'PORTED');
                      if (ct === 'BOTH') return 'Ported & Data Circuited';
                      if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                      return 'Ported';
                    })()}
                  </span>
                </div>

                {selectedPropForDetails.data_circuit ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-[#222430]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Carrier Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {selectedPropForDetails.data_circuit.carrier_name || 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Bandwidth</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {selectedPropForDetails.data_circuit.bandwidth || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Circuit Pricing</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedPropForDetails.data_circuit.circuit_monthly_price !== null &&
                          selectedPropForDetails.data_circuit.circuit_monthly_price !== undefined
                            ? `$${Number(selectedPropForDetails.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Wholesaler (Admin Only)</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {selectedPropForDetails.data_circuit.wholesaler_name || '—'}
                          {selectedPropForDetails.data_circuit.revenue_share_percentage
                            ? ` (${selectedPropForDetails.data_circuit.revenue_share_percentage}% share)`
                            : ''}
                        </span>
                      </div>
                    </div>

                    {selectedPropForDetails.data_circuit.technical_details && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-[#222430]">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                          Technical Configuration (IP / WAN / Gateway)
                        </span>
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#222430] text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {selectedPropForDetails.data_circuit.technical_details}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 pt-1">
                    No Data Circuit provisioned for this property location.
                  </p>
                )}
              </div>
              <div className="hidden">
                <div></div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end shrink-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

