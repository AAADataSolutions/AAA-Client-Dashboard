'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Eye,
  PhoneCall,
  Link2,
  Unlink,
  Users,
  AlertCircle,
  Settings,
  Trash2,
} from 'lucide-react';

interface OrgPropertyActionMenuProps {
  activePropMenu: { prop: any; bottom: number; left: number } | null;
  setActivePropMenu: (menu: { prop: any; bottom: number; left: number } | null) => void;
  setViewingPropDetails: (prop: any | null) => void;
  handleViewPropertyServices: (prop: any) => Promise<void>;
  handleOpenAssignServiceModal: (prop?: any) => Promise<void>;
  setUnassignTarget: (target: { propertyId: string; name: string } | null) => void;
  handleOpenPropertyContacts: (prop: any) => Promise<void>;
  setStatusPropTarget: (prop: any | null) => void;
  handleOpenEditPropertySettings: (prop: any) => void;
  setDeletePropTarget: (prop: any) => void;
}

export function OrgPropertyActionMenu({
  activePropMenu,
  setActivePropMenu,
  setViewingPropDetails,
  handleViewPropertyServices,
  handleOpenAssignServiceModal,
  setUnassignTarget,
  handleOpenPropertyContacts,
  setStatusPropTarget,
  handleOpenEditPropertySettings,
  setDeletePropTarget,
}: OrgPropertyActionMenuProps) {
  return (
    <AnimatePresence>
      {activePropMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActivePropMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              bottom: `${activePropMenu.bottom}px`,
              left: `${activePropMenu.left}px`,
            }}
            className="z-50 w-56 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          >
            {/* Header with Property Name and "Property Options" */}
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#2b2d3b] bg-slate-50/50 dark:bg-[#15161c]/50">
              <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {activePropMenu.prop.name}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Property Options</div>
            </div>

            {/* 1. View Property Details */}
            <button
              onClick={() => {
                setViewingPropDetails(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property Details</span>
            </button>

            {/* 2. View Services */}
            <button
              onClick={() => {
                handleViewPropertyServices(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-purple-500" />
              <span>View Services</span>
            </button>

            {/* 3. Assign Service */}
            <button
              onClick={() => {
                handleOpenAssignServiceModal(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assign Service</span>
            </button>

            {/* 4. Unassign from Organization (orange text) */}
            <button
              onClick={() => {
                setUnassignTarget({ propertyId: activePropMenu.prop.id, name: activePropMenu.prop.name });
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 transition cursor-pointer font-semibold"
            >
              <Unlink className="w-3.5 h-3.5 text-amber-500" />
              <span>Unassign from Organization</span>
            </button>

            {/* 5. Manage Contacts */}
            <button
              onClick={() => {
                handleOpenPropertyContacts(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manage Contacts</span>
            </button>

            {/* 6. Change Status */}
            <button
              onClick={() => {
                setStatusPropTarget(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Change Status</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-[#2b2d3b]" />

            {/* 7. Edit Property Settings */}
            <button
              onClick={() => {
                handleOpenEditPropertySettings(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Property Settings</span>
            </button>

            {/* 8. Delete Property (red text) */}
            <button
              onClick={() => {
                setDeletePropTarget(activePropMenu.prop);
                setActivePropMenu(null);
              }}
              className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Property</span>
            </button>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
