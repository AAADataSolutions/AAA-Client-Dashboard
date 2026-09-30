'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  DollarSign,
  Building2,
  Hotel,
  Percent,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Copy,
  Check,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  default_commission_rate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  notes?: string | null;
  total_properties_count: number;
  active_properties_count: number;
  monthly_gross_revenue: number;
  monthly_commission_estimated: number;
  has_pending_invite?: boolean;
  created_at: string;
}

interface PropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  monthly_price: number | null;
  partner_id?: string | null;
  partner_commission_override?: number | null;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyOption[]>([]);
  const [metrics, setMetrics] = useState({
    totalPartners: 0,
    activePartners: 0,
    totalCommissionPayout: 0,
    assignedPropertiesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Partner Invite Modal (Shown right after creation or when requesting invite link)
  const [inviteModalData, setInviteModalData] = useState<{
    partnerName: string;
    partnerEmail: string;
    inviteUrl: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [generatingInviteId, setGeneratingInviteId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    default_commission_rate: 10,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    notes: '',
  });

  const [assignForm, setAssignForm] = useState({
    property_id: '',
    commission_override: '',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery.trim(),
        status: statusFilter,
      });
      const [resPartners, resProps] = await Promise.all([
        fetch(`/api/admin/partners?${params.toString()}`),
        fetch('/api/admin/properties?limit=200'),
      ]);

      const jsonPartners = await resPartners.json();
      const jsonProps = await resProps.json();

      if (jsonPartners.success) {
        setPartners(jsonPartners.data || []);
        if (jsonPartners.metrics) setMetrics(jsonPartners.metrics);
      }
      if (jsonProps.success) {
        setAllProperties(jsonProps.data || []);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load partners', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setFormError('Partner name and email are required.');
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to create partner.');

      setShowCreateModal(false);
      loadData();

      // Show invite modal with generated link
      if (result.inviteUrl) {
        setInviteModalData({
          partnerName: formData.name,
          partnerEmail: formData.email,
          inviteUrl: result.inviteUrl,
        });
      } else {
        showToast('Success', `${formData.name} added as partner.`);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create partner.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to update partner.');

      showToast('Updated', `Partner ${formData.name} updated.`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update partner.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateInviteLink = async (partner: Partner) => {
    try {
      setGeneratingInviteId(partner.id);
      const res = await fetch(`/api/admin/partners/${partner.id}/invite`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate invite link.');

      setInviteModalData({
        partnerName: partner.name,
        partnerEmail: partner.email,
        inviteUrl: json.inviteUrl,
      });
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to generate invite link.', 'error');
    } finally {
      setGeneratingInviteId(null);
    }
  };

  const handleCopyInviteUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    showToast('Copied', 'Partner invite link copied to clipboard.');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleAssignProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !assignForm.property_id) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: assignForm.property_id,
          commission_override: assignForm.commission_override || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to assign property.');

      showToast('Assigned', 'Property assigned to partner with revenue share.');
      setShowAssignModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Assignment failed.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-500 text-white'
              : toast.type === 'error'
              ? 'bg-rose-900/90 border border-rose-500 text-white'
              : 'bg-blue-900/90 border border-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Check className="w-5 h-5 text-blue-400" />
          )}
          <div>
            <p className="font-bold text-xs">{toast.title}</p>
            <p className="text-xs opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" /> Partners &amp; Revenue Share
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage channel partners, affiliate properties, and recurring commission revenue share.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: '',
              email: '',
              phone: '',
              company_name: '',
              default_commission_rate: 10,
              status: 'ACTIVE',
              notes: '',
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* 3 KPI Cards — EXACT ROYAL BLUE VARIANT AS IN IMAGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: TOTAL PARTNERS */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              TOTAL PARTNERS
            </span>
            <Users className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.totalPartners}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Partners</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            {metrics.activePartners} Active channel partners
          </p>
        </div>

        {/* Card 2: ASSIGNED PROPERTIES */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              ASSIGNED PROPERTIES
            </span>
            <Hotel className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {metrics.assignedPropertiesCount}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Properties</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Hospitality locations with revenue share
          </p>
        </div>

        {/* Card 3: EST. MONTHLY COMMISSION */}
        <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
              EST. MONTHLY COMMISSION
            </span>
            <DollarSign className="w-4 h-4 text-white/90" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${metrics.totalCommissionPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-white ml-2">Payout</span>
          </div>
          <p className="text-[11px] text-blue-200/90 font-medium">
            Total recurring partner payout pipeline
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search partner name, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#1e2029] text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-[#15161c] border-b border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">PARTNER / COMPANY</th>
                <th className="py-3.5 px-4">CONTACT</th>
                <th className="py-3.5 px-4">DEFAULT RATE</th>
                <th className="py-3.5 px-4">PROPERTIES</th>
                <th className="py-3.5 px-4">MONTHLY RUN-RATE</th>
                <th className="py-3.5 px-4">EST. COMMISSION</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No partner records found. Click &quot;Add Partner&quot; to register your first channel partner.
                  </td>
                </tr>
              ) : (
                partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                    {/* Partner Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white block">{partner.name}</span>
                      {partner.company_name && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{partner.company_name}</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{partner.email}</span>
                      </div>
                      {partner.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{partner.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Default Rate */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                      {partner.default_commission_rate}%
                    </td>

                    {/* Assigned Properties */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <Hotel className="w-3.5 h-3.5 text-slate-400" />
                        {partner.active_properties_count} Active
                      </span>
                    </td>

                    {/* Gross Monthly */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800 dark:text-slate-200">
                      ${partner.monthly_gross_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Commission */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      ${partner.monthly_commission_estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                          partner.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy Invite Link */}
                        <button
                          onClick={() => handleGenerateInviteLink(partner)}
                          disabled={generatingInviteId === partner.id}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition border border-emerald-200/60 dark:border-emerald-800/60"
                          title="Generate & Copy Invite Link"
                        >
                          {generatingInviteId === partner.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Invite Link</span>
                        </button>

                        {/* Assign Property */}
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setAssignForm({ property_id: '', commission_override: '' });
                            setShowAssignModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition border border-blue-200/60 dark:border-blue-800/60"
                        >
                          <LinkIcon className="w-3 h-3" /> Assign Property
                        </button>

                        {/* Edit Partner */}
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setFormData({
                              name: partner.name,
                              email: partner.email,
                              phone: partner.phone || '',
                              company_name: partner.company_name || '',
                              default_commission_rate: partner.default_commission_rate,
                              status: partner.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                              notes: partner.notes || '',
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#20222e] cursor-pointer"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Invite URL Modal */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Partner Invitation Link
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invite ready for <strong className="text-slate-700 dark:text-slate-200">{inviteModalData.partnerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Share this partner-specific link with <strong>{inviteModalData.partnerEmail}</strong>. When they open the link, they will create their password and get direct access to the Partner Portal.
              </p>

              <div className="p-3 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteModalData.inviteUrl}
                  className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 w-full focus:outline-none select-all"
                />
                <button
                  onClick={() => handleCopyInviteUrl(inviteModalData.inviteUrl)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                <strong>Next Step:</strong> Send this invite URL via email, Slack, or messaging. The invitation token remains valid for 30 days.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                onClick={() => setInviteModalData(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Partner Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {showCreateModal ? 'Add New Partner' : 'Edit Partner'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={showCreateModal ? handleCreatePartner : handleUpdatePartner} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Hospitality Group"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@domain.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Company / Entity</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Entity Name"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Revenue Share (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.default_commission_rate}
                    onChange={(e) => setFormData({ ...formData, default_commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional commission terms or payment details..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shadow-xs"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {showCreateModal ? 'Create & Generate Invite' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Property Modal */}
      {showAssignModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Property to {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400">Default Commission Rate: {selectedPartner.default_commission_rate}%</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleAssignProperty} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Property</label>
                <select
                  required
                  value={assignForm.property_id}
                  onChange={(e) => setAssignForm({ ...assignForm, property_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose a property --</option>
                  {allProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.monthly_price ? `($${p.monthly_price}/mo)` : ''} {p.partner_id === selectedPartner.id ? '(Currently assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Commission Rate Override (% optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder={`Leave blank to use default ${selectedPartner.default_commission_rate}%`}
                  value={assignForm.commission_override}
                  onChange={(e) => setAssignForm({ ...assignForm, commission_override: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shadow-xs"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Assign Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
