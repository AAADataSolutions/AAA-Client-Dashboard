import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
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

export type CircuitStatus =
  | 'STARTED'
  | 'PRICING_FINALIZED'
  | 'QUOTATION_SENT'
  | 'PAPERWORK_SIGNED'
  | 'SITE_SURVEY'
  | 'FOC_STAGE'
  | 'INSTALLED'
  | 'CANCELLED'
  | 'REQUESTED'; // backward compatibility

export const CIRCUIT_STAGES: {
  key: CircuitStatus;
  label: string;
  step: number;
  desc: string;
}[] = [
  { key: 'STARTED', label: '1. Started', step: 1, desc: 'New data circuit request initiated' },
  { key: 'PRICING_FINALIZED', label: '2. Wholesaler Pricing Finalized', step: 2, desc: 'Wholesaler offer evaluated & price finalized' },
  { key: 'QUOTATION_SENT', label: '3. Quotation Sent', step: 3, desc: 'Winning carrier proposal sent to client' },
  { key: 'PAPERWORK_SIGNED', label: '4. Paperwork Signed', step: 4, desc: 'Signed Agreement PDF uploaded (Required Gate)' },
  { key: 'SITE_SURVEY', label: '5. Site Survey', step: 5, desc: 'On-site technical survey status' },
  { key: 'FOC_STAGE', label: '6. FOC Confirmed / Pending', step: 6, desc: 'FOC date and cutover actions' },
  { key: 'INSTALLED', label: '7. Installed', step: 7, desc: 'Circuit live & operational' },
];

export function getCircuitStageBadge(
  status: string,
  circuit?: { site_survey_status?: string; foc_status?: string } | null
) {
  switch (status) {
    case 'STARTED':
    case 'REQUESTED':
      return {
        label: 'Started',
        bg: 'bg-slate-100 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 14,
      };
    case 'PRICING_FINALIZED':
      return {
        label: 'Pricing Finalized',
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        pct: 28,
      };
    case 'QUOTATION_SENT':
      return {
        label: 'Quotation Sent',
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        pct: 42,
      };
    case 'PAPERWORK_SIGNED':
      return {
        label: 'Paperwork Signed',
        bg: 'bg-teal-50 dark:bg-teal-950/50',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/50',
        pct: 57,
      };
    case 'SITE_SURVEY': {
      const surveyStatus = circuit?.site_survey_status;
      if (surveyStatus === 'COMPLETED' || surveyStatus === 'DONE') {
        return {
          label: 'Site Survey: Completed',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/50',
          pct: 71,
        };
      }
      if (surveyStatus === 'NOT_REQUIRED') {
        return {
          label: 'Site Survey: N/A',
          bg: 'bg-slate-100 dark:bg-slate-800/80',
          text: 'text-slate-700 dark:text-slate-300',
          border: 'border-slate-200 dark:border-slate-700',
          pct: 71,
        };
      }
      return {
        label: 'Site Survey: Pending',
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/50',
        pct: 71,
      };
    }
    case 'FOC_STAGE': {
      const focStatus = circuit?.foc_status;
      if (focStatus === 'CONFIRMED') {
        return {
          label: 'FOC Confirmed',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50',
          text: 'text-emerald-700 dark:text-emerald-300',
          border: 'border-emerald-200 dark:border-emerald-800/50',
          pct: 85,
        };
      }
      return {
        label: 'FOC: Pending',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        pct: 85,
      };
    }
    case 'INSTALLED':
      return {
        label: 'Installed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        pct: 100,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
        pct: 0,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 14,
      };
  }
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export interface WholesalerItem {
  id: string;
  name: string;
  phone?: string | null;
}

export interface CircuitMetrics {
  totalCircuits: number;
  installedCircuits: number;
  inProgressCircuits: number;
  expectedMonthlyRevShare: number;
  receivedMonthlyRevShare: number;
  pendingMonthlyRevShare: number;
  totalHistoricalRevShareReceived?: number;
}

export const formatCurrency = (val: number) =>
  `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
