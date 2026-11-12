import React from 'react';
import {
  PhoneCall,
  Phone,
  Clock,
  Plus,
  LifeBuoy,
} from 'lucide-react';

interface PropertyServicesTabProps {
  services: any[];
}

export function PropertyServicesTab({ services }: PropertyServicesTabProps) {
  return (
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
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs block">
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
  );
}

interface PropertyE911TabProps {
  property: any;
  e911: any;
}

export function PropertyE911Tab({ property, e911 }: PropertyE911TabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            PSAP Routing Status
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
              property.ray_baud_and_logs_enabled || property.e911_status === 'VERIFIED'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
            }`}
          >
            {property.ray_baud_and_logs_enabled || property.e911_status === 'VERIFIED' ? 'PSAP Verified' : 'Audit Required'}
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
          <span className="text-slate-700 dark:text-slate-300">
            {e911?.verified_at ? new Date(e911.verified_at).toLocaleDateString() : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PropertyOnboardingTabProps {
  onboarding: any;
}

export function PropertyOnboardingTab({ onboarding }: PropertyOnboardingTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
            Onboarding Pipeline
          </span>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
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
  );
}

interface PropertyTicketsTabProps {
  tickets: any[];
  onCreateTicket?: (propertyId: string) => void;
  propertyId: string;
}

export function PropertyTicketsTab({
  tickets,
  onCreateTicket,
  propertyId,
}: PropertyTicketsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white text-xs">
          Property Support Tickets
        </span>
        {onCreateTicket && (
          <button
            onClick={() => onCreateTicket(propertyId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition shadow-2xs cursor-pointer"
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
  );
}
