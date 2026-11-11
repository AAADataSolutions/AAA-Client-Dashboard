'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PhoneForwarded,
  Radio,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Hotel,
  UserCheck,
  ArrowRight,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react';
import { useToast } from '@/components/client/ClientToast';

interface ForwardingTarget {
  name: string;
  number: string;
}

interface SavedContact {
  id: string;
  name: string;
  phone_number: string;
  is_suggested?: boolean;
}

interface ClientDidItem {
  id: string;
  custom_service_id: string;
  service_name: string;
  phone_number: string;
  normalized_did: string;
  service_type: string;
  status: string;
  property_id: string | null;
  property_name: string;
  property_location: string;
  pbx_server_id: 1 | 2 | 3;
  pbx_server_label: string;
  call_forwarding_state: 'ON' | 'OFF';
  active_forwarding_numbers: ForwardingTarget[];
  forwarding_updated_at: string;
}

export default function ClientCallForwardingPage() {
  const toast = useToast();
  const [items, setItems] = useState<ClientDidItem[]>([]);
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [metrics, setMetrics] = useState({
    totalDids: 0,
    forwardingOnCount: 0,
    forwardingOffCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  // Modal state
  const [selectedItem, setSelectedItem] = useState<ClientDidItem | null>(null);
  const [modalTargets, setModalTargets] = useState<ForwardingTarget[]>([{ name: 'General Manager', number: '' }]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchForwardingData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/client/call-forwarding');
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setSavedContacts(json.savedContacts || []);
        setProperties(json.properties || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load call forwarding settings');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchForwardingData();
  }, [fetchForwardingData]);

  const filteredItems = items.filter((i) => {
    if (propertyFilter !== 'ALL' && i.property_id !== propertyFilter) return false;
    if (stateFilter !== 'ALL' && i.call_forwarding_state !== stateFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        i.phone_number.toLowerCase().includes(q) ||
        i.property_name.toLowerCase().includes(q) ||
        i.service_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenModal = (item: ClientDidItem) => {
    setSelectedItem(item);
    if (item.active_forwarding_numbers && item.active_forwarding_numbers.length > 0) {
      setModalTargets(item.active_forwarding_numbers.map((t) => ({ name: t.name || 'Contact', number: t.number || '' })));
    } else if (savedContacts.length > 0) {
      setModalTargets([{ name: savedContacts[0].name, number: savedContacts[0].phone_number }]);
    } else {
      setModalTargets([{ name: 'General Manager', number: '' }]);
    }
    setNewContactName('');
    setNewContactNumber('');
  };

  const handleToggleSavedContact = (contact: SavedContact) => {
    const cleanNum = contact.phone_number.replace(/[^0-9]/g, '');
    const exists = modalTargets.some((t) => t.number.replace(/[^0-9]/g, '') === cleanNum);
    if (exists) {
      const remaining = modalTargets.filter((t) => t.number.replace(/[^0-9]/g, '') !== cleanNum);
      setModalTargets(remaining.length > 0 ? remaining : [{ name: '', number: '' }]);
    } else {
      const nonEmpty = modalTargets.filter((t) => t.number.trim() !== '');
      setModalTargets([...nonEmpty, { name: contact.name, number: contact.phone_number }]);
    }
  };

  const handleEnableForwarding = async () => {
    if (!selectedItem) return;
    const validTargets = modalTargets.filter((t) => t.number.trim().length > 0);
    if (validTargets.length === 0) {
      toast.error('Please enter or select at least one destination phone number.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/client/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward_on',
          service_id: selectedItem.id,
          property_id: selectedItem.property_id,
          property_name: selectedItem.property_name,
          did: selectedItem.normalized_did || selectedItem.phone_number,
          server_id: selectedItem.pbx_server_id,
          forwarding_numbers: validTargets,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to enable forwarding');
      toast.success(json.message || `Call forwarding enabled for ${selectedItem.phone_number}`);
      setSelectedItem(null);
      fetchForwardingData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableForwarding = async (targetItem?: ClientDidItem) => {
    const item = targetItem || selectedItem;
    if (!item) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/client/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward_off',
          service_id: item.id,
          property_id: item.property_id,
          did: item.normalized_did || item.phone_number,
          server_id: item.pbx_server_id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to disable forwarding');
      toast.success(json.message || `Call forwarding turned OFF for ${item.phone_number}`);
      if (!targetItem) setSelectedItem(null);
      fetchForwardingData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSavedContact = async () => {
    if (!newContactName.trim() || !newContactNumber.trim()) {
      toast.error('Enter both a contact name and phone number.');
      return;
    }
    try {
      const res = await fetch('/api/client/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          property_id: selectedItem?.property_id || null,
          contact_name: newContactName.trim(),
          contact_number: newContactNumber.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save contact');
      setSavedContacts((prev) => [json.data, ...prev]);
      setNewContactName('');
      setNewContactNumber('');
      toast.success(`Saved ${json.data.name} to your forwarding contacts.`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Call Forwarding Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Instantly forward your hotel phone lines (DIDs) to one or multiple backup numbers (General Manager, Owner, Night Desk) or restore normal PBX routing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/call-logs"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1c24] dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Radio className="w-4 h-4 text-blue-500" />
            <span>View Call History (CDR)</span>
          </Link>
          <button
            onClick={fetchForwardingData}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Your Phone Lines (DIDs)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalDids}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Currently Forwarding (ON)</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{metrics.forwardingOnCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Normal PBX Routing (OFF)</span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">{metrics.forwardingOffCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone number or property..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs"
          />
        </div>

        <select
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium"
        >
          <option value="ALL">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium"
        >
          <option value="ALL">All Statuses</option>
          <option value="ON">Forwarding ON</option>
          <option value="OFF">Forwarding OFF</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#222430] bg-slate-50/70 dark:bg-[#171922] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Phone Number (DID)</th>
                <th className="py-3.5 px-4">Property</th>
                <th className="py-3.5 px-4">Call Forwarding Status</th>
                <th className="py-3.5 px-4">Forwarded To</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e202b] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading your phone lines...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No phone lines found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOn = item.call_forwarding_state === 'ON';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                                : 'bg-slate-100 dark:bg-[#1f222e] text-slate-500'
                            }`}
                          >
                            <PhoneForwarded className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white font-mono">
                              {item.phone_number}
                            </p>
                            <span className="text-[10px] text-slate-400">{item.service_type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <Hotel className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.property_name}</span>
                        </div>
                        {item.property_location && (
                          <span className="text-[11px] text-slate-400 block">{item.property_location}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            FORWARDING ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            OFF (Normal Hotel Routing)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isOn && item.active_forwarding_numbers.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.active_forwarding_numbers.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-medium text-emerald-800 dark:text-emerald-200"
                              >
                                {t.name}: <strong className="font-mono">{t.number}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Hotel Front Desk / Default PBX</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isOn && (
                            <button
                              onClick={() => handleDisableForwarding(item)}
                              disabled={submitting}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 font-semibold text-[11px] cursor-pointer transition"
                            >
                              Turn OFF
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer transition"
                          >
                            {isOn ? 'Edit Forwarding' : 'Forward Calls'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
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
                onClick={() => setSelectedItem(null)}
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
                          onClick={() => handleToggleSavedContact(c)}
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
                    onClick={handleAddSavedContact}
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
                  onClick={() => handleDisableForwarding()}
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
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200/70 dark:bg-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnableForwarding}
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
      )}
    </div>
  );
}

