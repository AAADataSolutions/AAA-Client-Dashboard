'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { E911Item } from '@/store/slices/e911Slice';

interface E911DetailDrawerProps {
  show: boolean;
  record: E911Item | null;
  activeTab: 'DETAILS' | 'NOTES';
  setActiveTab: (tab: 'DETAILS' | 'NOTES') => void;
  onClose: () => void;
  newCorrectionNote: string;
  setNewCorrectionNote: (note: string) => void;
  addingNote: boolean;
  onAddCorrectionNote: (e: React.FormEvent) => void;
}

export default function E911DetailDrawer({
  show,
  record,
  activeTab,
  setActiveTab,
  onClose,
  newCorrectionNote,
  setNewCorrectionNote,
  addingNote,
  onAddCorrectionNote,
}: E911DetailDrawerProps) {
  if (!show || !record) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{record.property_name}</h3>
                <p className="text-xs text-slate-400">Emergency Dispatch &amp; PSAP Record</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('DETAILS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'DETAILS'
                      ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('NOTES')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    activeTab === 'NOTES'
                      ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Correction Notes
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab 1: Details */}
          {activeTab === 'DETAILS' && (
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Property Name</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                    {record.property_name}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Assigned Organization</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                    {record.organization_name}
                  </p>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-black dark:text-white block">Emergency Dispatch Address</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                    {record.emergency_address}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Validation Status</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    {record.status}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Ray Baum Compliance</label>
                  <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-semibold text-slate-800 dark:text-slate-200">
                    {record.ray_baum_compliant ? 'Verified' : 'Audit Required'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Correction Notes */}
          {activeTab === 'NOTES' && (
            <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Audit History &amp; Correction Logs</h4>
                {record.correction_notes ? (
                  <div className="p-3.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl space-y-2 whitespace-pre-wrap font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {record.correction_notes}
                  </div>
                ) : (
                  <p className="text-slate-400 italic p-4 border border-dashed border-slate-200 dark:border-[#222430] rounded-xl text-center">
                    No correction notes logged for this location yet.
                  </p>
                )}
              </div>

              {/* Add New Note */}
              <form onSubmit={onAddCorrectionNote} className="pt-3 border-t border-slate-100 dark:border-[#222430] space-y-2.5">
                <label className="font-bold text-black dark:text-white block">Add Note / Carrier Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={newCorrectionNote}
                  onChange={(e) => setNewCorrectionNote(e.target.value)}
                  placeholder="Enter verification notes, PSAP dispatch corrections, or room-level details..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none focus:outline-none focus:border-blue-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={addingNote || !newCorrectionNote.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Append Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="p-4 border-t border-slate-100 dark:border-[#222430] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
