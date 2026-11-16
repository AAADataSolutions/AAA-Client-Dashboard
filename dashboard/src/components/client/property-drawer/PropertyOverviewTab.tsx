'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  FileText,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Loader2,
  Check,
  Calendar,
} from 'lucide-react';

interface PropertyOverviewTabProps {
  property: any;
  onPropertyUpdated?: (updatedProp: any) => void;
}

export function PropertyOverviewTab({ property, onPropertyUpdated }: PropertyOverviewTabProps) {
  // GM Inline Edit State (Client can ONLY edit GM details)
  const [isEditingGM, setIsEditingGM] = useState(false);
  const [gmName, setGmName] = useState(
    property?.general_manager_name || property?.contact_person_name || ''
  );
  const [gmPhone, setGmPhone] = useState(
    property?.general_manager_phone || property?.main_phone || ''
  );
  const [gmEmail, setGmEmail] = useState(
    property?.general_manager_email || property?.contact_person_email || ''
  );
  const [savingGM, setSavingGM] = useState(false);
  const [gmError, setGmError] = useState<string | null>(null);
  const [gmSuccess, setGmSuccess] = useState(false);

  useEffect(() => {
    setGmName(property?.general_manager_name || property?.contact_person_name || '');
    setGmPhone(property?.general_manager_phone || property?.main_phone || '');
    setGmEmail(property?.general_manager_email || property?.contact_person_email || '');
    setIsEditingGM(false);
    setGmError(null);
  }, [property?.id, property?.general_manager_name, property?.general_manager_phone, property?.general_manager_email]);

  const handleSaveGM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingGM(true);
      setGmError(null);

      const res = await fetch(`/api/client/properties/${property.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          general_manager_name: gmName.trim(),
          general_manager_phone: gmPhone.trim(),
          general_manager_email: gmEmail.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update General Manager details.');
      }

      setGmSuccess(true);
      setIsEditingGM(false);

      if (onPropertyUpdated) {
        onPropertyUpdated({
          ...property,
          general_manager_name: gmName.trim(),
          general_manager_phone: gmPhone.trim(),
          general_manager_email: gmEmail.trim(),
        });
      }

      setTimeout(() => setGmSuccess(false), 3500);
    } catch (err: any) {
      setGmError(err.message || 'Error updating GM details.');
    } finally {
      setSavingGM(false);
    }
  };

  // Strictly decoupled Ray Baum compliance status
  const isRayBaumActive = Boolean(
    (property?.ray_baum_status && String(property.ray_baum_status).trim().toUpperCase() === 'ACTIVE') ||
      property?.is_ray_baum_active === true
  );

  const isE911Verified = (property?.e911_status || '').toUpperCase() === 'VERIFIED';
  const isBillingDone = property?.billing_status === 'BILLING_DONE';

  return (
    <div className="space-y-5">
      {/* 1. Status Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1b24] border border-slate-200/80 dark:border-[#252733] flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Operational &amp; Billing Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                property.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {property.status === 'ACTIVE' || property.status === 'ONBOARDING'
                ? 'Onboarded'
                : property.status || 'Active'}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isBillingDone
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40'
              }`}
            >
              {isBillingDone ? 'BILLING DONE' : 'BILLING PENDING'}
            </span>
          </div>
        </div>

        {property.billed_date && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Billed Date</span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{property.billed_date}</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Location & Identity Details */}
      <div className="space-y-3">
        <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Location &amp; Address
        </h4>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{property.address}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                {property.city}, {property.state} {property.zip_code} ({property.country || 'USA'})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-[#222430]">
            <div>
              <span className="text-[10px] text-slate-400 block">Main Phone</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                {property.main_phone || property.phone || property.general_manager_phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Fax</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                {property.fax || property.fax_number || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 dark:border-[#222430]">
            <div>
              <span className="text-[10px] text-slate-400 block">Voice Monthly Price</span>
              <span className="text-slate-900 dark:text-white font-bold text-xs">
                {property.monthly_price !== null && property.monthly_price !== undefined
                  ? `$${Number(property.monthly_price).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : 'Not set'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Connectivity Type</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                {(() => {
                  const ct = property.connectivity_type || (property.data_circuit ? 'BOTH' : 'PORTED');
                  if (ct === 'BOTH') return 'Voice Services & Data Circuited';
                  if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                  return 'Voice Services';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Leadership & Contacts (Client Can ONLY Edit GM Details) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Leadership &amp; Contacts
          </h4>
          {!isEditingGM && (
            <button
              type="button"
              onClick={() => setIsEditingGM(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit GM Details</span>
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
          {gmSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>General Manager details updated successfully!</span>
            </div>
          )}

          {gmError && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs">
              {gmError}
            </div>
          )}

          {/* General Manager: View vs Inline Edit Mode */}
          {isEditingGM ? (
            <form onSubmit={handleSaveGM} className="space-y-3 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Edit General Manager Details
                </span>
                <span className="text-[10px] text-slate-400">Client-Editable Field</span>
              </div>

              <div>
                <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  General Manager Name
                </label>
                <input
                  type="text"
                  value={gmName}
                  onChange={(e) => setGmName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={gmPhone}
                    onChange={(e) => setGmPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 000-0000"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={gmEmail}
                    onChange={(e) => setGmEmail(e.target.value)}
                    placeholder="e.g. gm@property.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingGM(false);
                    setGmError(null);
                  }}
                  disabled={savingGM}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#282a36] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#20222d] text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGM}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition disabled:opacity-50"
                >
                  {savingGM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{savingGM ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block">General Manager</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  {property.general_manager_name && property.general_manager_name !== 'N/A' && property.general_manager_name !== '—'
                    ? property.general_manager_name
                    : property.contact_person_name && property.contact_person_name !== 'N/A' && property.contact_person_name !== '—'
                    ? property.contact_person_name
                    : 'Not Designated'}
                </span>
                {((property.general_manager_phone && property.general_manager_phone !== 'N/A') || property.main_phone) && (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>
                      {property.general_manager_phone && property.general_manager_phone !== 'N/A'
                        ? property.general_manager_phone
                        : property.main_phone}
                    </span>
                  </p>
                )}
                {property.general_manager_email && property.general_manager_email !== 'N/A' && (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{property.general_manager_email}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Primary Contact Person (Read-Only) */}
          <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-100 dark:border-[#222430]">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Primary Contact Person</span>
              <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                {property.contact_person_name && property.contact_person_name !== 'N/A' && property.contact_person_name !== '—'
                  ? property.contact_person_name
                  : 'Designated Contact'}
              </span>
              {property.contact_person_email && property.contact_person_email !== 'N/A' && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{property.contact_person_email}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Compliance Badges (Strictly Decoupled Ray Baum Status) */}
      <div className="space-y-3">
        <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Compliance Flags
        </h4>
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-3">
          {/* Ray Baum Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">
                  Ray Baum Act &amp; Kari&apos;s Law Compliance
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  Dispatchable location metadata status for this site.
                </span>
              </div>
            </div>

            {isRayBaumActive ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active / Compliant</span>
                </span>
                <button
                  type="button"
                  onClick={() => window.open(`/dashboard/ray-baum/${property.id}`, '_blank')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700 transition cursor-pointer shadow-xs group"
                >
                  <span>View Numbers</span>
                  <ExternalLink className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Inactive / Non-Compliant</span>
              </span>
            )}
          </div>

          {/* E911 Registry Status Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">E911 Registry Status:</span>
            <span
              className={`font-bold text-xs ${
                isE911Verified
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isE911Verified ? 'VERIFIED' : 'AUDIT REQUIRED'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Data Circuit Summary (if circuit attached) */}
      {property.data_circuit && (
        <div className="space-y-3">
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Data Circuit &amp; Network
          </h4>
          <div className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">Carrier</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  {property.data_circuit.carrier_name || 'Carrier Pending'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Bandwidth</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {property.data_circuit.bandwidth || '1 Gig'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pricing</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  {property.data_circuit.circuit_monthly_price !== null && property.data_circuit.circuit_monthly_price !== undefined
                    ? `$${Number(property.data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo`
                    : '—'}
                </span>
              </div>
            </div>

            {property.data_circuit.agreement_file_url && (
              <div className="pt-2 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <span className="text-[10.5px] text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Executed Agreement PDF</span>
                </span>
                <a
                  href={property.data_circuit.agreement_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span>View PDF</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
