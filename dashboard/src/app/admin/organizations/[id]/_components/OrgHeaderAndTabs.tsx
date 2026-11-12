'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2,
  Hotel,
  ChevronLeft,
  MapPin,
  PhoneCall,
  Users,
  ShieldCheck,
  Edit2,
  UserPlus,
} from 'lucide-react';
import { type OrgDetail, type OrgDetailTab, itemVariants } from './types';

interface OrgHeaderAndTabsProps {
  org: OrgDetail;
  activeTab: OrgDetailTab;
  setActiveTab: (tab: OrgDetailTab) => void;
  fetchOrgProperties: () => Promise<void>;
  setEditFormData: (data: any) => void;
  setEditLogoPreview: (preview: string | null) => void;
  setEditLogoFile: (file: File | null) => void;
  setShowEditOrgModal: (show: boolean) => void;
  setShowAddContactModal: (show: boolean) => void;
}

export function OrgHeaderAndTabs({
  org,
  activeTab,
  setActiveTab,
  fetchOrgProperties,
  setEditFormData,
  setEditLogoPreview,
  setEditLogoFile,
  setShowEditOrgModal,
  setShowAddContactModal,
}: OrgHeaderAndTabsProps) {
  return (
    <>
      {/* Navigation Breadcrumb */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href="/admin/organizations"
          className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Management Groups Directory</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold">{org.name}</span>
      </motion.div>

      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-6 rounded-2xl shadow-xs"
      >
        <div className="flex items-center gap-4">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-[#222430] shrink-0 shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{org.name}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  org.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : org.status === 'INACTIVE'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    org.status === 'ACTIVE' ? 'bg-emerald-500' : org.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
                {org.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{org.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (org) {
                setEditFormData({
                  name: org.name || '',
                  address: org.street_address || '',
                  city: org.city || '',
                  state: org.state || '',
                  zip_code: org.zip_code || '',
                  country: org.country || 'USA',
                  phone: org.phone !== '—' ? org.phone : '',
                  email: org.email !== '—' ? org.email : '',
                  status: org.status || 'ACTIVE',
                  logo_url: org.logo_url || '',
                });
                setEditLogoPreview(org.logo_url || null);
                setEditLogoFile(null);
              }
              setShowEditOrgModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#252733] hover:bg-slate-50 dark:hover:bg-[#1f212a] text-slate-700 dark:text-slate-300 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddContactModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222430] overflow-x-auto pb-1 text-xs"
      >
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTACTS')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'CONTACTS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts ({org.contacts?.length || 0})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('PROPERTIES');
            fetchOrgProperties();
          }}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'PROPERTIES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Hotel className="w-4 h-4" />
          <span>Assigned Properties ({org.properties?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'SERVICES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Services &amp; Lines ({org.services?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('E911')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'E911'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>E911 Compliance ({org.e911?.length || 0})</span>
        </button>
      </motion.div>
    </>
  );
}
