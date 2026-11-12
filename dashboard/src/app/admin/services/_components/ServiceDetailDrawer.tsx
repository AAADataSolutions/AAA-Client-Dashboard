'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, X } from 'lucide-react';
import type { ServiceItem } from '@/store/slices/servicesSlice';

interface ServiceDetailDrawerProps {
  showDetailsDrawer: boolean;
  selectedServiceForDetails: ServiceItem | null;
  onClose: () => void;
}

export default function ServiceDetailDrawer({
  showDetailsDrawer,
  selectedServiceForDetails,
  onClose,
}: ServiceDetailDrawerProps) {
  return (
    <AnimatePresence>
      {showDetailsDrawer && selectedServiceForDetails && (
        <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10"
          >
            <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <PhoneCall className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Service Line Details</h3>
                  <p className="text-xs text-slate-400">{selectedServiceForDetails.phone_number}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Service ID</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-mono font-bold text-slate-900 dark:text-white">
                  {selectedServiceForDetails.custom_service_id || selectedServiceForDetails.id}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Service Name</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                  {selectedServiceForDetails.service_name}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">DID / Phone Number</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                  {selectedServiceForDetails.phone_number}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Service Type</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                  {selectedServiceForDetails.service_type}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Monthly Price</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ${Number(selectedServiceForDetails.price || 0).toFixed(2)} / month
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Assigned Property</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                  {selectedServiceForDetails.attached_property_name || 'Unassigned'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                  {selectedServiceForDetails.attached_organization_name || 'Unassigned'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-black dark:text-white block text-xs">Status</label>
                <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedServiceForDetails.status}
                </p>
              </div>

              {selectedServiceForDetails.description && (
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block text-xs">Description</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300">
                    {selectedServiceForDetails.description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end gap-2 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
