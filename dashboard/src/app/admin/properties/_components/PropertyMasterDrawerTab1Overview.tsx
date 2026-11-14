'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { DrawerTabType, OrgOption, PartnerOption, ServerOption, VendorOption } from './types';
import { PropertyOverviewIdentitySection } from './PropertyOverviewIdentitySection';
import { PropertyOverviewCommercialSection } from './PropertyOverviewCommercialSection';

export interface PropertyMasterDrawerTab1OverviewProps {
  drawerTab: DrawerTabType;
  selectedPropForDrawer: PropertyRecord;
  propertyDrawerData: any;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  onOpenEdit?: (prop: PropertyRecord) => void;
  onDataChanged?: () => void;
  orgOptions?: OrgOption[];
  partnerOptions?: PartnerOption[];
  serverOptions?: ServerOption[];
  vendorOptions?: VendorOption[];
}

export function PropertyMasterDrawerTab1Overview({
  drawerTab,
  selectedPropForDrawer,
  propertyDrawerData,
  copiedField,
  handleCopy,
  handleQuickUpdateBillingStatus,
  onDataChanged,
  orgOptions = [],
  partnerOptions = [],
  serverOptions = [],
  vendorOptions = [],
}: PropertyMasterDrawerTab1OverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dynamic org and partner list if not provided via props
  const [localOrgs, setLocalOrgs] = useState<OrgOption[]>(orgOptions);
  const [localPartners, setLocalPartners] = useState<PartnerOption[]>(partnerOptions);

  useEffect(() => {
    if (orgOptions && orgOptions.length > 0) {
      setLocalOrgs(orgOptions);
    } else {
      fetch('/api/admin/organizations?limit=150')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setLocalOrgs(d.data.map((o: any) => ({ id: o.id, name: o.name })));
          }
        })
        .catch(() => {});
    }

    if (partnerOptions && partnerOptions.length > 0) {
      setLocalPartners(partnerOptions);
    } else {
      fetch('/api/admin/partners?limit=100')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setLocalPartners(
              d.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                company_name: p.company_name,
                default_commission_rate: p.default_commission_rate ?? 0,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [orgOptions, partnerOptions]);

  // Form State for Inline Editing
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');
  const [mainPhone, setMainPhone] = useState('');
  const [fax, setFax] = useState('');
  const [gmName, setGmName] = useState('');
  const [gmEmail, setGmEmail] = useState('');
  const [gmPhone, setGmPhone] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [onboardingDate, setOnboardingDate] = useState('');
  const [billingStatus, setBillingStatus] = useState<'BILLING_DONE' | 'BILLING_PENDING'>('BILLING_PENDING');
  const [partnerId, setPartnerId] = useState('');
  const [partnerCommOverride, setPartnerCommOverride] = useState('');
  const [serverId, setServerId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [rayBaumStatus, setRayBaumStatus] = useState<'ACTIVE' | 'INACTIVE'>('INACTIVE');
  const [e911Status, setE911Status] = useState<'VERIFIED' | 'AUDIT_REQUIRED'>('AUDIT_REQUIRED');

  // Reset form state from current property data
  const syncFormFromData = () => {
    const prop = propertyDrawerData?.property || selectedPropForDrawer;
    const org = propertyDrawerData?.organization || (selectedPropForDrawer as any).primary_organization;
    const rawRb = (prop.ray_baum_status || selectedPropForDrawer.ray_baum_status || '').toUpperCase();
    const isRbActive = rawRb === 'ACTIVE' || rawRb === 'COMPLIANT' || rawRb === 'TRUE';

    const rawE9 = (
      propertyDrawerData?.e911?.property_e911_status ||
      prop.e911_status ||
      selectedPropForDrawer.e911_status ||
      ''
    ).toUpperCase();
    const isE9Ver = rawE9 === 'VERIFIED';

    setName(prop.name || selectedPropForDrawer.name || '');
    setOrgId(org?.id || (selectedPropForDrawer as any).organization_id || '');
    setAddress(prop.address || selectedPropForDrawer.address || '');
    setCity(prop.city || selectedPropForDrawer.city || '');
    setState(prop.state || selectedPropForDrawer.state || '');
    setZipCode(prop.zip_code || selectedPropForDrawer.zip_code || '');
    setCountry(prop.country || selectedPropForDrawer.country || 'USA');
    setMainPhone(prop.main_phone || selectedPropForDrawer.main_phone || '');
    setFax(prop.fax || selectedPropForDrawer.fax || '');
    setGmName(prop.general_manager_name || selectedPropForDrawer.general_manager_name || '');
    setGmEmail(prop.general_manager_email || selectedPropForDrawer.general_manager_email || '');
    setGmPhone(prop.general_manager_phone || selectedPropForDrawer.general_manager_phone || '');
    setMonthlyPrice(
      prop.monthly_price !== null && prop.monthly_price !== undefined
        ? String(prop.monthly_price)
        : selectedPropForDrawer.monthly_price !== null && selectedPropForDrawer.monthly_price !== undefined
        ? String(selectedPropForDrawer.monthly_price)
        : ''
    );
    setOnboardingDate(prop.onboarding_date || selectedPropForDrawer.onboarding_date || '');
    setBillingStatus(
      (prop.billing_status || (selectedPropForDrawer as any).billing_status) === 'BILLING_DONE'
        ? 'BILLING_DONE'
        : 'BILLING_PENDING'
    );
    setPartnerId(prop.partner_id || (selectedPropForDrawer as any).partner_id || '');
    setPartnerCommOverride(
      prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
        ? String(prop.partner_commission_override)
        : ''
    );
    setServerId(prop.server_id || (selectedPropForDrawer as any).server_id || '');
    setVendorId(prop.vendor_id || (selectedPropForDrawer as any).vendor_id || '');
    setRayBaumStatus(isRbActive ? 'ACTIVE' : 'INACTIVE');
    setE911Status(isE9Ver ? 'VERIFIED' : 'AUDIT_REQUIRED');
  };

  useEffect(() => {
    syncFormFromData();
  }, [selectedPropForDrawer, propertyDrawerData]);

  if (drawerTab !== 'OVERVIEW') return null;

  // Accurately determine Ray Baum status without hardcoding to active
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

  // Handle Save Inline Edits
  const handleSaveInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveError('Property Name is required.');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const payload: Record<string, any> = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: zipCode.trim(),
        country: country.trim() || 'USA',
        main_phone: mainPhone.trim() || null,
        fax: fax.trim() || null,
        general_manager_name: gmName.trim() || null,
        general_manager_email: gmEmail.trim() || null,
        general_manager_phone: gmPhone.trim() || null,
        base_price: monthlyPrice === '' ? 0 : Number(monthlyPrice),
        monthly_price: monthlyPrice === '' ? null : Number(monthlyPrice),
        onboarding_date: onboardingDate.trim() || null,
        billing_status: billingStatus,
        partner_id: partnerId.trim() || null,
        partner_commission_override: partnerCommOverride === '' ? null : Number(partnerCommOverride),
        server_id: serverId.trim() || null,
        vendor_id: vendorId.trim() || null,
        ray_baum_status: rayBaumStatus,
        e911_status: e911Status,
        ray_baud_and_logs_enabled: e911Status === 'VERIFIED',
      };

      if (orgId) {
        payload.organization_id = orgId;
      } else {
        payload.organization_id = 'UNASSIGNED';
      }

      const res = await fetch(`/api/admin/properties/${selectedPropForDrawer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update property details.');
      }

      setIsEditing(false);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setSaveError(err.message || 'Error saving changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveInline} className="space-y-4 text-xs">
      {/* Inline Edit Header Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40">
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs block">
            {isEditing ? 'Editing Property Details Inline' : 'Property Record Management'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {isEditing
              ? 'Make changes directly in the fields below and click Save.'
              : 'Directly edit core identity, GM contacts, pricing & compliance inline.'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  syncFormFromData();
                  setIsEditing(false);
                  setSaveError(null);
                }}
                disabled={saving}
                className="px-3 py-1.5 border border-slate-300 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#181a24] text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                syncFormFromData();
                setIsEditing(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl">
          {saveError}
        </div>
      )}

      {/* Property Identity & GM Contacts Section */}
      <PropertyOverviewIdentitySection
        isEditing={isEditing}
        name={name}
        setName={setName}
        orgId={orgId}
        setOrgId={setOrgId}
        address={address}
        setAddress={setAddress}
        city={city}
        setCity={setCity}
        state={state}
        setState={setState}
        zipCode={zipCode}
        setZipCode={setZipCode}
        country={country}
        setCountry={setCountry}
        mainPhone={mainPhone}
        setMainPhone={setMainPhone}
        fax={fax}
        setFax={setFax}
        gmName={gmName}
        setGmName={setGmName}
        gmEmail={gmEmail}
        setGmEmail={setGmEmail}
        gmPhone={gmPhone}
        setGmPhone={setGmPhone}
        propertyDrawerData={propertyDrawerData}
        selectedPropForDrawer={selectedPropForDrawer}
        localOrgs={localOrgs}
        copiedField={copiedField}
        handleCopy={handleCopy}
      />

      {/* Commercial & Compliance Section */}
      <PropertyOverviewCommercialSection
        isEditing={isEditing}
        monthlyPrice={monthlyPrice}
        setMonthlyPrice={setMonthlyPrice}
        onboardingDate={onboardingDate}
        setOnboardingDate={setOnboardingDate}
        billingStatus={billingStatus}
        setBillingStatus={setBillingStatus}
        handleQuickUpdateBillingStatus={handleQuickUpdateBillingStatus}
        partnerId={partnerId}
        setPartnerId={setPartnerId}
        partnerCommOverride={partnerCommOverride}
        setPartnerCommOverride={setPartnerCommOverride}
        rayBaumStatus={rayBaumStatus}
        setRayBaumStatus={setRayBaumStatus}
        e911Status={e911Status}
        setE911Status={setE911Status}
        isRayBaumActive={isRayBaumActive}
        isE911Verified={isE911Verified}
        e911DisplayText={e911DisplayText}
        propertyDrawerData={propertyDrawerData}
        selectedPropForDrawer={selectedPropForDrawer}
        localPartners={localPartners}
        serverId={serverId}
        setServerId={setServerId}
        vendorId={vendorId}
        setVendorId={setVendorId}
        serverOptions={serverOptions}
        vendorOptions={vendorOptions}
      />
    </form>
  );
}
