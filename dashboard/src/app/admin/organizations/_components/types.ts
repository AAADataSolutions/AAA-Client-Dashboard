import { type Variants } from 'framer-motion';
import { type OrgRecord } from '@/store/slices/organizationsSlice';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
    },
  },
};

export interface PropertyItem {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  main_phone?: string;
  status?: string;
}

export interface EditOrgFormData {
  name: string;
  logo_url: string;
  type: 'GROUP' | 'INDIVIDUAL';
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  contact_name: string;
  status: string;
}

export interface ContactFormData {
  full_name: string;
  email: string;
  phone_number: string;
  is_primary: boolean;
}

export interface OrgMenuPosition {
  bottom: number;
  left: number;
  org: OrgRecord;
}

export async function exportOrganizationsToCSV(organizations: OrgRecord[]) {
  const res = await fetch('/api/admin/organizations?limit=1000');
  const json = await res.json();
  const list: OrgRecord[] = json.success && json.data ? json.data : organizations;

  const headers = [
    'Management Group Name',
    'Type',
    'Primary Contact',
    'Email',
    'Phone',
    'Status',
    'Created At',
    'Street Address',
    'City',
    'State',
    'Zip Code',
  ];

  const escapeCSV = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = list.map((org: OrgRecord) => [
    escapeCSV(org.name),
    escapeCSV(org.type || 'GROUP'),
    escapeCSV(org.primary_contact_name || org.contact_name || ''),
    escapeCSV(org.email || ''),
    escapeCSV(org.phone || ''),
    escapeCSV(org.status || 'ACTIVE'),
    escapeCSV(org.created_at ? new Date(org.created_at).toISOString().split('T')[0] : ''),
    escapeCSV(org.street_address || org.address || ''),
    escapeCSV(org.city || ''),
    escapeCSV(org.state || ''),
    escapeCSV(org.zip_code || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `management_groups_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
