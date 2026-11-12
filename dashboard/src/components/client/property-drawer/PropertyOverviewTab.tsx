import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface PropertyOverviewTabProps {
  property: any;
}

export function PropertyOverviewTab({ property }: PropertyOverviewTabProps) {
  return (
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
          {property.status === 'ACTIVE' || property.status === 'ONBOARDING' ? 'Onboarded' : (property.status || 'Onboarded')}
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
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {property.main_phone || property.phone || property.general_manager_phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Fax</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {property.fax || property.fax_number || '—'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
            <div>
              <span className="text-[10px] text-slate-400 block">Monthly Price</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">
                {property.monthly_price !== null && property.monthly_price !== undefined
                  ? `$${Number(property.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Connectivity Type</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                {(() => {
                  const ct = property.connectivity_type || (property.data_circuit ? 'BOTH' : 'PORTED');
                  if (ct === 'BOTH') return 'Ported & Data Circuited';
                  if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                  return 'Ported';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Circuit & Network Details (Client-Safe: Never exposes Wholesaler) */}
      {property.data_circuit && (
        <div className="space-y-3">
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Data Circuit &amp; Network Details
          </h4>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Carrier Name</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {property.data_circuit.carrier_name || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Bandwidth</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {property.data_circuit.bandwidth || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Circuit Pricing</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {property.data_circuit.circuit_monthly_price !== null && property.data_circuit.circuit_monthly_price !== undefined
                    ? `$${Number(property.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Signed Agreement Document Card */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-[#222430]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                Signed Agreement Document
              </span>
              {property.data_circuit.agreement_file_url ? (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {property.data_circuit.agreement_file_name || 'Signed_Agreement.pdf'}
                        </p>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 shrink-0">
                          SIGNED
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {property.data_circuit.paperwork_signed_at
                          ? `Executed on ${new Date(property.data_circuit.paperwork_signed_at).toLocaleDateString()}`
                          : 'Executed Client Agreement'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={property.data_circuit.agreement_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Signed PDF</span>
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200/60 dark:border-[#252733] flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Signed Agreement PDF:</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">Pending Execution</span>
                </div>
              )}
            </div>

            {property.data_circuit.technical_details && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#222430]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
                  Technical Configuration (IP / WAN / Gateway)
                </span>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#252733] font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {property.data_circuit.technical_details}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Property Management & Contacts */}
      <div className="space-y-3">
        <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Leadership &amp; Contacts
        </h4>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
          {/* General Manager */}
          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block">General Manager</span>
              <span className="font-semibold text-slate-900 dark:text-white block">
                {(property.general_manager_name && property.general_manager_name !== 'N/A' && property.general_manager_name !== '—')
                  ? property.general_manager_name
                  : (property.contact_person_name && property.contact_person_name !== 'N/A' && property.contact_person_name !== '—')
                  ? property.contact_person_name
                  : 'Not Designated'}
              </span>
              {((property.general_manager_phone && property.general_manager_phone !== 'N/A') || property.main_phone) && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{property.general_manager_phone && property.general_manager_phone !== 'N/A' ? property.general_manager_phone : property.main_phone}</span>
                </p>
              )}
              {(property.general_manager_email && property.general_manager_email !== 'N/A') && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{property.general_manager_email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Primary Contact Person */}
          <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-100 dark:border-[#222430]">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Primary Contact Person</span>
              <span className="font-semibold text-slate-900 dark:text-white block">
                {(property.contact_person_name && property.contact_person_name !== 'N/A' && property.contact_person_name !== '—')
                  ? property.contact_person_name
                  : (property.general_manager_name && property.general_manager_name !== 'N/A' && property.general_manager_name !== '—')
                  ? property.general_manager_name
                  : 'Primary Contact'}
              </span>
              {(property.contact_person_email && property.contact_person_email !== 'N/A') ? (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{property.contact_person_email}</span>
                </p>
              ) : (property.general_manager_email && property.general_manager_email !== 'N/A') ? (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{property.general_manager_email}</span>
                </p>
              ) : (
                <span className="text-slate-400 text-[11px]">No email provided</span>
              )}
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
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">
                Ray Baum&apos;s &amp; Dispatch Logging
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Dispatchable location metadata enabled for this property.
              </span>
            </div>
          </div>
          {property.ray_baud_and_logs_enabled || property.ray_baum_status === 'Active' || property.ray_baum_status === 'ACTIVE' ? (
            <button
              onClick={() => window.open(`/dashboard/ray-baum/${property.id}`, '_blank')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 transition cursor-pointer shadow-xs group"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>View Ray Baum No.s</span>
              <ExternalLink className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              DISABLED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
