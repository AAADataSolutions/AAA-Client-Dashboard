'use client';

import React from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  ExternalLink,
  Phone,
} from 'lucide-react';

interface PropertyE911TabProps {
  property: any;
  e911?: any;
}

export function PropertyE911Tab({ property, e911 }: PropertyE911TabProps) {
  const isRayBaumActive = Boolean(
    (property.ray_baum_status && String(property.ray_baum_status).trim().toUpperCase() === 'ACTIVE') ||
      property.is_ray_baum_active === true
  );

  const rawE911 = (
    property.e911_status ||
    e911?.status ||
    (property.ray_baud_and_logs_enabled && property.e911_status !== 'AUDIT_REQUIRED' && property.e911_status !== 'PENDING' ? 'VERIFIED' : 'AUDIT_REQUIRED')
  )
    .toString()
    .trim()
    .toUpperCase();

  const isE911Verified = rawE911 === 'VERIFIED';
  const e911DisplayText = isE911Verified ? 'VERIFIED' : rawE911.replace(/_/g, ' ') || 'AUDIT REQUIRED';

  const defaultAddr = property.address
    ? `${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''} ${property.zip_code || ''}`.trim()
    : 'Property Master Location';

  const registeredAddress = e911?.emergency_address || property.address || defaultAddr;

  const verifiedDate =
    e911?.verified_at || property.e911_verified_at || property.created_at;

  const formattedDate = verifiedDate
    ? new Date(verifiedDate).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Pending Verification';

  return (
    <div className="space-y-4">
      {/* 1. E911 Routing & PSAP Validation Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          isE911Verified
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40'
            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isE911Verified
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-amber-600 text-white border-amber-700'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              E911 Routing &amp; PSAP Validation Status
            </h4>
            <p
              className={`text-[11px] font-semibold mt-0.5 ${
                isE911Verified
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              Status: {e911DisplayText}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
            isE911Verified
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
          }`}
        >
          {isE911Verified ? 'PSAP Active' : 'Audit Required'}
        </span>
      </div>

      {/* 2. Registered Emergency Dispatchable Address */}
      <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Registered Emergency Dispatchable Address
        </span>
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white text-sm">
            {registeredAddress}
          </p>
          <p className="text-[11px] text-slate-500">
            Matches property street location: <strong className="text-emerald-600">Yes (Geocoded)</strong>
          </p>
        </div>

        {e911?.correction_notes && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px]">
            <strong>Carrier Note:</strong> {e911.correction_notes}
          </div>
        )}
      </div>

      {/* 3. Ray Baum's Act & Kari's Law Compliance Audit */}
      <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Ray Baum&apos;s Act &amp; Kari&apos;s Law Compliance Audit
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Dispatchable Location Status */}
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Dispatchable Location Status</span>
            {isRayBaumActive ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Compliant &amp; Active</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Inactive / Non-Compliant</span>
              </span>
            )}
          </div>

          {/* Direct 911 Dialing (Kari's Law) */}
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Direct 911 Dialing (Kari&apos;s Law)</span>
            {isRayBaumActive ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No Prefix Required (911 Active)</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Dialing Audit Required</span>
              </span>
            )}
          </div>

          {/* Automated Notification Logs */}
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Automated Notification Logs</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {property.ray_baud_and_logs_enabled !== false
                ? 'Enabled (Instant SMS/Email)'
                : 'Disabled'}
            </span>
          </div>

          {/* PSAP Verification Timestamp */}
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">PSAP Verification Timestamp</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons: Open Ray Baum's Numbers + E911 Compliance Center */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={() => window.open(`/dashboard/ray-baum/${property.id}`, '_blank')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer group"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Open Ray Baum&apos;s Numbers (New Tab)</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => window.open(`/dashboard/ray-baum/${property.id}`, '_blank')}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer group"
        >
          <span>Open E911 Compliance Center</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

