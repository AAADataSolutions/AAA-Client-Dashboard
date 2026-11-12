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

export interface OrgDetail {
  id: string;
  name: string;
  type?: string;
  logo_url?: string;
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

export type OrgDetailTab =
  | 'OVERVIEW'
  | 'CONTACTS'
  | 'PROPERTIES'
  | 'ONBOARDING'
  | 'SERVICES'
  | 'PORTING'
  | 'E911';

export type OnboardingStatus =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'CSR_DETAILS'
  | 'CUT_SHEET_REVIEW'
  | 'PORTING_SUBMITTED'
  | 'SOF_WAITING'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

export const STAGES_ROAD: {
  key: OnboardingStatus;
  label: string;
  step: number;
  desc: string;
  dateField: string;
}[] = [
  { key: 'DRAFT', label: 'Draft Initialized', step: 1, desc: 'Property draft initialized with inactive status', dateField: 'draft_date' },
  { key: 'CONTRACT_SENT', label: 'Contract Sent', step: 2, desc: 'Service agreement dispatched to GM', dateField: 'contract_sent_date' },
  { key: 'SIGNED', label: 'Contract Signed', step: 3, desc: 'Agreement executed and verified', dateField: 'signed_date' },
  { key: 'CSR_DETAILS', label: 'CSR and Contract Details', step: 4, desc: 'Customer service record & contract verified', dateField: 'csr_details_date' },
  { key: 'CUT_SHEET_REVIEW', label: 'Cut Sheet Review', step: 5, desc: 'Technical cut sheet review and validation', dateField: 'cut_sheet_review_date' },
  { key: 'PORTING_SUBMITTED', label: 'Porting Submitted', step: 6, desc: 'LSR porting order submitted to winning carrier', dateField: 'porting_submitted_date' },
  { key: 'FOC_RECEIVED', label: 'FOC Confirmed', step: 7, desc: 'Firm Order Confirmation date locked', dateField: 'foc_confirmed_date' },
  { key: 'COMPLETED', label: 'Onboarded', step: 8, desc: 'Traffic migrated & property activated', dateField: 'live_cutover_date' },
];

export function getStageBadge(status: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
  pct: number;
} {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draft Initialized', bg: 'bg-slate-100 dark:bg-[#1a1c24]', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-[#2a2c3a]', pct: 12.5 };
    case 'CONTRACT_SENT':
      return { label: 'Contract Sent', bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', pct: 25 };
    case 'SIGNED':
      return { label: 'Contract Signed', bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', pct: 37.5 };
    case 'CSR_DETAILS':
    case 'CSR_AND_CONTRACT_DETAILS':
      return { label: 'CSR and Contract Details', bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/50', pct: 50 };
    case 'CUT_SHEET_REVIEW':
    case 'SOF_WAITING':
    case 'CUT_SHEET':
      return { label: 'Cut Sheet Review', bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', pct: 62.5 };
    case 'PORTING_SUBMITTED':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      return { label: 'Porting Submitted', bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', pct: 75 };
    case 'FOC_RECEIVED':
      return { label: 'FOC Confirmed', bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800/50', pct: 87.5 };
    case 'COMPLETED':
      return { label: 'Onboarded', bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', pct: 100 };
    default:
      return { label: status || 'Draft Initialized', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', border: 'border-slate-200 dark:border-slate-700', pct: 12.5 };
  }
}
