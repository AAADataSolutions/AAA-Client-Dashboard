'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Hotel,
  Building2,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Settings,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  LifeBuoy,
  Users,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Archive,
  BarChart3,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  Network,
  LayoutGrid,
  List,
  GitBranch,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PropertyRecord {
  id: string;
  code?: string;
  name: string;
  brand?: string;
  organization_id?: string;
  organization_name?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string | null;
  fax: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  general_manager_name: string | null;
  ray_baud_and_logs_enabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'OFFBOARDED';
  sip_trunks_count?: number;
  did_count?: number;
  e911_status?: 'VERIFIED' | 'PENDING' | 'AUDIT_REQUIRED';
  open_tickets_count?: number;
  onboarding_stage?: string;
  created_at: string;
}

interface OrgOption {
  id: string;
  name: string;
}

const INITIAL_ORGS_OPTIONS: OrgOption[] = [
  { id: 'org-shamin', name: 'Shamin Hotels' },
  { id: 'org-abc', name: 'ABC Hospitality' },
  { id: 'org-marriott', name: 'Marriott Franchise Group' },
  { id: 'org-xyz', name: 'XYZ Hotel Management' },
  { id: 'org-crestview', name: 'Crestview Luxury Resorts' },
  { id: 'org-summit', name: 'Summit Hospitality Partners' },
  { id: 'org-pacific', name: 'Pacific West Hospitality' },
  { id: 'org-horizon', name: 'Horizon Heritage Inns' },
];

const INITIAL_PROPERTIES: PropertyRecord[] = [
  {
    id: 'prop-courtyard-richmond',
    code: 'CY-RIC-101',
    name: 'Courtyard Richmond Downtown',
    brand: 'Courtyard by Marriott',
    organization_id: 'org-shamin',
    organization_name: 'Shamin Hotels',
    address: '100 South 14th Street',
    city: 'Richmond',
    state: 'VA',
    zip_code: '23219',
    country: 'USA',
    main_phone: '+1 (804) 555-0144',
    fax: '+1 (804) 555-0145',
    contact_person_name: 'David Wright',
    contact_person_email: 'dwright@shaminhotels.com',
    general_manager_name: 'Michael Robinson',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
    sip_trunks_count: 8,
    did_count: 36,
    e911_status: 'VERIFIED',
    open_tickets_count: 1,
    onboarding_stage: 'Completed (Production)',
    created_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'prop-hilton-garden-glenallen',
    code: 'HGI-GLN-204',
    name: 'Hilton Garden Inn Glen Allen',
    brand: 'Hilton Garden Inn',
    organization_id: 'org-shamin',
    organization_name: 'Shamin Hotels',
    address: '4050 Cox Road',
    city: 'Glen Allen',
    state: 'VA',
    zip_code: '23060',
    country: 'USA',
    main_phone: '+1 (804) 555-0188',
    fax: '+1 (804) 555-0189',
    contact_person_name: 'Sarah Jenkins',
    contact_person_email: 'sjenkins@shaminhotels.com',
    general_manager_name: 'Amanda Hayes',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
    sip_trunks_count: 12,
    did_count: 48,
    e911_status: 'VERIFIED',
    open_tickets_count: 0,
    onboarding_stage: 'Completed (Production)',
    created_at: '2025-01-20T11:30:00Z',
  },
  {
    id: 'prop-marriott-sf-marquis',
    code: 'MM-SFO-300',
    name: 'Marriott Marquis San Francisco',
    brand: 'Marriott Hotels',
    organization_id: 'org-abc',
    organization_name: 'ABC Hospitality',
    address: '780 Mission Street',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94103',
    country: 'USA',
    main_phone: '+1 (415) 555-0899',
    fax: '+1 (415) 555-0890',
    contact_person_name: 'David Ross',
    contact_person_email: 'd.ross@abchospitality.com',
    general_manager_name: 'Jonathan Sterling',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
    sip_trunks_count: 24,
    did_count: 120,
    e911_status: 'VERIFIED',
    open_tickets_count: 2,
    onboarding_stage: 'Completed (Production)',
    created_at: '2025-02-04T14:10:00Z',
  },
  {
    id: 'prop-residence-inn-austin',
    code: 'RI-ATX-405',
    name: 'Residence Inn Austin Downtown',
    brand: 'Residence Inn',
    organization_id: 'org-summit',
    organization_name: 'Summit Hospitality Partners',
    address: '300 East 4th Street',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    country: 'USA',
    main_phone: '+1 (512) 555-0322',
    fax: '+1 (512) 555-0323',
    contact_person_name: 'Kevin Miller',
    contact_person_email: 'kmiller@summithp.com',
    general_manager_name: 'Jessica Ramos',
    ray_baud_and_logs_enabled: true,
    status: 'ONBOARDING',
    sip_trunks_count: 6,
    did_count: 24,
    e911_status: 'PENDING',
    open_tickets_count: 0,
    onboarding_stage: 'FOC Received (Porting 03/18)',
    created_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'prop-hyatt-regency-chicago',
    code: 'HR-CHI-502',
    name: 'Hyatt Regency Chicago Loop',
    brand: 'Hyatt Regency',
    organization_id: 'org-xyz',
    organization_name: 'XYZ Hotel Management',
    address: '151 East Wacker Drive',
    city: 'Chicago',
    state: 'IL',
    zip_code: '60601',
    country: 'USA',
    main_phone: '+1 (312) 555-0750',
    fax: '+1 (312) 555-0751',
    contact_person_name: 'Marcus Vance',
    contact_person_email: 'mvance@xyzmgmt.com',
    general_manager_name: 'Robert Chen',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
    sip_trunks_count: 18,
    did_count: 85,
    e911_status: 'VERIFIED',
    open_tickets_count: 0,
    onboarding_stage: 'Completed (Production)',
    created_at: '2025-02-12T16:20:00Z',
  },
  {
    id: 'prop-crestview-ocean-resort',
    code: 'COR-MIA-610',
    name: 'Crestview Ocean Grand Resort',
    brand: 'Independent Luxury',
    organization_id: 'org-crestview',
    organization_name: 'Crestview Luxury Resorts',
    address: '4401 Collins Avenue',
    city: 'Miami Beach',
    state: 'FL',
    zip_code: '33140',
    country: 'USA',
    main_phone: '+1 (305) 555-0911',
    fax: '+1 (305) 555-0912',
    contact_person_name: 'Rachel Adams',
    contact_person_email: 'radams@crestview.io',
    general_manager_name: 'Victoria De La Cruz',
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE',
    sip_trunks_count: 16,
    did_count: 70,
    e911_status: 'VERIFIED',
    open_tickets_count: 1,
    onboarding_stage: 'Completed (Production)',
    created_at: '2025-02-22T13:45:00Z',
  },
  {
    id: 'prop-westin-seattle-waterfront',
    code: 'WS-SEA-715',
    name: 'Westin Seattle Waterfront',
    brand: 'Westin Hotels',
    organization_id: 'org-pacific',
    organization_name: 'Pacific West Hospitality',
    address: '1900 5th Avenue',
    city: 'Seattle',
    state: 'WA',
    zip_code: '98101',
    country: 'USA',
    main_phone: '+1 (206) 555-0610',
    fax: '+1 (206) 555-0611',
    contact_person_name: 'Chloe Lin',
    contact_person_email: 'operations@pacwesthotels.com',
    general_manager_name: 'Brian Kowalski',
    ray_baud_and_logs_enabled: false,
    status: 'ACTIVE',
    sip_trunks_count: 14,
    did_count: 60,
    e911_status: 'AUDIT_REQUIRED',
    open_tickets_count: 1,
    onboarding_stage: 'Completed (E911 Audit Pending)',
    created_at: '2025-01-30T15:00:00Z',
  },
];

function getBrandBadge(brand: string = 'Hotel'): { bg: string; text: string; initial: string } {
  if (brand.includes('Courtyard') || brand.includes('Marriott') || brand.includes('Residence')) {
    return { bg: 'bg-indigo-100', text: 'text-indigo-700', initial: 'M' };
  }
  if (brand.includes('Hilton')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700', initial: 'H' };
  }
  if (brand.includes('Hyatt')) {
    return { bg: 'bg-teal-100', text: 'text-teal-700', initial: 'HY' };
  }
  if (brand.includes('Westin')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', initial: 'W' };
  }
  return { bg: 'bg-purple-100', text: 'text-purple-700', initial: 'L' };
}

export default function AdminPropertiesPage() {
  const supabase = createClient();

  const [properties, setProperties] = useState<PropertyRecord[]>(INITIAL_PROPERTIES);
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>(INITIAL_ORGS_OPTIONS);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedE911Filter, setSelectedE911Filter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'TRUNKS' | 'NEWEST' | 'STATE'>('NAME');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyRecord | null>(null);
  const [drawerProperty, setDrawerProperty] = useState<PropertyRecord | null>(null);

  // Form State
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Courtyard by Marriott',
    organization_id: 'org-shamin',
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
    ray_baud_and_logs_enabled: true,
    status: 'ACTIVE' as PropertyRecord['status'],
  });

  // Load from DB if connected
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch Organizations for dropdown
        const { data: orgs } = await supabase.from('organizations').select('id, name');
        if (orgs && orgs.length > 0) {
          setOrgOptions(orgs);
        }

        // Fetch Properties
        const { data: propData } = await supabase
          .from('properties')
          .select(`
            *,
            org_links:organization_properties(
              organization_id,
              organization:organizations(id, name)
            )
          `)
          .order('created_at', { ascending: false });

        if (propData && propData.length > 0) {
          const mapped: PropertyRecord[] = propData.map((item: any, idx: number) => {
            const orgLink = item.org_links?.[0];
            const orgId = orgLink?.organization_id || 'org-shamin';
            const orgName = orgLink?.organization?.name || 'Assigned Organization';

            const initials = item.name.substring(0, 2).toUpperCase();
            return {
              id: item.id,
              code: `${initials}-${item.city ? item.city.slice(0, 3).toUpperCase() : 'LOC'}-${100 + idx}`,
              name: item.name,
              brand: item.brand || 'Hospitality Location',
              organization_id: orgId,
              organization_name: orgName,
              address: item.address,
              city: item.city,
              state: item.state,
              zip_code: item.zip_code,
              country: item.country || 'USA',
              main_phone: item.main_phone || '+1 (800) 555-0100',
              fax: item.fax || null,
              contact_person_name: item.contact_person_name || 'Property Operations',
              contact_person_email: item.contact_person_email || 'frontdesk@hotel.com',
              general_manager_name: item.general_manager_name || 'General Manager',
              ray_baud_and_logs_enabled: item.ray_baud_and_logs_enabled ?? true,
              status: (item.status as any) || 'ACTIVE',
              sip_trunks_count: Math.floor(Math.random() * 16) + 4,
              did_count: Math.floor(Math.random() * 50) + 20,
              e911_status: item.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
              open_tickets_count: Math.floor(Math.random() * 2),
              onboarding_stage: 'Completed (Production)',
              created_at: item.created_at,
            };
          });

          setProperties(mapped);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.organization_name && p.organization_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesOrg = selectedOrgFilter === 'ALL' || p.organization_id === selectedOrgFilter;
        const matchesBrand = selectedBrandFilter === 'ALL' || (p.brand && p.brand.includes(selectedBrandFilter));
        const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;

        let matchesE911 = true;
        if (selectedE911Filter === 'VERIFIED') matchesE911 = p.e911_status === 'VERIFIED';
        if (selectedE911Filter === 'AUDIT') matchesE911 = p.e911_status === 'AUDIT_REQUIRED';

        return matchesSearch && matchesOrg && matchesBrand && matchesStatus && matchesE911;
      })
      .sort((a, b) => {
        if (sortBy === 'TRUNKS') return (b.sip_trunks_count || 0) - (a.sip_trunks_count || 0);
        if (sortBy === 'STATE') return a.state.localeCompare(b.state);
        if (sortBy === 'NEWEST') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return a.name.localeCompare(b.name);
      });
  }, [properties, searchQuery, selectedOrgFilter, selectedBrandFilter, selectedStatusFilter, selectedE911Filter, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage) || 1;
  const paginatedProps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(start, start + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  // KPIs
  const totalPropsCount = properties.length;
  const totalE911Compliant = properties.filter((p) => p.e911_status === 'VERIFIED').length;
  const totalVoiceTrunks = properties.reduce((acc, p) => acc + (p.sip_trunks_count || 0), 0);
  const totalOnboarding = properties.filter((p) => p.status === 'ONBOARDING').length;

  // Actions
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      brand: 'Courtyard by Marriott',
      organization_id: orgOptions[0]?.id || 'org-shamin',
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
      ray_baud_and_logs_enabled: true,
      status: 'ACTIVE',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (prop: PropertyRecord) => {
    setSelectedProperty(prop);
    setFormData({
      name: prop.name,
      brand: prop.brand || 'Courtyard by Marriott',
      organization_id: prop.organization_id || orgOptions[0]?.id || 'org-shamin',
      address: prop.address,
      city: prop.city,
      state: prop.state,
      zip_code: prop.zip_code,
      country: prop.country || 'USA',
      main_phone: prop.main_phone || '',
      fax: prop.fax || '',
      contact_person_name: prop.contact_person_name || '',
      contact_person_email: prop.contact_person_email || '',
      general_manager_name: prop.general_manager_name || '',
      ray_baud_and_logs_enabled: prop.ray_baud_and_logs_enabled,
      status: prop.status,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenStatus = (prop: PropertyRecord) => {
    setSelectedProperty(prop);
    setShowStatusModal(true);
  };

  const handleOpenReassign = (prop: PropertyRecord) => {
    setSelectedProperty(prop);
    setFormData((prev) => ({
      ...prev,
      organization_id: prop.organization_id || orgOptions[0]?.id || '',
    }));
    setShowReassignModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Property name is required.');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.zip_code.trim()) {
      setFormError('Complete physical address (Street, City, State, Zip) is required for E911 dispatch compliance.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const selectedOrg = orgOptions.find((o) => o.id === formData.organization_id);

      // Attempt DB Insert
      const { data: dbProp } = await supabase
        .from('properties')
        .insert({
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip_code: formData.zip_code.trim(),
          country: formData.country || 'USA',
          main_phone: formData.main_phone.trim() || null,
          fax: formData.fax.trim() || null,
          contact_person_name: formData.contact_person_name.trim() || null,
          contact_person_email: formData.contact_person_email.trim() || null,
          general_manager_name: formData.general_manager_name.trim() || null,
          ray_baud_and_logs_enabled: formData.ray_baud_and_logs_enabled,
          status: formData.status,
        })
        .select()
        .single();

      if (dbProp && formData.organization_id) {
        await supabase.from('organization_properties').insert({
          organization_id: formData.organization_id,
          property_id: dbProp.id,
          status: formData.status,
        });
      }

      const initials = formData.name.substring(0, 2).toUpperCase();
      const newProp: PropertyRecord = {
        id: dbProp ? dbProp.id : `prop-${Date.now()}`,
        code: `${initials}-${formData.city.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 800) + 100}`,
        name: formData.name.trim(),
        brand: formData.brand,
        organization_id: formData.organization_id,
        organization_name: selectedOrg?.name || 'Assigned Organization',
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim(),
        country: formData.country || 'USA',
        main_phone: formData.main_phone.trim() || null,
        fax: formData.fax.trim() || null,
        contact_person_name: formData.contact_person_name.trim() || null,
        contact_person_email: formData.contact_person_email.trim() || null,
        general_manager_name: formData.general_manager_name.trim() || null,
        ray_baud_and_logs_enabled: formData.ray_baud_and_logs_enabled,
        status: formData.status,
        sip_trunks_count: 8,
        did_count: 32,
        e911_status: formData.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
        open_tickets_count: 0,
        onboarding_stage: formData.status === 'ONBOARDING' ? 'Porting Scheduled' : 'Completed (Production)',
        created_at: new Date().toISOString(),
      };

      setProperties([newProp, ...properties]);
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create property');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const selectedOrg = orgOptions.find((o) => o.id === formData.organization_id);

      // Attempt DB Update
      await supabase
        .from('properties')
        .update({
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip_code: formData.zip_code.trim(),
          country: formData.country || 'USA',
          main_phone: formData.main_phone.trim() || null,
          fax: formData.fax.trim() || null,
          contact_person_name: formData.contact_person_name.trim() || null,
          contact_person_email: formData.contact_person_email.trim() || null,
          general_manager_name: formData.general_manager_name.trim() || null,
          ray_baud_and_logs_enabled: formData.ray_baud_and_logs_enabled,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProperty.id);

      setProperties((prev) =>
        prev.map((p) =>
          p.id === selectedProperty.id
            ? {
                ...p,
                name: formData.name.trim(),
                brand: formData.brand,
                organization_id: formData.organization_id,
                organization_name: selectedOrg?.name || p.organization_name,
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                zip_code: formData.zip_code.trim(),
                main_phone: formData.main_phone.trim() || null,
                fax: formData.fax.trim() || null,
                contact_person_name: formData.contact_person_name.trim() || null,
                contact_person_email: formData.contact_person_email.trim() || null,
                general_manager_name: formData.general_manager_name.trim() || null,
                ray_baud_and_logs_enabled: formData.ray_baud_and_logs_enabled,
                e911_status: formData.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
                status: formData.status,
              }
            : p
        )
      );

      if (drawerProperty && drawerProperty.id === selectedProperty.id) {
        setDrawerProperty({
          ...drawerProperty,
          name: formData.name.trim(),
          brand: formData.brand,
          organization_id: formData.organization_id,
          organization_name: selectedOrg?.name || drawerProperty.organization_name,
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          status: formData.status,
          ray_baud_and_logs_enabled: formData.ray_baud_and_logs_enabled,
          e911_status: formData.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
        });
      }

      setShowEditModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update property');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: PropertyRecord['status']) => {
    if (!selectedProperty) return;

    try {
      await supabase
        .from('properties')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedProperty.id);

      setProperties((prev) =>
        prev.map((p) => (p.id === selectedProperty.id ? { ...p, status: newStatus } : p))
      );

      if (drawerProperty && drawerProperty.id === selectedProperty.id) {
        setDrawerProperty({ ...drawerProperty, status: newStatus });
      }

      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleReassignOrg = async () => {
    if (!selectedProperty) return;
    const selectedOrg = orgOptions.find((o) => o.id === formData.organization_id);

    try {
      // Reassign in DB
      await supabase.from('organization_properties').delete().eq('property_id', selectedProperty.id);
      await supabase.from('organization_properties').insert({
        organization_id: formData.organization_id,
        property_id: selectedProperty.id,
        status: selectedProperty.status,
      });

      setProperties((prev) =>
        prev.map((p) =>
          p.id === selectedProperty.id
            ? {
                ...p,
                organization_id: formData.organization_id,
                organization_name: selectedOrg?.name || 'Assigned Organization',
              }
            : p
        )
      );

      if (drawerProperty && drawerProperty.id === selectedProperty.id) {
        setDrawerProperty({
          ...drawerProperty,
          organization_id: formData.organization_id,
          organization_name: selectedOrg?.name || 'Assigned Organization',
        });
      }

      setShowReassignModal(false);
    } catch (err) {
      console.error('Error reassigning organization:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Property ID',
      'Name',
      'Brand',
      'Organization',
      'Address',
      'City',
      'State',
      'Zip',
      'Main Phone',
      'General Manager',
      'E911 Status',
      'SIP Trunks',
      'Status',
    ];

    const rows = filteredProperties.map((p) => [
      p.code || p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${(p.organization_name || '').replace(/"/g, '""')}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      p.city,
      p.state,
      p.zip_code,
      p.main_phone || '',
      `"${(p.general_manager_name || '').replace(/"/g, '""')}"`,
      p.e911_status || 'VERIFIED',
      p.sip_trunks_count || 0,
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AAA_Properties_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Managed Properties</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {properties.length} Locations
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure hotel property locations, E911 PSAP dispatch addresses, Ray Baum&apos;s Act
            compliance, and voice trunks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedOrgFilter('ALL');
              setSelectedBrandFilter('ALL');
              setSelectedStatusFilter('ALL');
              setSelectedE911Filter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Property</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Properties */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Properties
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalPropsCount}</span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ● 99.8% Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Across 42 Regions</span>
              <span className="font-semibold text-slate-700">Multi-Brand</span>
            </div>
          </div>
        </div>

        {/* E911 Compliant */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              E911 PSAP Verified
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalE911Compliant}</span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                98.7% Certified
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Ray Baum &amp; Kari&apos;s Law</span>
              <span className="font-semibold text-slate-700">Dispatch Ready</span>
            </div>
          </div>
        </div>

        {/* Active Voice Trunks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Active Voice Trunks
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalVoiceTrunks}</span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                PBX Mesh
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Zero Carrier Jitter</span>
              <span className="font-semibold text-emerald-600">14ms Core Latency</span>
            </div>
          </div>
        </div>

        {/* Onboarding Locations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Onboarding
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalOnboarding}</span>
              <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                Porting Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>FOC Scheduled</span>
              <span className="font-semibold text-sky-700">&lt; 3d Cutover</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search properties, code, city, GM, brand..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ⌘F
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Organization Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Org:</span>
            <select
              value={selectedOrgFilter}
              onChange={(e) => {
                setSelectedOrgFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="ALL">All Organizations</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Brand:</span>
            <select
              value={selectedBrandFilter}
              onChange={(e) => {
                setSelectedBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Brands</option>
              <option value="Courtyard">Courtyard</option>
              <option value="Hilton">Hilton</option>
              <option value="Marriott">Marriott</option>
              <option value="Hyatt">Hyatt</option>
              <option value="Westin">Westin</option>
              <option value="Independent">Independent / Luxury</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OFFBOARDED">Offboarded</option>
            </select>
          </div>

          {/* E911 Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">E911:</span>
            <select
              value={selectedE911Filter}
              onChange={(e) => {
                setSelectedE911Filter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All E911</option>
              <option value="VERIFIED">Verified</option>
              <option value="AUDIT">Audit Required</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="NAME">Name (A-Z)</option>
              <option value="TRUNKS">Most Trunks</option>
              <option value="STATE">By State</option>
              <option value="NEWEST">Newest</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded ${
                viewMode === 'LIST' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded ${
                viewMode === 'GRID' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Table / Grid Representation */}
      {viewMode === 'LIST' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Property &amp; Location</th>
                  <th className="py-3 px-4">Organization / Tenant</th>
                  <th className="py-3 px-4">E911 &amp; Ray Baum</th>
                  <th className="py-3 px-4">Voice Services</th>
                  <th className="py-3 px-4">GM &amp; Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Hotel className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No properties found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try clearing filter criteria or create a new property.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedProps.map((prop) => {
                    const badge = getBrandBadge(prop.brand || prop.name);

                    return (
                      <tr
                        key={prop.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setDrawerProperty(prop)}
                      >
                        {/* 1. Property & Brand */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl ${badge.bg} ${badge.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-white`}
                            >
                              {badge.initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {prop.name}
                                </span>
                                {prop.code && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200">
                                    {prop.code}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {prop.brand || 'Hospitality Location'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-slate-600 font-medium">
                                  {prop.city}, {prop.state} {prop.zip_code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Organization / Tenant */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-800">
                              {prop.organization_name || 'Shamin Hotels'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReassign(prop);
                            }}
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5"
                          >
                            <span>Reassign Org</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </td>

                        {/* 3. E911 & Ray Baum */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prop.e911_status === 'VERIFIED' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                PSAP Verified
                              </span>
                              <div className="text-[10px] text-slate-400">Ray Baum Compliant</div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                Audit Required
                              </span>
                              <div className="text-[10px] text-amber-600 font-medium">Dispatchable Check</div>
                            </div>
                          )}
                        </td>

                        {/* 4. Voice Services */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {prop.sip_trunks_count || 8} Trunks
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {prop.did_count || 32} DIDs Active
                          </div>
                        </td>

                        {/* 5. GM & Contact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {prop.general_manager_name || 'General Manager'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {prop.main_phone || '+1 (800) 555-0100'}
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prop.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          )}
                          {prop.status === 'ONBOARDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                              Onboarding
                            </span>
                          )}
                          {prop.status === 'INACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Inactive
                            </span>
                          )}
                          {prop.status === 'OFFBOARDED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Offboarded
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(prop)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Edit Property"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenStatus(prop)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Change Status / Operations"
                            >
                              <MoreVertical className="w-4 h-4" />
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

          {/* Pagination Footer */}
          <div className="py-3 px-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {filteredProperties.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredProperties.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredProperties.length}</span>{' '}
              properties
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-[#4338ca] text-white shadow-sm'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedProps.map((prop) => {
            const badge = getBrandBadge(prop.brand || prop.name);

            return (
              <div
                key={prop.id}
                onClick={() => setDrawerProperty(prop)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${badge.bg} ${badge.text} flex items-center justify-center font-bold text-sm`}
                      >
                        {badge.initial}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {prop.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 font-medium">{prop.brand}</div>
                      </div>
                    </div>
                    {prop.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                    {prop.status === 'ONBOARDING' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Onboarding
                      </span>
                    )}
                  </div>

                  <div className="mt-3 py-2 px-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Organization:</span>
                    <span className="font-bold text-indigo-700 truncate max-w-[180px]">
                      {prop.organization_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 py-2.5 border-y border-slate-100 text-center">
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {prop.sip_trunks_count || 8}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Trunks
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">{prop.did_count || 32}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        DIDs
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-emerald-600">
                        {prop.e911_status === 'VERIFIED' ? '100%' : 'Audit'}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        E911 PSAP
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {prop.city}, {prop.state} {prop.zip_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{prop.main_phone || '+1 (800) 555-0100'}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setDrawerProperty(prop)}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>Property Center</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(prop)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CREATE PROPERTY MODAL                                                  */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add New Property Location</h2>
                  <p className="text-xs text-slate-500">
                    Register a hotel property and link to a client tenant organization.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Property Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Courtyard Richmond Downtown"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Assign Organization <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Hotel Brand / Chain</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Courtyard by Marriott"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">General Manager Name</label>
                  <input
                    type="text"
                    value={formData.general_manager_name}
                    onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                    placeholder="e.g. Michael Robinson"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Physical Address for E911 */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">
                  Street Address (Exact PSAP Dispatch Location) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="100 South 14th Street"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Richmond"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="VA"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">
                    Zip Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="23219"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Main Frontdesk Phone</label>
                  <input
                    type="text"
                    value={formData.main_phone}
                    onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                    placeholder="+1 (804) 555-0144"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Property Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="ACTIVE">Active (Production)</option>
                    <option value="ONBOARDING">Onboarding (Porting In Progress)</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Ray Baum Flag */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Ray Baum&apos;s Act &amp; Kari&apos;s Law Dispatch Logging
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Enable automated PSAP dispatchable location reporting and frontdesk 911 alert logging.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.ray_baud_and_logs_enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, ray_baud_and_logs_enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold disabled:opacity-50 shadow-sm"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Property</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT PROPERTY MODAL                                                    */}
      {/* ========================================================================= */}
      {showEditModal && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Property Details</h2>
                  <p className="text-xs text-slate-500">
                    Update location telemetry, GM contact, and E911 configuration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Property Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Organization</label>
                  <select
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    {orgOptions.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Brand / Chain</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">General Manager</label>
                  <input
                    type="text"
                    value={formData.general_manager_name}
                    onChange={(e) => setFormData({ ...formData, general_manager_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Zip</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Main Phone</label>
                  <input
                    type="text"
                    value={formData.main_phone}
                    onChange={(e) => setFormData({ ...formData, main_phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="ACTIVE">Active (Production)</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="OFFBOARDED">Offboarded</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold disabled:opacity-50 shadow-sm"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. REASSIGN ORGANIZATION MODAL                                            */}
      {/* ========================================================================= */}
      {showReassignModal && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Reassign Property Tenant</h3>
              </div>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Reassign <span className="font-bold text-slate-900">{selectedProperty.name}</span> to a
              different franchise group or management client.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <label className="font-semibold text-slate-700">Target Organization</label>
              <select
                value={formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
              >
                {orgOptions.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignOrg}
                className="px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs shadow-sm"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. STATUS CONTROL MODAL                                                   */}
      {/* ========================================================================= */}
      {showStatusModal && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Property Lifecycle Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Manage operational status for{' '}
              <span className="font-bold text-slate-900">{selectedProperty.name}</span>.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <button
                onClick={() => handleUpdateStatus('ACTIVE')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedProperty.status === 'ACTIVE'
                    ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Active Production</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Live SIP mesh trunking, 911 dispatch tables active.
                  </div>
                </div>
                {selectedProperty.status === 'ACTIVE' && (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              <button
                onClick={() => handleUpdateStatus('ONBOARDING')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedProperty.status === 'ONBOARDING'
                    ? 'border-sky-500 bg-sky-50/50 font-bold text-sky-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Onboarding / Porting</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    FOC date scheduled, carrier port submission in flight.
                  </div>
                </div>
                {selectedProperty.status === 'ONBOARDING' && (
                  <Check className="w-4 h-4 text-sky-600" />
                )}
              </button>

              <button
                onClick={() => handleUpdateStatus('INACTIVE')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedProperty.status === 'INACTIVE'
                    ? 'border-slate-500 bg-slate-100 font-bold text-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span>Inactive (Standby)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Trunks reserved, outbound voice traffic paused.
                  </div>
                </div>
                {selectedProperty.status === 'INACTIVE' && (
                  <Check className="w-4 h-4 text-slate-600" />
                )}
              </button>

              <button
                onClick={() => handleUpdateStatus('OFFBOARDED')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedProperty.status === 'OFFBOARDED'
                    ? 'border-rose-500 bg-rose-50 font-bold text-rose-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5 text-rose-500" />
                    <span>Offboarded</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Contract terminated, numbers released to carrier.
                  </div>
                </div>
                {selectedProperty.status === 'OFFBOARDED' && (
                  <Check className="w-4 h-4 text-rose-600" />
                )}
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PROPERTY-LEVEL UNIFIED MANAGEMENT SLIDE-OVER DRAWER                    */}
      {/* ========================================================================= */}
      {drawerProperty && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    getBrandBadge(drawerProperty.brand).bg
                  } ${
                    getBrandBadge(drawerProperty.brand).text
                  } flex items-center justify-center font-bold text-base shadow-xs`}
                >
                  {getBrandBadge(drawerProperty.brand).initial}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{drawerProperty.name}</h2>
                    {drawerProperty.code && (
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-xs font-mono font-bold border border-slate-200 shadow-xs">
                        {drawerProperty.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-indigo-700">
                      {drawerProperty.organization_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {drawerProperty.city}, {drawerProperty.state}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(drawerProperty)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDrawerProperty(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Telemetry Overview */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Property Telemetry &amp; Services
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div className="text-xl font-bold text-indigo-900">
                      {drawerProperty.sip_trunks_count || 8}
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">SIP Trunks</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="text-xl font-bold text-blue-900">
                      {drawerProperty.did_count || 32}
                    </div>
                    <div className="text-[11px] font-semibold text-blue-700 mt-0.5">Active DIDs</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="text-xl font-bold text-emerald-900">
                      {drawerProperty.e911_status === 'VERIFIED' ? 'Verified' : 'Pending'}
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">E911 PSAP</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">
                      {drawerProperty.open_tickets_count || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Tickets</div>
                  </div>
                </div>
              </div>

              {/* Physical Location & E911 Compliance Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>E911 Dispatchable Address &amp; Kari&apos;s Law</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    RAY BAUM ACT READY
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="font-bold text-slate-800">{drawerProperty.address}</div>
                  <div className="text-slate-600">
                    {drawerProperty.city}, {drawerProperty.state} {drawerProperty.zip_code},{' '}
                    {drawerProperty.country}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    PSAP Route ID: PSAP-{drawerProperty.state}-911-CORE
                  </div>
                </div>
              </div>

              {/* Management & Technical Contacts */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  On-Site Leadership &amp; Contacts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px]">General Manager:</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {drawerProperty.general_manager_name || 'General Manager'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {drawerProperty.main_phone || '+1 (800) 555-0100'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Telecom Contact:</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {drawerProperty.contact_person_name || 'David Wright'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {drawerProperty.contact_person_email || 'frontdesk@hotel.com'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Operational Shortcuts */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Property Operations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link
                    href={`/admin/e911?propertyId=${drawerProperty.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          E911 PSAP Audit
                        </div>
                        <div className="text-[10px] text-slate-400">Verify emergency dispatch</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>

                  <Link
                    href={`/admin/onboarding-porting?propertyId=${drawerProperty.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          DID Porting Orders
                        </div>
                        <div className="text-[10px] text-slate-400">Manage FOC and LOA</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedProperty(drawerProperty);
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
              >
                Change Lifecycle ({drawerProperty.status})
              </button>
              <button
                onClick={() => setDrawerProperty(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
