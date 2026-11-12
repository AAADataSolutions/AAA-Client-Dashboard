'use client';

import React from 'react';
import {
  Hotel,
  MapPin,
  PhoneCall,
  MoreVertical,
  LifeBuoy,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  FileText,
} from 'lucide-react';
import { getStageBadge } from '@/components/client/OnboardingTimelineModal';
import { PropertyRecord, getCircuitStageBadge } from './types';

interface PropertiesGridViewProps {
  properties: PropertyRecord[];
  handleOpenPropertyDetails: (prop: PropertyRecord, tab?: 'OVERVIEW' | 'SERVICES' | 'E911' | 'ONBOARDING' | 'TICKETS') => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, prop: PropertyRecord) => void;
}

export const PropertiesGridView: React.FC<PropertiesGridViewProps> = ({
  properties,
  handleOpenPropertyDetails,
  handleOpenMenu,
}) => {
  return (
    /* GRID VIEW */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map((prop) => (
        <div
          key={prop.id}
          onClick={() => handleOpenPropertyDetails(prop)}
          className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
                  <Hotel className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {prop.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{prop.city}, {prop.state}</span>
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold shrink-0 ${
                  prop.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                }`}
              >
                {prop.status}
              </span>
            </div>

            <div className="space-y-2 text-xs py-2 border-t border-b border-slate-100 dark:border-[#20222c] my-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">General Manager:</span>
                <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                  {prop.general_manager_name || prop.contact_person_name || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Active Services:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {prop.services_count} Lines
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Monthly Price:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {prop.monthly_price !== null && prop.monthly_price !== undefined
                    ? `$${Number(prop.monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Connectivity:</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {(() => {
                    const ct = (prop as any).connectivity_type || ((prop as any).data_circuit ? 'BOTH' : 'PORTED');
                    if (ct === 'BOTH') return 'Ported & Data Circuited';
                    if (ct === 'DATA_CIRCUITED') return 'Data Circuited';
                    return 'Ported';
                  })()}
                </span>
              </div>
              {(prop as any).data_circuit && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Circuit Status:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <span>{getCircuitStageBadge((prop as any).data_circuit.status).label}</span>
                    {(prop as any).data_circuit.agreement_file_url && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-200">
                        <FileText className="w-2.5 h-2.5" /> PDF
                      </span>
                    )}
                  </span>
                </div>
              )}
              {(prop as any).data_circuit && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Carrier / Price:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {(prop as any).data_circuit.carrier_name || 'Pending'}
                    {(prop as any).data_circuit.circuit_monthly_price !== null && (prop as any).data_circuit.circuit_monthly_price !== undefined
                      ? ` • $${Number((prop as any).data_circuit.circuit_monthly_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Stage:</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {getStageBadge(prop.stage || prop.onboarding_status || 'DRAFT').label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPropertyDetails(prop);
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
            <button
              onClick={(e) => handleOpenMenu(e, prop)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#20222d] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Property options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface PropertiesPaginationAndMenuProps {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  menuPosition: {
    bottom?: number;
    top?: number;
    left: number;
    prop: PropertyRecord;
  } | null;
  setMenuPosition: React.Dispatch<React.SetStateAction<{
    bottom?: number;
    top?: number;
    left: number;
    prop: PropertyRecord;
  } | null>>;
  handleOpenPropertyDetails: (prop: PropertyRecord, tab?: 'OVERVIEW' | 'SERVICES' | 'E911' | 'ONBOARDING' | 'TICKETS') => void;
  handleOpenEditGM: (prop: PropertyRecord) => void;
}

export const PropertiesPaginationAndMenu: React.FC<PropertiesPaginationAndMenuProps> = ({
  totalRecords,
  currentPage,
  pageSize,
  totalPages,
  setCurrentPage,
  menuPosition,
  setMenuPosition,
  handleOpenPropertyDetails,
  handleOpenEditGM,
}) => {
  return (
    <>
      {/* 5. Pagination */}
      {totalRecords > 0 && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] px-4 py-3 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, totalRecords)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> properties
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1">...</span>}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        currentPage === p
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a]'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Fixed 3-Dots Overlay Action Menu with all requested actions */}
      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="z-50 w-60 rounded-xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#252733]">
              <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                Property Actions
              </span>
              <span className="font-semibold text-slate-900 dark:text-white truncate block">
                {menuPosition.prop.name}
              </span>
            </div>

            {/* Action 1: View property details */}
            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'OVERVIEW')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>View Property Details</span>
            </button>

            {/* Action 2: View services */}
            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'SERVICES')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
              <span>View Services ({menuPosition.prop.services_count})</span>
            </button>

            {/* Action 3: View tickets */}
            <button
              onClick={() => handleOpenPropertyDetails(menuPosition.prop, 'TICKETS')}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 transition cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-500" />
              <span>View Tickets ({menuPosition.prop.tickets?.length || 0})</span>
            </button>

            {/* Action 4: Edit GM details */}
            <button
              onClick={() => handleOpenEditGM(menuPosition.prop)}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Edit GM Details</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
