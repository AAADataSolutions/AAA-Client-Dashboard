'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Info, Trash2, Loader2 } from 'lucide-react';
import type { ServiceItem } from '@/store/slices/servicesSlice';
import type { PropertyOption } from './types';

interface ServiceAssignModalsProps {
  statusService: ServiceItem | null;
  onCloseStatus: () => void;
  assignService: ServiceItem | null;
  onCloseAssign: () => void;
  deleteService: ServiceItem | null;
  onCloseDelete: () => void;
  propertyOptions: PropertyOption[];
  onSuccess: (title: string, message: string) => void;
  onOptimisticStatus?: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void;
}

export default function ServiceAssignModals({
  statusService,
  onCloseStatus,
  assignService,
  onCloseAssign,
  deleteService,
  onCloseDelete,
  propertyOptions,
  onSuccess,
  onOptimisticStatus,
}: ServiceAssignModalsProps) {
  // Status Slider state
  const [statusSliderValue, setStatusSliderValue] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [statusSliderLoading, setStatusSliderLoading] = useState(false);

  useEffect(() => {
    if (statusService) {
      setStatusSliderValue((statusService.status as any) || 'ACTIVE');
    }
  }, [statusService]);

  const handleConfirmStatusSlider = async () => {
    if (!statusService) return;
    if (onOptimisticStatus) {
      onOptimisticStatus(statusService.id, statusSliderValue);
    }

    try {
      setStatusSliderLoading(true);
      const res = await fetch(`/api/admin/services/${statusService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusSliderValue }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update status.');
      onCloseStatus();
      onSuccess('Status Updated', `${statusService.phone_number} is now ${statusSliderValue}.`);
    } catch (err: any) {
      onSuccess('Error', err.message);
    } finally {
      setStatusSliderLoading(false);
    }
  };

  // Assign to Property state
  const [targetPropertyId, setTargetPropertyId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (assignService) {
      setTargetPropertyId(assignService.property_id || '');
    }
  }, [assignService]);

  const handleConfirmAssignProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignService || !targetPropertyId) return;

    try {
      setAssignLoading(true);
      const res = await fetch(`/api/admin/services/${assignService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: targetPropertyId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign property.');
      const assignedProp = propertyOptions.find((p) => p.id === targetPropertyId);
      onCloseAssign();
      onSuccess(
        'Property Assigned',
        `${assignService.phone_number} linked to ${assignedProp?.name || 'property'}.`
      );
    } catch (err: any) {
      onSuccess('Error', err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteService) return;
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/admin/services/${deleteService.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete service');
      onCloseDelete();
      onSuccess('Deleted', `Service ${deleteService.phone_number} removed.`);
    } catch (err: any) {
      onSuccess('Error', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* 1. STATUS SLIDER MODAL */}
      <AnimatePresence>
        {statusService && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Update Service Status</h3>
                <button
                  type="button"
                  onClick={onCloseStatus}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Select operating state for{' '}
                  <span className="font-bold text-black dark:text-white">
                    {statusService.phone_number}
                  </span>
                  :
                </p>

                {/* Smooth Slider Control */}
                <div className="p-1.5 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] grid grid-cols-3 gap-1 relative">
                  {(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusSliderValue(st)}
                      className={`py-2 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer relative z-10 flex flex-col items-center gap-1 ${
                        statusSliderValue === st
                          ? st === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : st === 'SUSPENDED'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <span>{st}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-[#1a1b24] rounded-xl border border-slate-200/60 dark:border-[#282a36] text-[11px] text-slate-500">
                  {statusSliderValue === 'ACTIVE' && 'Service is currently routing calls & incurring active monthly billing.'}
                  {statusSliderValue === 'INACTIVE' && 'Service is provisioned in the PBX but temporarily unrouted.'}
                  {statusSliderValue === 'SUSPENDED' && 'Service is disabled due to non-payment or administrative hold.'}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onCloseStatus}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStatusSlider}
                    disabled={statusSliderLoading}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {statusSliderLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ASSIGN TO PROPERTY MODAL */}
      <AnimatePresence>
        {assignService && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Assign to Property</h3>
                </div>
                <button
                  type="button"
                  onClick={onCloseAssign}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmAssignProperty} className="mt-4 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400">
                  Select destination property for{' '}
                  <span className="font-bold text-black dark:text-white">
                    {assignService.phone_number}
                  </span>
                  :
                </p>

                <div>
                  <select
                    value={targetPropertyId}
                    onChange={(e) => setTargetPropertyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Property...</option>
                    {propertyOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.organization_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onCloseAssign}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading || !targetPropertyId}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {assignLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. DELETE SERVICE MODAL */}
      <AnimatePresence>
        {deleteService && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <div className="flex items-center gap-2 text-rose-600">
                  <Trash2 className="w-4 h-4" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Service</h3>
                </div>
                <button
                  type="button"
                  onClick={onCloseDelete}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-black dark:text-white">
                    {deleteService.custom_service_id || deleteService.phone_number}
                  </span>
                  ? This will unroute all associated phone numbers and cancel linked billing.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onCloseDelete}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
