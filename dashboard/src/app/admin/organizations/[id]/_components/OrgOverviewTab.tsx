'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Hotel, PhoneCall, Users, Clock } from 'lucide-react';
import { type OrgDetail, itemVariants } from './types';

interface OrgOverviewTabProps {
  org: OrgDetail;
  setEditFormData: (data: any) => void;
  setEditLogoPreview: (preview: string | null) => void;
  setEditLogoFile: (file: File | null) => void;
  setShowEditOrgModal: (show: boolean) => void;
  setShowAddContactModal: (show: boolean) => void;
}

export function OrgOverviewTab({
  org,
  setEditFormData,
  setEditLogoPreview,
  setEditLogoFile,
  setShowEditOrgModal,
  setShowAddContactModal,
}: OrgOverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Quick Stats Row (4 Deep Blue Standardized Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Assigned Properties
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Hotel size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {org.properties?.length || 0}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Locations</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Hospitality assets linked</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Active Voice Lines
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <PhoneCall size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {org.services?.length || 0}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Lines</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Operational trunks &amp; DIDs</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Authorized Contacts
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {org.contacts?.length || 0}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">Personnel</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Authorized managers</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
              Onboarding Pipelines
            </span>
            <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-100 dark:text-white">
              {org.onboardings?.length || 0}
            </span>
            <span className="text-xs text-slate-100 ml-1.5 font-medium">In Flight</span>
          </div>
          <p className="text-[11px] text-slate-100 mt-2">Active migrations</p>
        </motion.div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Organization Profile</h3>
            <button
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
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
            >
              Edit Profile
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {org.logo_url && (
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-400">Logo:</span>
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-[#2a2d3d]"
                />
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{org.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Registered Address:</span>
              <span className="text-right text-slate-700 dark:text-slate-300 font-medium max-w-[220px]">
                {org.address}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Main Phone:</span>
              <span className="text-slate-700 dark:text-slate-300">{org.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Main Email:</span>
              <span className="text-slate-700 dark:text-slate-300">{org.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{org.status}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Primary Administrator</h3>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
            >
              Add Contact
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Contact Person:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {org.primary_contact?.name || 'Not Assigned'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {org.primary_contact?.email || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Direct Phone:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {org.primary_contact?.phone || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#222430]">
              <span className="text-slate-400">Designation:</span>
              <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                Primary Admin
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
