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
  | 'REQUESTED';

export const CIRCUIT_STAGES: {
  key: CircuitStatus;
  label: string;
  step: number;
  desc: string;
}[] = [
  { key: 'STARTED', label: '1. Started', step: 1, desc: 'Requirements & initial setup' },
  { key: 'PRICING_FINALIZED', label: '2. Pricing Finalized', step: 2, desc: 'Carrier offer selected & evaluated' },
  { key: 'QUOTATION_SENT', label: '3. Quotation Sent', step: 3, desc: 'Proposal sent to your team' },
  { key: 'PAPERWORK_SIGNED', label: '4. Paperwork Signed', step: 4, desc: 'Agreement executed & signed' },
  { key: 'SITE_SURVEY', label: '5. Site Survey', step: 5, desc: 'Facility readiness verification' },
  { key: 'FOC_STAGE', label: '6. FOC Committed', step: 6, desc: 'Firm Order Commitment cutover' },
  { key: 'INSTALLED', label: '7. Installed & Live', step: 7, desc: 'Active enterprise bandwidth' },
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
        label: 'Installed & Live',
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
        label: status || 'Pending',
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 14,
      };
  }
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '$0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0.00';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

