'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Users,
  Search,
  Plus,
  DollarSign,
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
  Phone,
  Mail,
  FileText,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Printer,
  Clock,
  Eye,
  MoreVertical,
  Unlink,
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
  status?: string;
}

interface PartnerInvoiceItem {
  id: string;
  partner_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_properties: number;
  gross_revenue: number;
  commission_amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  paid_at?: string | null;
  payment_reference?: string | null;
  line_items?: any[];
  notes?: string | null;
  created_at: string;
  partner?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
    default_commission_rate?: number;
  };
}

export default function AdminPartnersPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'INVOICES'>('PARTNERS');

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyOption[]>([]);
  const [partnerMetrics, setPartnerMetrics] = useState({
    totalPartners: 0,
    activePartners: 0,
    totalCommissionPayout: 0,
    assignedPropertiesCount: 0,
  });

  // Invoices state
  const [invoices, setInvoices] = useState<PartnerInvoiceItem[]>([]);
  const [invoiceMetrics, setInvoiceMetrics] = useState({
    totalInvoicesCount: 0,
    totalInvoiced: 0,
    pendingPayout: 0,
    totalPaid: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 3-Dots Action Menu state
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    partner: Partner;
  } | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewPropertiesModal, setShowViewPropertiesModal] = useState(false);
  const [showViewInvoicesModal, setShowViewInvoicesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [partnerAssignedProps, setPartnerAssignedProps] = useState<PropertyOption[]>([]);
  const [partnerInvoicesList, setPartnerInvoicesList] = useState<PartnerInvoiceItem[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // Invoice statement preview modal
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<PartnerInvoiceItem | null>(null);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Partner Invite Modal
  const [inviteModalData, setInviteModalData] = useState<{
    partnerName: string;
    partnerEmail: string;
    inviteUrl: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [generatingInviteId, setGeneratingInviteId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

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
      if (activeTab === 'PARTNERS') {
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
          if (jsonPartners.metrics) setPartnerMetrics(jsonPartners.metrics);
        }
        if (jsonProps.success) {
          setAllProperties(jsonProps.data || []);
        }
      } else {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          status: statusFilter,
        });
        const resInvoices = await fetch(`/api/admin/partners/invoices?${params.toString()}`);
        const jsonInvoices = await resInvoices.json();
        if (jsonInvoices.success) {
          setInvoices(jsonInvoices.data || []);
          if (jsonInvoices.metrics) setInvoiceMetrics(jsonInvoices.metrics);
        }
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle 3-dots Action Menu with upside/downside space detection
  const handleOpenMenu = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 240;

    if (spaceBelow < menuHeight) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        left: Math.max(10, rect.right - 230),
        partner,
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(10, rect.right - 230),
        partner,
      });
    }
  };

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

      showToast('Updated', `${formData.name} updated successfully.`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update partner.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartner) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete partner.');

      showToast('Deleted', `${selectedPartner.name} removed.`);
      setShowDeleteModal(false);
      setSelectedPartner(null);
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Delete failed.', 'error');
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

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
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

  const handleOpenViewProperties = async (partner: Partner) => {
    setSelectedPartner(partner);
    setLoadingModalData(true);
    setShowViewPropertiesModal(true);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerAssignedProps(json.data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load partner properties:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string) => {
    if (!selectedPartner) return;
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, action: 'UNASSIGN' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Unassign failed.');

      showToast('Unassigned', 'Property unassigned from partner.');
      setPartnerAssignedProps((prev) => prev.filter((p) => p.id !== propertyId));
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Unassign failed.', 'error');
    }
  };

  const handleOpenViewInvoices = async (partner: Partner) => {
    setSelectedPartner(partner);
    setLoadingModalData(true);
    setShowViewInvoicesModal(true);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerInvoicesList(json.data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load partner invoices:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setUpdatingInvoiceId(invoiceId);
      const res = await fetch('/api/admin/partners/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update invoice status.');

      showToast('Status Updated', `Invoice status set to ${newStatus}.`);
      loadData();
      if (selectedPartner) {
        setPartnerInvoicesList((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv))
        );
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Update failed', 'error');
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-admin-invoice, #printable-admin-invoice * {
            visibility: visible;
          }
          #printable-admin-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 30px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" /> Partners &amp; Revenue Share
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage channel partners, affiliate properties, recurring commissions, and partner payout invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === 'PARTNERS' && (
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          )}
        </div>
      </div>

      {/* Top Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222430] pb-2">
        <button
          onClick={() => {
            setActiveTab('PARTNERS');
            setSearchQuery('');
            setStatusFilter('ALL');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'PARTNERS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181a24]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Partner Directory</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'PARTNERS' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-[#20222a] text-slate-700 dark:text-slate-300'}`}>
            {partnerMetrics.totalPartners}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('INVOICES');
            setSearchQuery('');
            setStatusFilter('ALL');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'INVOICES'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181a24]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Partner Invoices &amp; Payouts</span>
          {invoiceMetrics.pendingPayout > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
              Pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PARTNERS DIRECTORY */}
      {activeTab === 'PARTNERS' && (
        <div className="space-y-6">
          {/* 3 KPI Cards — ROYAL BLUE VARIANT */}
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
                  {partnerMetrics.totalPartners}
                </span>
                <span className="text-sm font-semibold text-white ml-2">Partners</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                {partnerMetrics.activePartners} Active channel partners
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
                  {partnerMetrics.assignedPropertiesCount}
                </span>
                <span className="text-sm font-semibold text-white ml-2">Properties</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Hospitality locations with revenue share
              </p>
            </div>

            {/* Card 3: EST. MONTHLY COMMISSION / RUN RATE */}
            <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                  MONTHLY RUN RATE
                </span>
                <DollarSign className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
                  ${partnerMetrics.totalCommissionPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-white ml-2">/ Month</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Combined monthly commission revenue share
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search partner name, email, company, phone..."
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

          {/* EXACT REQUESTED 8 TABLE COLUMNS */}
          <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white dark:bg-[#15161c] border-b border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 whitespace-nowrap">PARTNER</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">EMAIL</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">PHONE NO.</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">SHARE</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">NO. OF PROPERTIES ASSIGNED</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">MONTHLY RUN RATE</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">STATUS</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">ACTIONS</th>
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
                        No partner records found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    partners.map((partner) => {
                      const isActive = partner.status === 'ACTIVE';

                      return (
                        <tr key={partner.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                          {/* 1. PARTNER (Name + Company underneath) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm block">
                              {partner.name}
                            </span>
                            {partner.company_name && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-normal mt-0.5">
                                {partner.company_name}
                              </span>
                            )}
                          </td>

                          {/* 2. EMAIL */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{partner.email}</span>
                            </div>
                          </td>

                          {/* 3. PHONE NO. */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                            {partner.phone && partner.phone !== '—' ? (
                              <div className="flex items-center gap-1.5">
                                <span>{partner.phone}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(partner.phone || '');
                                    setCopiedPhoneId(partner.id);
                                    showToast('Copied', 'Phone copied to clipboard');
                                    setTimeout(() => setCopiedPhoneId(null), 2000);
                                  }}
                                  className="text-slate-400 hover:text-blue-500 cursor-pointer p-0.5"
                                  title="Copy Phone"
                                >
                                  {copiedPhoneId === partner.id ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* 4. SHARE */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-black text-blue-600 dark:text-blue-400 text-xs">
                            {partner.default_commission_rate}%
                          </td>

                          {/* 5. NO. OF PROPERTIES ASSIGNED */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenViewProperties(partner)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px] cursor-pointer transition"
                              title="Click to view assigned properties list"
                            >
                              <Hotel className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{partner.total_properties_count} {partner.total_properties_count === 1 ? 'Property' : 'Properties'}</span>
                            </button>
                          </td>

                          {/* 6. MONTHLY RUN RATE (Sum of % of each assigned property's monthly price) */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            ${partner.monthly_commission_estimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* 7. STATUS (Active / Inactive) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* 8. THREE DOTS FOR ACTIONS */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenMenu(e, partner)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#20222a] border border-transparent hover:border-slate-200 dark:hover:border-[#2a2c38] transition cursor-pointer"
                              title="Partner Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTNER INVOICES & PAYOUTS */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total Invoiced */}
            <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                  TOTAL INVOICED
                </span>
                <FileText className="w-4 h-4 text-white/90" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  ${invoiceMetrics.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-white ml-2">Total</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                {invoiceMetrics.totalInvoicesCount} Total statements submitted by partners
              </p>
            </div>

            {/* Card 2: Pending Approval & Payout */}
            <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                  PENDING APPROVAL &amp; PAYOUT
                </span>
                <Clock className="w-4 h-4 text-amber-300" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
                  ${invoiceMetrics.pendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-white ml-2">Pending</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Invoices awaiting review or disbursement
              </p>
            </div>

            {/* Card 3: Total Paid Out */}
            <div className="p-5 rounded-2xl bg-[#0f3496] text-white flex flex-col justify-between shadow-md border border-[#1740ab]/50 min-h-[140px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100">
                  TOTAL CLEARED &amp; PAID
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-emerald-300 tracking-tight">
                  ${invoiceMetrics.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-white ml-2">Disbursed</span>
              </div>
              <p className="text-[11px] text-blue-200/90 font-medium">
                Lifetime settled partner disbursements
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice #, partner name, email..."
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
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
                <option value="REJECTED">Rejected</option>
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

          {/* Invoices Table */}
          <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white dark:bg-[#15161c] border-b border-slate-200 dark:border-[#222430] text-slate-900 dark:text-white font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">INVOICE #</th>
                    <th className="py-3.5 px-4">PARTNER</th>
                    <th className="py-3.5 px-4">PERIOD</th>
                    <th className="py-3.5 px-4">PROPERTIES</th>
                    <th className="py-3.5 px-4">GROSS REVENUE</th>
                    <th className="py-3.5 px-4">COMMISSION DUE</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                        Loading invoices...
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No partner invoices found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => {
                      let statusBadge = {
                        bg: 'bg-amber-50 dark:bg-amber-950/40',
                        text: 'text-amber-700 dark:text-amber-300',
                        border: 'border-amber-200 dark:border-amber-800',
                        label: inv.status,
                      };
                      if (inv.status === 'PAID') {
                        statusBadge = { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'PAID' };
                      } else if (inv.status === 'APPROVED') {
                        statusBadge = { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'APPROVED' };
                      } else if (inv.status === 'REJECTED') {
                        statusBadge = { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'REJECTED' };
                      }

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                          {/* Invoice # */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {inv.invoice_number}
                          </td>

                          {/* Partner */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {inv.partner?.name || 'Partner Account'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {inv.partner?.email || '—'}
                            </span>
                          </td>

                          {/* Period */}
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {inv.period_start} to {inv.period_end}
                          </td>

                          {/* Properties */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2e3c] font-semibold text-[11px]">
                              {inv.total_properties} {inv.total_properties === 1 ? 'Property' : 'Properties'}
                            </span>
                          </td>

                          {/* Gross */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            ${Number(inv.gross_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Commission Due */}
                          <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            ${Number(inv.commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Status with Quick Update Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={inv.status}
                              disabled={updatingInvoiceId === inv.id}
                              onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer focus:outline-none ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                            >
                              <option value="SUBMITTED">SUBMITTED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="PAID">PAID</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedInvoiceForView(inv)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View &amp; Download PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* THREE-DOTS OVERLAY ACTION MENU */}
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
            className="z-50 w-56 rounded-2xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-2xl py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 font-medium divide-y divide-slate-100 dark:divide-[#242634]"
          >
            <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              {menuPosition.partner.name}
            </div>

            <div className="py-1">
              {/* Action 1: Assign Properties */}
              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setAssignForm({ property_id: '', commission_override: '' });
                  setShowAssignModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Assign Properties</span>
              </button>

              {/* Action 2: View Assigned Properties */}
              <button
                onClick={() => {
                  handleOpenViewProperties(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <Hotel className="w-3.5 h-3.5 text-slate-500" />
                <span>View Assigned Properties ({menuPosition.partner.total_properties_count})</span>
              </button>

              {/* Action 3: Generate Invite Link */}
              <button
                onClick={() => {
                  handleGenerateInviteLink(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Generate Invite Link</span>
              </button>

              {/* Action 4: View Invoices */}
              <button
                onClick={() => {
                  handleOpenViewInvoices(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>View Invoices &amp; Payouts</span>
              </button>
            </div>

            <div className="py-1">
              {/* Edit Partner */}
              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setFormData({
                    name: menuPosition.partner.name,
                    email: menuPosition.partner.email,
                    phone: menuPosition.partner.phone || '',
                    company_name: menuPosition.partner.company_name || '',
                    default_commission_rate: menuPosition.partner.default_commission_rate,
                    status: menuPosition.partner.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    notes: menuPosition.partner.notes || '',
                  });
                  setShowEditModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Partner Details</span>
              </button>

              {/* Delete Partner */}
              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setShowDeleteModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Partner</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW ASSIGNED PROPERTIES MODAL / DRAWER */}
      {showViewPropertiesModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-blue-600" /> Properties Assigned to {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Default Partner Share: <strong className="text-blue-600">{selectedPartner.default_commission_rate}%</strong>
                </p>
              </div>
              <button onClick={() => setShowViewPropertiesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingModalData ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                Loading assigned properties...
              </div>
            ) : partnerAssignedProps.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Hotel className="w-8 h-8 mx-auto opacity-30" />
                <p>No properties currently assigned to this partner.</p>
                <button
                  onClick={() => {
                    setShowViewPropertiesModal(false);
                    setAssignForm({ property_id: '', commission_override: '' });
                    setShowAssignModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign a Property Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
                      <tr>
                        <th className="py-2.5 px-3">PROPERTY</th>
                        {isSuperAdmin && <th className="py-2.5 px-3">MONTHLY PRICE</th>}
                        <th className="py-2.5 px-3">PARTNER SHARE</th>
                        {isSuperAdmin && <th className="py-2.5 px-3">MONTHLY COMMISSION</th>}
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                      {partnerAssignedProps.map((prop) => {
                        const effectiveRate = prop.partner_commission_override !== null && prop.partner_commission_override !== undefined
                          ? Number(prop.partner_commission_override)
                          : Number(selectedPartner.default_commission_rate || 10);
                        const price = Number(prop.monthly_price || 0);
                        const commAmount = price * (effectiveRate / 100);

                        return (
                          <tr key={prop.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 dark:text-white block">{prop.name}</span>
                              <span className="text-[11px] text-slate-400">
                                {prop.city ? `${prop.city}, ${prop.state || ''}` : prop.address || '—'}
                              </span>
                            </td>
                            {isSuperAdmin && (
                              <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                ${price.toFixed(2)}
                              </td>
                            )}
                            <td className="py-3 px-3 font-bold text-blue-600">
                              {effectiveRate}%
                              {prop.partner_commission_override !== null && prop.partner_commission_override !== undefined && (
                                <span className="ml-1 text-[10px] text-amber-500 font-normal">(Override)</span>
                              )}
                            </td>
                            {isSuperAdmin && (
                              <td className="py-3 px-3 font-extrabold text-emerald-600">
                                ${commAmount.toFixed(2)}
                              </td>
                            )}
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleUnassignProperty(prop.id)}
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition border border-rose-200/50"
                                title="Unassign from Partner"
                              >
                                <Unlink className="w-3.5 h-3.5" /> Unassign
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">
                    Total Properties: <strong>{partnerAssignedProps.length}</strong>
                  </span>
                  <button
                    onClick={() => {
                      setShowViewPropertiesModal(false);
                      setAssignForm({ property_id: '', commission_override: '' });
                      setShowAssignModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Assign Another Property
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW INVOICES MODAL / DRAWER */}
      {showViewInvoicesModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3.5">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> Invoices Submitted by {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review submitted statements, verify line items, and download PDF receipts.
                </p>
              </div>
              <button onClick={() => setShowViewInvoicesModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingModalData ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                Loading partner invoices...
              </div>
            ) : partnerInvoicesList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-30" />
                <p>No invoices submitted by this partner yet.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-[#222430] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
                    <tr>
                      <th className="py-2.5 px-3">INVOICE #</th>
                      <th className="py-2.5 px-3">PERIOD</th>
                      <th className="py-2.5 px-3">PROPERTIES</th>
                      <th className="py-2.5 px-3">GROSS AMOUNT</th>
                      <th className="py-2.5 px-3">COMMISSION DUE</th>
                      <th className="py-2.5 px-3">STATUS</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                    {partnerInvoicesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {inv.period_start} to {inv.period_end}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                          {inv.total_properties} Props
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          ${Number(inv.gross_revenue).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 font-black text-emerald-600 text-sm">
                          ${Number(inv.commission_amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={inv.status}
                            disabled={updatingInvoiceId === inv.id}
                            onChange={(e) => handleUpdateInvoiceStatus(inv.id, e.target.value)}
                            className="px-2.5 py-1 rounded-full text-[10.5px] font-bold border border-slate-300 dark:border-[#2a2c3a] bg-white dark:bg-[#111217] cursor-pointer"
                          >
                            <option value="SUBMITTED">SUBMITTED</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="PAID">PAID</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedInvoiceForView({
                                ...inv,
                                partner: selectedPartner,
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition border border-blue-200/50"
                          >
                            <Eye className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Delete Partner Modal */}
      {showDeleteModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Partner</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>{selectedPartner.name}</strong>? Any assigned properties will be unlinked from this partner.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePartner}
                disabled={formLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Partner
              </button>
            </div>
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

            <form onSubmit={handleAssignPropertySubmit} className="space-y-3 text-xs">
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
                      {p.name} {isSuperAdmin && p.monthly_price ? `($${p.monthly_price}/mo)` : ''} {p.partner_id === selectedPartner.id ? '(Currently assigned)' : ''}
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

      {/* VIEW & PRINT / DOWNLOAD PDF STATEMENT MODAL */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Top Actions */}
            <div className="no-print flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Partner Statement Document</span>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                  selectedInvoiceForView.status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedInvoiceForView.status === 'APPROVED'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {selectedInvoiceForView.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Download / Print PDF
                </button>
                <button
                  onClick={() => setSelectedInvoiceForView(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Document */}
            <div id="printable-admin-invoice" ref={printRef} className="space-y-6 text-slate-800 dark:text-slate-200 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <img src="/logo.png" alt="AAA Data Solutions" className="h-10 mb-2" />
                  <h2 className="font-black text-base text-slate-900 dark:text-white">AAA Data Solutions</h2>
                  <p className="text-slate-500 text-[11px]">Telecommunications &amp; Voice Line Services</p>
                  <p className="text-slate-500 text-[11px]">billing@aaadatasolutions.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    PARTNER INVOICE
                  </h3>
                  <p className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedInvoiceForView.invoice_number}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Date: {new Date(selectedInvoiceForView.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Period: {selectedInvoiceForView.period_start} to {selectedInvoiceForView.period_end}
                  </p>
                </div>
              </div>

              {/* Partner & Summary Box */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200/80 dark:border-[#222430]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    PAYABLE TO (PARTNER):
                  </span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedInvoiceForView.partner?.name || selectedPartner?.name || 'Channel Partner'}
                  </p>
                  {(selectedInvoiceForView.partner?.company_name || selectedPartner?.company_name) && (
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {selectedInvoiceForView.partner?.company_name || selectedPartner?.company_name}
                    </p>
                  )}
                  <p className="text-slate-500">{selectedInvoiceForView.partner?.email || selectedPartner?.email || 'partner@aaadatasolutions.com'}</p>
                  {(selectedInvoiceForView.partner?.phone || selectedPartner?.phone) && (
                    <p className="text-slate-500">{selectedInvoiceForView.partner?.phone || selectedPartner?.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    INVOICE SUMMARY:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Properties Included: <strong className="text-slate-900 dark:text-white">{selectedInvoiceForView.total_properties}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Total Gross Revenue: <strong className="text-slate-900 dark:text-white">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</strong>
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Payment Terms: <strong className="text-slate-900 dark:text-white">Net 30 Days</strong>
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 dark:border-[#222430] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] font-bold text-slate-700 dark:text-slate-300 uppercase text-[10.5px]">
                    <tr>
                      <th className="py-2.5 px-3">PROPERTY / LOCATION</th>
                      <th className="py-2.5 px-3 text-right">MONTHLY SUBSCRIPTION</th>
                      <th className="py-2.5 px-3 text-right">COMMISSION RATE</th>
                      <th className="py-2.5 px-3 text-right">COMMISSION AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                    {selectedInvoiceForView.line_items && selectedInvoiceForView.line_items.length > 0 ? (
                      selectedInvoiceForView.line_items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{item.property_name}</span>
                            <span className="text-[10px] text-slate-400">{item.property_location}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold">
                            ${Number(item.monthly_price).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                            {item.commission_rate}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            ${Number(item.commission_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          {selectedInvoiceForView.total_properties} Properties itemized in billing cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes & Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    REMITTANCE NOTES:
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {selectedInvoiceForView.notes || 'Standard electronic payout remittance.'}
                  </p>
                </div>

                <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#222430]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Gross Volume:</span>
                    <span className="font-semibold">${Number(selectedInvoiceForView.gross_revenue).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-[#222430] pt-1.5 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                    <span>Total Amount Payable:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ${Number(selectedInvoiceForView.commission_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 text-center">
                <p>AAA Data Solutions Partner Network • All Rights Reserved</p>
                <p className="mt-0.5">Disbursements are processed upon review and approval by AAA Accounts.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
