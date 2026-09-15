'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Building2,
  Hotel,
  ChevronLeft,
  MapPin,
  Mail,
  Phone,
  Layers,
  PhoneCall,
  LifeBuoy,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Plus,
  Search,
  Check,
  Copy,
  Clock,
  ArrowUpRight,
  RefreshCw,
  GitBranch,
  Calendar,
  AlertTriangle,
  UserPlus,
  Send,
  Loader2,
  X,
} from 'lucide-react';
import { InviteManagerModal } from '@/components/admin/InviteManagerModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
};

interface OrgDetail {
  id: string;
  name: string;
  type?: string;
  address: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'SUSPENDED' | 'PENDING_ONBOARDING';
  created_at: string;
  updated_at: string;
  primary_contact: {
    name: string;
    email: string;
    phone: string;
    role: string;
    is_primary: boolean;
    status: string;
  };
  contacts: any[];
  properties: any[];
  onboardings: any[];
  services: any[];
  portings: any[];
  e911: any[];
  invitations: any[];
  activeInvite: any | null;
  stats: {
    propertiesCount: number;
    contactsCount: number;
    servicesCount: number;
    onboardingsCount: number;
    portingsCount: number;
  };
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orgId = resolvedParams.id;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'CONTACTS' | 'PROPERTIES' | 'ONBOARDING' | 'SERVICES' | 'PORTING' | 'E911'
  >('OVERVIEW');

  // Modals & Action States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Add Contact Modal
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    is_primary: false,
  });
  const [savingContact, setSavingContact] = useState(false);

  // Assign Property Modal
  const [showAssignPropModal, setShowAssignPropModal] = useState(false);
  const [availableProps, setAvailableProps] = useState<any[]>([]);
  const [selectedPropToAssign, setSelectedPropToAssign] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrgDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/organizations/${orgId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrg(json.data);
        setEditFormData({
          name: json.data.name || '',
          address: json.data.street_address || '',
          city: json.data.city || '',
          state: json.data.state || '',
          zip_code: json.data.zip_code || '',
          phone: json.data.phone !== '—' ? json.data.phone : '',
          email: json.data.email !== '—' ? json.data.email : '',
          status: json.data.status || 'ACTIVE',
        });
      } else {
        setError(json.error || 'Failed to load organization details');
      }
    } catch (err: any) {
      console.error('Error fetching org:', err);
      setError(err.message || 'Error loading organization workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, [orgId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveOrgEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');
      setShowEditOrgModal(false);
      fetchOrgDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add contact');
      setShowAddContactModal(false);
      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
      fetchOrgDetails();
    } catch (err: any) {
      alert(err.message || 'Error adding contact');
    } finally {
      setSavingContact(false);
    }
  };

  const handleOpenAssignProp = async () => {
    setShowAssignPropModal(true);
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const json = await res.json();
      if (json.success && json.data) {
        setAvailableProps(json.data);
        if (json.data.length > 0) setSelectedPropToAssign(json.data[0].id);
      }
    } catch (err) {
      console.error('Error loading properties catalog:', err);
    }
  };

  const handleAssignProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropToAssign) return;
    setAssigningLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign property');
      setShowAssignPropModal(false);
      fetchOrgDetails();
    } catch (err: any) {
      alert(err.message || 'Error assigning property');
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleUnassignProp = async (propId: string) => {
    if (!confirm('Are you sure you want to unassign this property from this organization?')) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties?propertyId=${propId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to unassign property');
      fetchOrgDetails();
    } catch (err: any) {
      alert(err.message || 'Error unassigning property');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this contact?')) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/contacts?member_id=${contactId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
      fetchOrgDetails();
    } catch (err: any) {
      alert(err.message || 'Error removing contact');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse font-sans">
        <div className="h-6 w-36 bg-slate-200 dark:bg-[#222430] rounded"></div>
        <div className="h-32 bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430]"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430]"></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430]"></div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-20 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Organization Workspace Error</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || 'Organization record could not be loaded.'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push('/admin/organizations')}
            className="px-4 py-2 bg-slate-100 dark:bg-[#222430] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold"
          >
            Back to Organizations
          </button>
          <button
            onClick={fetchOrgDetails}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const initials = org.name.substring(0, 2).toUpperCase();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans pb-16"
    >
      {/* Top Breadcrumbs */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Organizations
        </Link>
        <span className="text-[11px] text-slate-400">
          Created: {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </motion.div>

      {/* Header Card */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-2xl shrink-0 border border-blue-200/50 dark:border-blue-900/50">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{org.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${org.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : org.status === 'PENDING_ONBOARDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {org.status}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{org.address}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                {org.email !== '—' && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {org.email}
                  </span>
                )}
                {org.phone !== '—' && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {org.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Invite Manager / Credentials</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEditOrgModal(true)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-[#1a1c24] hover:bg-slate-200 dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2a2c3a] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Details</span>
            </motion.button>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/dashboard"
                target="_blank"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer inline-flex"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Client Portal View</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs Navigation (7 Dedicated Tabs as specified in Task.md) */}
      <motion.div variants={itemVariants} className="flex border-b border-slate-200 dark:border-[#222430] gap-1 overflow-x-auto [scrollbar-width:thin]">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTACTS')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'CONTACTS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts ({org.stats?.contactsCount || org.contacts?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROPERTIES')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'PROPERTIES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Assigned Properties ({org.stats?.propertiesCount || org.properties?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ONBOARDING')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'ONBOARDING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>Onboarding ({org.stats?.onboardingsCount || org.onboardings?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'SERVICES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Services &amp; Lines ({org.stats?.servicesCount || org.services?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('PORTING')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'PORTING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Porting ({org.stats?.portingsCount || org.portings?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('E911')}
          className={`pb-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${activeTab === 'E911'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>E911 Compliance ({org.e911?.length || 0})</span>
        </button>
      </motion.div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Assigned Properties
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <Hotel size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {org.properties?.length || 0}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Locations</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Hospitality assets linked</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Active Voice Lines
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {org.services?.length || 0}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Lines</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Operational trunks &amp; DIDs</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Authorized Contacts
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {org.contacts?.length || 0}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">Personnel</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Authorized managers</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">
                  Onboarding Pipelines
                </span>
                <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-100 dark:text-white">
                  {org.onboardings?.length || 0}
                </span>
                <span className="text-xs text-slate-100 ml-1.5 font-medium">In Flight</span>
              </div>
              <p className="text-[11px] text-slate-100 mt-2">Active migrations</p>
            </motion.div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Info */}
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Organization Profile
                </h3>
                <button
                  onClick={() => setShowEditOrgModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
                >
                  Edit Profile
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{org.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registered Address:</span>
                  <span className="text-right text-slate-700 dark:text-slate-300 font-medium max-w-[220px]">
                    {org.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Main Phone:</span>
                  <span className="text-slate-700 dark:text-slate-300">{org.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Main Email:</span>
                  <span className="text-slate-700 dark:text-slate-300">{org.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{org.status}</span>
                </div>
              </div>
            </div>

            {/* Primary Contact & Invite */}
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Primary Contact &amp; Onboarding Invite
                </h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
                >
                  Manage Invite
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Person:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {org.primary_contact?.name || 'Not Assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {org.primary_contact?.email || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Direct Phone:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {org.primary_contact?.phone || '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-[#222430]">
                  <span className="text-slate-400">Invitation Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${org.activeInvite?.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : org.activeInvite?.status === 'APPROVED' || org.activeInvite?.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                  >
                    {org.activeInvite?.status || 'NO ACTIVE INVITE'}
                  </span>
                </div>
                {org.activeInvite?.invite_url && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleCopy(org.activeInvite.invite_url, 'invite-url')}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-blue-200 dark:border-blue-900/40"
                    >
                      {copiedId === 'invite-url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'invite-url' ? 'Copied URL' : 'Copy Onboarding Invite URL'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CONTACTS */}
      {activeTab === 'CONTACTS' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Contact List</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized contacts with portal access for {org.name}.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddContactModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Name</th>
                  <th className="py-3 px-4 font-bold">Email</th>
                  <th className="py-3 px-4 font-bold">Phone</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.contacts?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No contacts listed yet.
                    </td>
                  </tr>
                ) : (
                  org.contacts?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.invite_url && (
                            <button
                              onClick={() => handleCopy(c.invite_url, `copy-url-${c.id}`)}
                              className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
                              title="Copy Invitation URL"
                            >
                              {copiedId === `copy-url-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Mail className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(c.email, `copy-c-${c.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#20222d] transition cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedId === `copy-c-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove Contact"
                          >
                            <X className="w-3.5 h-3.5" />
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
      )}

      {/* Tab 3: PROPERTIES */}
      {activeTab === 'PROPERTIES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assigned Properties</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Physical property locations assigned to {org.name}.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenAssignProp}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Property</span>
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property Name</th>
                  <th className="py-3 px-4 font-bold">Address</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Services</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.properties?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No properties assigned yet. Click &quot;Assign Property&quot; above.
                    </td>
                  </tr>
                ) : (
                  org.properties?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <Link href="/admin/properties" className="hover:text-blue-600 transition">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {p.address}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {p.services_count || 6} Lines
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleUnassignProp(p.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: ONBOARDING */}
      {activeTab === 'ONBOARDING' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Onboarding Processes</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Onboarding pipeline stages belonging to {org.name}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property</th>
                  <th className="py-3 px-4 font-bold">Current Stage</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Target Date</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.onboardings?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No active onboarding requests on record.
                    </td>
                  </tr>
                ) : (
                  org.onboardings?.map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {o.property_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60">
                          {o.stage?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {o.target_date ? new Date(o.target_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href="/admin/onboarding-porting"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                        >
                          View Pipeline &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: SERVICES & LINES */}
      {activeTab === 'SERVICES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Telecom Inventory</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Provisioned voice services, SIP trunks, and phone numbers for {org.name}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property</th>
                  <th className="py-3 px-4 font-bold">Service Type</th>
                  <th className="py-3 px-4 font-bold">Phone Number</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.services?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No telecom services currently active.
                    </td>
                  </tr>
                ) : (
                  org.services?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {s.property_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {s.service_type}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {s.phone_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: PORTING */}
      {activeTab === 'PORTING' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Number Porting Requests</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Phone number transfers and carrier migration orders for {org.name}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property</th>
                  <th className="py-3 px-4 font-bold">Numbers in Batch</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Target / FOC Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.portings?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No porting orders on record.
                    </td>
                  </tr>
                ) : (
                  org.portings?.map((pr: any) => (
                    <tr key={pr.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {pr.property_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {pr.numbers_count} Line(s)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30">
                          {pr.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {pr.target_date ? new Date(pr.target_date).toLocaleDateString() : 'Pending FOC'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: E911 */}
      {activeTab === 'E911' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">E911 Emergency Location Compliance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              PSAP dispatch emergency addresses configured for {org.name} locations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property</th>
                  <th className="py-3 px-4 font-bold">Registered Emergency Address</th>
                  <th className="py-3 px-4 font-bold">PSAP Status</th>
                  <th className="py-3 px-4 font-bold">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.e911?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No E911 records configured yet.
                    </td>
                  </tr>
                ) : (
                  org.e911?.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {rec.property_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {rec.emergency_address}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {rec.verified_at ? new Date(rec.verified_at).toLocaleDateString() : 'Pending Validation'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Manager Modal */}
      <InviteManagerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        orgId={org.id}
        orgName={org.name}
        onSuccess={fetchOrgDetails}
      />

      {/* Edit Organization Modal */}
      <AnimatePresence>
        {showEditOrgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowEditOrgModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Organization Profile</h3>
                <button onClick={() => setShowEditOrgModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOrgEdit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Street Address</label>
                  <textarea
                    rows={2}
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                  <input
                    type="text"
                    placeholder="ZIP"
                    value={editFormData.zip_code}
                    onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                    className="px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">Main Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_ONBOARDING">PENDING_ONBOARDING</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowEditOrgModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={editSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {editSaving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowAddContactModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Organization Contact</h3>
                <button onClick={() => setShowAddContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactFormData.full_name}
                    onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                    placeholder="Alex Johnson"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                    placeholder="alex@company.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">Phone Number</label>
                  <input
                    type="text"
                    value={contactFormData.phone_number}
                    onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="detail_primary_checkbox"
                    checked={contactFormData.is_primary}
                    onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="detail_primary_checkbox" className="text-slate-700 dark:text-slate-300 cursor-pointer">
                    Set as Primary Administrator
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={savingContact}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {savingContact ? 'Saving...' : 'Add Contact'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <div className="fixed inset-0" onClick={() => setShowAssignPropModal(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Property</h3>
                <button onClick={() => setShowAssignPropModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignProp} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Select Property from Database
                  </label>
                  <select
                    value={selectedPropToAssign}
                    onChange={(e) => setSelectedPropToAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  >
                    {availableProps.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowAssignPropModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={assigningLoading || !selectedPropToAssign}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
