'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPortingRequests,
  setSearchQuery,
  setStatusFilter,
  setSortBy,
  setPagination,
  PortingItem,
} from '@/store/slices/portingSlice';
import {
  OrgOption,
  PartnerOption,
  Teammate,
  Toast,
  getStageBadge,
} from './portingTypes';

export function usePortingData() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const dispatch = useAppDispatch();
  const {
    items: portings,
    loading,
    error,
    pagination,
    metrics,
    filters,
  } = useAppSelector((state) => state.porting);

  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [partnerOptions, setPartnerOptions] = useState<PartnerOption[]>([]);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    bottom: number;
    left: number;
    record: PortingItem;
  } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Load organizations for dropdown
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await fetch('/api/admin/organizations?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrgOptions(data.data.map((o: any) => ({ id: o.id, name: o.name })));
        }
      } catch (err) {
        console.warn('Could not load org options:', err);
      }
    }
    loadOrgs();
  }, []);

  // Load partners for dropdown
  useEffect(() => {
    async function loadPartners() {
      try {
        const res = await fetch('/api/admin/partners?limit=100');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPartnerOptions(
            data.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              company_name: p.company_name,
              default_commission_rate: p.default_commission_rate ?? 0,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not load partner options:', err);
      }
    }
    loadPartners();
  }, []);

  // Load admin teammates for assignment
  useEffect(() => {
    async function loadTeammates() {
      try {
        const res = await fetch('/api/admin/members');
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setTeammates(data.members);
        }
      } catch (err) {
        console.warn('Could not load teammates:', err);
      }
    }
    loadTeammates();
  }, []);

  // Fetch porting requests
  const loadData = useCallback(() => {
    dispatch(
      fetchPortingRequests({
        page: pagination.currentPage,
        limit: pagination.limit,
        searchQuery: filters.searchQuery,
        status: filters.selectedStatus,
        sortBy: filters.sortBy,
      })
    );
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync search input
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    dispatch(setSearchQuery(val));
  };

  const handleStatusFilterChange = (status: string) => {
    dispatch(setStatusFilter(status));
  };

  const handleSortByChange = (sortBy: string) => {
    dispatch(setSortBy(sortBy));
  };

  const handlePageChange = (page: number) => {
    dispatch(setPagination({ currentPage: page }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    dispatch(setStatusFilter('ALL'));
    dispatch(setSortBy('NEWEST'));
    dispatch(setPagination({ currentPage: 1 }));
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('Copied', `${text} copied to clipboard.`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export CSV handler
  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '5000',
        search: filters.searchQuery || '',
        status: filters.selectedStatus || 'ALL',
        sortBy: filters.sortBy || 'NEWEST',
      });
      const res = await fetch(`/api/admin/porting?${params.toString()}`);
      const json = await res.json();
      const list: PortingItem[] = json.success && json.data ? json.data : portings;

      const headers = [
        'Client',
        'Property Name',
        'Main Phone Number',
        'Fax Number',
        'Monthly Price ($)',
        'Channel Partner',
        'Partner Revenue Share (%)',
        'Target Cutover Date',
        'Street Address',
        'City',
        'State',
        'ZIP Code',
        'GM Full Name',
        'GM Phone Number',
        'GM Email Address',
        'Initial Lifecycle Stage',
        'E911 Compliance Status',
        "Ray Baum & Kari's Law",
        'Losing Carrier & Porting Notes',
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = list.map((item: any) => {
        const partner = partnerOptions.find((p) => p.id === item.partner_id);
        const partnerName = partner
          ? partner.company_name
            ? `${partner.name} (${partner.company_name})`
            : partner.name
          : 'No Partner Assigned';
        const revShare =
          item.partner_commission_override !== null && item.partner_commission_override !== undefined
            ? item.partner_commission_override
            : partner?.default_commission_rate ?? '';
        const stageBadge = getStageBadge(item.status || item.stage || 'DRAFT');

        return [
          escapeCSV(
            item.organization_name && item.organization_name !== 'Unassigned'
              ? item.organization_name
              : '-- Unassigned (None) --'
          ),
          escapeCSV(item.property_name || ''),
          escapeCSV(item.property_phone || ''),
          escapeCSV(item.fax && item.fax !== '—' ? item.fax : ''),
          escapeCSV(
            item.monthly_price !== null && item.monthly_price !== undefined
              ? Number(item.monthly_price).toFixed(2)
              : ''
          ),
          escapeCSV(partnerName),
          escapeCSV(revShare !== '' ? `${revShare}%` : ''),
          escapeCSV(item.target_date || ''),
          escapeCSV(item.property_address || ''),
          escapeCSV(item.city || ''),
          escapeCSV(item.state || ''),
          escapeCSV(item.zip_code || ''),
          escapeCSV(
            item.general_manager_name && item.general_manager_name !== 'N/A'
              ? item.general_manager_name
              : ''
          ),
          escapeCSV(
            item.general_manager_phone && item.general_manager_phone !== 'N/A'
              ? item.general_manager_phone
              : ''
          ),
          escapeCSV(
            item.general_manager_email && item.general_manager_email !== 'N/A'
              ? item.general_manager_email
              : ''
          ),
          escapeCSV(stageBadge.label),
          escapeCSV(item.e911_status === 'VERIFIED' ? 'PSAP Verified (Compliant)' : 'Audit Required'),
          escapeCSV(
            item.ray_baud_and_logs_enabled || item.ray_baum_status === 'ACTIVE'
              ? 'Active (Compliant)'
              : 'Inactive'
          ),
          escapeCSV(item.carrier_details || item.notes || ''),
        ];
      });

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `porting_records_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export porting failed:', err);
      showToast('Export Error', err.message || 'Could not export porting records', 'error');
    } finally {
      setExportingCSV(false);
    }
  };

  // Open 3-Dots Menu (opens ABOVE the row)
  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    record: PortingItem
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const bottom = window.innerHeight - rect.top + 6;
    setMenuPosition({ bottom, left, record });
  };

  return {
    isSuperAdmin,
    portings,
    loading,
    error,
    pagination,
    metrics,
    filters,
    orgOptions,
    partnerOptions,
    teammates,
    searchInput,
    copiedField,
    exportingCSV,
    menuPosition,
    setMenuPosition,
    toasts,
    showToast,
    loadData,
    handleSearchChange,
    handleStatusFilterChange,
    handleSortByChange,
    handlePageChange,
    handleResetFilters,
    handleCopy,
    handleExportCSV,
    handleOpenMenu,
  };
}
