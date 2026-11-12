export interface PortingRecordItem {
  id: string;
  org_property_id: string;
  property_id: string | null;
  property_name: string;
  property_address: string;
  property_location: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  property_phone: string;
  fax?: string;
  monthly_price?: number | string | null;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  e911_status?: string | null;
  ray_baud_and_logs_enabled?: boolean;
  ray_baum_status?: string | null;
  carrier_details?: string;
  attachments?: any[];
  status: string;
  draft_date?: string | null;
  contract_sent_date?: string | null;
  signed_date?: string | null;
  csr_details_date?: string | null;
  cut_sheet_review_date?: string | null;
  porting_submitted_date?: string | null;
  sof_review_date?: string | null;
  foc_confirmed_date?: string | null;
  live_cutover_date?: string | null;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  services_count: number;
  services: any[];
  created_at: string;
  updated_at: string;
  organization_name?: string;
}

export const getStageLabel = (stageKey: string) => {
  switch (stageKey) {
    case 'DRAFT':
      return 'Stage 1: Draft initialized';
    case 'CONTRACT_SENT':
      return 'Stage 2: Contract sent';
    case 'SIGNED':
      return 'Stage 3: Contract signed';
    case 'CSR_DETAILS':
    case 'CSR_AND_CONTRACT_DETAILS':
      return 'Stage 4: CSR and contract details';
    case 'CUT_SHEET_REVIEW':
    case 'SOF_WAITING':
    case 'CUT_SHEET':
      return 'Stage 5: Cut sheet review';
    case 'PORTING_SUBMITTED':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      return 'Stage 6: Porting submitted';
    case 'FOC_RECEIVED':
      return 'Stage 7: FOC Confirm';
    case 'COMPLETED':
      return 'Stage 8: Onboarding';
    default:
      return stageKey || 'Submitted';
  }
};

export const normalizeStageKey = (statusOrStage?: string): string => {
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
};

export const formatStageDate = (rawDate?: string | null): string => {
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
};

export const getStageDate = (rec: any, status?: string): string => {
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

  return formatStageDate(rawDate);
};
