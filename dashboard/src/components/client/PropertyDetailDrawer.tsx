'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  PhoneCall,
  ShieldCheck,
  LifeBuoy,
  Wifi,
  FileText,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { PropertyDetailDrawerProps, PropertyDrawerTab } from './property-drawer/types';
import { PropertyOverviewTab } from './property-drawer/PropertyOverviewTab';
import { PropertyServicesTab } from './property-drawer/PropertyServicesTab';
import { PropertyE911Tab } from './property-drawer/PropertyE911Tab';
import { PropertyTicketsTab } from './property-drawer/PropertyTicketsTab';
import { PropertyDataCircuitTab } from './property-drawer/PropertyDataCircuitTab';
import { PropertyPortingDocsTab } from './property-drawer/PropertyPortingDocsTab';

export const PropertyDetailDrawer: React.FC<PropertyDetailDrawerProps> = ({
  property,
  onClose,
  onCreateTicket,
  defaultTab = 'OVERVIEW',
  onPropertyUpdated,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<PropertyDrawerTab>(defaultTab);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, property?.id]);

  if (!property) return null;

  const services = property.services || [];
  const tickets = property.tickets || [];
  const attachments = property.porting_attachments || property.attachments || [];
  const isBillingDone = property.billing_status === 'BILLING_DONE';

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setRefreshing(false), 600);
      }
    }
  };

  const navTabs: { key: PropertyDrawerTab; label: string; icon: any }[] = [
    { key: 'OVERVIEW', label: '1. Overview', icon: Building2 },
    { key: 'SERVICES', label: `2. Services (${services.length})`, icon: PhoneCall },
    { key: 'E911', label: '3. E911 State', icon: ShieldCheck },
    { key: 'TICKETS', label: `4. Tickets (${tickets.length})`, icon: LifeBuoy },
    { key: 'DATA_CIRCUIT', label: '5. Data Circuit', icon: Wifi },
    { key: 'PORTING_DOCS', label: `6. Porting Docs (${attachments.length})`, icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border-l border-slate-200 dark:border-[#222430] h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Top Header (Identical to Admin Style) */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/80 dark:bg-[#111217] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 dark:text-white text-base truncate">
                  {property.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  {property.status === 'ACTIVE' || property.status === 'ONBOARDING'
                    ? 'ONBOARDED'
                    : property.status || 'ACTIVE'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    isBillingDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                  }`}
                >
                  {isBillingDone ? 'BILLING DONE' : 'BILLING PENDING'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                  {(() => {
                    const ct = property.connectivity_type || (property.data_circuit ? 'BOTH' : 'PORTED');
                    if (ct === 'BOTH') return 'Voice Services & Data Circuited';
                    if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                    return 'Voice Services';
                  })()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {property.address
                    ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''} ${property.zip_code || ''}`.trim()
                    : 'Property Master Record'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRefresh && (
              <button
                type="button"
                onClick={handleRefreshClick}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer transition"
                title="Refresh Details"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer transition"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs (Admin Navigation Order & Layout) */}
        <div className="flex items-center border-b border-slate-200 dark:border-[#222430] px-4 bg-white dark:bg-[#15161c] text-xs font-bold shrink-0 overflow-x-auto [scrollbar-width:none]">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-3.5 border-b-2 font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'OVERVIEW' && (
            <PropertyOverviewTab
              property={property}
              onPropertyUpdated={onPropertyUpdated}
            />
          )}

          {activeTab === 'SERVICES' && (
            <PropertyServicesTab services={services} />
          )}

          {activeTab === 'E911' && (
            <PropertyE911Tab
              property={property}
              e911={property.e911_record}
            />
          )}

          {activeTab === 'TICKETS' && (
            <PropertyTicketsTab
              tickets={tickets}
              onCreateTicket={onCreateTicket}
              propertyId={property.id}
            />
          )}

          {activeTab === 'DATA_CIRCUIT' && (
            <PropertyDataCircuitTab
              dataCircuit={property.data_circuit}
              property={property}
            />
          )}

          {activeTab === 'PORTING_DOCS' && (
            <PropertyPortingDocsTab attachments={attachments} />
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">
            Property ID: <span className="text-slate-700 dark:text-slate-300 font-semibold">{property.id.substring(0, 8)}...</span>
          </span>
          <button
            type="button"
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
