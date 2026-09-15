'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Hotel,
  GitBranch,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  PlusCircle,
  MapPin,
  Phone,
  User,
  Info,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useToast } from './ClientToast';

interface PropertyCatalogItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string | null;
  contact_person_name: string | null;
  general_manager_name: string | null;
  status: string;
}

interface StartOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOnboarding: any) => void;
}

export const StartOnboardingModal: React.FC<StartOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [mode, setMode] = useState<'EXISTING_PROPERTY' | 'NEW_PROPERTY'>('EXISTING_PROPERTY');

  // Search & Dropdown properties state
  const [unassignedProperties, setUnassignedProperties] = useState<PropertyCatalogItem[]>([]);
  const [isLoadingProps, setIsLoadingProps] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    main_phone: '',
    fax: '',
    contact_person_name: '',
    contact_person_email: '',
    general_manager_name: '',
    target_date: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch unassigned properties for the dropdown
  const fetchUnassignedProperties = useCallback(async (query: string = '') => {
    setIsLoadingProps(true);
    try {
      const res = await fetch(`/api/client/properties/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setUnassignedProperties(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch unassigned properties:', err);
    } finally {
      setIsLoadingProps(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUnassignedProperties(filterQuery);
    }
  }, [isOpen, filterQuery, fetchUnassignedProperties]);

  if (!isOpen) return null;

  // Selected property object
  const selectedProperty = unassignedProperties.find((p) => p.id === selectedPropertyId);

  // Filtered properties for the dropdown
  const filteredDropdownOptions = unassignedProperties.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let payload: any = {
        mode,
        target_date: formData.target_date || null,
        notes: formData.notes || null,
      };

      if (mode === 'EXISTING_PROPERTY') {
        if (!selectedPropertyId) {
          throw new Error('Please select a property from the dropdown list.');
        }
        payload.property_id = selectedPropertyId;
      } else {
        if (!formData.name.trim()) throw new Error('Property name is required.');
        if (!formData.address.trim()) throw new Error('Street address is required.');
        if (!formData.city.trim()) throw new Error('City is required.');
        if (!formData.state.trim()) throw new Error('State is required.');
        if (!formData.zip_code.trim()) throw new Error('ZIP code is required.');

        payload = {
          ...payload,
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip_code: formData.zip_code.trim(),
          country: formData.country.trim() || 'USA',
          main_phone: formData.main_phone.trim() || null,
          fax: formData.fax.trim() || null,
          contact_person_name: formData.contact_person_name.trim() || null,
          contact_person_email: formData.contact_person_email.trim() || null,
          general_manager_name: formData.general_manager_name.trim() || null,
        };
      }

      const res = await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit onboarding request');
      }

      toast.success('Onboarding request submitted with initial status DRAFT.');
      onSuccess(json.data);
      onClose();
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setError(err.message || 'Failed to submit onboarding request');
      toast.error(err.message || 'Could not start onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#252733] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#111217]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Start New Property Onboarding
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Initiate a new telecommunication provisioning lifecycle (starts at Stage 1: Draft).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Mode Selector Tabs */}
        <div className="p-4 bg-slate-50/70 dark:bg-[#161820] border-b border-slate-200/80 dark:border-[#222430] shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('EXISTING_PROPERTY');
                setError(null);
              }}
              className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                mode === 'EXISTING_PROPERTY'
                  ? 'bg-white dark:bg-[#1f2029] border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white/60 dark:bg-[#181920]/60 border-slate-200 dark:border-[#252733] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                mode === 'EXISTING_PROPERTY'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <Building className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Select Existing Property
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                  Choose from available properties in AAA database
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('NEW_PROPERTY');
                setError(null);
              }}
              className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                mode === 'NEW_PROPERTY'
                  ? 'bg-white dark:bg-[#1f2029] border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white/60 dark:bg-[#181920]/60 border-slate-200 dark:border-[#252733] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${
                mode === 'NEW_PROPERTY'
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Add New Property
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
                  Enter property and contact details from scratch
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold">{error}</p>
                {error.includes('row-level security') && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Tip: Please ensure migration <code>DB_Queries/10_fix_property_onboarding_rls.sql</code> has been executed in your Supabase SQL editor.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CASE 1: EXISTING PROPERTY DROPDOWN SELECTOR */}
          {mode === 'EXISTING_PROPERTY' && (
            <div className="space-y-4">
              {/* Filter Search Input */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                  Select Property from AAA Database <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder="Type to filter properties by name, city, or address..."
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {filterQuery && (
                    <button
                      type="button"
                      onClick={() => setFilterQuery('')}
                      className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#252733] hover:bg-slate-50 dark:hover:bg-[#1f2029] text-slate-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* The Dropdown Element */}
                <div className="relative">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      setError(null);
                    }}
                    aria-label="Select property from AAA Database"
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">
                      {isLoadingProps
                        ? 'Loading database properties...'
                        : filteredDropdownOptions.length === 0
                        ? 'No unassigned properties found'
                        : `— Select a Property (${filteredDropdownOptions.length} available) —`}
                    </option>
                    {filteredDropdownOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.city}, {p.state} ({p.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Property Preview Card */}
              {selectedProperty ? (
                <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Hotel className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          {selectedProperty.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}</span>
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Ready to Onboard</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Main Phone:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedProperty.main_phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact Person / GM:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                        {selectedProperty.contact_person_name || selectedProperty.general_manager_name || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                  <span>Please choose a property from the dropdown above to view its details.</span>
                </div>
              )}

              {/* Target Date & Notes for Existing Property */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-[#222430]">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Go-Live Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Initial Scoping Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. 24 DIDs, port from AT&T, analog lines"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CASE 2: NEW PROPERTY CREATION */}
          {mode === 'NEW_PROPERTY' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Property / Hotel Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Grand Hyatt Downtown Chicago"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 151 E Wacker Dr"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Chicago"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. IL"
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      ZIP Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      placeholder="e.g. 60601"
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Main Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.main_phone}
                    onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                    placeholder="e.g. +1 (312) 565-1234"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    General Manager Name
                  </label>
                  <input
                    type="text"
                    value={formData.general_manager_name}
                    onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                    placeholder="e.g. Mark Roberts"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person_name}
                    onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins (IT Director)"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Contact Person Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_person_email}
                    onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                    placeholder="e.g. sjenkins@hyatt.com"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target Go-Live Date
                  </label>
                  <input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Project Scope Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. New property cutover, 12 voice lines"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181920] border border-slate-200 dark:border-[#252733] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Workflow Note Alert */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-bold text-[11.5px] block">
                Next Steps in the Onboarding Roadmap:
              </span>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                Submitting will create the property onboarding at <strong>Stage 1: Draft</strong>. The AAA Data Solutions engineering team will review the property details and prepare your master telecom contract and porting LOA authorization.
              </p>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#111217]/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-[#1f212a] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (mode === 'EXISTING_PROPERTY' && !selectedPropertyId)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Onboarding...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {mode === 'EXISTING_PROPERTY'
                    ? 'Confirm & Start Onboarding'
                    : 'Create Property & Start Onboarding'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
