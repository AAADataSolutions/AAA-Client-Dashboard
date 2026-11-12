'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Flame, ArrowUpDown } from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import {
  ServiceCreateFormData,
  isFireLineSvcType,
  isElevatorLineSvcType,
} from './types';
import { PropertyProvisionServiceFields } from './PropertyProvisionServiceFields';

interface PropertyDrawerProvisionServiceModalProps {
  showCreateServiceInDrawerModal: boolean;
  setShowCreateServiceInDrawerModal: (show: boolean) => void;
  selectedPropForDrawer: PropertyRecord | null;
  serviceCreateForm: ServiceCreateFormData;
  setServiceCreateForm: React.Dispatch<React.SetStateAction<ServiceCreateFormData>>;
  serviceCreateError: string | null;
  creatingServiceInDrawer: boolean;
  handleCreateServiceInDrawerSubmit: (e: React.FormEvent) => void;
  availableDrawerServiceTypes: string[];
  showCustomSvcIdInDrawer: boolean;
  setShowCustomSvcIdInDrawer: (show: boolean) => void;
}

export function PropertyDrawerProvisionServiceModal({
  showCreateServiceInDrawerModal,
  setShowCreateServiceInDrawerModal,
  selectedPropForDrawer,
  serviceCreateForm,
  setServiceCreateForm,
  serviceCreateError,
  creatingServiceInDrawer,
  handleCreateServiceInDrawerSubmit,
  availableDrawerServiceTypes,
  showCustomSvcIdInDrawer,
  setShowCustomSvcIdInDrawer,
}: PropertyDrawerProvisionServiceModalProps) {
  return (
    <AnimatePresence>
      {showCreateServiceInDrawerModal &&
        selectedPropForDrawer &&
        (() => {
          const currentType = serviceCreateForm.is_custom_type
            ? serviceCreateForm.custom_type_input.trim()
            : serviceCreateForm.service_type_name;
          const isFire = isFireLineSvcType(currentType);
          const isElevator = isElevatorLineSvcType(currentType);

          const handleTypeSelect = (newType: string) => {
            const isFL = isFireLineSvcType(newType);
            const isEL = isElevatorLineSvcType(newType);
            let newId = serviceCreateForm.custom_service_id;
            if (!newId || newId.startsWith('SVC-') || newId.startsWith('FL-') || newId.startsWith('EL-')) {
              if (isFL) newId = `FL-${Math.floor(100000 + Math.random() * 900000)}`;
              else if (isEL) newId = `EL-${Math.floor(100000 + Math.random() * 900000)}`;
              else newId = `SVC-${Math.floor(100000 + Math.random() * 900000)}`;
            }
            setServiceCreateForm((prev) => ({
              ...prev,
              service_type_name: newType,
              custom_service_id: newId,
            }));
          };

          return (
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    {isFire ? (
                      <Flame className="w-5 h-5 text-orange-500" />
                    ) : isElevator ? (
                      <ArrowUpDown className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-blue-600" />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {isFire ? 'Add Fire Line' : isElevator ? 'Add Elevator Line' : 'Provision New Service'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Directly attaching to{' '}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPropForDrawer.name}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateServiceInDrawerModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {serviceCreateError && (
                  <div className="mx-5 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg shrink-0">
                    {serviceCreateError}
                  </div>
                )}

                <form
                  onSubmit={handleCreateServiceInDrawerSubmit}
                  className="p-5 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs"
                >
                  <PropertyProvisionServiceFields
                    isFire={isFire}
                    isElevator={isElevator}
                    selectedPropForDrawer={selectedPropForDrawer}
                    serviceCreateForm={serviceCreateForm}
                    setServiceCreateForm={setServiceCreateForm}
                    handleTypeSelect={handleTypeSelect}
                    availableDrawerServiceTypes={availableDrawerServiceTypes}
                    showCustomSvcIdInDrawer={showCustomSvcIdInDrawer}
                    setShowCustomSvcIdInDrawer={setShowCustomSvcIdInDrawer}
                  />

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430] shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowCreateServiceInDrawerModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingServiceInDrawer}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      {creatingServiceInDrawer ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFire ? (
                        'Save Fire Line'
                      ) : isElevator ? (
                        'Save Elevator Line'
                      ) : (
                        'Provision Service'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}
    </AnimatePresence>
  );
}

