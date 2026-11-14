import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export function getCircuitStageBadge(status?: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'INSTALLED':
      return {
        label: '7. Installed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'FOC_STAGE':
      return {
        label: '6. FOC Confirmed',
        bg: 'bg-teal-50 dark:bg-teal-950/60',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/60',
      };
    case 'SITE_SURVEY':
      return {
        label: '5. Site Survey',
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'PAPERWORK_SIGNED':
      return {
        label: '4. Paperwork Signed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'QUOTATION_SENT':
      return {
        label: '3. Quotation Sent',
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
      };
    case 'PRICING_FINALIZED':
      return {
        label: '2. Pricing Finalized',
        bg: 'bg-sky-50 dark:bg-sky-950/60',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/60',
      };
    case 'STARTED':
    case 'REQUESTED':
      return {
        label: '1. Started',
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/60',
      };
    default:
      return {
        label: status || 'Pending',
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}

export interface PropertyRecord {
  id: string;
  org_property_id: string;
  name: string;
  monthly_price: number | null;
  connectivity_type?: string;
  data_circuit?: any;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  organization_name?: string;
  organization_type?: string;
  main_phone: string | null;
  fax: string | null;
  contact_person_name: string | null;
  contact_person_email: string | null;
  general_manager_name: string | null;
  general_manager_phone: string | null;
  general_manager_email: string | null;
  ray_baud_and_logs_enabled: boolean;
  ray_baum_status?: string;
  is_ray_baum_active?: boolean;
  porting_attachments?: any[];
  status: string;
  stage?: string;
  services_count: number;
  services: any[];
  e911_status: string;
  e911_verified_at: string | null;
  e911_record: any | null;
  onboarding_status: string | null;
  onboarding_target_date: string | null;
  onboarding_date?: string | null;
  open_tickets_count: number;
  tickets: any[];
  billing_status?: string;
  billed_date?: string | null;
  created_at: string;
}

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
