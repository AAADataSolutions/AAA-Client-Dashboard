'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PhoneForwarded,
  PhoneCall,
  Radio,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Hotel,
  Building2,
  UserCheck,
  Server,
  ArrowRight,
  Loader2,
  Power,
  PowerOff,
  FileClock,
} from 'lucide-react';

interface ForwardingTarget {
  name: string;
  number: string;
}

interface SavedContact {
  id: string;
  organization_id?: string;
  property_id?: string | null;
  name: string;
  phone_number: string;
  is_suggested?: boolean;
}

interface CallForwardingItem {
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
  organization_id: string | null;
  organization_name: string;
  portal_username: string;
  pbx_server_id: 1 | 2 | 3;
  pbx_server_label: string;
  portal_did_synced: boolean;
  call_forwarding_state: 'ON' | 'OFF';
  active_forwarding_numbers: ForwardingTarget[];
  saved_contacts: SavedContact[];
  forwarding_updated_at: string;
}

export default function AdminCallForwardingPage() {
  const [items, setItems] = useState<CallForwardingItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalDids: 0,
    forwardingOnCount: 0,
    forwardingOffCount: 0,
    pbx115Count: 0,
    pbx142Count: 0,
    pbx240Count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serverFilter, setServerFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  // Manage Modal state
  const [selectedItem, setSelectedItem] = useState<CallForwardingItem | null>(null);
  const [modalServerId, setModalServerId] = useState<1 | 2 | 3>(1);
  const [modalUsername, setModalUsername] = useState('');
  const [modalTargets, setModalTargets] = useState<ForwardingTarget[]>([{ name: 'General Manager', number: '' }]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCallForwardingData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (serverFilter !== 'ALL') params.set('server_id', serverFilter);
      if (stateFilter !== 'ALL') params.set('state', stateFilter);

      const res = await fetch(`/api/admin/call-forwarding?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load call forwarding data', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, serverFilter, stateFilter]);

  useEffect(() => {
    fetchCallForwardingData();
  }, [fetchCallForwardingData]);

  const handleOpenManageModal = (item: CallForwardingItem) => {
    setSelectedItem(item);
    setModalServerId(item.pbx_server_id || 1);
    setModalUsername(item.portal_username || 'admin@activetelephones.com');
    if (item.active_forwarding_numbers && item.active_forwarding_numbers.length > 0) {
      setModalTargets(item.active_forwarding_numbers.map((t) => ({ name: t.name || 'Contact', number: t.number || '' })));
    } else if (item.saved_contacts && item.saved_contacts.length > 0) {
      setModalTargets([{ name: item.saved_contacts[0].name, number: item.saved_contacts[0].phone_number }]);
    } else {
      setModalTargets([{ name: 'General Manager', number: '' }]);
    }
    setNewContactName('');
    setNewContactNumber('');
  };

  const handleToggleSavedContactIntoTargets = (contact: SavedContact) => {
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
      showToast('Missing Destination', 'Please enter or select at least one destination phone number.', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward_on',
          service_id: selectedItem.id,
          organization_id: selectedItem.organization_id,
          property_id: selectedItem.property_id,
          property_name: selectedItem.property_name,
          username: modalUsername,
          did: selectedItem.normalized_did || selectedItem.phone_number,
          server_id: modalServerId,
          forwarding_numbers: validTargets,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to enable call forwarding');
      }
      showToast('Forwarding Enabled (ON)', json.message || `Forwarding active for ${selectedItem.phone_number}`);
      setSelectedItem(null);
      fetchCallForwardingData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableForwarding = async (targetItem?: CallForwardingItem) => {
    const item = targetItem || selectedItem;
    if (!item) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward_off',
          service_id: item.id,
          organization_id: item.organization_id,
          property_id: item.property_id,
          username: targetItem ? item.portal_username : modalUsername,
          did: item.normalized_did || item.phone_number,
          server_id: targetItem ? item.pbx_server_id : modalServerId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to disable call forwarding');
      }
      showToast('Forwarding Disabled (OFF)', json.message || `Normal PBX routing restored for ${item.phone_number}`);
      if (!targetItem) setSelectedItem(null);
      fetchCallForwardingData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshLiveStatus = async () => {
    if (!selectedItem) return;
    try {
      setRefreshingLive(true);
      const res = await fetch('/api/admin/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh_status',
          service_id: selectedItem.id,
          organization_id: selectedItem.organization_id,
          property_id: selectedItem.property_id,
          username: modalUsername,
          did: selectedItem.normalized_did || selectedItem.phone_number,
          server_id: modalServerId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('PBX Status Synced', `Live status retrieved from ${selectedItem.pbx_server_label}.`);
        fetchCallForwardingData();
      }
    } catch (err: any) {
      showToast('Sync Error', err.message || 'Failed to query PBX status', 'error');
    } finally {
      setRefreshingLive(false);
    }
  };

  const handleSaveNewContact = async () => {
    if (!selectedItem?.organization_id || !newContactName.trim() || !newContactNumber.trim()) {
      showToast('Missing Fields', 'Enter a contact label and phone number (requires an assigned Organization).', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/call-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_contact',
          organization_id: selectedItem.organization_id,
          property_id: selectedItem.property_id,
          contact_name: newContactName.trim(),
          contact_number: newContactNumber.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save contact');
      const created = json.data;
      setSelectedItem({
        ...selectedItem,
        saved_contacts: [created, ...(selectedItem.saved_contacts || [])],
      });
      setNewContactName('');
      setNewContactNumber('');
      showToast('Contact Saved', `Added ${created.name} to saved forwarding contacts.`);
      fetchCallForwardingData();
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-medium ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800'
              : 'bg-emerald-950 text-emerald-100 border-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-bold">{toast.title}</p>
            <p className="opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>FreePBX Cluster Integration (PBX 115 • PBX 142 • PBX 240)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Call Forwarding &amp; DID Routing Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage real-time inbound DID call forwarding across all properties, management groups, and FreePBX servers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/call-logs"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1c24] dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
          >
            <FileClock className="w-4 h-4 text-blue-500" />
            <span>View CDR Call Logs</span>
          </Link>
          <button
            onClick={fetchCallForwardingData}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh DIDs</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total DIDs</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.totalDids}</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Forwarding ON</span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{metrics.forwardingOnCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Normal Routing (OFF)</span>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200 mt-1">{metrics.forwardingOffCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">PBX 115 (Srv 1)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pbx115Count}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase">PBX 142 (Srv 2)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pbx142Count}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430]">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase">PBX 240 (Srv 3)</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{metrics.pbx240Count}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by DID number, property name, management group, or portal username..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={serverFilter}
          onChange={(e) => setServerFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          <option value="ALL">All PBX Servers</option>
          <option value="1">Server 1 — PBX 115</option>
          <option value="2">Server 2 — PBX 142</option>
          <option value="3">Server 3 — PBX 240</option>
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#191b24] border border-slate-200 dark:border-[#262936] text-xs font-medium text-slate-700 dark:text-slate-200"
        >
          <option value="ALL">All Forwarding States</option>
          <option value="ON">Forwarding ON Only</option>
          <option value="OFF">Forwarding OFF Only</option>
        </select>
      </div>

      {/* DIDs Table */}
      <div className="rounded-2xl bg-white dark:bg-[#13151c] border border-slate-200/80 dark:border-[#222430] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#222430] bg-slate-50/70 dark:bg-[#171922] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">DID / Phone Number</th>
                <th className="py-3.5 px-4">Property &amp; Management Group</th>
                <th className="py-3.5 px-4">PBX Server</th>
                <th className="py-3.5 px-4">Portal Username</th>
                <th className="py-3.5 px-4">Forwarding Status</th>
                <th className="py-3.5 px-4">Active Destination(s)</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e202b] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading DID Call Forwarding records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No DIDs found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isOn = item.call_forwarding_state === 'ON';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#181a24] transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
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
                          <Hotel className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{item.property_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{item.organization_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                          <Server className="w-3 h-3" />
                          {item.pbx_server_label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {item.portal_username}
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
                            OFF (Normal PBX)
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
                          <span className="text-slate-400 text-[11px]">Inbound PBX Default Route</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isOn && (
                            <button
                              onClick={() => handleDisableForwarding(item)}
                              disabled={submitting}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-semibold text-[11px] cursor-pointer transition"
                              title="Turn Forwarding OFF"
                            >
                              Turn OFF
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenManageModal(item)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer transition"
                          >
                            Configure
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

      {/* Configure Call Forwarding Modal */}
      {selectedItem && (
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
      )}
    </div>
  );
}

