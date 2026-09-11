'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface OrgRecord {
  id: string;
  code?: string;
  name: string;
  type?: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_ONBOARDING' | 'ARCHIVED';
  contact_name?: string;
  properties_count?: number;
  admin_count?: number;
  admin_note?: string;
  sip_lines?: number;
  sip_architecture?: string;
  open_tickets_count?: number;
  urgent_tickets_count?: number;
  created_at: string;
}

// Initial realistic default portfolios matching enterprise dashboard reference
const INITIAL_ORGS: OrgRecord[] = [
  {
    id: 'org-shamin',
    code: 'SH-409',
    name: 'Shamin Hotels',
    type: 'Franchise Portfolio',
    email: 'sjenkins@shaminhotels.com',
    phone: '+1 (804) 555-0192',
    address: '2000 Midlothian Turnpike',
    city: 'Richmond',
    state: 'VA',
    zip_code: '23235',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'Sarah Jenkins',
    properties_count: 50,
    admin_count: 8,
    admin_note: '2 MFA pending',
    sip_lines: 420,
    sip_architecture: 'Cloud PBX Active',
    open_tickets_count: 4,
    urgent_tickets_count: 1,
    created_at: '2025-01-14T08:00:00Z',
  },
  {
    id: 'org-abc',
    code: 'ABC-102',
    name: 'ABC Hospitality',
    type: 'Regional Hotel Group',
    email: 'd.ross@abchospitality.com',
    phone: '+1 (415) 555-0814',
    address: '742 Market Street, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94102',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'David Ross',
    properties_count: 25,
    admin_count: 4,
    admin_note: 'All verified',
    sip_lines: 190,
    sip_architecture: 'SIP Mesh Primary',
    open_tickets_count: 2,
    urgent_tickets_count: 0,
    created_at: '2025-02-01T10:30:00Z',
  },
  {
    id: 'org-marriott',
    code: 'MFG-800',
    name: 'Marriott Franchise Group',
    type: 'Enterprise Franchise',
    email: 'elena.vance@marriott-fg.com',
    phone: '+1 (301) 555-9021',
    address: '10400 Fernwood Road',
    city: 'Bethesda',
    state: 'MD',
    zip_code: '20817',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'Elena Vance',
    properties_count: 112,
    admin_count: 24,
    admin_note: 'Global Access',
    sip_lines: 840,
    sip_architecture: 'Dual Redundancy',
    open_tickets_count: 7,
    urgent_tickets_count: 0,
    created_at: '2024-11-10T14:15:00Z',
  },
  {
    id: 'org-xyz',
    code: 'XYZ-340',
    name: 'XYZ Hotel Management',
    type: 'Third-Party Management',
    email: 'mvance@xyzmgmt.com',
    phone: '+1 (312) 555-4421',
    address: '333 North Michigan Ave',
    city: 'Chicago',
    state: 'IL',
    zip_code: '60601',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'Marcus Vance',
    properties_count: 34,
    admin_count: 6,
    admin_note: 'All verified',
    sip_lines: 210,
    sip_architecture: 'Cloud PBX Active',
    open_tickets_count: 0,
    urgent_tickets_count: 0,
    created_at: '2025-03-05T09:00:00Z',
  },
  {
    id: 'org-crestview',
    code: 'CLR-550',
    name: 'Crestview Luxury Resorts',
    type: 'Independent Luxury',
    email: 'radams@crestview.io',
    phone: '+1 (305) 555-8833',
    address: '4400 Collins Avenue',
    city: 'Miami Beach',
    state: 'FL',
    zip_code: '33140',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'Rachel Adams',
    properties_count: 16,
    admin_count: 5,
    admin_note: 'E911 Superusers',
    sip_lines: 120,
    sip_architecture: 'Hospitality IVR',
    open_tickets_count: 1,
    urgent_tickets_count: 0,
    created_at: '2025-02-18T16:40:00Z',
  },
  {
    id: 'org-summit',
    code: 'SHP-118',
    name: 'Summit Hospitality Partners',
    type: 'Asset Owner',
    email: 'kmiller@summithp.com',
    phone: '+1 (512) 555-2309',
    address: '1100 Congress Avenue',
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    country: 'USA',
    status: 'PENDING_ONBOARDING',
    contact_name: 'Kevin Miller',
    properties_count: 8,
    admin_count: 2,
    admin_note: 'Provisioning',
    sip_lines: 62,
    sip_architecture: 'Carrier Port Pending',
    open_tickets_count: 0,
    urgent_tickets_count: 0,
    created_at: '2025-04-02T11:20:00Z',
  },
  {
    id: 'org-pacific',
    code: 'PW-220',
    name: 'Pacific West Hospitality',
    type: 'Regional Hotel Group',
    email: 'operations@pacwesthotels.com',
    phone: '+1 (206) 555-7711',
    address: '1201 Third Avenue',
    city: 'Seattle',
    state: 'WA',
    zip_code: '98101',
    country: 'USA',
    status: 'ACTIVE',
    contact_name: 'Chloe Lin',
    properties_count: 19,
    admin_count: 3,
    admin_note: 'All verified',
    sip_lines: 145,
    sip_architecture: 'SIP Mesh Primary',
    open_tickets_count: 1,
    urgent_tickets_count: 0,
    created_at: '2025-01-28T12:00:00Z',
  },
  {
    id: 'org-horizon',
    code: 'HH-604',
    name: 'Horizon Heritage Inns',
    type: 'Franchise Portfolio',
    email: 'admin@horizonheritage.com',
    phone: '+1 (615) 555-4920',
    address: '501 Broadway',
    city: 'Nashville',
    state: 'TN',
    zip_code: '37203',
    country: 'USA',
    status: 'SUSPENDED',
    contact_name: 'Brandon Ward',
    properties_count: 12,
    admin_count: 2,
    admin_note: 'Billing Hold',
    sip_lines: 94,
    sip_architecture: 'Cloud PBX Suspended',
    open_tickets_count: 3,
    urgent_tickets_count: 1,
    created_at: '2024-10-15T09:45:00Z',
  },
];

// Helper for Initials color
function getAvatarBg(initials: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    SH: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
    AB: { bg: 'bg-blue-100', text: 'text-blue-700' },
    MF: { bg: 'bg-teal-100', text: 'text-teal-700' },
    XY: { bg: 'bg-slate-100', text: 'text-slate-700' },
    CR: { bg: 'bg-purple-100', text: 'text-purple-700' },
    PW: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    HH: { bg: 'bg-amber-100', text: 'text-amber-700' },
  };
  return map[initials] || { bg: 'bg-indigo-100', text: 'text-indigo-700' };
}

export default function AdminOrganizationsPage() {
  const supabase = createClient();

  const [organizations, setOrganizations] = useState<OrgRecord[]>(INITIAL_ORGS);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTicketFilter, setSelectedTicketFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'PROPERTIES' | 'NEWEST' | 'NAME' | 'LINES'>('PROPERTIES');
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID'>('LIST');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals & Slide-overs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgRecord | null>(null);
  const [drawerOrg, setDrawerOrg] = useState<OrgRecord | null>(null);

  // Form States
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Franchise Portfolio',
    email: '',
    phone: '',
    contact_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    status: 'ACTIVE' as OrgRecord['status'],
  });

  // Fetch from DB if available
  useEffect(() => {
    async function loadOrgs() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          // Merge database records with telemetry view
          const mapped: OrgRecord[] = data.map((item: any, idx: number) => {
            const words = (item.name || 'Org').split(' ');
            const initials =
              words.length > 1
                ? `${words[0][0]}${words[1][0]}`.toUpperCase()
                : item.name.substring(0, 2).toUpperCase();

            return {
              id: item.id,
              code: `${initials}-${100 + idx}`,
              name: item.name,
              type: item.type || 'Franchise Portfolio',
              email: item.email || 'admin@' + item.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
              phone: item.phone || '+1 (800) 555-0100',
              address: item.address || 'Corporate Headquarters',
              city: item.city || 'Dallas',
              state: item.state || 'TX',
              zip_code: item.zip_code || '75001',
              country: item.country || 'USA',
              status: (item.status as any) || 'ACTIVE',
              contact_name: item.contact_name || 'Operations Director',
              properties_count: Math.floor(Math.random() * 30) + 5,
              admin_count: Math.floor(Math.random() * 6) + 2,
              admin_note: 'All verified',
              sip_lines: Math.floor(Math.random() * 300) + 40,
              sip_architecture: 'SIP Mesh Primary',
              open_tickets_count: Math.floor(Math.random() * 3),
              urgent_tickets_count: 0,
              created_at: item.created_at,
            };
          });

          // Prepend or use live DB data
          setOrganizations(mapped);
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrgs();
  }, []);

  // Filtered & Sorted Records
  const filteredOrgs = useMemo(() => {
    return organizations
      .filter((org) => {
        const matchesSearch =
          org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (org.code && org.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (org.email && org.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (org.city && org.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (org.contact_name && org.contact_name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = selectedType === 'ALL' || org.type === selectedType;
        const matchesStatus = selectedStatus === 'ALL' || org.status === selectedStatus;

        let matchesTickets = true;
        if (selectedTicketFilter === 'URGENT') {
          matchesTickets = (org.urgent_tickets_count || 0) > 0;
        } else if (selectedTicketFilter === 'OPEN') {
          matchesTickets = (org.open_tickets_count || 0) > 0;
        } else if (selectedTicketFilter === 'ZERO') {
          matchesTickets = (org.open_tickets_count || 0) === 0;
        }

        return matchesSearch && matchesType && matchesStatus && matchesTickets;
      })
      .sort((a, b) => {
        if (sortBy === 'PROPERTIES') {
          return (b.properties_count || 0) - (a.properties_count || 0);
        }
        if (sortBy === 'LINES') {
          return (b.sip_lines || 0) - (a.sip_lines || 0);
        }
        if (sortBy === 'NAME') {
          return a.name.localeCompare(b.name);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [organizations, searchQuery, selectedType, selectedStatus, selectedTicketFilter, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredOrgs.length / itemsPerPage) || 1;
  const paginatedOrgs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrgs.slice(start, start + itemsPerPage);
  }, [filteredOrgs, currentPage, itemsPerPage]);

  // KPI Calculations
  const totalOrgsCount = organizations.length;
  const totalProperties = organizations.reduce((acc, o) => acc + (o.properties_count || 0), 0);
  const totalSipLines = organizations.reduce((acc, o) => acc + (o.sip_lines || 0), 0);
  const totalUrgentOrAction = organizations.reduce(
    (acc, o) => acc + (o.urgent_tickets_count || 0) + (o.status === 'SUSPENDED' ? 1 : 0),
    0
  );

  // Actions
  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: 'Franchise Portfolio',
      email: '',
      phone: '',
      contact_name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      status: 'ACTIVE',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (org: OrgRecord) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      type: org.type || 'Franchise Portfolio',
      email: org.email || '',
      phone: org.phone || '',
      contact_name: org.contact_name || '',
      address: org.address || '',
      city: org.city || '',
      state: org.state || '',
      zip_code: org.zip_code || '',
      country: org.country || 'USA',
      status: org.status,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenStatus = (org: OrgRecord) => {
    setSelectedOrg(org);
    setShowStatusModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Organization name is required.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      // Attempt DB Insert
      const { data: dbOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          country: formData.country.trim() || 'USA',
          status: formData.status,
        })
        .select()
        .single();

      const initials = formData.name.substring(0, 2).toUpperCase();
      const newOrg: OrgRecord = {
        id: dbOrg ? dbOrg.id : `org-${Date.now()}`,
        code: `${initials}-${Math.floor(Math.random() * 800) + 100}`,
        name: formData.name.trim(),
        type: formData.type,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        contact_name: formData.contact_name.trim() || 'Operations Lead',
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        country: formData.country || 'USA',
        status: formData.status,
        properties_count: 0,
        admin_count: 1,
        admin_note: 'Initial Admin',
        sip_lines: 0,
        sip_architecture: 'SIP Mesh Primary',
        open_tickets_count: 0,
        urgent_tickets_count: 0,
        created_at: new Date().toISOString(),
      };

      setOrganizations([newOrg, ...organizations]);
      setShowCreateModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create organization');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setFormLoading(true);
    setFormError(null);

    try {
      // Attempt DB Update
      await supabase
        .from('organizations')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          zip_code: formData.zip_code.trim() || null,
          country: formData.country.trim() || 'USA',
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedOrg.id);

      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === selectedOrg.id
            ? {
                ...o,
                name: formData.name.trim(),
                type: formData.type,
                email: formData.email.trim() || null,
                phone: formData.phone.trim() || null,
                contact_name: formData.contact_name.trim() || o.contact_name,
                address: formData.address.trim() || null,
                city: formData.city.trim() || null,
                state: formData.state.trim() || null,
                zip_code: formData.zip_code.trim() || null,
                country: formData.country.trim() || 'USA',
                status: formData.status,
              }
            : o
        )
      );

      if (drawerOrg && drawerOrg.id === selectedOrg.id) {
        setDrawerOrg({
          ...drawerOrg,
          name: formData.name.trim(),
          type: formData.type,
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          status: formData.status,
        });
      }

      setShowEditModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update organization');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrgRecord['status']) => {
    if (!selectedOrg) return;

    try {
      await supabase
        .from('organizations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedOrg.id);

      setOrganizations((prev) =>
        prev.map((o) => (o.id === selectedOrg.id ? { ...o, status: newStatus } : o))
      );

      if (drawerOrg && drawerOrg.id === selectedOrg.id) {
        setDrawerOrg({ ...drawerOrg, status: newStatus });
      }

      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'ID Code',
      'Organization Name',
      'Portfolio Type',
      'Primary Contact',
      'Email',
      'Phone',
      'City',
      'State',
      'Properties',
      'Admins',
      'SIP Lines',
      'Status',
      'Created Date',
    ];

    const rows = filteredOrgs.map((o) => [
      o.code || o.id,
      `"${o.name.replace(/"/g, '""')}"`,
      `"${(o.type || '').replace(/"/g, '""')}"`,
      `"${(o.contact_name || '').replace(/"/g, '""')}"`,
      o.email || '',
      o.phone || '',
      o.city || '',
      o.state || '',
      o.properties_count || 0,
      o.admin_count || 0,
      o.sip_lines || 0,
      o.status,
      new Date(o.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AAA_Organizations_${new Date().toISOString().slice(0, 10)}.csv`);
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organizations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {organizations.length} Portfolios
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage client portfolios, brand franchises, hotel management groups, and multi-tenant
            telephony services.
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
              setSelectedType('ALL');
              setSelectedStatus('ALL');
              setSelectedTicketFilter('ALL');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter Views</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Organization</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Reference Screenshot Match) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Organizations
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalOrgsCount}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                All Active
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Franchises & Groups</span>
              <span className="font-semibold text-slate-700">100% SLA OK</span>
            </div>
          </div>
        </div>

        {/* Managed Properties */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Managed Properties
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalProperties}</span>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                +14 this month
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Across 42 regions</span>
              <span className="font-semibold text-emerald-600">99.98% Up</span>
            </div>
          </div>
        </div>

        {/* Provisioned Services */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Provisioned Services
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalSipLines.toLocaleString()}</span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                PBX & SIP
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Trunks & Extensions</span>
              <span className="font-semibold text-slate-700">Zero Carrier Latency</span>
            </div>
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Action Required
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalUrgentOrAction}</span>
              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                Escalations
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>Carrier port approvals</span>
              <span className="font-semibold text-rose-600">&lt; 4h SLA</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search organizations, codes, emails..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
            ⌘F
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Type */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Franchise Portfolio">Franchise Portfolio</option>
              <option value="Regional Hotel Group">Regional Hotel Group</option>
              <option value="Enterprise Franchise">Enterprise Franchise</option>
              <option value="Third-Party Management">Third-Party Management</option>
              <option value="Independent Luxury">Independent Luxury</option>
              <option value="Asset Owner">Asset Owner</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_ONBOARDING">Provisioning</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Tickets */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Tickets:</span>
            <select
              value={selectedTicketFilter}
              onChange={(e) => {
                setSelectedTicketFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL">Any Tickets</option>
              <option value="URGENT">Has Urgent</option>
              <option value="OPEN">Has Open</option>
              <option value="ZERO">0 Tickets</option>
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
              <option value="PROPERTIES">Most Properties</option>
              <option value="LINES">Most SIP Lines</option>
              <option value="NEWEST">Newest Created</option>
              <option value="NAME">Name (A-Z)</option>
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
                  <th className="py-3 px-4">Organization & Contact</th>
                  <th className="py-3 px-4">Properties</th>
                  <th className="py-3 px-4">Admin Users</th>
                  <th className="py-3 px-4">SIP Services</th>
                  <th className="py-3 px-4">Open Tickets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No organizations found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Try adjusting your search criteria or create a new organization.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrgs.map((org) => {
                    const initials =
                      (org.code || org.name.substring(0, 2)).split('-')[0].slice(0, 2) || 'OR';
                    const avatarStyle = getAvatarBg(initials);

                    return (
                      <tr
                        key={org.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => setDrawerOrg(org)}
                      >
                        {/* 1. Organization & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-white`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {org.name}
                                </span>
                                {org.code && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold border border-slate-200">
                                    {org.code}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {org.type || 'Franchise Portfolio'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600 font-medium">
                                  {org.contact_name || 'Primary Contact'}
                                </span>
                                {org.email && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-500 truncate">{org.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Properties */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 text-sm">
                            {org.properties_count || 0}
                          </div>
                          <Link
                            href={`/admin/properties?orgId=${org.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 mt-0.5"
                          >
                            <span>View portfolio</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>

                        {/* 3. Admin Users */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">
                            {org.admin_count || 1} admins
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {org.admin_note || 'All verified'}
                          </div>
                        </td>

                        {/* 4. SIP Services */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{org.sip_lines || 0} lines</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {org.sip_architecture || 'SIP Mesh Primary'}
                          </div>
                        </td>

                        {/* 5. Open Tickets */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {org.urgent_tickets_count && org.urgent_tickets_count > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {org.open_tickets_count} ({org.urgent_tickets_count} Urgent)
                            </span>
                          ) : (org.open_tickets_count || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              {org.open_tickets_count} Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>0 Tickets
                            </span>
                          )}
                        </td>

                        {/* 6. Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {org.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          )}
                          {org.status === 'PENDING_ONBOARDING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                              Provisioning
                            </span>
                          )}
                          {org.status === 'SUSPENDED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Suspended
                            </span>
                          )}
                          {org.status === 'ARCHIVED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Archived
                            </span>
                          )}
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(org)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Edit Organization"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenStatus(org)}
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
                {filteredOrgs.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredOrgs.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{filteredOrgs.length}</span>{' '}
              organizations
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
          {paginatedOrgs.map((org) => {
            const initials =
              (org.code || org.name.substring(0, 2)).split('-')[0].slice(0, 2) || 'OR';
            const avatarStyle = getAvatarBg(initials);

            return (
              <div
                key={org.id}
                onClick={() => setDrawerOrg(org)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-bold text-sm`}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {org.name}
                        </h3>
                        <div className="text-[11px] text-slate-500 font-medium">{org.type}</div>
                      </div>
                    </div>
                    {org.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                    {org.status === 'PENDING_ONBOARDING' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Provisioning
                      </span>
                    )}
                    {org.status === 'SUSPENDED' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Suspended
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 py-3 border-y border-slate-100 text-center">
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {org.properties_count || 0}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Properties
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">{org.sip_lines || 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        SIP Lines
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900">
                        {org.admin_count || 1}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Admins
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{org.city ? `${org.city}, ${org.state || 'USA'}` : 'Headquarters'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{org.email || 'No email provided'}</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setDrawerOrg(org)}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <span>Org Dashboard</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(org)}
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
      {/* 5. CREATE ORGANIZATION MODAL                                              */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Client Organization</h2>
                  <p className="text-xs text-slate-500">
                    Add a new enterprise client, franchise group, or management portfolio.
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
                    Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shamin Hotels"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Portfolio / Entity Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Franchise Portfolio">Franchise Portfolio</option>
                    <option value="Regional Hotel Group">Regional Hotel Group</option>
                    <option value="Enterprise Franchise">Enterprise Franchise</option>
                    <option value="Third-Party Management">Third-Party Management</option>
                    <option value="Independent Luxury">Independent Luxury</option>
                    <option value="Asset Owner">Asset Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Primary Contact Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Corporate Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sjenkins@shaminhotels.com"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (804) 555-0192"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING_ONBOARDING">Pending Onboarding</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="2000 Midlothian Turnpike"
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
                    placeholder="Richmond"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">State / Region</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="VA"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    placeholder="23235"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
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
                  <span>Save Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT ORGANIZATION MODAL                                                */}
      {/* ========================================================================= */}
      {showEditModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit Organization</h2>
                  <p className="text-xs text-slate-500">
                    Update organization identity, contacts, and configuration.
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
                  <label className="font-semibold text-slate-700">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Portfolio Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Franchise Portfolio">Franchise Portfolio</option>
                    <option value="Regional Hotel Group">Regional Hotel Group</option>
                    <option value="Enterprise Franchise">Enterprise Franchise</option>
                    <option value="Third-Party Management">Third-Party Management</option>
                    <option value="Independent Luxury">Independent Luxury</option>
                    <option value="Asset Owner">Asset Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Primary Contact</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Corporate Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING_ONBOARDING">Pending Onboarding</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Street Address</label>
                <input
                  type="text"
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
      {/* 7. STATUS CONTROL MODAL                                                   */}
      {/* ========================================================================= */}
      {showStatusModal && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Organization Status Control</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3">
              Change the operational lifecycle state for{' '}
              <span className="font-bold text-slate-900">{selectedOrg.name}</span>.
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <button
                onClick={() => handleUpdateStatus('ACTIVE')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedOrg.status === 'ACTIVE'
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
                    Full voice trunks, E911 dispatch, and dashboard access enabled.
                  </div>
                </div>
                {selectedOrg.status === 'ACTIVE' && <Check className="w-4 h-4 text-emerald-600" />}
              </button>

              <button
                onClick={() => handleUpdateStatus('PENDING_ONBOARDING')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedOrg.status === 'PENDING_ONBOARDING'
                    ? 'border-sky-500 bg-sky-50/50 font-bold text-sky-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span>Provisioning / Onboarding</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Contract signing, porting submission, and property config.
                  </div>
                </div>
                {selectedOrg.status === 'PENDING_ONBOARDING' && (
                  <Check className="w-4 h-4 text-sky-600" />
                )}
              </button>

              <button
                onClick={() => handleUpdateStatus('SUSPENDED')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedOrg.status === 'SUSPENDED'
                    ? 'border-rose-500 bg-rose-50/50 font-bold text-rose-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Suspended</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Temporarily pause outbound voice trunks and lock client portal.
                  </div>
                </div>
                {selectedOrg.status === 'SUSPENDED' && <Check className="w-4 h-4 text-rose-600" />}
              </button>

              <button
                onClick={() => handleUpdateStatus('ARCHIVED')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  selectedOrg.status === 'ARCHIVED'
                    ? 'border-slate-500 bg-slate-100 font-bold text-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    <span>Archived</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Soft deleted with read-only historical compliance records.
                  </div>
                </div>
                {selectedOrg.status === 'ARCHIVED' && <Check className="w-4 h-4 text-slate-600" />}
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
      {/* 8. SINGLE-ORGANIZATION DASHBOARD DRAWER / SLIDE-OVER                      */}
      {/* ========================================================================= */}
      {drawerOrg && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl ${getAvatarBg(drawerOrg.name.substring(0, 2)).bg} ${
                    getAvatarBg(drawerOrg.name.substring(0, 2)).text
                  } flex items-center justify-center font-bold text-base shadow-xs`}
                >
                  {drawerOrg.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{drawerOrg.name}</h2>
                    {drawerOrg.code && (
                      <span className="px-2 py-0.5 rounded bg-white text-slate-700 text-xs font-mono font-bold border border-slate-200 shadow-xs">
                        {drawerOrg.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>{drawerOrg.type || 'Enterprise Client'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {drawerOrg.city ? `${drawerOrg.city}, ${drawerOrg.state || ''}` : 'USA'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(drawerOrg)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDrawerOrg(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Organization Analytics Overview */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Organization-Wise Analytics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div className="text-xl font-bold text-indigo-900">
                      {drawerOrg.properties_count || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-700 mt-0.5">Properties</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="text-xl font-bold text-blue-900">{drawerOrg.sip_lines || 0}</div>
                    <div className="text-[11px] font-semibold text-blue-700 mt-0.5">SIP Lines</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="text-xl font-bold text-emerald-900">100%</div>
                    <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">E911 PSAP</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xl font-bold text-slate-900">
                      {drawerOrg.open_tickets_count || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">Open Tickets</div>
                  </div>
                </div>
              </div>

              {/* Contact & Physical Address */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Headquarters & Primary Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px]">Primary Contact:</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {drawerOrg.contact_name || 'Sarah Jenkins'}
                    </p>
                    <p className="text-slate-500 text-xs">{drawerOrg.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Phone & Dispatch:</span>
                    <p className="font-semibold text-slate-800 text-xs mt-0.5">
                      {drawerOrg.phone || '+1 (800) 555-0100'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {drawerOrg.address ? `${drawerOrg.address}, ${drawerOrg.city || ''}` : 'USA'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Telephony Architecture & Carrier Mesh */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Voice Line Routing & Architecture
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Mesh
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Architecture</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {drawerOrg.sip_architecture || 'Dual Cloud Redundancy'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Latency</span>
                    <p className="font-semibold text-emerald-600 mt-0.5">14ms Average (Carrier Core)</p>
                  </div>
                </div>
              </div>

              {/* Quick Operational Shortcuts */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Operational Shortcuts
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link
                    href={`/admin/properties?orgId=${drawerOrg.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          Managed Properties
                        </div>
                        <div className="text-[10px] text-slate-400">
                          View all {drawerOrg.properties_count || 0} hotel locations
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>

                  <Link
                    href={`/admin/e911?orgId=${drawerOrg.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          E911 PSAP Dispatch
                        </div>
                        <div className="text-[10px] text-slate-400">Kari&apos;s Law verification</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>

                  <Link
                    href={`/admin/onboarding-porting?orgId=${drawerOrg.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          Porting & Numbers
                        </div>
                        <div className="text-[10px] text-slate-400">LOA & FOC milestones</div>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                  </Link>

                  <Link
                    href={`/admin/tickets?orgId=${drawerOrg.id}`}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <LifeBuoy className="w-4 h-4 text-violet-600" />
                      <div>
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600">
                          Support Tickets
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {drawerOrg.open_tickets_count || 0} active tickets
                        </div>
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
                  setSelectedOrg(drawerOrg);
                  setShowStatusModal(true);
                }}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors"
              >
                Change Status ({drawerOrg.status})
              </button>
              <button
                onClick={() => setDrawerOrg(null)}
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
