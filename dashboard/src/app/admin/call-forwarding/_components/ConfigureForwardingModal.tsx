'use client';

import React from 'react';
import {
  PhoneForwarded,
  RefreshCw,
  Plus,
  Trash2,
  X,
  UserCheck,
  ArrowRight,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react';
import { CallForwardingItem, ForwardingTarget, SavedContact } from './types';

interface ConfigureForwardingModalProps {
  selectedItem: CallForwardingItem | null;
  setSelectedItem: (item: CallForwardingItem | null) => void;
  modalServerId: 1 | 2 | 3;
  setModalServerId: (id: 1 | 2 | 3) => void;
  modalUsername: string;
  setModalUsername: (val: string) => void;
  modalTargets: ForwardingTarget[];
  setModalTargets: (targets: ForwardingTarget[]) => void;
  newContactName: string;
  setNewContactName: (val: string) => void;
  newContactNumber: string;
  setNewContactNumber: (val: string) => void;
  submitting: boolean;
  refreshingLive: boolean;
  handleRefreshLiveStatus: () => void;
  handleToggleSavedContactIntoTargets: (contact: SavedContact) => void;
  handleSaveNewContact: () => void;
  handleDisableForwarding: (targetItem?: CallForwardingItem) => void;
  handleEnableForwarding: () => void;
}

export function ConfigureForwardingModal({
  selectedItem,
  setSelectedItem,
  modalServerId,
  setModalServerId,
  modalUsername,
  setModalUsername,
  modalTargets,
  setModalTargets,
  newContactName,
  setNewContactName,
  newContactNumber,
  setNewContactNumber,
  submitting,
  refreshingLive,
  handleRefreshLiveStatus,
  handleToggleSavedContactIntoTargets,
  handleSaveNewContact,
  handleDisableForwarding,
  handleEnableForwarding,
}: ConfigureForwardingModalProps) {
  if (!selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#242736] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/60 dark:bg-[#10121a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Configure DID Call Forwarding — {selectedItem.phone_number}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedItem.property_name} • {selectedItem.organization_name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedItem(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* PBX Server & Portal Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#191b26] border border-slate-200/80 dark:border-[#252836]">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                PBX Server Cluster
              </label>
              <select
                value={modalServerId}
                onChange={(e) => setModalServerId(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2d3d] font-semibold text-slate-800 dark:text-white"
              >
                <option value={1}>Server 1 — PBX 115</option>
                <option value={2}>Server 2 — PBX 142</option>
                <option value={3}>Server 3 — PBX 240</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Call Forwarding Portal Username
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalUsername}
                  onChange={(e) => setModalUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#12141c] border border-slate-200 dark:border-[#2a2d3d] font-mono text-slate-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleRefreshLiveStatus}
                  disabled={refreshingLive}
                  className="px-3 py-2 rounded-lg bg-slate-200/80 dark:bg-[#232634] hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold shrink-0 cursor-pointer"
                  title="Query live status from PBX"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingLive ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick-Select Saved Contacts */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Saved Forwarding Contacts (Click to Select / Deselect)
            </label>
            {selectedItem.saved_contacts && selectedItem.saved_contacts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedItem.saved_contacts.map((c) => {
                  const isSelected = modalTargets.some(
                    (t) => t.number.replace(/[^0-9]/g, '') === c.phone_number.replace(/[^0-9]/g, '')
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleSavedContactIntoTargets(c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-[#191b24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282b3a] hover:border-blue-400'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{c.name}:</span>
                      <span className="font-mono font-bold">{c.phone_number}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-[11px]">
                No saved contacts yet. Add a contact below or enter destination numbers directly.
              </p>
            )}

            {/* Add New Saved Contact inline */}
            {selectedItem.organization_id && (
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="New Contact Label (e.g. General Manager, Owner)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a]"
                />
                <input
                  type="text"
                  placeholder="Phone Number (e.g. 20387679781)"
                  value={newContactNumber}
                  onChange={(e) => setNewContactNumber(e.target.value)}
                  className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a] font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveNewContact}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white font-semibold shrink-0 cursor-pointer"
                >
                  + Save to Address Book
                </button>
              </div>
            )}
          </div>

          {/* Active Forwarding Destinations List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Forwarding Destination Numbers (`forwarding_numbers`)
              </label>
              <button
                type="button"
                onClick={() => setModalTargets([...modalTargets, { name: 'Backup Contact', number: '' }])}
                className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Destination
              </button>
            </div>

            {modalTargets.map((target, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. General Manager)"
                  value={target.name}
                  onChange={(e) => {
                    const updated = [...modalTargets];
                    updated[index].name = e.target.value;
                    setModalTargets(updated);
                  }}
                  className="w-2/5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a] text-slate-900 dark:text-white"
                />
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Destination Number (e.g. 20387679781)"
                  value={target.number}
                  onChange={(e) => {
                    const updated = [...modalTargets];
                    updated[index].number = e.target.value;
                    setModalTargets(updated);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a] font-mono text-slate-900 dark:text-white"
                />
                {modalTargets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalTargets(modalTargets.filter((_, i) => i !== index))}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/60 dark:bg-[#10121a] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleDisableForwarding()}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition"
          >
            <PowerOff className="w-4 h-4" />
            <span>Disable Forwarding (Restore PBX Route)</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEnableForwarding}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span>Enable Call Forwarding (ON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

