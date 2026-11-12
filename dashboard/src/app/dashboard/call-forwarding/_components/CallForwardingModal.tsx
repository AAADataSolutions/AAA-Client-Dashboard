import React from 'react';
import {
  X,
  UserCheck,
  Plus,
  ArrowRight,
  Trash2,
  PowerOff,
  Power,
  Loader2,
} from 'lucide-react';
import { ClientDidItem, ForwardingTarget, SavedContact } from './types';

interface CallForwardingModalProps {
  selectedItem: ClientDidItem | null;
  onClose: () => void;
  savedContacts: SavedContact[];
  modalTargets: ForwardingTarget[];
  setModalTargets: React.Dispatch<React.SetStateAction<ForwardingTarget[]>>;
  onToggleSavedContact: (contact: SavedContact) => void;
  newContactName: string;
  setNewContactName: (val: string) => void;
  newContactNumber: string;
  setNewContactNumber: (val: string) => void;
  onAddSavedContact: () => void;
  onDisableForwarding: () => void;
  onEnableForwarding: () => void;
  submitting: boolean;
}

export function CallForwardingModal({
  selectedItem,
  onClose,
  savedContacts,
  modalTargets,
  setModalTargets,
  onToggleSavedContact,
  newContactName,
  setNewContactName,
  newContactNumber,
  setNewContactNumber,
  onAddSavedContact,
  onDisableForwarding,
  onEnableForwarding,
  submitting,
}: CallForwardingModalProps) {
  if (!selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#242736] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/60 dark:bg-[#10121a]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Manage Call Forwarding — {selectedItem.phone_number}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{selectedItem.property_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          {/* Saved Contacts */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">
              Saved Forwarding Contacts (Click to Select)
            </label>
            {savedContacts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {savedContacts.map((c) => {
                  const isSelected = modalTargets.some(
                    (t) => t.number.replace(/[^0-9]/g, '') === c.phone_number.replace(/[^0-9]/g, '')
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onToggleSavedContact(c)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-[#191b24] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#282b3a]'
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
              <p className="text-slate-400 text-[11px]">No saved contacts yet. Save a contact below for 1-click access.</p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Contact Name (e.g. GM, Owner)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a]"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newContactNumber}
                onChange={(e) => setNewContactNumber(e.target.value)}
                className="flex-1 w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a] font-mono"
              />
              <button
                type="button"
                onClick={onAddSavedContact}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold shrink-0 cursor-pointer"
              >
                + Save Contact
              </button>
            </div>
          </div>

          {/* Active Destinations */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Forward Calls To
              </label>
              <button
                type="button"
                onClick={() => setModalTargets([...modalTargets, { name: 'Backup Contact', number: '' }])}
                className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Number
              </button>
            </div>

            {modalTargets.map((target, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Label (e.g. General Manager)"
                  value={target.name}
                  onChange={(e) => {
                    const updated = [...modalTargets];
                    updated[index].name = e.target.value;
                    setModalTargets(updated);
                  }}
                  className="w-2/5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a]"
                />
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Phone Number (e.g. 20387679781)"
                  value={target.number}
                  onChange={(e) => {
                    const updated = [...modalTargets];
                    updated[index].number = e.target.value;
                    setModalTargets(updated);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#282b3a] font-mono"
                />
                {modalTargets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalTargets(modalTargets.filter((_, i) => i !== index))}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/60 dark:bg-[#10121a] flex flex-wrap items-center justify-between gap-3">
          {selectedItem.call_forwarding_state === 'ON' ? (
            <button
              type="button"
              onClick={onDisableForwarding}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PowerOff className="w-4 h-4" />
              <span>Turn Forwarding OFF</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onEnableForwarding}
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span>Enable Call Forwarding</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
