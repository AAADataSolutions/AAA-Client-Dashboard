'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  PhoneCall,
  ShieldCheck,
  Wifi,
  FileText,
  RefreshCw,
  X,
  MapPin,
  Loader2,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType, ServiceCreateFormData } from './types';
import { PropertyMasterDrawerTab1Overview } from './PropertyMasterDrawerTab1Overview';
import { PropertyMasterDrawerTab2And3 } from './PropertyMasterDrawerTab2And3';
import { PropertyMasterDrawerTab4And5 } from './PropertyMasterDrawerTab4And5';
import { PropertyMasterDrawerTab6Pbx } from './PropertyMasterDrawerTab6Pbx';
import { PropertyDrawerProvisionServiceModal } from './PropertyDrawerProvisionServiceModal';

export interface PropertyMasterDrawerProps {
  showPropertyDrawer: boolean;
  setShowPropertyDrawer: (show: boolean) => void;
  selectedPropForDrawer: PropertyRecord | null;
  propertyDrawerData: any;
  loadingDrawerData: boolean;
  refreshDrawerData: (propId: string) => void;
  drawerTab: DrawerTabType;
  setDrawerTab: (tab: DrawerTabType) => void;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  handleOpenCreateServiceInDrawer: () => void;
  handleDrawerAssignService: (e: React.FormEvent) => void;
  drawerAssignServiceId: string;
  setDrawerAssignServiceId: (id: string) => void;
  assigningServiceInDrawer: boolean;
  handleDrawerUnassignService: (serviceId: string, serviceName: string) => void;
  unassigningServiceId: string | null;
  showCreateServiceInDrawerModal: boolean;
  setShowCreateServiceInDrawerModal: (show: boolean) => void;
  serviceCreateForm: ServiceCreateFormData;
  setServiceCreateForm: React.Dispatch<React.SetStateAction<ServiceCreateFormData>>;
  serviceCreateError: string | null;
  creatingServiceInDrawer: boolean;
  handleCreateServiceInDrawerSubmit: (e: React.FormEvent) => void;
  availableDrawerServiceTypes: string[];
  showCustomSvcIdInDrawer: boolean;
  setShowCustomSvcIdInDrawer: (show: boolean) => void;
}

export function PropertyMasterDrawer({
  showPropertyDrawer,
  setShowPropertyDrawer,
  selectedPropForDrawer,
  propertyDrawerData,
  loadingDrawerData,
  refreshDrawerData,
  drawerTab,
  setDrawerTab,
  copiedField,
  handleCopy,
  handleQuickUpdateBillingStatus,
  handleOpenCreateServiceInDrawer,
  handleDrawerAssignService,
  drawerAssignServiceId,
  setDrawerAssignServiceId,
  assigningServiceInDrawer,
  handleDrawerUnassignService,
  unassigningServiceId,
  showCreateServiceInDrawerModal,
  setShowCreateServiceInDrawerModal,
  serviceCreateForm,
  setServiceCreateForm,
  serviceCreateError,
  creatingServiceInDrawer,
  handleCreateServiceInDrawerSubmit,
  availableDrawerServiceTypes,
  showCustomSvcIdInDrawer,
  setShowCustomSvcIdInDrawer,
}: PropertyMasterDrawerProps) {
  return (
    <>
      {/* 10. COMPREHENSIVE PROPERTY RIGHT-SIDE DRAWER (ALL TABS) */}
      <AnimatePresence>
        {showPropertyDrawer && selectedPropForDrawer && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setShowPropertyDrawer(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 overflow-hidden"
            >
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/80 dark:bg-[#111217] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 dark:text-white text-base">
                        {selectedPropForDrawer.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                        {selectedPropForDrawer.status === 'ACTIVE' || selectedPropForDrawer.status === 'ONBOARDING'
                          ? 'ONBOARDED'
                          : selectedPropForDrawer.status || 'ACTIVE'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          (propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                        }`}
                      >
                        {(propertyDrawerData?.property?.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
                          ? 'BILLING DONE'
                          : 'BILLING PENDING'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                        {(() => {
                          const ct = selectedPropForDrawer.connectivity_type || (selectedPropForDrawer.data_circuit ? 'BOTH' : 'PORTED');
                          if (ct === 'BOTH') return 'Ported & Data Circuited';
                          if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                          return 'Ported';
                        })()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>
                        {selectedPropForDrawer.address
                          ? `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city || ''}, ${selectedPropForDrawer.state || ''} ${selectedPropForDrawer.zip_code || ''}`
                          : 'Property Master Record'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => refreshDrawerData(selectedPropForDrawer.id)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDrawerData ? 'animate-spin text-blue-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowPropertyDrawer(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center border-b border-slate-200 dark:border-[#222430] px-4 bg-white dark:bg-[#15161c] text-xs font-bold shrink-0 overflow-x-auto">
                {[
                  { key: 'OVERVIEW', label: '1. Overview', icon: Building2 },
                  {
                    key: 'SERVICES',
                    label: `2. Services (${propertyDrawerData?.services?.length ?? selectedPropForDrawer.services_count ?? 0})`,
                    icon: PhoneCall,
                  },
                  { key: 'E911', label: '3. E911 State', icon: ShieldCheck },
                  {
                    key: 'DATA_CIRCUIT',
                    label: '4. Data Circuit',
                    icon: Wifi,
                  },
                  {
                    key: 'PORTING_DOCS',
                    label: `5. Porting Docs (${propertyDrawerData?.porting_attachments?.length ?? 0})`,
                    icon: FileText,
                  },
                  {
                    key: 'CALL_FORWARDING',
                    label: '6. Call Forwarding & CDR',
                    icon: PhoneCall,
                  },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = drawerTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setDrawerTab(t.key as DrawerTabType)}
                      className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                        isActive
                          ? 'border-black dark:border-white text-black dark:text-white'
                          : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {loadingDrawerData && !propertyDrawerData ? (
                  <div className="p-16 text-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-blue-600" />
                    <p className="font-medium">Loading complete property database details...</p>
                  </div>
                ) : (
                  <>
                    <PropertyMasterDrawerTab1Overview
                      drawerTab={drawerTab}
                      selectedPropForDrawer={selectedPropForDrawer}
                      propertyDrawerData={propertyDrawerData}
                      copiedField={copiedField}
                      handleCopy={handleCopy}
                      handleQuickUpdateBillingStatus={handleQuickUpdateBillingStatus}
                    />

                    <PropertyMasterDrawerTab2And3
                      drawerTab={drawerTab}
                      selectedPropForDrawer={selectedPropForDrawer}
                      propertyDrawerData={propertyDrawerData}
                      handleOpenCreateServiceInDrawer={handleOpenCreateServiceInDrawer}
                      handleDrawerAssignService={handleDrawerAssignService}
                      drawerAssignServiceId={drawerAssignServiceId}
                      setDrawerAssignServiceId={setDrawerAssignServiceId}
                      assigningServiceInDrawer={assigningServiceInDrawer}
                      copiedField={copiedField}
                      handleCopy={handleCopy}
                      handleDrawerUnassignService={handleDrawerUnassignService}
                      unassigningServiceId={unassigningServiceId}
                    />

                    <PropertyMasterDrawerTab4And5
                      drawerTab={drawerTab}
                      propertyDrawerData={propertyDrawerData}
                      copiedField={copiedField}
                      handleCopy={handleCopy}
                    />

                    <PropertyMasterDrawerTab6Pbx
                      drawerTab={drawerTab}
                      selectedPropForDrawer={selectedPropForDrawer}
                      propertyDrawerData={propertyDrawerData}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROVISION NEW SERVICE MODAL (FROM PROPERTY RIGHT SIDEBAR) */}
      <PropertyDrawerProvisionServiceModal
        showCreateServiceInDrawerModal={showCreateServiceInDrawerModal}
        setShowCreateServiceInDrawerModal={setShowCreateServiceInDrawerModal}
        selectedPropForDrawer={selectedPropForDrawer}
        serviceCreateForm={serviceCreateForm}
        setServiceCreateForm={setServiceCreateForm}
        serviceCreateError={serviceCreateError}
        creatingServiceInDrawer={creatingServiceInDrawer}
        handleCreateServiceInDrawerSubmit={handleCreateServiceInDrawerSubmit}
        availableDrawerServiceTypes={availableDrawerServiceTypes}
        showCustomSvcIdInDrawer={showCustomSvcIdInDrawer}
        setShowCustomSvcIdInDrawer={setShowCustomSvcIdInDrawer}
      />
    </>
  );
}

