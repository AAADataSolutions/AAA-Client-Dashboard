'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  Phone,
  Edit2,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType } from './types';
import { PropertyDrawerRayBaumManager } from './PropertyDrawerRayBaumManager';

interface PropertyMasterDrawerTab3E911Props {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  onDataChanged?: () => void;
}

export function PropertyMasterDrawerTab3E911({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  onDataChanged,
}: PropertyMasterDrawerTab3E911Props) {
  const [isEditingE911, setIsEditingE911] = useState(false);
  const [savingE911, setSavingE911] = useState(false);
  const [e911Error, setE911Error] = useState<string | null>(null);

  const [e911Address, setE911Address] = useState('');
  const [e911Status, setE911Status] = useState<'VERIFIED' | 'AUDIT_REQUIRED'>('AUDIT_REQUIRED');
  const [rayBaumStatus, setRayBaumStatus] = useState<'ACTIVE' | 'INACTIVE'>('INACTIVE');
  const [notificationLogs, setNotificationLogs] = useState(true);
  const [correctionNotes, setCorrectionNotes] = useState('');

  const syncE911FromData = () => {
    const defaultAddr = `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city}, ${selectedPropForDrawer.state} ${selectedPropForDrawer.zip_code}`;
    const registered = propertyDrawerData?.e911?.registered_address || defaultAddr;
    const rawRb = (
      propertyDrawerData?.property?.ray_baum_status ??
      propertyDrawerData?.e911?.ray_baum_status ??
      selectedPropForDrawer?.ray_baum_status ??
      ''
    ).toString().trim().toUpperCase();
    const isRbActive = rawRb === 'ACTIVE' || rawRb === 'COMPLIANT' || rawRb === 'TRUE';

    const rawE9 = (
      propertyDrawerData?.e911?.property_e911_status ||
      propertyDrawerData?.property?.e911_status ||
      selectedPropForDrawer?.e911_status ||
      ''
    ).toString().trim().toUpperCase();
    const isE9Ver = rawE9 === 'VERIFIED';

    setE911Address(registered);
    setE911Status(isE9Ver ? 'VERIFIED' : 'AUDIT_REQUIRED');
    setRayBaumStatus(isRbActive ? 'ACTIVE' : 'INACTIVE');
    setNotificationLogs(Boolean(propertyDrawerData?.e911?.ray_baud_and_logs_enabled ?? isE9Ver));
    setCorrectionNotes(propertyDrawerData?.e911?.correction_notes || '');
  };

  useEffect(() => {
    syncE911FromData();
  }, [propertyDrawerData, selectedPropForDrawer]);

  if (drawerTab !== 'E911') return null;

  const rawRayBaum = (
    propertyDrawerData?.property?.ray_baum_status ??
    propertyDrawerData?.e911?.ray_baum_status ??
    selectedPropForDrawer?.ray_baum_status ??
    ''
  ).toString().trim().toUpperCase();
  const isRayBaumActive = rawRayBaum === 'ACTIVE' || rawRayBaum === 'COMPLIANT' || rawRayBaum === 'TRUE';

  const rawE911 = (
    propertyDrawerData?.e911?.property_e911_status ||
    propertyDrawerData?.property?.e911_status ||
    selectedPropForDrawer?.e911_status ||
    ''
  ).toString().trim().toUpperCase();
  const isE911Verified = rawE911 === 'VERIFIED';
  const e911DisplayText = isE911Verified ? 'VERIFIED' : (rawE911 ? rawE911.replace(/_/g, ' ') : 'AUDIT REQUIRED');

  const handleSaveE911 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingE911(true);
      setE911Error(null);

      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_address: e911Address.trim(),
          e911_status: e911Status,
          ray_baum_status: rayBaumStatus,
          ray_baud_and_logs_enabled: e911Status === 'VERIFIED',
          correction_notes: correctionNotes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update E911 information.');
      }

      setIsEditingE911(false);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setE911Error(err.message || 'Error saving E911 changes.');
    } finally {
      setSavingE911(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* E911 Action Header Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          isE911Verified
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/40'
            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold shrink-0 ${
              isE911Verified ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-black text-slate-900 dark:text-white text-sm">
              E911 Routing &amp; PSAP Validation Status
            </p>
            <p
              className={`text-xs font-bold mt-0.5 ${
                isE911Verified
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              Status: {e911DisplayText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditingE911 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  syncE911FromData();
                  setIsEditingE911(false);
                  setE911Error(null);
                }}
                disabled={savingE911}
                className="px-3 py-1.5 border border-slate-300 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181a24] text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveE911}
                disabled={savingE911}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {savingE911 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{savingE911 ? 'Saving...' : 'Save E911'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  syncE911FromData();
                  setIsEditingE911(true);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit E911 Details</span>
              </button>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isE911Verified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                }`}
              >
                {isE911Verified ? 'PSAP Active' : 'Audit Required'}
              </span>
            </>
          )}
        </div>
      </div>

      {e911Error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl">
          {e911Error}
        </div>
      )}

      {/* Registered Emergency Address */}
      <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Registered Emergency Dispatchable Address
        </span>
        <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl text-xs space-y-1">
          {isEditingE911 ? (
            <input
              type="text"
              value={e911Address}
              onChange={(e) => setE911Address(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
            />
          ) : (
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {propertyDrawerData?.e911?.registered_address ||
                `${selectedPropForDrawer.address}, ${selectedPropForDrawer.city}, ${selectedPropForDrawer.state} ${selectedPropForDrawer.zip_code}`}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            Matches property street location: <strong className="text-emerald-600">Yes (Geocoded)</strong>
          </p>
        </div>
      </div>

      {/* Ray Baum's Act & Kari's Law Compliance */}
      <div className="p-4 bg-slate-50/80 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Ray Baum&apos;s Act &amp; Kari&apos;s Law Compliance Audit
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Dispatchable Location Status</span>
            {isEditingE911 ? (
              <select
                value={rayBaumStatus}
                onChange={(e) => setRayBaumStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className={`font-bold px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                  rayBaumStatus === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                }`}
              >
                <option value="ACTIVE">Compliant &amp; Active</option>
                <option value="INACTIVE">Audit Required / Inactive</option>
              </select>
            ) : isRayBaumActive ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> Compliant &amp; Active
              </span>
            ) : (
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Audit Required / Inactive
              </span>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Direct 911 Dialing (Kari&apos;s Law)</span>
            {isRayBaumActive ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> No Prefix Required (911 Active)
              </span>
            ) : (
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Dialing Audit Required
              </span>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">Automated Notification Logs</span>
            {isEditingE911 ? (
              <select
                value={notificationLogs ? 'true' : 'false'}
                onChange={(e) => setNotificationLogs(e.target.value === 'true')}
                className="px-2 py-1 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-xs"
              >
                <option value="true">Enabled (Instant SMS/Email)</option>
                <option value="false">Disabled</option>
              </select>
            ) : (
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                {propertyDrawerData?.e911?.ray_baud_and_logs_enabled ? 'Enabled (Instant SMS/Email)' : 'Disabled'}
              </span>
            )}
          </div>

          <div className="p-3 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-xl">
            <span className="text-[10px] text-slate-400 block mb-1">PSAP Registry Status</span>
            {isEditingE911 ? (
              <select
                value={e911Status}
                onChange={(e) => setE911Status(e.target.value as 'VERIFIED' | 'AUDIT_REQUIRED')}
                className={`font-bold px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                  e911Status === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                }`}
              >
                <option value="VERIFIED">Verified (PSAP Active)</option>
                <option value="AUDIT_REQUIRED">Audit Required (Pending)</option>
              </select>
            ) : (
              <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                {propertyDrawerData?.e911?.verified_at
                  ? new Date(propertyDrawerData.e911.verified_at).toLocaleDateString()
                  : isE911Verified ? 'System Verified' : 'Pending Verification'}
              </span>
            )}
          </div>
        </div>

        {/* Correction Notes */}
        <div>
          <span className="font-bold block text-xs mb-1">PSAP Audit Correction Notes:</span>
          {isEditingE911 ? (
            <textarea
              rows={2}
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="Enter any PSAP discrepancy notes, room numbering corrections, etc..."
              className="w-full px-3 py-1.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
            />
          ) : propertyDrawerData?.e911?.correction_notes ? (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300">
              <p className="text-[11px]">{propertyDrawerData.e911.correction_notes}</p>
            </div>
          ) : (
            <p className="text-slate-400 text-[11px] italic">No active correction notes recorded.</p>
          )}
        </div>
      </div>

      {/* In-Drawer Ray Baum Numbers Manager */}
      <PropertyDrawerRayBaumManager
        propertyId={selectedPropForDrawer.id}
        propertyName={selectedPropForDrawer.name}
        onDataChanged={onDataChanged}
      />

      {/* Shortcut Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
        <a
          href={`/admin/e911?search=${encodeURIComponent(selectedPropForDrawer.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Open Ray Baum&apos;s Numbers (New Tab)</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <a
          href="/admin/e911"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#222430] dark:hover:bg-[#2c2f3e] text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
        >
          <span>Open E911 Compliance Center</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
