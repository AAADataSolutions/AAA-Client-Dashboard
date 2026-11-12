'use client';

import React from 'react';
import {
  PhoneCall,
  Plus,
  MoreVertical,
  Edit2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Eye,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import {
  setPagination,
  ServiceItem,
  ServiceRecord,
} from '@/store/slices/servicesSlice';
import { ServiceFormData, INITIAL_SERVICE_FORM_DATA } from './types';

interface ServicesTableProps {
  error: string | null;
  loading: boolean;
  services: ServiceRecord[];
  loadData: () => void;
  hasActiveFilters: boolean;
  resetAllFilters: () => void;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  setShowCustomServiceId: (show: boolean) => void;
  setShowCreateModal: (show: boolean) => void;
  setSelectedServiceForDetails: (svc: ServiceItem | null) => void;
  setShowDetailsDrawer: (show: boolean) => void;
  handleOpenStatusSlider: (e: React.MouseEvent, svc: ServiceItem) => void;
  handleOpenEdit: (svc: ServiceItem) => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, svc: ServiceItem) => void;
  pagination: {
    currentPage: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  menuPosition: { bottom: number; left: number; service: ServiceItem } | null;
  setMenuPosition: (pos: { bottom: number; left: number; service: ServiceItem } | null) => void;
  handleOpenAssignModal: (svc: ServiceItem) => void;
  handleUnassignProperty: (svc: ServiceItem) => void;
  setServiceToDelete: (svc: ServiceItem | null) => void;
}

export default function ServicesTable({
  error,
  loading,
  services,
  loadData,
  hasActiveFilters,
  resetAllFilters,
  setFormData,
  setShowCustomServiceId,
  setShowCreateModal,
  setSelectedServiceForDetails,
  setShowDetailsDrawer,
  handleOpenStatusSlider,
  handleOpenEdit,
  handleOpenMenu,
  pagination,
  menuPosition,
  setMenuPosition,
  handleOpenAssignModal,
  handleUnassignProperty,
  setServiceToDelete,
}: ServicesTableProps) {
  const dispatch = useAppDispatch();

  return (
    <>
      {/* Main Table View */}
      {error ? (
        <div className="bg-white dark:bg-[#15161c] border border-rose-500/20 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Could not load services</p>
          <p className="text-xs text-slate-400 mt-0.5">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 bg-[#4f46e5] text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : loading && services.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl overflow-hidden shadow-sm p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 animate-pulse">
              <div className="h-3.5 bg-slate-200 dark:bg-[#222430] rounded w-1/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-24"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-16"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#222430] rounded w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#222430] rounded-full w-14"></div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-sm">
          <PhoneCall className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No Services Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {hasActiveFilters
              ? 'No services match the selected filters.'
              : 'Provision your first voice trunk or DID line.'}
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
                setFormData(INITIAL_SERVICE_FORM_DATA);
                setShowCustomServiceId(false);
                setShowCreateModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#4f46e5] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Provision Service
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-black dark:text-white font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE ID</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE NAME</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE NUMBER</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">SERVICE TYPE</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PRICE / MO</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">ORGANIZATION</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">PROPERTY</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-4 text-black dark:text-white font-bold text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                {services.map((svc: ServiceRecord) => {
                  return (
                    <tr
                      key={svc.id}
                      onClick={() => {
                        setSelectedServiceForDetails(svc);
                        setShowDetailsDrawer(true);
                      }}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition cursor-pointer"
                    >
                      {/* 1. Service ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-black dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                          {svc.custom_service_id || svc.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* 2. Service Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-black dark:text-white text-sm block">
                          {svc.service_name || `Service ${svc.phone_number}`}
                        </span>
                      </td>

                      {/* 3. Service Number (NO phone icon) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {svc.phone_number}
                        </span>
                      </td>

                      {/* 4. Service Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                          {svc.service_type || 'Voice Line'}
                        </span>
                      </td>

                      {/* 5. Monthly Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          ${Number(svc.price || 0).toFixed(2)}/mo
                        </span>
                      </td>

                      {/* 6. Organization (Auto-resolved via single property) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {svc.attached_organization_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 7. Property */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300">
                          {svc.attached_property_name || 'Unassigned'}
                        </span>
                      </td>

                      {/* 8. Status (Click opens Smooth Slider Modal) */}
                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => handleOpenStatusSlider(e, svc)}>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition ${
                            svc.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                              : svc.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              svc.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : svc.status === 'SUSPENDED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {svc.status === 'ACTIVE' ? 'Active' : svc.status === 'SUSPENDED' ? 'Suspended' : 'Inactive'}
                        </button>
                      </td>

                      {/* 9. Actions (Pencil & Three Dots) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(svc)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenMenu(e, svc)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server-Side Pagination Bar */}
          <div className="p-3 border-t border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} services
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
                onClick={() => dispatch(setPagination({ currentPage: Math.min(pagination.totalPages, pagination.currentPage + 1) }))}
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
            className="fixed z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{menuPosition.service.phone_number}</p>
              <p className="text-[10px] text-slate-400">Service Options</p>
            </div>

            <button
              onClick={() => {
                handleOpenEdit(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Service</span>
            </button>

            <button
              onClick={() => {
                setSelectedServiceForDetails(menuPosition.service);
                setShowDetailsDrawer(true);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Details</span>
            </button>

            <button
              onClick={() => {
                handleOpenAssignModal(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
            >
              <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assign to Property</span>
            </button>

            {menuPosition.service.property_id && (
              <button
                onClick={() => {
                  const svc = menuPosition.service;
                  setMenuPosition(null);
                  handleUnassignProperty(svc);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium text-amber-600 dark:text-amber-400"
              >
                <X className="w-3.5 h-3.5 text-amber-500" />
                <span>Unassign Property</span>
              </button>
            )}

            <button
              onClick={() => {
                setServiceToDelete(menuPosition.service);
                setMenuPosition(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium text-rose-600 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Service</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
