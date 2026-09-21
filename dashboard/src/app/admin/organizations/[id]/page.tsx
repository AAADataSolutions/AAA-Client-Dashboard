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
  Link2,
  Unlink,
  Download,
  ArrowLeftRight,
  Sparkles,
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

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

const STAGES_ROAD: { key: OnboardingStatus; label: string; step: number; desc: string; dateField: string }[] = [
  { key: 'DRAFT', label: 'Draft Initialized', step: 1, desc: 'Property draft initialized with inactive status', dateField: 'draft_date' },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', step: 2, desc: 'Service agreement dispatched to GM', dateField: 'contract_sent_date' },
  { key: 'SIGNED', label: 'Contract Signed', step: 3, desc: 'Agreement executed and verified', dateField: 'signed_date' },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', step: 4, desc: 'LSR submitted to winning carrier', dateField: 'porting_submitted_date' },
  { key: 'SOF_WAITING', label: 'SOF Review', step: 5, desc: 'Service Order Form technical review', dateField: 'sof_review_date' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 6, desc: 'Firm Order Confirmation date locked', dateField: 'foc_confirmed_date' },
  { key: 'COMPLETED', label: 'Live Cutover', step: 7, desc: 'Traffic migrated & property activated', dateField: 'live_cutover_date' },
];

function getStageBadge(status: string): { label: string; bg: string; text: string; border: string; pct: number } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]', pct: 14 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', pct: 28 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', pct: 42 };
    case 'PORTING_SUBMITTED':
      return { label: 'Porting Submitted', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', pct: 57 };
    case 'SOF_WAITING':
      return { label: 'SOF Review', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 71 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50', pct: 85 };
    case 'COMPLETED':
      return { label: 'Live Cutover', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', pct: 100 };
    default:
      return { label: status || 'Draft Initialized', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700', pct: 14 };
  }
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

  // Property Action 7: Edit Property Settings
  const [editingPropSettingsTarget, setEditingPropSettingsTarget] = useState<any | null>(null);
  const [editPropSettingsForm, setEditPropSettingsForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    main_phone: '',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    ray_baum_status: 'Active',
    status: 'ACTIVE',
  });
  const [savingPropSettings, setSavingPropSettings] = useState(false);

  // Property Action 8: Delete Property
  const [deletePropTarget, setDeletePropTarget] = useState<any | null>(null);
  const [deletingProp, setDeletingProp] = useState(false);

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

  // Services & Lines 3-Dots Action Menu
  const [activeServiceMenu, setActiveServiceMenu] = useState<{
    srv: any;
    bottom: number;
    left: number;
  } | null>(null);

  // Services Action 1: Edit Service
  const [editingServiceTarget, setEditingServiceTarget] = useState<any | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({
    phone_number: '',
    service_type: 'Voice Line',
    status: 'ACTIVE',
    description: '',
  });
  const [savingEditService, setSavingEditService] = useState(false);

  // Services Action 2: View Details
  const [viewingServiceDetails, setViewingServiceDetails] = useState<any | null>(null);

  // Services Action 3: Assign to Property
  const [assignServiceToPropTarget, setAssignServiceToPropTarget] = useState<any | null>(null);
  const [selectedPropForService, setSelectedPropForService] = useState<string>('');
  const [savingAssignServiceToProp, setSavingAssignServiceToProp] = useState(false);

  // Services Action 4: Delete Service
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<any | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  // Onboarding Tab Filtering & Search
  const [onbSearchInput, setOnbSearchInput] = useState('');
  const [onbStageFilter, setOnbStageFilter] = useState('ALL');
  const [onbSortBy, setOnbSortBy] = useState('NEWEST');

  // Onboarding Unified Modal (Details & Stage Roadmap)
  const [unifiedOnboardingRecord, setUnifiedOnboardingRecord] = useState<any | null>(null);
  const [unifiedOnboardingTab, setUnifiedOnboardingTab] = useState<'DETAILS' | 'STAGE'>('DETAILS');
  const [editOnbStageStatus, setEditOnbStageStatus] = useState<OnboardingStatus>('DRAFT');
  const [editOnbTargetDate, setEditOnbTargetDate] = useState<string>('');
  const [onbStageDates, setOnbStageDates] = useState({
    draft_date: '',
    contract_sent_date: '',
    signed_date: '',
    porting_submitted_date: '',
    sof_review_date: '',
    foc_confirmed_date: '',
    live_cutover_date: '',
  });
  const [updatingOnbStage, setUpdatingOnbStage] = useState(false);

  // Onboarding Initialize Modal (scoped to this organization)
  const [showInitOnbModal, setShowInitOnbModal] = useState(false);
  const [initOnbForm, setInitOnbForm] = useState({
    property_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    general_manager_name: '',
    general_manager_phone: '',
    general_manager_email: '',
    target_date: '',
  });
  const [initOnbLoading, setInitOnbLoading] = useState(false);
  const [initOnbError, setInitOnbError] = useState<string | null>(null);

  // Legacy onboarding popover compatibility
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

      if (json.data) {
        setOrg((prev: any) => {
          if (!prev) return null;
          const prevContacts = prev.contacts || [];
          return {
            ...prev,
            contacts: [
              json.data,
              ...prevContacts.filter((c: any) => c.id !== json.data.id && (!json.data.is_primary || !c.is_primary)),
            ],
          };
        });
      }

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
    const targetId = contactToDelete.id;
    setDeletingContact(true);

    // Optimistically remove from state immediately
    setOrg((prev: any) => {
      if (!prev) return null;
      return {
        ...prev,
        contacts: (prev.contacts || []).filter((c: any) => c.id !== targetId),
      };
    });
    setContactToDelete(null);

    try {
      const res = await fetch(
        `/api/admin/organizations/${orgId}/contacts?member_id=${targetId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to remove contact');

      showToast('Contact removed successfully.');
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error removing contact', 'error');
      fetchOrgDetails();
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

  // Property Action 7 Handler: Open Edit Settings
  const handleOpenEditPropertySettings = (prop: any) => {
    setEditingPropSettingsTarget(prop);
    setEditPropSettingsForm({
      name: prop.name || '',
      address: prop.address || '',
      city: prop.city || '',
      state: prop.state || '',
      zip_code: prop.zip_code || '',
      main_phone: prop.main_phone && prop.main_phone !== '—' ? prop.main_phone : '',
      general_manager_name: prop.general_manager_name && prop.general_manager_name !== '—' ? prop.general_manager_name : '',
      general_manager_phone: prop.general_manager_phone && prop.general_manager_phone !== '—' ? prop.general_manager_phone : '',
      general_manager_email: prop.general_manager_email && prop.general_manager_email !== '—' ? prop.general_manager_email : '',
      ray_baum_status: prop.ray_baum_status === 'Active' ? 'Active' : 'Inactive',
      status: prop.status || 'ACTIVE',
    });
  };

  // Property Action 7 Handler: Save Property Settings
  const handleSavePropertySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPropSettingsTarget) return;
    setSavingPropSettings(true);
    try {
      const res = await fetch(`/api/admin/properties/${editingPropSettingsTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPropSettingsForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update property settings');
      showToast('Property settings saved successfully.');
      setEditingPropSettingsTarget(null);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error updating property', 'error');
    } finally {
      setSavingPropSettings(false);
    }
  };

  // Property Action 8 Handler: Delete Property
  const handleDeletePropertySubmit = async () => {
    if (!deletePropTarget) return;
    setDeletingProp(true);
    try {
      const res = await fetch(`/api/admin/properties/${deletePropTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete property');
      showToast(`Property "${deletePropTarget.name}" deleted.`);
      setDeletePropTarget(null);
      fetchOrgDetails();
      fetchOrgProperties();
    } catch (err: any) {
      showToast(err.message || 'Error deleting property', 'error');
    } finally {
      setDeletingProp(false);
    }
  };

  // Service Action 1 Handler: Open Edit Service
  const handleOpenEditService = (srv: any) => {
    setEditingServiceTarget(srv);
    setEditServiceForm({
      phone_number: srv.phone_number || '',
      service_type: srv.service_type || 'Voice Line',
      status: srv.status || 'ACTIVE',
      description: srv.description || '',
    });
  };

  // Service Action 1 Handler: Save Edit Service
  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceTarget) return;
    setSavingEditService(true);
    try {
      const res = await fetch(`/api/admin/services/${editingServiceTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editServiceForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update service');
      showToast('Service details updated successfully.');
      setEditingServiceTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating service', 'error');
    } finally {
      setSavingEditService(false);
    }
  };

  // Service Action 3 Handler: Open Assign to Property
  const handleOpenAssignServiceToProp = (srv: any) => {
    setAssignServiceToPropTarget(srv);
    const initialPropId = srv.property_id || (org?.properties && org.properties[0]?.id) || '';
    setSelectedPropForService(initialPropId);
  };

  // Service Action 3 Handler: Save Assign to Property
  const handleSaveAssignServiceToProp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignServiceToPropTarget || !selectedPropForService) return;
    setSavingAssignServiceToProp(true);
    try {
      const res = await fetch(`/api/admin/services/${assignServiceToPropTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: selectedPropForService }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to reassign service');
      showToast('Service assigned to property successfully.');
      setAssignServiceToPropTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error assigning service', 'error');
    } finally {
      setSavingAssignServiceToProp(false);
    }
  };

  // Service Action 4 Handler: Delete Service
  const handleDeleteServiceSubmit = async () => {
    if (!deleteServiceTarget) return;
    setDeletingService(true);
    try {
      const res = await fetch(`/api/admin/services/${deleteServiceTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete service');
      showToast(`Service "${deleteServiceTarget.phone_number}" deleted.`);
      setDeleteServiceTarget(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error deleting service', 'error');
    } finally {
      setDeletingService(false);
    }
  };

  // Onboarding Unified Modal Handler
  const openUnifiedOnboardingModal = (record: any, tab: 'DETAILS' | 'STAGE' = 'DETAILS') => {
    setUnifiedOnboardingRecord(record);
    setUnifiedOnboardingTab(tab);
    setEditOnbStageStatus((record.stage || record.status || 'DRAFT') as OnboardingStatus);
    setEditOnbTargetDate(record.target_date ? record.target_date.split('T')[0] : '');
    setOnbStageDates({
      draft_date: record.draft_date ? record.draft_date.split('T')[0] : '',
      contract_sent_date: record.contract_sent_date ? record.contract_sent_date.split('T')[0] : '',
      signed_date: record.signed_date ? record.signed_date.split('T')[0] : '',
      porting_submitted_date: record.porting_submitted_date ? record.porting_submitted_date.split('T')[0] : '',
      sof_review_date: record.sof_review_date ? record.sof_review_date.split('T')[0] : '',
      foc_confirmed_date: record.foc_confirmed_date ? record.foc_confirmed_date.split('T')[0] : '',
      live_cutover_date: record.live_cutover_date ? record.live_cutover_date.split('T')[0] : '',
    });
  };

  // Save Onboarding Stage from Unified Modal
  const handleUpdateOnbStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unifiedOnboardingRecord) return;
    setUpdatingOnbStage(true);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unifiedOnboardingRecord.id,
          status: editOnbStageStatus,
          target_date: editOnbTargetDate || null,
          draft_date: onbStageDates.draft_date || null,
          contract_sent_date: onbStageDates.contract_sent_date || null,
          signed_date: onbStageDates.signed_date || null,
          porting_submitted_date: onbStageDates.porting_submitted_date || null,
          sof_review_date: onbStageDates.sof_review_date || null,
          foc_confirmed_date: onbStageDates.foc_confirmed_date || null,
          live_cutover_date: onbStageDates.live_cutover_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update stage');

      if (editOnbStageStatus === 'COMPLETED') {
        showToast(`Property cutover completed and activated!`);
      } else {
        showToast(`Stage updated to ${getStageBadge(editOnbStageStatus).label}.`);
      }
      setUnifiedOnboardingRecord(null);
      fetchOrgDetails();
    } catch (err: any) {
      showToast(err.message || 'Error updating stage', 'error');
    } finally {
      setUpdatingOnbStage(false);
    }
  };

  // Initialize Onboarding Submit
  const handleCreateOnbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initOnbForm.property_name.trim()) {
      setInitOnbError('Property name is required.');
      return;
    }
    setInitOnbLoading(true);
    setInitOnbError(null);
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...initOnbForm,
          organization_id: orgId,
          e911_status: 'PENDING',
          ray_baum_status: 'AUDIT_REQUIRED',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to initialize onboarding');

      showToast(`Onboarding initialized for "${initOnbForm.property_name}".`);
      setShowInitOnbModal(false);
      setInitOnbForm({
        property_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        general_manager_name: '',
        general_manager_phone: '',
        general_manager_email: '',
        target_date: '',
      });
      fetchOrgDetails();
    } catch (err: any) {
      setInitOnbError(err.message || 'Creation failed');
      showToast(err.message || 'Error initializing onboarding', 'error');
    } finally {
      setInitOnbLoading(false);
    }
  };

  // Export Onboardings to CSV
  const handleExportOnbCSV = () => {
    const list = org?.onboardings || [];
    const headers = ['ID,Property,Organization,Stage,Target Date,GM Name,GM Phone,GM Email\n'];
    const rows = list.map((o: any) =>
      `"${o.id}","${o.property_name || ''}","${org?.name || ''}","${o.stage || o.status || ''}","${o.target_date || ''}","${o.general_manager_name || ''}","${o.general_manager_phone || ''}","${o.general_manager_email || ''}"`
    );
    const blob = new Blob([headers.concat(rows.join('\n')).join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${org?.name || 'organization'}-onboardings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Onboardings exported as CSV.');
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

        {/* <button
          onClick={() => setActiveTab('ONBOARDING')}
          className={`px-3.5 py-2 font-semibold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'ONBOARDING'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Onboarding ({org.onboardings?.length || 0})</span>
        </button> */}

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
                        {(() => {
                          const rawStage = prop.onboarding_stage || prop.stage;
                          if (!rawStage) return <span className="text-slate-400">—</span>;
                          const badge = getStageBadge(rawStage);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}
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
              {/* <Link
                href="/admin/services"
                className="text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline cursor-pointer"
              >
                Open Services Catalog
              </Link> */}
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
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
                {org.services?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
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
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActiveServiceMenu({
                              srv,
                              bottom: window.innerHeight - rect.top + 6,
                              left: Math.max(16, rect.left - 160),
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                          title="Service Options"
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

      {/* Tab 5: ONBOARDING (Same as Onboarding Page with Full Parity & Actions) */}
      {activeTab === 'ONBOARDING' && (() => {
        const totalOnb = org.onboardings?.length || 0;
        const inFlightOnb = (org.onboardings || []).filter((o: any) =>
          ['PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED'].includes(o.stage || o.status)
        ).length;
        const draftPendingOnb = (org.onboardings || []).filter((o: any) =>
          ['DRAFT', 'CONTRACT_SENT', 'SIGNED'].includes(o.stage || o.status)
        ).length;
        const completedOnb = (org.onboardings || []).filter((o: any) =>
          ['COMPLETED', 'LIVE_CUTOVER'].includes(o.stage || o.status)
        ).length;

        const filteredOnboardings = (org.onboardings || []).filter((onb: any) => {
          const q = onbSearchInput.trim().toLowerCase();
          if (q) {
            const nameMatch = onb.property_name?.toLowerCase().includes(q);
            const addrMatch = (onb.property_address || onb.property_location)?.toLowerCase().includes(q);
            const gmMatch = onb.general_manager_name?.toLowerCase().includes(q);
            const gmEmailMatch = onb.general_manager_email?.toLowerCase().includes(q);
            if (!nameMatch && !addrMatch && !gmMatch && !gmEmailMatch) return false;
          }
          if (onbStageFilter !== 'ALL') {
            if ((onb.stage || onb.status) !== onbStageFilter) return false;
          }
          return true;
        });

        filteredOnboardings.sort((a: any, b: any) => {
          if (onbSortBy === 'PROP_ASC') {
            return (a.property_name || '').localeCompare(b.property_name || '');
          } else if (onbSortBy === 'STATUS') {
            return (a.stage || a.status || '').localeCompare(b.stage || b.status || '');
          }
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        const hasActiveOnbFilters = onbSearchInput.trim() !== '' || onbStageFilter !== 'ALL' || onbSortBy !== 'NEWEST';

        return (
          <div className="space-y-5">
            {/* Header & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] p-4 rounded-2xl shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Onboarding &amp; Porting Pipelines</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Track 7-stage property cutover schedules and carrier porting status for {org.name}.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportOnbCSV}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
                <button
                  onClick={() => {
                    setOnbSearchInput('');
                    setOnbStageFilter('ALL');
                    setOnbSortBy('NEWEST');
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1c1e27] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Reset
                </button>
                <button
                  onClick={() => {
                    setInitOnbError(null);
                    setShowInitOnbModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Initialize Onboarding
                </button>
              </div>
            </div>

            {/* 4 Real KPI Cards (Matches Onboarding Page Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Total Pipelines</span>
                  <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                    <Hotel size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-slate-100 dark:text-white">{totalOnb}</span>
                  <span className="text-xs text-slate-100 ml-1.5 font-medium">Properties</span>
                </div>
                <p className="text-[11px] text-slate-100 mt-2">Active &amp; completed lifecycles</p>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Porting In-Flight</span>
                  <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                    <ArrowLeftRight size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-slate-100 dark:text-white">{inFlightOnb}</span>
                  <span className="text-xs text-slate-100 ml-1.5 font-medium">Orders</span>
                </div>
                <p className="text-[11px] text-slate-100 mt-2">LOA, SOF &amp; FOC carrier stages</p>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Draft &amp; Pending</span>
                  <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-slate-100 dark:text-white">{draftPendingOnb}</span>
                  <span className="text-xs text-slate-100 ml-1.5 font-medium">Pending</span>
                </div>
                <p className="text-[11px] text-slate-100 mt-2">Awaiting contract signing</p>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-blue-800 dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] p-4 rounded-xl shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-100 dark:text-slate-400">Cutover Complete</span>
                  <div className="w-7 h-7 rounded-lg text-white dark:text-blue-400 flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold text-slate-100 dark:text-white">{completedOnb}</span>
                  <span className="text-xs text-slate-100 ml-1.5 font-medium">Active</span>
                </div>
                <p className="text-[11px] text-slate-100 mt-2">100% migrated &amp; operational</p>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-3 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by property, address, GM name, email..."
                    value={onbSearchInput}
                    onChange={(e) => setOnbSearchInput(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  {onbSearchInput && (
                    <button onClick={() => setOnbSearchInput('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={onbStageFilter}
                    onChange={(e) => setOnbStageFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="ALL">Stage: All Stages</option>
                    {STAGES_ROAD.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>

                  <select
                    value={onbSortBy}
                    onChange={(e) => setOnbSortBy(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="NEWEST">Sort: Recently Added</option>
                    <option value="PROP_ASC">Sort: Property (A-Z)</option>
                    <option value="STATUS">Sort: Stage Progress</option>
                  </select>
                </div>
              </div>

              {hasActiveOnbFilters && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1a1c24] text-xs">
                  <span className="text-slate-400">Active Filters:</span>
                  {onbSearchInput && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                      "{onbSearchInput}"
                      <button onClick={() => setOnbSearchInput('')} className="cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {onbStageFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                      Stage: {onbStageFilter}
                      <button onClick={() => setOnbStageFilter('ALL')} className="cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setOnbSearchInput('');
                      setOnbStageFilter('ALL');
                      setOnbSortBy('NEWEST');
                    }}
                    className="text-slate-500 hover:text-blue-600 text-xs font-medium underline ml-auto cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
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
                    {filteredOnboardings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                          {hasActiveOnbFilters
                            ? 'No onboarding records match the selected filters.'
                            : 'No onboarding pipelines recorded for this organization.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOnboardings.map((onb: any) => {
                        const stageBadge = getStageBadge(onb.stage || onb.status || 'DRAFT');
                        const fullAddress = onb.property_address || onb.property_location || 'Pending Address';

                        return (
                          <tr
                            key={onb.id}
                            onClick={() => openUnifiedOnboardingModal(onb, 'DETAILS')}
                            className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {onb.property_name}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                <span>{fullAddress}</span>
                                {fullAddress !== 'Pending Address' && (
                                  <button
                                    onClick={() => handleCopy(fullAddress, `onb-addr-${onb.id}`)}
                                    className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5"
                                    title="Copy Address"
                                  >
                                    {copiedId === `onb-addr-${onb.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap">
                              {org.name}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stageBadge.bg} ${stageBadge.text} ${stageBadge.border}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                {stageBadge.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                              {onb.target_date ? new Date(onb.target_date).toLocaleDateString() : 'TBD'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {onb.general_manager_name || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {onb.general_manager_phone || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {onb.general_manager_email || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
      

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

      {/* Fixed Popover for Property Actions (Opens strictly ABOVE) - Matches Screenshot 1 */}
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
              className="z-50 w-56 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            >
              {/* Header with Property Name and "Property Options" */}
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#2b2d3b] bg-slate-50/50 dark:bg-[#15161c]/50">
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {activePropMenu.prop.name}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Property Options</div>
              </div>

              {/* 1. View Property Details */}
              <button
                onClick={() => {
                  setViewingPropDetails(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Property Details</span>
              </button>

              {/* 2. View Services */}
              <button
                onClick={() => {
                  handleViewPropertyServices(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-purple-500" />
                <span>View Services</span>
              </button>

              {/* 3. Assign Service */}
              <button
                onClick={() => {
                  handleOpenAssignServiceModal(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assign Service</span>
              </button>

              {/* 4. Unassign from Organization (orange text) */}
              <button
                onClick={() => {
                  setUnassignTarget({ propertyId: activePropMenu.prop.id, name: activePropMenu.prop.name });
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 transition cursor-pointer font-semibold"
              >
                <Unlink className="w-3.5 h-3.5 text-amber-500" />
                <span>Unassign from Organization</span>
              </button>

              {/* 5. Manage Contacts */}
              <button
                onClick={() => {
                  handleOpenPropertyContacts(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Manage Contacts</span>
              </button>

              {/* 6. Change Status */}
              <button
                onClick={() => {
                  setStatusPropTarget(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Change Status</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-[#2b2d3b]" />

              {/* 7. Edit Property Settings */}
              <button
                onClick={() => {
                  handleOpenEditPropertySettings(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Property Settings</span>
              </button>

              {/* 8. Delete Property (red text) */}
              <button
                onClick={() => {
                  setDeletePropTarget(activePropMenu.prop);
                  setActivePropMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Property</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Popover for Service Actions (Opens strictly ABOVE) - Matches Screenshot 2 */}
      <AnimatePresence>
        {activeServiceMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setActiveServiceMenu(null)}
            />
            <div
              style={{
                position: 'fixed',
                bottom: `${activeServiceMenu.bottom}px`,
                left: `${activeServiceMenu.left}px`,
              }}
              className="z-50 w-52 bg-white dark:bg-[#1a1b23] border border-slate-200 dark:border-[#2b2d3b] rounded-xl shadow-2xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            >
              {/* Header with Service Number and "Service Options" */}
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#2b2d3b] bg-slate-50/50 dark:bg-[#15161c]/50">
                <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                  {activeServiceMenu.srv.phone_number || '1234567895'}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Service Options</div>
              </div>

              {/* 1. Edit Service */}
              <button
                onClick={() => {
                  handleOpenEditService(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit Service</span>
              </button>

              {/* 2. View Details */}
              <button
                onClick={() => {
                  setViewingServiceDetails(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Details</span>
              </button>

              {/* 3. Assign to Property */}
              <button
                onClick={() => {
                  handleOpenAssignServiceToProp(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#252736] flex items-center gap-2.5 transition cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Assign to Property</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-[#2b2d3b]" />

              {/* 4. Delete Service (red text) */}
              <button
                onClick={() => {
                  setDeleteServiceTarget(activeServiceMenu.srv);
                  setActiveServiceMenu(null);
                }}
                className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Service</span>
              </button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Popover for Onboarding Actions (Opens strictly ABOVE) - Matches Onboarding Page */}
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
              className="z-50 w-48 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{onboardingMenuPosition.onb.property_name}</p>
                <p className="text-[10px] text-slate-400">Pipeline Actions</p>
              </div>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'DETAILS');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>View Details</span>
              </button>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'STAGE');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Edit Stage</span>
              </button>
              <button
                onClick={() => {
                  openUnifiedOnboardingModal(onboardingMenuPosition.onb, 'STAGE');
                  setOnboardingMenuPosition(null);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium"
              >
                <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Stage Road</span>
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

      {/* Edit Property Settings Modal */}
      <AnimatePresence>
        {editingPropSettingsTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPropSettingsTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[92vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1a1c24] flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Edit Property Settings
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {editingPropSettingsTarget.name}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setEditingPropSettingsTarget(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePropertySettings} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Property Name *</label>
                    <input
                      type="text"
                      required
                      value={editPropSettingsForm.name}
                      onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Street Address</label>
                    <input
                      type="text"
                      value={editPropSettingsForm.address}
                      onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">City</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.city}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">State</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.state}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Zip Code</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.zip_code}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, zip_code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Main Phone</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.main_phone}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, main_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">General Manager Name</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.general_manager_name}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">GM Phone</label>
                      <input
                        type="text"
                        value={editPropSettingsForm.general_manager_phone}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">GM Email</label>
                      <input
                        type="email"
                        value={editPropSettingsForm.general_manager_email}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, general_manager_email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Ray Baum Compliance Status</label>
                      <select
                        value={editPropSettingsForm.ray_baum_status}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, ray_baum_status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending">Pending Audit</option>
                        <option value="Exempt">Exempt</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-900 dark:text-slate-100 block">Property Status</label>
                      <select
                        value={editPropSettingsForm.status}
                        onChange={(e) => setEditPropSettingsForm({ ...editPropSettingsForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setEditingPropSettingsTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingPropSettings}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingPropSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Settings</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Property Confirmation Modal */}
      <AnimatePresence>
        {deletePropTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletePropTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-rose-200 dark:border-rose-900/40 rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Property</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletePropTarget.name}"</strong>? This will detach its services, E911 records, and onboarding pipelines.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletePropTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#181920] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePropertySubmit}
                    disabled={deletingProp}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {deletingProp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Delete Property</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingServiceTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingServiceTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Service</h3>
                      <p className="text-[11px] text-slate-400">{editingServiceTarget.phone_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingServiceTarget(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditService} className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editServiceForm.phone_number}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, phone_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Service Type</label>
                    <select
                      value={editServiceForm.service_type}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, service_type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer"
                    >
                      <option value="Voice Line">Voice Line</option>
                      <option value="Voice Trunk / DID">Voice Trunk / DID</option>
                      <option value="Toll-Free">Toll-Free</option>
                      <option value="Fax Line">Fax Line</option>
                      <option value="Broadband / Internet">Broadband / Internet</option>
                      <option value="Failover Wireless">Failover Wireless</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Status</label>
                    <select
                      value={editServiceForm.status}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PORTING">PORTING</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">Description / Notes</label>
                    <textarea
                      rows={2}
                      value={editServiceForm.description}
                      onChange={(e) => setEditServiceForm({ ...editServiceForm, description: e.target.value })}
                      placeholder="Circuit routing or porting details..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                    <button
                      type="button"
                      onClick={() => setEditingServiceTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingEditService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingEditService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* View Service Details Modal */}
      <AnimatePresence>
        {viewingServiceDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingServiceDetails(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Service Details</h3>
                      <p className="text-[11px] text-slate-400">{viewingServiceDetails.phone_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewingServiceDetails(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="text-slate-500 font-medium">Phone Number:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{viewingServiceDetails.phone_number}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="text-slate-500 font-medium">Service Type:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingServiceDetails.service_type || 'Voice Line'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      viewingServiceDetails.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : viewingServiceDetails.status === 'PORTING'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    }`}>
                      {viewingServiceDetails.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="text-slate-500 font-medium">Assigned Property:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{viewingServiceDetails.property_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-[#1f212a]">
                    <span className="text-slate-500 font-medium">Organization:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{org.name}</span>
                  </div>
                  <div className="py-1.5">
                    <span className="text-slate-500 font-medium block mb-1">Description / Notes:</span>
                    <p className="p-2.5 bg-slate-50 dark:bg-[#111217] rounded-lg border border-slate-100 dark:border-[#222430] text-slate-700 dark:text-slate-300">
                      {viewingServiceDetails.description || 'No additional description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    onClick={() => setViewingServiceDetails(null)}
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

      {/* Assign Service to Property Modal */}
      <AnimatePresence>
        {assignServiceToPropTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignServiceToPropTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222430]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Assign to Property</h3>
                      <p className="text-[11px] text-slate-400">{assignServiceToPropTarget.phone_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setAssignServiceToPropTarget(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAssignServiceToProp} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 dark:text-slate-100 block">
                      Target Property in {org.name} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedPropForService}
                      onChange={(e) => setSelectedPropForService(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer font-medium"
                    >
                      <option value="">Select Property</option>
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
                      onClick={() => setAssignServiceToPropTarget(null)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={savingAssignServiceToProp || !selectedPropForService}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingAssignServiceToProp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Assign Service</span>
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Service Confirmation Modal */}
      <AnimatePresence>
        {deleteServiceTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteServiceTarget(null)}
              className="fixed inset-0 min-h-screen w-screen h-screen z-60 bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-rose-200 dark:border-rose-900/40 rounded-2xl shadow-2xl p-6 z-10 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Service</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Are you sure you want to delete service <strong className="text-slate-900 dark:text-white font-mono">{deleteServiceTarget.phone_number}</strong>? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteServiceTarget(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#181920] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteServiceSubmit}
                    disabled={deletingService}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {deletingService ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Delete Service</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* UNIFIED ONBOARDING MODAL (DETAILS & STAGE ROADMAP - Matches /admin/onboarding-porting) */}
      <AnimatePresence>
        {unifiedOnboardingRecord && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{unifiedOnboardingRecord.property_name}</h3>
                    <p className="text-xs text-slate-400">Onboarding &amp; Cutover Lifecycle</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tab Navigation */}
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] text-xs">
                    <button
                      type="button"
                      onClick={() => setUnifiedOnboardingTab('DETAILS')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        unifiedOnboardingTab === 'DETAILS'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnifiedOnboardingTab('STAGE')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        unifiedOnboardingTab === 'STAGE'
                          ? 'bg-white dark:bg-[#1f212c] text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Stage Tracking
                    </button>
                  </div>

                  <button
                    onClick={() => setUnifiedOnboardingRecord(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab 1: Details */}
              {unifiedOnboardingTab === 'DETAILS' && (
                <div className="p-6 overflow-y-auto space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Property Name</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                        {unifiedOnboardingRecord.property_name}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Assigned Organization</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200 font-semibold">
                        {org?.name || 'Direct Portfolio'}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Property Address</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {unifiedOnboardingRecord.property_address || unifiedOnboardingRecord.address || 'Pending Address'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Name</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {unifiedOnboardingRecord.general_manager_name || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Phone</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {unifiedOnboardingRecord.general_manager_phone || 'N/A'}
                      </p>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">General Manager Email</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {unifiedOnboardingRecord.general_manager_email || 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Target Cutover Date</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-800 dark:text-slate-200">
                        {unifiedOnboardingRecord.target_date
                          ? new Date(unifiedOnboardingRecord.target_date).toLocaleDateString()
                          : 'Not Scheduled'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-black dark:text-white block text-xs">Current Lifecycle Stage</label>
                      <p className="p-2.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg font-bold text-blue-600 dark:text-blue-400">
                        {getStageBadge(((unifiedOnboardingRecord as any).stage || unifiedOnboardingRecord.status) as OnboardingStatus).label} ({getStageBadge(((unifiedOnboardingRecord as any).stage || unifiedOnboardingRecord.status) as OnboardingStatus).pct}%)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Stage Tracking (Curved Road with Animated Fill) */}
              {unifiedOnboardingTab === 'STAGE' && (
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {/* Stage Road Timeline */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Onboarding Progress Roadmap
                      </h4>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {getStageBadge(editOnbStageStatus).pct}% Complete
                      </span>
                    </div>

                    {/* Progress Bar with Fill Animation */}
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-[#111217] rounded-full overflow-hidden border border-slate-200 dark:border-[#222430]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getStageBadge(editOnbStageStatus).pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full"
                      />
                    </div>

                    {/* Curved Road Timeline Visualizer */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                      {STAGES_ROAD.map((st, idx) => {
                        const currentStepIndex = STAGES_ROAD.findIndex((s) => s.key === editOnbStageStatus);
                        const isDone = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <motion.div
                            key={st.key}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setEditOnbStageStatus(st.key)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                              isCurrent
                                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                                : isDone
                                ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                                : 'border-slate-200 dark:border-[#222430] opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#181920]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-200 dark:bg-[#222430] text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {isDone ? <Check className="w-3 h-3" /> : st.step}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">Stage {st.step}</span>
                            </div>

                            <p className="font-bold text-slate-900 dark:text-white text-xs">{st.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{st.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Update Form */}
                  <form onSubmit={handleUpdateOnbStageSubmit} className="pt-4 border-t border-slate-100 dark:border-[#222430] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Set Next Lifecycle Stage</label>
                        <select
                          value={editOnbStageStatus}
                          onChange={(e) => setEditOnbStageStatus(e.target.value as OnboardingStatus)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs cursor-pointer focus:outline-none focus:border-blue-500 font-semibold"
                        >
                          {STAGES_ROAD.map((s) => (
                            <option key={s.key} value={s.key}>
                              Stage {s.step}: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-black dark:text-white block mb-1">Target Cutover Date</label>
                        <input
                          type="date"
                          value={editOnbTargetDate ? editOnbTargetDate.split('T')[0] : ''}
                          onChange={(e) => setEditOnbTargetDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Milestone Expected Completion Dates */}
                    <div className="p-3.5 bg-slate-50 dark:bg-[#111217] rounded-xl border border-slate-200 dark:border-[#222430] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-900 dark:text-white block text-xs">
                          Milestone Expected Dates (All 7 Stages)
                        </label>
                        <span className="text-[10px] text-slate-400">Synced with client tracking view</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {STAGES_ROAD.map((s) => (
                          <div key={s.dateField} className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block truncate">
                              Stage {s.step}: {s.label}
                            </label>
                            <input
                              type="date"
                              value={(onbStageDates as any)[s.dateField] || ''}
                              onChange={(e) =>
                                setOnbStageDates((prev) => ({ ...prev, [s.dateField]: e.target.value }))
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-[11px] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {editOnbStageStatus === 'COMPLETED' && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Setting stage to <strong>Live Cutover (COMPLETED)</strong> will automatically activate the property to <strong>ACTIVE</strong> in the database and audit trail.
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setUnifiedOnboardingRecord(null)}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updatingOnbStage}
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        {updatingOnbStage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save & Update Stage'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Initialize Property Onboarding Modal */}
      <AnimatePresence>
        {showInitOnbModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Initialize Property Onboarding</h3>
                  <p className="text-xs text-slate-400">Scoped to organization: {org?.name}</p>
                </div>
                <button
                  onClick={() => setShowInitOnbModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOnbSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
                {initOnbError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
                    {initOnbError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Property Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hilton Garden Inn Downtown"
                    value={initOnbForm.property_name}
                    onChange={(e) => setInitOnbForm({ ...initOnbForm, property_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-black dark:text-white block">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Main St"
                    value={initOnbForm.address}
                    onChange={(e) => setInitOnbForm({ ...initOnbForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={initOnbForm.city}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={initOnbForm.state}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, state: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Zip Code</label>
                    <input
                      type="text"
                      placeholder="Zip"
                      value={initOnbForm.zip_code}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, zip_code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Name</label>
                    <input
                      type="text"
                      placeholder="General Manager"
                      value={initOnbForm.general_manager_name}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={initOnbForm.general_manager_phone}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">GM Email</label>
                    <input
                      type="email"
                      placeholder="gm@property.com"
                      value={initOnbForm.general_manager_email}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, general_manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-black dark:text-white block">Target Cutover Date</label>
                    <input
                      type="date"
                      value={initOnbForm.target_date}
                      onChange={(e) => setInitOnbForm({ ...initOnbForm, target_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowInitOnbModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={initOnbLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {initOnbLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Initialize Pipeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
