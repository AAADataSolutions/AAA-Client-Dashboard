import type { Variants } from 'framer-motion';
import { E911Item } from '@/store/slices/e911Slice';

export type E911Status = 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUIRED' | 'FAILED' | 'ACTIVE';

export interface StatusBadgeConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getStatusBadge(status: E911Status | string): StatusBadgeConfig {
  switch (status) {
    case 'VERIFIED':
    case 'ACTIVE':
      return {
        label: 'Active / PSAP Verified',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
      };
    case 'CORRECTION_REQUIRED':
      return {
        label: 'Correction Required',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
      };
    case 'PENDING':
      return {
        label: 'Validation Pending',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
      };
    case 'FAILED':
      return {
        label: 'Routing Failed',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-[#1a1c24]',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-[#2a2c3a]',
      };
  }
}

export interface PropertyOption {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  org_property_id?: string;
  organization_name?: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};
