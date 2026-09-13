'use client';

import React, { useState } from 'react';
import {
  X,
  Hotel,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  PhoneCall,
  GitBranch,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface PropertyDetailDrawerProps {
  property: any;
  onClose: () => void;
  onCreateTicket?: (propertyId: string) => void;
}

export const PropertyDetailDrawer: React.FC<PropertyDetailDrawerProps> = ({
  property,
  onClose,
  onCreateTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SERVICES' | 'E911' | 'ONBOARDING' | 'TICKETS'>('OVERVIEW');

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
            { key: 'E911', label: 'E911 Status' },
            { key: 'ONBOARDING', label: 'Onboarding' },
            { key: 'TICKETS', label: `Tickets (${tickets.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-3.5 border-b-2 font-medium transition-colors shrink-0 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-200/80 dark:border-[#252733] flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider block">
                    Operational Status
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5 inline-block">
                    Property Location Active
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    property.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {property.status || 'ACTIVE'}
                </span>
              </div>

              {/* Location Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Location &amp; Address
                </h4>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{property.address}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {property.city}, {property.state} {property.zip_code} ({property.country || 'USA'})
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Main Phone</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {property.main_phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Fax</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                        {property.fax || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Management & Contacts */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Leadership &amp; Contacts
                </h4>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">General Manager</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {property.general_manager_name || 'Not Designated'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-[#222430]">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Telecom Contact Person</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {property.contact_person_name || 'Primary Contact'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {property.contact_person_email || 'No email provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Badges */}
              <div className="space-y-3">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  Compliance Flags
                </h4>
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        Ray Baum's &amp; Dispatch Logging
                      </span>
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        Dispatchable location metadata enabled for this property.
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${
                      property.ray_baud_and_logs_enabled
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {property.ray_baud_and_logs_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES */}
          {activeTab === 'SERVICES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-xs">
                  Provisioned Voice Lines &amp; DIDs
                </span>
                <span className="text-[11px] text-slate-400">{services.length} Total</span>
              </div>

              {services.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
                  <PhoneCall className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 dark:text-white">No Services Assigned</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    There are no voice lines provisioned to this location.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.map((svc: any) => (
                    <div
                      key={svc.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block">
                            {svc.phone_number}
                          </span>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            {svc.service_type?.name || 'Voice Line'} {svc.description ? `• ${svc.description}` : ''}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          svc.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                        }`}
                      >
                        {svc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: E911 */}
          {activeTab === 'E911' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    PSAP Routing Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                      property.e911_status === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                        : property.e911_status === 'CORRECTION_REQUIRED' || property.e911_status === 'FAILED'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                    }`}
                  >
                    {property.e911_status}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-400 block">Registered Emergency Address</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {e911?.emergency_address || property.address}
                  </p>
                </div>
                {e911?.correction_notes && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px]">
                    <strong>Carrier Note:</strong> {e911.correction_notes}
                  </div>
                )}
                <div className="text-[10.5px] text-slate-400 pt-2 border-t border-slate-200/80 dark:border-[#252733] flex items-center justify-between">
                  <span>Last Verified:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {e911?.verified_at ? new Date(e911.verified_at).toLocaleDateString() : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ONBOARDING */}
          {activeTab === 'ONBOARDING' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                    Onboarding Pipeline
                  </span>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                    {onboarding?.status?.replace(/_/g, ' ') || 'ACTIVE'}
                  </span>
                </div>
                {onboarding?.target_date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Live Date: <strong>{new Date(onboarding.target_date).toLocaleDateString()}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TICKETS */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white text-xs">
                  Property Support Tickets
                </span>
                {onCreateTicket && (
                  <button
                    onClick={() => onCreateTicket(property.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition shadow-2xs"
                  >
                    <Plus className="w-3 h-3" /> New Ticket
                  </button>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
                  <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 dark:text-white">No Tickets on Record</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    This property has no active or past support tickets.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[280px]">
                          {t.subject}
                        </h5>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                            t.status === 'RESOLVED' || t.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1">
                        {t.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-[#222430]">
                        <span>Priority: <strong>{t.priority}</strong></span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Property ID: <span className="font-mono text-slate-600 dark:text-slate-300">{property.id.substring(0, 8)}...</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1c1e27] text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
