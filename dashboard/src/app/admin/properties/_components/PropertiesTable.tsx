'use client';

import React from 'react';
import {
  Building2,
  Plus,
  MoreVertical,
  Settings,
  PhoneCall,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  Trash2,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setPagination, PropertyItem, PropertyRecord } from '@/store/slices/propertiesSlice';
import { PropertyFormData, getDefaultPropertyFormData } from './types';
import { PropertyTableRow } from './PropertyTableRow';

interface PropertiesTableProps {
  properties: PropertyRecord[];
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  hasActiveFilters: boolean;
  resetAllFilters: () => void;
  loadData: () => void;
  isSuperAdmin: boolean;
  copiedField: string | null;
  handleCopy: (text: string, label: string) => void;
  handleOpenPropertyDrawer: (prop: PropertyRecord | PropertyItem) => void;
  handleOpenServicesModal: (prop: PropertyItem) => void;
  handleQuickUpdateStatus: (propId: string, newStatus: string) => void;
  handleQuickUpdateBillingStatus: (propId: string, newBillingStatus: 'BILLING_DONE' | 'BILLING_PENDING') => void;
  handleOpenEdit: (prop: PropertyItem) => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyItem) => void;
  menuPosition: { bottom: number; left: number; prop: PropertyItem } | null;
  setMenuPosition: (pos: { bottom: number; left: number; prop: PropertyItem } | null) => void;
  setSelectedPropForDetails: (prop: PropertyItem | null) => void;
  handleOpenAssignServiceModal: (prop: PropertyItem) => void;
  setSelectedPropForAssignOrg: (prop: PropertyItem | null) => void;
  setShowAssignOrgModal: (show: boolean) => void;
  handleUnassignFromOrg: (prop: PropertyItem) => void;
  handleOpenContactsDrawer: (prop: PropertyItem) => void;
  handleOpenStatusModal: (prop: PropertyItem) => void;
  setPropertyToDelete: (prop: PropertyItem | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<PropertyFormData>>;
  setShowCreateModal: (show: boolean) => void;
}

export function PropertiesTable({
  properties,
  loading,
  error,
  pagination,
  hasActiveFilters,
  resetAllFilters,
  loadData,
  isSuperAdmin,
  copiedField,
  handleCopy,
  handleOpenPropertyDrawer,
  handleOpenServicesModal,
  handleQuickUpdateStatus,
  handleQuickUpdateBillingStatus,
  handleOpenEdit,
  handleOpenMenu,
  menuPosition,
  setMenuPosition,
  setSelectedPropForDetails,
  handleOpenAssignServiceModal,
  setSelectedPropForAssignOrg,
  setShowAssignOrgModal,
  handleUnassignFromOrg,
  handleOpenContactsDrawer,
  handleOpenStatusModal,
  setPropertyToDelete,
  setFormData,
  setShowCreateModal,
}: PropertiesTableProps) {
  const dispatch = useAppDispatch();

  return (
    <>
      {/* Main Table View */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load properties</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && properties.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Properties Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No properties matched the selected filters.'
              : 'Get started by creating your first hotel property.'}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => {
                setFormData(getDefaultPropertyFormData());
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Property
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY</th>
                  {isSuperAdmin && (
                    <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">MONTHLY PRICE</th>
                  )}
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">MAIN PHONE NO.</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">CLIENT</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">NO. OF SERVICES</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">E911 STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">RAY BAUM AND KARY&apos;S LAW</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">GM EMAIL</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">BILLING STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {properties.map((prop: PropertyRecord) => (
                  <PropertyTableRow
                    key={prop.id}
                    prop={prop}
                    isSuperAdmin={isSuperAdmin}
                    copiedField={copiedField}
                    handleCopy={handleCopy}
                    handleOpenPropertyDrawer={handleOpenPropertyDrawer}
                    handleOpenServicesModal={handleOpenServicesModal}
                    handleQuickUpdateStatus={handleQuickUpdateStatus}
                    handleQuickUpdateBillingStatus={handleQuickUpdateBillingStatus}
                    handleOpenEdit={handleOpenEdit}
                    handleOpenMenu={handleOpenMenu}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} properties
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => dispatch(setPagination({ currentPage: Math.max(1, pagination.currentPage - 1) }))}
                disabled={pagination.currentPage <= 1 || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => dispatch(setPagination({ currentPage: num }))}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    pagination.currentPage === num
                      ? 'bg-[#4f46e5] text-white'
                      : 'border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c]'
                  }`}
                >
                  {num}
                </button>
              ))}

              <button
                onClick={() =>
                  dispatch(setPagination({ currentPage: Math.min(pagination.totalPages, pagination.currentPage + 1) }))
                }
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212c] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-DOTS ACTION POPUP */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ bottom: `${menuPosition.bottom}px`, left: `${menuPosition.left}px` }}
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.prop.name}</p>
              <p className="text-[10px] text-slate-400">Property Options</p>
            </div>

            <button
              onClick={() => {
                setSelectedPropForDetails(menuPosition.prop);
                handleOpenPropertyDrawer(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property Details</span>
            </button>

            <button
              onClick={() => {
                handleOpenServicesModal(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-purple-500" />
              <span>View Services</span>
            </button>

            <button
              onClick={() => {
                handleOpenAssignServiceModal(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assign Service</span>
            </button>

            {!menuPosition.prop.primary_organization &&
              (!menuPosition.prop.organizations || menuPosition.prop.organizations.length === 0) && (
                <button
                  onClick={() => {
                    setSelectedPropForAssignOrg(menuPosition.prop);
                    setShowAssignOrgModal(true);
                    setMenuPosition(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-blue-600 dark:text-blue-400"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Assign to Organization</span>
                </button>
              )}

            {(menuPosition.prop.primary_organization ||
              (menuPosition.prop.organizations && menuPosition.prop.organizations.length > 0)) && (
              <button
                onClick={() => {
                  const p = menuPosition.prop;
                  setMenuPosition(null);
                  handleUnassignFromOrg(p);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
              >
                <Unlink className="w-3.5 h-3.5 text-amber-500" />
                <span>Unassign from Organization</span>
              </button>
            )}

            <button
              onClick={() => {
                handleOpenContactsDrawer(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Manage Contacts</span>
            </button>

            <button
              onClick={() => {
                handleOpenStatusModal(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Change Status</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

            <button
              onClick={() => {
                handleOpenEdit(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Property Settings</span>
            </button>

            <button
              onClick={() => {
                setPropertyToDelete(menuPosition.prop);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Property</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}

