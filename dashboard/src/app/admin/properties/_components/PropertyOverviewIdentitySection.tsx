'use client';

import React from 'react';
import { Mail, Phone, Check, Copy, ExternalLink } from 'lucide-react';
import { PropertyRecord } from '@/store/slices/propertiesSlice';
import { OrgOption } from './types';

interface PropertyOverviewIdentitySectionProps {
  isEditing: boolean;
  name: string;
  setName: (v: string) => void;
  orgId: string;
  setOrgId: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  zipCode: string;
  setZipCode: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  mainPhone: string;
  setMainPhone: (v: string) => void;
  fax: string;
  setFax: (v: string) => void;
  gmName: string;
  setGmName: (v: string) => void;
  gmEmail: string;
  setGmEmail: (v: string) => void;
  gmPhone: string;
  setGmPhone: (v: string) => void;
  propertyDrawerData: any;
  selectedPropForDrawer: PropertyRecord;
  localOrgs: OrgOption[];
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
}

export function PropertyOverviewIdentitySection({
  isEditing,
  name,
  setName,
  orgId,
  setOrgId,
  address,
  setAddress,
  city,
  setCity,
  state,
  setState,
  zipCode,
  setZipCode,
  country,
  setCountry,
  mainPhone,
  setMainPhone,
  fax,
  setFax,
  gmName,
  setGmName,
  gmEmail,
  setGmEmail,
  gmPhone,
  setGmPhone,
  propertyDrawerData,
  selectedPropForDrawer,
  localOrgs,
  copiedField,
  handleCopy,
}: PropertyOverviewIdentitySectionProps) {
  return (
    <>
      {/* Property Identity & Location */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          Property Identity &amp; Location
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Property Name <span className="text-rose-500">*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
                {propertyDrawerData?.property?.name || selectedPropForDrawer.name}
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Client / Organization
            </label>
            {isEditing ? (
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned (Direct Property)</option>
                {localOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg flex items-center justify-between">
                {propertyDrawerData?.organization ? (
                  <a
                    href={`/admin/organizations/${propertyDrawerData.organization.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>{propertyDrawerData.organization.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ) : (
                  <span className="text-slate-400">Unassigned (Direct Property)</span>
                )}
                {propertyDrawerData?.organization && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-300">
                    {propertyDrawerData.organization.type || 'GROUP'}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Street Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                {propertyDrawerData?.property?.address || selectedPropForDrawer.address || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              City, State &amp; ZIP
            </label>
            {isEditing ? (
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="px-2.5 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                {propertyDrawerData?.property?.city || selectedPropForDrawer.city},{' '}
                {propertyDrawerData?.property?.state || selectedPropForDrawer.state}{' '}
                {propertyDrawerData?.property?.zip_code || selectedPropForDrawer.zip_code}
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Country
            </label>
            {isEditing ? (
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                {propertyDrawerData?.property?.country || selectedPropForDrawer.country || 'USA'}
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Main Phone Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={mainPhone}
                onChange={(e) => setMainPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <div className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>{propertyDrawerData?.property?.main_phone || selectedPropForDrawer.main_phone || '—'}</span>
                {(propertyDrawerData?.property?.main_phone || selectedPropForDrawer.main_phone) && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        propertyDrawerData?.property?.main_phone || selectedPropForDrawer.main_phone || '',
                        'drawer-main-phone'
                      )
                    }
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    {copiedField === 'drawer-main-phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              Fax Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                placeholder="+1 (555) 000-0001"
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                {propertyDrawerData?.property?.fax || selectedPropForDrawer.fax || '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* General Manager Contact Information */}
      <div className="bg-slate-50/80 dark:bg-[#111217] p-4 rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-3">
        <span className="font-bold text-black dark:text-white text-xs uppercase tracking-wider block pb-2 border-b border-slate-200/60 dark:border-[#222430]">
          General Manager Contact Information
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              GM Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={gmName}
                onChange={(e) => setGmName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg font-medium text-slate-900 dark:text-white">
                {propertyDrawerData?.property?.general_manager_name || selectedPropForDrawer.general_manager_name || '—'}
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              GM Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={gmEmail}
                onChange={(e) => setGmEmail(e.target.value)}
                placeholder="gm@hotelchain.com"
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{propertyDrawerData?.property?.general_manager_email || selectedPropForDrawer.general_manager_email || '—'}</span>
              </p>
            )}
          </div>

          <div>
            <label className="font-bold text-black dark:text-white block text-[11px] mb-1">
              GM Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={gmPhone}
                onChange={(e) => setGmPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="p-2.5 bg-white dark:bg-[#181a24] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {propertyDrawerData?.property?.general_manager_phone ||
                    selectedPropForDrawer.general_manager_phone ||
                    propertyDrawerData?.property?.main_phone ||
                    '—'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
