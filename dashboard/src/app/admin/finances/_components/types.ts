import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatCurrency = (val: number) => {
  const isNeg = val < 0;
  return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export interface MonthOption {
  key: string;
  label: string;
  year: number;
}

export interface EmailQueueState {
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  queuePosition?: number;
  error?: string;
}

export interface EmailQueueMeta {
  isProcessing: boolean;
  pendingCount: number;
}

export interface BackorderFormData {
  partner_id: string;
  period_month: string;
  custom_commission_rate: string;
  status: string;
  notes: string;
  send_email: boolean;
}
