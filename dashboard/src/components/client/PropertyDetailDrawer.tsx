'use client';

import React, { useState } from 'react';
import {
  X,
  Hotel,
  MapPin,
} from 'lucide-react';
import { PropertyDetailDrawerProps, PropertyDrawerTab } from './property-drawer/types';
import { PropertyOverviewTab } from './property-drawer/PropertyOverviewTab';
import { PropertyDataCircuitTab } from './property-drawer/PropertyDataCircuitTab';
import {
  PropertyServicesTab,
  PropertyE911Tab,
  PropertyOnboardingTab,
  PropertyTicketsTab,
} from './property-drawer/PropertySubTabs';

export const PropertyDetailDrawer: React.FC<PropertyDetailDrawerProps> = ({
  property,
  onClose,
  onCreateTicket,
  defaultTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<PropertyDrawerTab>(defaultTab);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, property?.id]);

  if (!property) return null;

  const services = property.services || [];
  const e911 = property.e911_record;
  const onboarding = property.onboarding;
  const tickets = property.tickets || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {property.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{property.city}, {property.state}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200/80 dark:border-[#222430] px-5 bg-white dark:bg-[#15161c] text-xs font-semibold overflow-x-auto [scrollbar-width:none]">
          {[
            { key: 'OVERVIEW', label: 'Overview' },
            { key: 'SERVICES', label: `Services (${services.length})` },
            ...(property.data_circuit ? [{ key: 'DATA_CIRCUIT', label: 'Data Circuit' }] : []),
            { key: 'E911', label: 'E911 Status' },
            { key: 'ONBOARDING', label: 'Onboarding' },
            { key: 'TICKETS', label: `Tickets (${tickets.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as PropertyDrawerTab)}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors shrink-0 cursor-pointer ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'OVERVIEW' && (
            <PropertyOverviewTab property={property} />
          )}

          {activeTab === 'SERVICES' && (
            <PropertyServicesTab services={services} />
          )}

          {activeTab === 'E911' && (
            <PropertyE911Tab property={property} e911={e911} />
          )}

          {activeTab === 'DATA_CIRCUIT' && property.data_circuit && (
            <PropertyDataCircuitTab dataCircuit={property.data_circuit} />
          )}

          {activeTab === 'ONBOARDING' && (
            <PropertyOnboardingTab onboarding={onboarding} />
          )}

          {activeTab === 'TICKETS' && (
            <PropertyTicketsTab
              tickets={tickets}
              onCreateTicket={onCreateTicket}
              propertyId={property.id}
            />
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Property ID: <span className="text-slate-600 dark:text-slate-300">{property.id.substring(0, 8)}...</span>
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
};
