import React from 'react';
import { PhoneCall, X, Hotel } from 'lucide-react';
import { ServiceItem } from './types';

interface ServiceDetailDrawerProps {
  selectedService: ServiceItem | null;
  onClose: () => void;
  orgName: string;
}

export function ServiceDetailDrawer({
  selectedService,
  onClose,
  orgName,
}: ServiceDetailDrawerProps) {
  if (!selectedService) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedService.phone_number || 'Voice Line'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedService.service_type || 'Voice Trunk / DID'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Operational Status
              </span>
              <span className="font-semibold text-slate-900 dark:text-white mt-0.5 inline-block">
                {selectedService.status === 'ACTIVE'
                  ? 'Live Carrier Route Active'
                  : selectedService.status === 'PORTING'
                  ? 'Carrier Porting in Progress'
                  : 'Line Inactive / Pending'}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                selectedService.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60'
              }`}
            >
              {selectedService.status}
            </span>
          </div>

          {/* Service Line Details */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Service Specifications
            </h4>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Service ID</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {selectedService.custom_service_id || `SVC-${selectedService.id.slice(0, 6).toUpperCase()}`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Service Name</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {selectedService.service_name || selectedService.description || 'Standard Voice Line'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#222430] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Service Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {selectedService.service_type}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Organization</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {selectedService.organization_name || orgName}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#222430]">
                <span className="text-[10px] text-slate-400 block">Description / Notes</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium text-xs mt-0.5">
                  {selectedService.description || 'No additional technical notes provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Location */}
          <div className="space-y-3">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              Assigned Location
            </h4>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
              <div className="flex items-start gap-2.5">
                <Hotel className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedService.property_name}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    {selectedService.property_address || selectedService.property_location || 'Address on file'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Line ID: <span className="text-slate-600 dark:text-slate-300 font-mono">{selectedService.id.substring(0, 8)}...</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1e27] text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
