'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Check,
  Copy,
  ExternalLink,
  Wifi,
  Settings,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';
import { PropertyDrawerDataCircuitManager } from './PropertyDrawerDataCircuitManager';
import ManageDataCircuitModal from '@/app/admin/data-circuits/_components/ManageDataCircuitModal';
import { WholesalerItem } from '@/app/admin/data-circuits/_components/types';
import { PropertyMasterDrawerTab5Docs } from './PropertyMasterDrawerTab5Docs';

interface PropertyMasterDrawerTab4And5Props {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  onDataChanged?: () => void;
}

export function PropertyMasterDrawerTab4And5({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  copiedField,
  handleCopy,
  onDataChanged,
}: PropertyMasterDrawerTab4And5Props) {
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalTab, setModalTab] = useState<'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW'>('PRICING');
  const [wholesalers, setWholesalers] = useState<WholesalerItem[]>([]);
  const [localCircuit, setLocalCircuit] = useState<any | null>(null);
  const [creatingCircuit, setCreatingCircuit] = useState(false);

  const currentCircuit = propertyDrawerData?.data_circuit || null;

  useEffect(() => {
    fetch('/api/admin/data-circuits/wholesalers')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setWholesalers(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const activeCircuit = useMemo(() => {
    const raw = localCircuit || currentCircuit;
    if (!raw) return null;
    return {
      ...raw,
      property_name: raw.property_name || selectedPropForDrawer.name,
      property_address: raw.property_address || selectedPropForDrawer.address,
    };
  }, [localCircuit, currentCircuit, selectedPropForDrawer]);

  const handleCircuitReload = useCallback(async () => {
    if (onDataChanged) onDataChanged();
    if (selectedPropForDrawer?.id) {
      try {
        const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}/details`);
        const json = await res.json();
        if (json.success && json.data?.data_circuit) {
          setLocalCircuit(json.data.data_circuit);
        }
      } catch (e) {
        console.error('Failed to reload circuit', e);
      }
    }
  }, [onDataChanged, selectedPropForDrawer?.id]);

  const handleOpenCircuitModal = async (
    targetTab: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW' = 'PRICING'
  ) => {
    setModalTab(targetTab);
    if (currentCircuit) {
      setLocalCircuit(currentCircuit);
      setShowManageModal(true);
      return;
    }
    try {
      setCreatingCircuit(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedPropForDrawer.id,
          status: 'STARTED',
          connectivity_type: 'BOTH',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setLocalCircuit(json.data);
        if (onDataChanged) onDataChanged();
        setShowManageModal(true);
      }
    } catch (err) {
      console.error('Failed to create initial data circuit', err);
    } finally {
      setCreatingCircuit(false);
    }
  };

  const handleModalToast = (title: string, message?: string, type?: 'success' | 'error' | 'info') => {
    console.log(`[${type || 'info'}] ${title}: ${message || ''}`);
  };

  return (
    <>
      {/* 4-Tab Dedicated Data Circuit Modal (Wholesaler Pricing, Lifecycle Stages & Agreement PDF, Tech Details, Quotation Preview) */}
      <ManageDataCircuitModal
        showManageModal={showManageModal && !!activeCircuit}
        onClose={() => setShowManageModal(false)}
        selectedCircuit={activeCircuit}
        modalTab={modalTab}
        setModalTab={setModalTab}
        wholesalers={wholesalers}
        onReload={handleCircuitReload}
        onToast={handleModalToast}
      />

      {/* TAB 4: DATA CIRCUIT ("DATA SUBJECT" / DATA CIRCUIT DETAILS) */}
      {drawerTab === 'DATA_CIRCUIT' && (
        <div className="space-y-4">
          {/* Header Action Bar to Open Creation / Management Modal */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-sm">Data Circuit Provisioning</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-bold mt-0.5">
                  {currentCircuit
                    ? `Stage: ${currentCircuit.status?.replace(/_/g, ' ') || 'STARTED'}`
                    : 'No Active Circuit Assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={creatingCircuit}
                onClick={() => handleOpenCircuitModal('PRICING')}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {currentCircuit ? <Settings className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{currentCircuit ? 'Manage Circuit Modal' : 'Create Data Circuit'}</span>
              </button>
              {currentCircuit && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-xs">
                  {currentCircuit.status || 'STARTED'}
                </span>
              )}
            </div>
          </div>

          {currentCircuit ? (
            <>
              {/* Carrier & Client Pricing Specs */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                  Carrier &amp; Pricing Parameters
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Carrier (Client Sees)</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                      {currentCircuit.carrier_name || 'Pending Selection'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Bandwidth</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                      {currentCircuit.bandwidth || '1 Gig'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Client Monthly Price</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                      $
                      {Number(currentCircuit.circuit_monthly_price || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      /mo
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Wholesaler (Hidden)</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 text-sm mt-0.5 block">
                      {currentCircuit.wholesaler_name || '—'}
                    </span>
                  </div>
                </div>

                {/* Wholesaler Revenue Share Breakdown */}
                <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Wholesaler Revenue Share Percentage</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {currentCircuit.revenue_share_percentage || 0}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Estimated Monthly Revenue Share</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${Number(currentCircuit.monthly_revenue_share_amount || 0).toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              </div>

              {/* Full Descriptive Technical Details */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">
                    Descriptive Technical Information (WAN IP, IP Address, Gateway, DNS, etc.)
                  </span>
                  {currentCircuit.technical_details && (
                    <button
                      onClick={() => handleCopy(currentCircuit.technical_details, 'tech-details-copy')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {copiedField === 'tech-details-copy' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Technical Details</span>
                    </button>
                  )}
                </div>

                {currentCircuit.technical_details ? (
                  <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                    {currentCircuit.technical_details}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-slate-400 text-xs">
                    No technical details recorded yet for this circuit.
                  </div>
                )}
              </div>

              {/* Lifecycle Milestones & Signed Agreement */}
              <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5 text-xs">
                <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
                  Lifecycle Milestones &amp; Agreement Documents
                </span>

                <div className="space-y-2">
                  <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                    <span>Signed Agreement PDF:</span>
                    {currentCircuit.agreement_file_url ? (
                      <a
                        href={currentCircuit.agreement_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">No agreement uploaded</span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                    <span>Site Survey Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        currentCircuit.site_survey_status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {currentCircuit.site_survey_status || 'PENDING'}
                    </span>
                  </div>

                  {currentCircuit.site_survey_notes && (
                    <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Site Survey Notes:</span>
                      <p className="text-slate-700 dark:text-slate-300">{currentCircuit.site_survey_notes}</p>
                    </div>
                  )}

                  {currentCircuit.foc_pending_actions_notes && (
                    <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg">
                      <span className="text-[10px] text-slate-400 block mb-0.5">Pending Action Notes:</span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{currentCircuit.foc_pending_actions_notes}</p>
                    </div>
                  )}

                  <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                    <span>Firm Order Commitment (FOC) Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        currentCircuit.foc_status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {currentCircuit.foc_status || 'PENDING_ACTIONS'}
                    </span>
                  </div>

                  {currentCircuit.foc_date && (
                    <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                      <span>FOC Cutover Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {new Date(currentCircuit.foc_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Administration & Financial Notes */}
              {currentCircuit.internal_admin_notes && (
                <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-1.5 text-xs">
                  <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block">
                    Internal Admin &amp; Wholesale Pricing Notes
                  </span>
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-amber-900 dark:text-amber-200">
                    <p className="whitespace-pre-wrap">{currentCircuit.internal_admin_notes}</p>
                  </div>
                </div>
              )}

              {/* In-Drawer Data Circuit Stage & Parameter Manager */}
              <PropertyDrawerDataCircuitManager
                circuit={currentCircuit}
                propertyId={selectedPropForDrawer.id}
                propertyName={selectedPropForDrawer.name}
                connectivityType={selectedPropForDrawer.connectivity_type || 'BOTH'}
                onDataChanged={onDataChanged}
              />

              {/* Direct Link to Global Circuit Pipeline */}
              <div className="pt-2 flex justify-end">
                <a
                  href={`/admin/data-circuits?search=${encodeURIComponent(selectedPropForDrawer.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#222430] dark:hover:bg-[#2c2f3e] text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Open Circuit in Global Provisioning Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-[#222430] rounded-2xl space-y-3">
              <Wifi className="w-8 h-8 mx-auto text-slate-400" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Ported Only — No Data Circuit Attached
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  This property currently has Voice/DID services without an active dedicated Data Circuit pipeline.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={creatingCircuit}
                  onClick={() => handleOpenCircuitModal('PRICING')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{creatingCircuit ? 'Initializing Circuit...' : 'Create Data Circuit for this Property'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PORTING DOCS & IMAGES (VIEW, UPLOAD & DELETE) */}
      <PropertyMasterDrawerTab5Docs
        drawerTab={drawerTab}
        selectedPropForDrawer={selectedPropForDrawer}
        propertyDrawerData={propertyDrawerData}
        onDataChanged={onDataChanged}
      />
    </>
  );
}
