export type LifecycleStage =
  | 'DRAFT'
  | 'CONTRACT_SENT'
  | 'SIGNED'
  | 'CSR_DETAILS'
  | 'CUT_SHEET_REVIEW'
  | 'PORTING_SUBMITTED'
  | 'FOC_RECEIVED'
  | 'COMPLETED';

export const STAGES_ROAD: {
  key: LifecycleStage;
  label: string;
  step: number;
  desc: string;
  dateField: string;
}[] = [
  {
    key: 'DRAFT',
    label: 'Draft initialized',
    step: 1,
    desc: 'Property draft initialized with inactive status',
    dateField: 'draft_date',
  },
  {
    key: 'CONTRACT_SENT',
    label: 'Contract sent',
    step: 2,
    desc: 'Service agreement dispatched to GM',
    dateField: 'contract_sent_date',
  },
  {
    key: 'SIGNED',
    label: 'Contract signed',
    step: 3,
    desc: 'Agreement executed and verified',
    dateField: 'signed_date',
  },
  {
    key: 'CSR_DETAILS',
    label: 'CSR and contract details',
    step: 4,
    desc: 'Customer service record & contract verified',
    dateField: 'csr_details_date',
  },
  {
    key: 'CUT_SHEET_REVIEW',
    label: 'Cut sheet review',
    step: 5,
    desc: 'Technical cut sheet review and validation',
    dateField: 'cut_sheet_review_date',
  },
  {
    key: 'PORTING_SUBMITTED',
    label: 'Porting submitted',
    step: 6,
    desc: 'LSR porting order submitted to winning carrier',
    dateField: 'porting_submitted_date',
  },
  {
    key: 'FOC_RECEIVED',
    label: 'FOC Confirm',
    step: 7,
    desc: 'Firm Order Confirmation date locked',
    dateField: 'foc_confirmed_date',
  },
  {
    key: 'COMPLETED',
    label: 'Onboarding',
    step: 8,
    desc: 'Traffic migrated & property activated',
    dateField: 'live_cutover_date',
  },
];

export function getStageBadge(status: string): {
  label: string;
  step: number;
  bg: string;
  text: string;
  border: string;
  pct: number;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Stage 1: Draft initialized',
        step: 1,
        bg: 'bg-slate-100 dark:bg-[#1a1c24]',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-[#2a2c3a]',
        pct: 12.5,
      };
    case 'CONTRACT_SENT':
      return {
        label: 'Stage 2: Contract sent',
        step: 2,
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        pct: 25,
      };
    case 'SIGNED':
      return {
        label: 'Stage 3: Contract signed',
        step: 3,
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        pct: 37.5,
      };
    case 'CSR_DETAILS':
    case 'CSR_AND_CONTRACT_DETAILS':
      return {
        label: 'Stage 4: CSR and contract details',
        step: 4,
        bg: 'bg-teal-50 dark:bg-teal-950/50',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/50',
        pct: 50,
      };
    case 'CUT_SHEET_REVIEW':
    case 'SOF_WAITING':
    case 'CUT_SHEET':
      return {
        label: 'Stage 5: Cut sheet review',
        step: 5,
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/50',
        pct: 62.5,
      };
    case 'PORTING_SUBMITTED':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      return {
        label: 'Stage 6: Porting submitted',
        step: 6,
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        pct: 75,
      };
    case 'FOC_RECEIVED':
      return {
        label: 'Stage 7: FOC Confirm',
        step: 7,
        bg: 'bg-sky-50 dark:bg-sky-950/50',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/50',
        pct: 87.5,
      };
    case 'COMPLETED':
      return {
        label: 'Stage 8: Onboarding',
        step: 8,
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        pct: 100,
      };
    default:
      return {
        label: status || 'Stage 1: Draft initialized',
        step: 1,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-800 dark:text-slate-200',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 12.5,
      };
  }
}

export function normalizeStageKey(statusOrStage?: string): LifecycleStage {
  if (!statusOrStage) return 'DRAFT';
  const s = String(statusOrStage).toUpperCase();
  if (s.includes('CONTRACT_SENT') || s.includes('CONTRACT SENT') || s.includes('STAGE 2')) return 'CONTRACT_SENT';
  if (s.includes('SIGNED') || s.includes('STAGE 3')) return 'SIGNED';
  if (s.includes('CSR') || s.includes('STAGE 4')) return 'CSR_DETAILS';
  if (s.includes('CUT_SHEET') || s.includes('CUT SHEET') || s.includes('SOF') || s.includes('STAGE 5')) return 'CUT_SHEET_REVIEW';
  if (s.includes('PORTING_SUBMITTED') || s.includes('SUBMITTED') || s.includes('IN_PROGRESS') || s.includes('STAGE 6')) return 'PORTING_SUBMITTED';
  if (s.includes('FOC') || s.includes('STAGE 7')) return 'FOC_RECEIVED';
  if (s.includes('COMPLETED') || s.includes('ONBOARD') || s.includes('STAGE 8')) return 'COMPLETED';
  return 'DRAFT';
}

export function formatStageDate(rawDate?: string | null): string {
  if (!rawDate || rawDate === '—' || rawDate === 'N/A' || rawDate === 'null' || rawDate === 'undefined' || String(rawDate).trim() === '') {
    return '(-)';
  }
  try {
    const cleanDate = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanDate)) {
      const parts = cleanDate.substring(0, 10).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
    const d = new Date(cleanDate);
    if (isNaN(d.getTime())) return '(-)';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '(-)';
  }
}

export function getStageDate(rec: any, status?: string): string {
  if (!rec) return '(-)';
  const currentStage = normalizeStageKey(status || rec.status || rec.stage || 'DRAFT');
  let rawDate: string | null | undefined = null;

  switch (currentStage) {
    case 'DRAFT':
      rawDate = rec.draft_date;
      break;
    case 'CONTRACT_SENT':
      rawDate = rec.contract_sent_date;
      break;
    case 'SIGNED':
      rawDate = rec.signed_date;
      break;
    case 'CSR_DETAILS':
      rawDate = rec.csr_details_date;
      break;
    case 'CUT_SHEET_REVIEW':
      rawDate = rec.cut_sheet_review_date || rec.sof_review_date;
      break;
    case 'PORTING_SUBMITTED':
      rawDate = rec.porting_submitted_date;
      break;
    case 'FOC_RECEIVED':
      rawDate = rec.foc_confirmed_date;
      break;
    case 'COMPLETED':
      rawDate = rec.live_cutover_date || rec.completed_at;
      break;
    default:
      rawDate = null;
  }

  return formatStageDate(rawDate || rec.target_date || rec.created_at);
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

export interface Teammate {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
