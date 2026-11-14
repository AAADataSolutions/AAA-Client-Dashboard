import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
};

export interface ContactItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  status: string;
  created_at?: string;
}

export interface AssignedServiceItem {
  id: string;
  phone_number: string;
  service_type: string;
  description?: string;
  price?: number;
  status: string;
}

export interface AvailableServiceOption {
  id: string;
  phone_number: string;
  service_type: string;
  price?: number;
}

export interface OrgOption {
  id: string;
  name: string;
}

export interface PartnerOption {
  id: string;
  name: string;
  company_name?: string;
  default_commission_rate: number;
}

export interface ServerOption {
  id: string;
  name: string;
  provider?: string;
  status?: string;
}

export interface VendorOption {
  id: string;
  name: string;
  category?: string;
  status?: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export type DrawerTabType =
  | 'OVERVIEW'
  | 'SERVICES'
  | 'E911'
  | 'DATA_CIRCUIT'
  | 'PORTING_DOCS'
  | 'CALL_FORWARDING';

export interface PropertyFormData {
  name: string;
  organization_id: string;
  partner_id: string;
  partner_commission_override: string | number;
  server_id: string;
  vendor_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string;
  fax: string;
  general_manager_name: string;
  general_manager_phone: string;
  general_manager_email: string;
  base_price: string | number;
  monthly_price: string | number;
  onboarding_date: string;
  ray_baud_and_logs_enabled: boolean;
  ray_baum_status: 'ACTIVE' | 'INACTIVE';
  e911_status: 'VERIFIED' | 'AUDIT_REQUIRED';
  connectivity_type: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH';
  billing_status: 'BILLING_DONE' | 'BILLING_PENDING';
  billed_date?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface ServiceCreateFormData {
  custom_service_id: string;
  service_name: string;
  phone_number: string;
  service_type_name: string;
  custom_type_input: string;
  is_custom_type: boolean;
  property_id: string;
  description: string;
  price: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  device_type: string;
  serial_number: string;
  extension: string;
  pbx_server_id: number;
}

export const getDefaultPropertyFormData = (): PropertyFormData => ({
  name: '',
  organization_id: '',
  partner_id: '',
  partner_commission_override: '',
  server_id: '',
  vendor_id: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: 'USA',
  main_phone: '',
  fax: '',
  general_manager_name: '',
  general_manager_phone: '',
  general_manager_email: '',
  base_price: '',
  monthly_price: '',
  onboarding_date: new Date().toISOString().slice(0, 10),
  ray_baud_and_logs_enabled: true,
  ray_baum_status: 'ACTIVE',
  e911_status: 'VERIFIED',
  connectivity_type: 'PORTED',
  billing_status: 'BILLING_PENDING',
  billed_date: null,
  status: 'ACTIVE',
});

export function formatBilledDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const raw = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const isFireLineSvcType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'firelines' || t === 'fireline' || t.includes('fireline');
};

export const isElevatorLineSvcType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'elevatorlines' || t === 'elevatorline' || t.includes('elevatorline');
};

