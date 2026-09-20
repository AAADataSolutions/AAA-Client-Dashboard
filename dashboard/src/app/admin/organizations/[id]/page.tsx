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
  Trash2,
  MoreVertical,
  SlidersHorizontal,
  Settings,
  Eye,
} from 'lucide-react';

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

  // Edit Organization Modal
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
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

  // Delete Contact Confirmation
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  // Assign Property Modal
  const [showAssignPropModal, setShowAssignPropModal] = useState(false);
  const [availableProps, setAvailableProps] = useState<any[]>([]);
  const [selectedPropToAssign, setSelectedPropToAssign] = useState<string>('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Unassign Property Confirmation Modal
  const [unassignTarget, setUnassignTarget] = useState<{ propertyId: string; name: string } | null>(null);
  const [unassigningLoading, setUnassigningLoading] = useState(false);

  // Property Actions: View Details, View Services, Change Status, Manage Contacts
  const [viewingPropDetails, setViewingPropDetails] = useState<any | null>(null);
  const [viewingPropServices, setViewingPropServices] = useState<{ propName: string; services: any[] } | null>(null);
  const [loadingPropServices, setLoadingPropServices] = useState(false);
  const [statusPropTarget, setStatusPropTarget] = useState<any | null>(null);
  const [savingPropStatus, setSavingPropStatus] = useState(false);

  // Property Three-Dots Action Menu (Opens ABOVE)
  const [activePropMenu, setActivePropMenu] = useState<{
    prop: any;
    bottom: number;
    left: number;
  } | null>(null);

  // Property Contacts Modal
  const [propContactsTarget, setPropContactsTarget] = useState<any | null>(null);
  const [propContactsList, setPropContactsList] = useState<any[]>([]);
  const [loadingPropContacts, setLoadingPropContacts] = useState(false);
  const [showAddPropContactForm, setShowAddPropContactForm] = useState(false);
  const [newPropContact, setNewPropContact] = useState({ name: '', email: '', phone: '', role: 'Property Manager' });
  const [savingPropContact, setSavingPropContact] = useState(false);

  // 2-Tab Assign Service Modal
  const [showAssignServiceModal, setShowAssignServiceModal] = useState(false);
  const [assignServiceTab, setAssignServiceTab] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [targetPropertyForService, setTargetPropertyForService] = useState<string>('');
  const [availableUnassignedServices, setAvailableUnassignedServices] = useState<any[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState<string>('');
  const [loadingUnassignedServices, setLoadingUnassignedServices] = useState(false);
  const [serviceTypesList, setServiceTypesList] = useState<any[]>([]);
  const [newServiceForm, setNewServiceForm] = useState({
    service_name: '',
    phone_number: '',
    service_type: 'Voice Trunk / DID',
    description: '',
    status: 'ACTIVE',
  });
  const [savingService, setSavingService] = useState(false);

  // Onboarding Actions & Modals
  const [onboardingMenuPosition, setOnboardingMenuPosition] = useState<{
    onb: any;
    bottom: number;
    left: number;
  } | null>(null);
  const [viewingOnboardingDetails, setViewingOnboardingDetails] = useState<any | null>(null);
  const [editingOnboardingStage, setEditingOnboardingStage] = useState<any | null>(null);
  const [savingOnboardingStage, setSavingOnboardingStage] = useState(false);
  const [stageProgressOnboarding, setStageProgressOnboarding] = useState<any | null>(null);

  // Copy state & toast
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

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
          country: json.data.country || 'USA',
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

  // Fetch assigned properties list with full rich fields
  const fetchOrgProperties = async () => {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/properties`);
      const json = await res.json();
      if (json.success && json.data && org) {
        setOrg((prev) => (prev ? { ...prev, properties: json.data } : null));
      }
    } catch (err) {
      console.error('Error refreshing org properties:', err);
    }
  };

  useEffect(() => {
    fetchOrgDetails();
  }, [orgId]);

  const handleCopy = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Save Edit Org
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
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update organization');

      showToast('Organization profile updated successfully.');
      setShowEditOrgModal(false);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating organization', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  // Add Contact
  const handleAddContactSubmit = async (e: React.FormEvent) => {
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

      showToast('Contact added successfully.');
      setShowAddContactModal(false);
      setContactFormData({ full_name: '', email: '', phone_number: '', is_primary: false });
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  // Confirm Delete Contact
  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;
    setDeletingContact(true);
    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/contacts?member_id=${contactToDelete.id}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');

      showToast('Contact removed successfully.');
      setContactToDelete(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
    } finally {
      setDeletingContact(false);
    }
  };

  // Open Assign Property Modal (Strictly Unassigned Properties Only per Rule 4)
  const handleOpenAssignModal = async () => {
    setShowAssignPropModal(true);
    try {
      const res = await fetch('/api/admin/properties?limit=100');
      const json = await res.json();
      if (json.success) {
        const unassigned = (json.data || []).filter(
          (p: any) => (!p.organizations || p.organizations.length === 0) && (!p.organizations_count || p.organizations_count === 0)
        );
        setAvailableProps(unassigned);
        if (unassigned.length > 0) setSelectedPropToAssign(unassigned[0].id);
      }
    } catch (err) {
      console.error('Error fetching available properties:', err);
    }
  };

  const handleAssignPropertySubmit = async (e: React.FormEvent) => {
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

      showToast('Property assigned successfully.');
      setShowAssignPropModal(false);
      fetchOrgProperties();
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error assigning property', 'error');
    } finally {
      setAssigningLoading(false);
    }
  };

  // Confirm Unassign Property
  const handleConfirmUnassign = async () => {
    if (!unassignTarget) return;
    setUnassigningLoading(true);
    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/properties?propertyId=${unassignTarget.propertyId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to unassign property');

      showToast('Property unassigned from organization.');
      setUnassignTarget(null);
      fetchOrgProperties();
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error unassigning property', 'error');
    } finally {
      setUnassigningLoading(false);
    }
  };

  // View Services for Property
  const handleViewPropertyServices = async (prop: any) => {
    setLoadingPropServices(true);
    setViewingPropServices({ propName: prop.name, services: [] });
    try {
      const res = await fetch(`/api/admin/services?limit=100`);
      const json = await res.json();
      if (json.success) {
        const matching = (json.data || []).filter(
          (s: any) => s.attached_property_name === prop.name || s.attached_property_id === prop.id
        );
        setViewingPropServices({ propName: prop.name, services: matching });
      }
    } catch (err) {
      console.error('Error fetching property services:', err);
    } finally {
      setLoadingPropServices(false);
    }
  };

  // Change Property Status
  const handleSavePropertyStatus = async (newStatus: string) => {
    if (!statusPropTarget) return;
    setSavingPropStatus(true);
    try {
      const res = await fetch(`/api/admin/properties/${statusPropTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update property status');

      showToast(`Property status updated to ${newStatus}.`);
      setStatusPropTarget(null);
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setSavingPropStatus(false);
    }
  };

  // Property Contacts Functions
  const handleOpenPropertyContacts = async (prop: any) => {
    setPropContactsTarget(prop);
    setLoadingPropContacts(true);
    setShowAddPropContactForm(false);
    try {
      const res = await fetch(`/api/admin/properties/${prop.id}/contacts`);
      const json = await res.json();
      if (json.success) {
        setPropContactsList(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching property contacts:', err);
    } finally {
      setLoadingPropContacts(false);
    }
  };

  const handleAddPropContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propContactsTarget || !newPropContact.name) return;
    setSavingPropContact(true);
    try {
      const res = await fetch(`/api/admin/properties/${propContactsTarget.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPropContact),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add contact');
      showToast('Contact added to property.');
      setShowAddPropContactForm(false);
      setNewPropContact({ name: '', email: '', phone: '', role: 'Property Manager' });
      handleOpenPropertyContacts(propContactsTarget);
    } catch (err: any) {
      showToast(err.message || 'Error adding contact', 'error');
    } finally {
      setSavingPropContact(false);
    }
  };

  const handleDeletePropContact = async (contactId: string) => {
    if (!propContactsTarget) return;
    try {
      const res = await fetch(`/api/admin/properties/${propContactsTarget.id}/contacts?contact_id=${contactId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');
      showToast('Contact removed from property.');
      handleOpenPropertyContacts(propContactsTarget);
    } catch (err: any) {
      showToast(err.message || 'Error deleting contact', 'error');
    }
  };

  // 2-Tab Assign Service Modal Functions
  const handleOpenAssignServiceModal = async (defaultProp?: any) => {
    setShowAssignServiceModal(true);
    setAssignServiceTab('EXISTING');
    if (defaultProp?.id) {
      setTargetPropertyForService(defaultProp.id);
    } else if (org?.properties && org.properties.length > 0) {
      setTargetPropertyForService(org.properties[0].id);
    }
    setLoadingUnassignedServices(true);
    try {
      const [srvRes, typesRes] = await Promise.all([
        fetch('/api/admin/services?limit=200'),
        fetch('/api/admin/service-types'),
      ]);
      const srvJson = await srvRes.json();
      const typesJson = await typesRes.json();
      if (srvJson.success) {
        const unassigned = (srvJson.data || []).filter(
          (s: any) => s.is_unassigned || !s.attached_property_name || s.attached_property_name === 'Unassigned'
        );
        setAvailableUnassignedServices(unassigned);
        if (unassigned.length > 0) setSelectedServiceToAssign(unassigned[0].id);
      }
      if (typesJson.success) {
        setServiceTypesList(typesJson.data || []);
      }
    } catch (err) {
      console.error('Error fetching data for assign service:', err);
    } finally {
      setLoadingUnassignedServices(false);
    }
  };

  const handleAssignExistingServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPropertyForService || !selectedServiceToAssign) return;
    setSavingService(true);
    try {
      const res = await fetch(`/api/admin/properties/${targetPropertyForService}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: selectedServiceToAssign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to assign service');
      showToast('Service assigned to property successfully.');
      setShowAssignServiceModal(false);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error assigning service', 'error');
    } finally {
      setSavingService(false);
    }
  };

  const handleCreateNewServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPropertyForService || !newServiceForm.phone_number) return;
    setSavingService(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newServiceForm,
          property_id: targetPropertyForService,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create service');
      showToast('Service created and assigned to property.');
      setShowAssignServiceModal(false);
      setNewServiceForm({
        service_name: '',
        phone_number: '',
        service_type: 'Voice Trunk / DID',
        description: '',
        status: 'ACTIVE',
      });
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error creating service', 'error');
    } finally {
      setSavingService(false);
    }
  };

  // Onboarding Stage Save
  const handleSaveOnboardingStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOnboardingStage) return;
    setSavingOnboardingStage(true);
    try {
      const res = await fetch(`/api/admin/onboarding/${editingOnboardingStage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editingOnboardingStage.stage,
          current_stage: editingOnboardingStage.stage,
          target_completion_date: editingOnboardingStage.target_date,
          draft_date: editingOnboardingStage.draft_date,
          contract_sent_date: editingOnboardingStage.contract_sent_date,
          signed_date: editingOnboardingStage.signed_date,
          porting_submitted_date: editingOnboardingStage.porting_submitted_date,
          sof_review_date: editingOnboardingStage.sof_review_date,
          foc_confirmed_date: editingOnboardingStage.foc_confirmed_date,
          live_cutover_date: editingOnboardingStage.live_cutover_date,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update onboarding stage');
      showToast('Onboarding stage and milestone dates updated.');
      setEditingOnboardingStage(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating onboarding stage', 'error');
    } finally {
      setSavingOnboardingStage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-500">Loading client organization workspace...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">Organization Not Found</h2>
        <p className="text-xs text-rose-700 dark:text-rose-300">{error || 'This organization does not exist.'}</p>
        <button
          onClick={() => router.push('/admin/organizations')}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:opacity-90 transition cursor-pointer"
        >
          Back to Organizations Directory
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 ${
            toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link
          href="/admin/organizations"
          className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Organizations Directory</span>
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold">{org.name}</span>
      </motion.div>

      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-6 rounded-2xl shadow-xs"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{org.name}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  org.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : org.status === 'INACTIVE'
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    org.status === 'ACTIVE' ? 'bg-emerald-500' : org.status === 'INACTIVE' ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
                {org.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{org.address}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEditOrgModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#252733] hover:bg-slate-50 dark:hover:bg-[#1f212a] text-slate-700 dark:text-slate-300 font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddContactModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222430] overflow-x-auto pb-1 text-xs"
      >
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'OVERVIEW'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('CONTACTS')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'CONTACTS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Contacts ({org.contacts?.length || 0})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('PROPERTIES');
            fetchOrgProperties();
          }}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'PROPERTIES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Hotel className="w-4 h-4" />
          <span>Assigned Properties ({org.properties?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'SERVICES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Services &amp; Lines ({org.services?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ONBOARDING')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'ONBOARDING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Onboarding ({org.onboardings?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('E911')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'E911'
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
          {/* Top Quick Stats Row (4 Deep Blue Standardized Cards) */}
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
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Organization Profile</h3>
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

            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Primary Administrator</h3>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold cursor-pointer"
                >
                  Add Contact
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
                  <span className="text-slate-400">Designation:</span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                    Primary Admin
                  </span>
                </div>
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </motion.button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Name</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Email</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Phone</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Role</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
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
                  org.contacts?.map((contact: any) => (
                    <tr key={contact.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{contact.name}</span>
                          {contact.is_primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                              Primary
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {contact.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {contact.phone}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {contact.role}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {contact.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleCopy(contact.email, `c-email-${contact.id}`, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                            title="Copy Email"
                          >
                            {copiedId === `c-email-${contact.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setContactToDelete({ id: contact.id, name: contact.name })}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove Contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Tab 3: ASSIGNED PROPERTIES (Comprehensive Columns & Actions) */}
      {activeTab === 'PROPERTIES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs space-y-4">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Assigned Properties Directory</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Physical property assets and hotel locations linked to {org.name}.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenAssignModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign New Property</span>
            </motion.button>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs border-collapse min-w-[1300px]">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">Property</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[160px]">Location</th>
                  <th className="py-3 px-3.5 font-bold text-center whitespace-nowrap min-w-[100px]">No. of Services</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">E911 Status</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">Ray Baum and Kary's Law</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[130px]">GM Name</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[130px]">GM Phone</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[170px]">GM Email</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">Property Status</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap min-w-[110px]">Stage</th>
                  <th className="py-3 px-3.5 font-bold text-right whitespace-nowrap min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.properties?.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                      No properties assigned to this organization yet.
                    </td>
                  </tr>
                ) : (
                  org.properties?.map((prop: any) => (
                    <tr key={prop.id || prop.link_id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                      {/* Property */}
                      <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <Link
                          href={`/admin/properties`}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        >
                          {prop.name}
                        </Link>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {prop.city && prop.state ? `${prop.city}, ${prop.state}` : (prop.address || '—')}
                      </td>

                      {/* No. of Services */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleViewPropertyServices(prop)}
                          className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold cursor-pointer"
                        >
                          {prop.services_count || 0} Lines
                        </button>
                      </td>

                      {/* E911 Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 dark:bg-[#1f212a] text-slate-700 dark:text-slate-300">
                          {prop.e911_status || 'Verified'}
                        </span>
                      </td>

                      {/* Ray Baum and Kary's Law: STRICTLY Active / Inactive */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {prop.ray_baum_status === 'Active' ? (
                          <button
                            onClick={() => window.open(`/admin/ray-baum/${prop.id}`, '_blank')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer"
                            title="Open Ray Baum and Kary's Law in new tab"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* GM Name */}
                      <td className="py-3.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {prop.general_manager_name || '—'}
                      </td>

                      {/* GM Phone */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {prop.general_manager_phone && prop.general_manager_phone !== '—' ? (
                          <button
                            onClick={(e) => handleCopy(prop.general_manager_phone, `gm-p-${prop.id}`, e)}
                            className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                          >
                            <span>{prop.general_manager_phone}</span>
                            {copiedId === `gm-p-${prop.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* GM Email */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        {prop.general_manager_email && prop.general_manager_email !== '—' ? (
                          <button
                            onClick={(e) => handleCopy(prop.general_manager_email, `gm-e-${prop.id}`, e)}
                            className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                          >
                            <span>{prop.general_manager_email}</span>
                            {copiedId === `gm-e-${prop.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Property Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {prop.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          {prop.status === 'ONBOARDING' ? (prop.onboarding_stage || 'Draft Initialized') : '—'}
                        </span>
                      </td>

                      {/* Actions: Three Dots Menu (Opens ABOVE) */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActivePropMenu({
                              prop,
                              bottom: window.innerHeight - rect.top + 6,
                              left: Math.max(16, rect.left - 150),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                          title="Property Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
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

      {/* Tab 4: SERVICES */}
      {activeTab === 'SERVICES' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Telecom Services</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Telecom voice trunks, firelines, and elevator lines assigned to {org.name}.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleOpenAssignServiceModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Service</span>
              </motion.button>
              <Link
                href="/admin/services"
                className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline cursor-pointer"
              >
                Open Services Catalog
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property Location</th>
                  <th className="py-3 px-4 font-bold">Service Type</th>
                  <th className="py-3 px-4 font-bold">Service Number / DID</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.services?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      No services assigned yet.
                    </td>
                  </tr>
                ) : (
                  org.services?.map((srv: any) => (
                    <tr key={srv.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{srv.property_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{srv.service_type}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-900 dark:text-white">{srv.phone_number}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {srv.status}
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

      {/* Tab 5: ONBOARDING */}
      {activeTab === 'ONBOARDING' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Onboarding &amp; Porting Pipelines</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Track 7-stage property cutover schedules and carrier porting status.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[160px]">Property Name</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[180px]">Address</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[140px]">Organization</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[130px]">Stage</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[130px]">Target Cutover Date</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[120px]">GM Name</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[120px]">GM Phone</th>
                  <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[160px]">GM Email</th>
                  <th className="py-3 px-4 font-bold text-right whitespace-nowrap min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.onboardings?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No onboarding pipelines recorded for this organization.
                    </td>
                  </tr>
                ) : (
                  org.onboardings?.map((onb: any) => (
                    <tr key={onb.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920]">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">{onb.property_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{onb.property_address || onb.property_location}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">{org.name}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          {onb.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {onb.target_date ? new Date(onb.target_date).toLocaleDateString() : 'TBD'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{onb.general_manager_name || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{onb.general_manager_phone || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{onb.general_manager_email || '—'}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOnboardingMenuPosition({
                              onb,
                              bottom: window.innerHeight - rect.top + 6,
                              left: Math.max(16, rect.left - 150),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                          title="Onboarding Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
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

      {/* Tab 6: E911 */}
      {activeTab === 'E911' && (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-[#222430]">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">E911 Emergency Location Compliance</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#111217] text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Property</th>
                  <th className="py-3 px-4 font-bold">Emergency Dispatch Address</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Verified Date</th>
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
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{rec.property_name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{rec.emergency_address}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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

      {/* Edit Organization Modal (With Clear Visible Labels on all inputs) */}
      <AnimatePresence>
        {showEditOrgModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditOrgModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 flex items-center justify-center p-4">
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

                <form onSubmit={handleSaveOrgEdit} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      Organization Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      Street Address
                    </label>
                    <textarea
                      rows={2}
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-hidden focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">City</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                        className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">State</label>
                      <input
                        type="text"
                        value={editFormData.state}
                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                        className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">ZIP Code</label>
                      <input
                        type="text"
                        value={editFormData.zip_code}
                        onChange={(e) => setEditFormData({ ...editFormData, zip_code: e.target.value })}
                        className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Phone Number</label>
                      <input
                        type="text"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Email Address</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Organization Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="PENDING_ONBOARDING">PENDING_ONBOARDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditOrgModal(false)}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={editSaving}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Contact Confirmation Dialog */}
      <AnimatePresence>
        {contactToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactToDelete(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-70 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-70 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Remove Contact?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{contactToDelete.name}</strong> from this organization?
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactToDelete(null)}
                    disabled={deletingContact}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1b22]"
                  >
                    No, Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmDeleteContact}
                    disabled={deletingContact}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {deletingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Yes, Remove</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Unassign Property Confirmation Modal */}
      <AnimatePresence>
        {unassignTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUnassignTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-70 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-70 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Unassign Property?</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to unassign <strong className="text-slate-900 dark:text-white">{unassignTarget.name}</strong> from {org.name}?
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnassignTarget(null)}
                    disabled={unassigningLoading}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1a1b22]"
                  >
                    No, Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmUnassign}
                    disabled={unassigningLoading}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {unassigningLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Yes, Unassign</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Property Modal */}
      <AnimatePresence>
        {showAssignPropModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignPropModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Property to {org.name}</h3>
                  <button onClick={() => setShowAssignPropModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAssignPropertySubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      Select Available Property
                    </label>
                    <select
                      value={selectedPropToAssign}
                      onChange={(e) => setSelectedPropToAssign(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
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
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={assigningLoading || !selectedPropToAssign}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddContactModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddContactModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Contact to {org.name}</h3>
                  <button onClick={() => setShowAddContactModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddContactSubmit} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactFormData.full_name}
                      onChange={(e) => setContactFormData({ ...contactFormData, full_name: e.target.value })}
                      placeholder="e.g., Alex Johnson"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactFormData.email}
                      onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                      placeholder="alex@organization.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block text-xs">Phone Number</label>
                    <input
                      type="text"
                      value={contactFormData.phone_number}
                      onChange={(e) => setContactFormData({ ...contactFormData, phone_number: e.target.value })}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_primary_org_detail"
                      checked={contactFormData.is_primary}
                      onChange={(e) => setContactFormData({ ...contactFormData, is_primary: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_primary_org_detail" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      Designate as Primary Contact for {org.name}
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={savingContact}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Contact</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Property Details Modal */}
      <AnimatePresence>
        {viewingPropDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPropDetails(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Property Details</h3>
                  <button onClick={() => setViewingPropDetails(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">Property Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingPropDetails.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">Physical Address:</span>
                    <span className="text-slate-700 dark:text-slate-300 text-right">{viewingPropDetails.address}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">General Manager:</span>
                    <span className="text-slate-700 dark:text-slate-300">{viewingPropDetails.general_manager_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">GM Contact:</span>
                    <span className="text-slate-700 dark:text-slate-300">{viewingPropDetails.general_manager_phone} | {viewingPropDetails.general_manager_email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">E911 PSAP Status:</span>
                    <span className="font-semibold text-emerald-600">{viewingPropDetails.e911_status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">Ray Baum Compliance:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingPropDetails.ray_baum_status}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-slate-900 dark:text-white">Operational Status:</span>
                    <span className="font-semibold text-emerald-600">{viewingPropDetails.status}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setViewingPropDetails(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Property Services Modal */}
      <AnimatePresence>
        {viewingPropServices && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPropServices(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Services Assigned to {viewingPropServices.propName}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Provisioned voice lines and telecom trunks.
                    </p>
                  </div>
                  <button onClick={() => setViewingPropServices(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingPropServices ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : viewingPropServices.services.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No active voice services found attached to this property.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {viewingPropServices.services.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{s.phone_number}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">{s.service_type}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setViewingPropServices(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Change Property Status Modal */}
      <AnimatePresence>
        {statusPropTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStatusPropTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Change Status: {statusPropTarget.name}
                  </h3>
                  <button onClick={() => setStatusPropTarget(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {['ACTIVE', 'INACTIVE', 'ONBOARDING', 'ARCHIVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleSavePropertyStatus(st)}
                      disabled={savingPropStatus}
                      className={`w-full p-2.5 rounded-xl border text-left font-semibold transition cursor-pointer flex items-center justify-between ${
                        statusPropTarget.status === st
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-[#222430] hover:bg-slate-50 dark:hover:bg-[#1a1b22] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{st}</span>
                      {statusPropTarget.status === st && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Popover for Property Actions (Opens strictly ABOVE) */}
      <AnimatePresence>
        {activePropMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActivePropMenu(null)}
            />
            <div
              style={{
                position: 'fixed',
                bottom: `${activePropMenu.bottom}px`,
                left: `${activePropMenu.left}px`,
              }}
              className="z-50 w-52 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                onClick={() => {
                  setViewingPropDetails(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Property Details</span>
              </button>
              <button
                onClick={() => {
                  handleViewPropertyServices(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-indigo-500" />
                <span>View Services</span>
              </button>
              <button
                onClick={() => {
                  handleOpenAssignServiceModal(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-500" />
                <span>Assign Service</span>
              </button>
              <button
                onClick={() => {
                  handleOpenPropertyContacts(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Manage Contacts</span>
              </button>
              <button
                onClick={() => {
                  setStatusPropTarget(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Change Status</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-[#2b2d3b]" />
              <button
                onClick={() => {
                  setUnassignTarget({ propertyId: activePropMenu.prop.id, name: activePropMenu.prop.name });
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Unassign Property</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Popover for Onboarding Actions (Opens strictly ABOVE) */}
      <AnimatePresence>
        {onboardingMenuPosition && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOnboardingMenuPosition(null)}
            />
            <div
              style={{
                position: 'fixed',
                bottom: `${onboardingMenuPosition.bottom}px`,
                left: `${onboardingMenuPosition.left}px`,
              }}
              className="z-50 w-48 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                onClick={() => {
                  setViewingOnboardingDetails(onboardingMenuPosition.onb);
                  setOnboardingMenuPosition(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  setEditingOnboardingStage({
                    ...onboardingMenuPosition.onb,
                    stage: onboardingMenuPosition.onb.stage || 'DRAFT',
                    target_date: onboardingMenuPosition.onb.target_date || '',
                    draft_date: onboardingMenuPosition.onb.draft_date || '',
                    contract_sent_date: onboardingMenuPosition.onb.contract_sent_date || '',
                    signed_date: onboardingMenuPosition.onb.signed_date || '',
                    porting_submitted_date: onboardingMenuPosition.onb.porting_submitted_date || '',
                    sof_review_date: onboardingMenuPosition.onb.sof_review_date || '',
                    foc_confirmed_date: onboardingMenuPosition.onb.foc_confirmed_date || '',
                    live_cutover_date: onboardingMenuPosition.onb.live_cutover_date || '',
                  });
                  setOnboardingMenuPosition(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit Stage & Dates</span>
              </button>
              <button
                onClick={() => {
                  setStageProgressOnboarding(onboardingMenuPosition.onb);
                  setOnboardingMenuPosition(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2 transition cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
                <span>View Stage Progress</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* 2-Tab Assign Service Modal */}
      <AnimatePresence>
        {showAssignServiceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignServiceModal(false)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign Service to Property</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Organization: {org.name}</p>
                  </div>
                  <button onClick={() => setShowAssignServiceModal(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-[#222430] gap-4 text-xs font-semibold">
                  <button
                    onClick={() => setAssignServiceTab('EXISTING')}
                    className={`pb-2 transition cursor-pointer border-b-2 ${
                      assignServiceTab === 'EXISTING'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Assign Existing Service
                  </button>
                  <button
                    onClick={() => setAssignServiceTab('NEW')}
                    className={`pb-2 transition cursor-pointer border-b-2 ${
                      assignServiceTab === 'NEW'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    Create New Service
                  </button>
                </div>

                {/* Tab 1: Existing Service */}
                {assignServiceTab === 'EXISTING' ? (
                  <form onSubmit={handleAssignExistingServiceSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Select Unassigned Service <span className="text-rose-500">*</span>
                      </label>
                      {loadingUnassignedServices ? (
                        <div className="py-2 text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading unassigned catalog...
                        </div>
                      ) : availableUnassignedServices.length === 0 ? (
                        <p className="text-amber-600 dark:text-amber-400 text-xs py-2">
                          No unassigned services available. Switch to 'Create New Service' tab to create one.
                        </p>
                      ) : (
                        <select
                          required
                          value={selectedServiceToAssign}
                          onChange={(e) => setSelectedServiceToAssign(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                        >
                          {availableUnassignedServices.map((srv) => (
                            <option key={srv.id} value={srv.id}>
                              {srv.phone_number} — {srv.service_type || 'Voice DID'} ({srv.service_name || 'Line'})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Assign to Property in {org.name} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={targetPropertyForService}
                        onChange={(e) => setTargetPropertyForService(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {(org.properties || []).map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                      <button
                        type="button"
                        onClick={() => setShowAssignServiceModal(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={savingService || !selectedServiceToAssign || !targetPropertyForService}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {savingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Assign Service</span>
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  /* Tab 2: Create New Service */
                  <form onSubmit={handleCreateNewServiceSubmit} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-900 dark:text-slate-100 block">
                          Service Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newServiceForm.service_type}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, service_type: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                        >
                          {serviceTypesList.map((st: any) => (
                            <option key={st.id || st.name} value={st.name}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-900 dark:text-slate-100 block">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newServiceForm.phone_number}
                          onChange={(e) => setNewServiceForm({ ...newServiceForm, phone_number: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Service Name / Label</label>
                      <input
                        type="text"
                        value={newServiceForm.service_name}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, service_name: e.target.value })}
                        placeholder="e.g. Front Desk Direct Line"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Description</label>
                      <textarea
                        rows={2}
                        value={newServiceForm.description}
                        onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                        placeholder="Circuit routing notes, equipment location, etc."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">
                        Assign to Property in {org.name} <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={targetPropertyForService}
                        onChange={(e) => setTargetPropertyForService(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        {(org.properties || []).map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.city || 'US'}, {p.state || 'Location'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                      <button
                        type="button"
                        onClick={() => setShowAssignServiceModal(false)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={savingService || !newServiceForm.phone_number || !targetPropertyForService}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                      >
                        {savingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Create &amp; Assign</span>
                      </motion.button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Property Contacts Modal */}
      <AnimatePresence>
        {propContactsTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPropContactsTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Contacts for {propContactsTarget.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      On-site general managers and facility engineers.
                    </p>
                  </div>
                  <button onClick={() => setPropContactsTarget(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {loadingPropContacts ? (
                  <div className="py-8 flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Contact List ({propContactsList.length})</span>
                      {!showAddPropContactForm && (
                        <button
                          onClick={() => setShowAddPropContactForm(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add New
                        </button>
                      )}
                    </div>

                    {showAddPropContactForm && (
                      <form onSubmit={handleAddPropContact} className="p-3 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200/80 dark:border-[#222430] space-y-2.5 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white text-[11px]">New Property Contact</div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Full Name *"
                            value={newPropContact.name}
                            onChange={(e) => setNewPropContact({ ...newPropContact, name: e.target.value })}
                            className="px-2.5 py-1.5 bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a36] rounded-lg"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={newPropContact.email}
                            onChange={(e) => setNewPropContact({ ...newPropContact, email: e.target.value })}
                            className="px-2.5 py-1.5 bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a36] rounded-lg"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={newPropContact.phone}
                            onChange={(e) => setNewPropContact({ ...newPropContact, phone: e.target.value })}
                            className="px-2.5 py-1.5 bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a36] rounded-lg"
                          />
                          <input
                            type="text"
                            placeholder="Role (e.g. GM, Engineer)"
                            value={newPropContact.role}
                            onChange={(e) => setNewPropContact({ ...newPropContact, role: e.target.value })}
                            className="px-2.5 py-1.5 bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#282a36] rounded-lg"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowAddPropContactForm(false)}
                            className="px-3 py-1 rounded-lg border border-slate-200 dark:border-[#222430] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingPropContact}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer disabled:opacity-50"
                          >
                            {savingPropContact ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="max-h-52 overflow-y-auto space-y-2">
                      {propContactsList.length === 0 ? (
                        <p className="text-center py-6 text-slate-400 text-xs">No property contacts listed yet.</p>
                      ) : (
                        propContactsList.map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{c.name} ({c.role || 'Contact'})</span>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{c.email || 'No email'} | {c.phone || 'No phone'}</span>
                            </div>
                            <button
                              onClick={() => handleDeletePropContact(c.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition"
                              title="Delete Contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setPropContactsTarget(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Onboarding Stage & Milestone Dates Modal (7 Stages per Rule 6) */}
      <AnimatePresence>
        {editingOnboardingStage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOnboardingStage(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Edit Onboarding Stage: {editingOnboardingStage.property_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Update current stage and set expected milestone completion dates.
                    </p>
                  </div>
                  <button onClick={() => setEditingOnboardingStage(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveOnboardingStage} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">
                      Current Active Stage (7 Stages)
                    </label>
                    <select
                      value={editingOnboardingStage.stage}
                      onChange={(e) => setEditingOnboardingStage({ ...editingOnboardingStage, stage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                    >
                      <option value="DRAFT">1. Draft Initialized</option>
                      <option value="CONTRACT_SENT">2. Contract Sent</option>
                      <option value="SIGNED">3. Contract Signed &amp; Waiting for LOA</option>
                      <option value="PORTING_SUBMITTED">4. Porting Submitted</option>
                      <option value="SOF_WAITING">5. SOF Review</option>
                      <option value="FOC_RECEIVED">6. FOC Confirmed</option>
                      <option value="COMPLETED">7. Live Cutover</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">
                      Target Cutover Date
                    </label>
                    <input
                      type="date"
                      value={editingOnboardingStage.target_date ? editingOnboardingStage.target_date.split('T')[0] : ''}
                      onChange={(e) => setEditingOnboardingStage({ ...editingOnboardingStage, target_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#222430] space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                      Expected Milestone Completion Dates (Optional)
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      Dates entered below will be visible to the client on their Onboarding Tracker. Blank dates remain hidden.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {[
                        { label: 'Draft Initialized Date', key: 'draft_date' },
                        { label: 'Contract Sent Date', key: 'contract_sent_date' },
                        { label: 'Signed & LOA Date', key: 'signed_date' },
                        { label: 'Porting Submitted Date', key: 'porting_submitted_date' },
                        { label: 'SOF Review Date', key: 'sof_review_date' },
                        { label: 'FOC Confirmed Date', key: 'foc_confirmed_date' },
                        { label: 'Live Cutover Date', key: 'live_cutover_date' },
                      ].map((field) => (
                        <div key={field.key} className="flex items-center justify-between gap-4">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{field.label}</span>
                          <input
                            type="date"
                            value={editingOnboardingStage[field.key] ? editingOnboardingStage[field.key].split('T')[0] : ''}
                            onChange={(e) => setEditingOnboardingStage({ ...editingOnboardingStage, [field.key]: e.target.value })}
                            className="px-2.5 py-1 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setEditingOnboardingStage(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={savingOnboardingStage}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingOnboardingStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Onboarding Details Modal */}
      <AnimatePresence>
        {viewingOnboardingDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingOnboardingDetails(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Onboarding Timeline — {viewingOnboardingDetails.property_name}
                  </h3>
                  <button onClick={() => setViewingOnboardingDetails(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">Active Stage:</span>
                    <span className="px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                      {viewingOnboardingDetails.stage}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="font-bold text-slate-900 dark:text-white">Target Cutover:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewingOnboardingDetails.target_date ? new Date(viewingOnboardingDetails.target_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="font-bold text-slate-900 dark:text-white block mb-2">Milestone Dates:</span>
                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-[#2b2d3b]">
                      {[
                        { label: 'Draft Initialized', val: viewingOnboardingDetails.draft_date },
                        { label: 'Contract Sent', val: viewingOnboardingDetails.contract_sent_date },
                        { label: 'Signed & LOA', val: viewingOnboardingDetails.signed_date },
                        { label: 'Porting Submitted', val: viewingOnboardingDetails.porting_submitted_date },
                        { label: 'SOF Review', val: viewingOnboardingDetails.sof_review_date },
                        { label: 'FOC Confirmed', val: viewingOnboardingDetails.foc_confirmed_date },
                        { label: 'Live Cutover', val: viewingOnboardingDetails.live_cutover_date },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-slate-500">{item.label}:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.val ? new Date(item.val).toLocaleDateString() : '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setViewingOnboardingDetails(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Stage Progress Stepper Modal */}
      <AnimatePresence>
        {stageProgressOnboarding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStageProgressOnboarding(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#222430]">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    7-Stage Progression — {stageProgressOnboarding.property_name}
                  </h3>
                  <button onClick={() => setStageProgressOnboarding(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 py-2">
                  {[
                    { key: 'DRAFT', label: '1. Draft Initialized', date: stageProgressOnboarding.draft_date },
                    { key: 'CONTRACT_SENT', label: '2. Contract Sent', date: stageProgressOnboarding.contract_sent_date },
                    { key: 'SIGNED', label: '3. Contract Signed & Waiting for LOA', date: stageProgressOnboarding.signed_date },
                    { key: 'PORTING_SUBMITTED', label: '4. Porting Submitted', date: stageProgressOnboarding.porting_submitted_date },
                    { key: 'SOF_WAITING', label: '5. SOF Review', date: stageProgressOnboarding.sof_review_date },
                    { key: 'FOC_RECEIVED', label: '6. FOC Confirmed', date: stageProgressOnboarding.foc_confirmed_date },
                    { key: 'COMPLETED', label: '7. Live Cutover', date: stageProgressOnboarding.live_cutover_date },
                  ].map((st, idx) => {
                    const isCurrent = stageProgressOnboarding.stage === st.key;
                    return (
                      <div
                        key={st.key}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                          isCurrent
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-100 dark:border-[#222430]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-[#1a1c24] text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <span className={`text-xs font-semibold ${isCurrent ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                            {st.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {st.date ? new Date(st.date).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setStageProgressOnboarding(null)}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
