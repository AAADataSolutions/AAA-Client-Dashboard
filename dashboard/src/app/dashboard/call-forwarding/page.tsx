'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Radio,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/client/ClientToast';
import { ClientDidItem, ForwardingTarget, SavedContact } from './_components/types';
import { CallForwardingModal } from './_components/CallForwardingModal';
import { CallForwardingTableView } from './_components/CallForwardingTableView';

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
      <CallForwardingTableView
        loading={loading}
        filteredItems={filteredItems}
        submitting={submitting}
        onDisableForwarding={handleDisableForwarding}
        onOpenModal={handleOpenModal}
      />

      {/* Modal */}
      <CallForwardingModal
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        savedContacts={savedContacts}
        modalTargets={modalTargets}
        setModalTargets={setModalTargets}
        onToggleSavedContact={handleToggleSavedContact}
        newContactName={newContactName}
        setNewContactName={setNewContactName}
        newContactNumber={newContactNumber}
        setNewContactNumber={setNewContactNumber}
        onAddSavedContact={handleAddSavedContact}
        onDisableForwarding={() => handleDisableForwarding()}
        onEnableForwarding={handleEnableForwarding}
        submitting={submitting}
      />
    </div>
  );
}
