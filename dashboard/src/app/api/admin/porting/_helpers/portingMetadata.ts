export function toSafeLegacyEnum(status?: string | null): string {
  if (!status) return 'DRAFT';
  switch (status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'SUBMITTED':
      return 'SUBMITTED';
    case 'FOC_RECEIVED':
    case 'FOC_CONFIRMED':
      return 'FOC_RECEIVED';
    case 'COMPLETED':
    case 'ONBOARDED':
      return 'COMPLETED';
    case 'REJECTED':
      return 'REJECTED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      // CONTRACT_SENT, SIGNED, CSR_DETAILS, CUT_SHEET_REVIEW, PORTING_SUBMITTED, IN_PROGRESS
      return 'IN_PROGRESS';
  }
}

export function getStageDateKeyForStatus(status?: string | null): string | null {
  switch (status) {
    case 'DRAFT':
      return 'draft_date';
    case 'CONTRACT_SENT':
      return 'contract_sent_date';
    case 'SIGNED':
    case 'CONTRACT_SIGNED':
      return 'signed_date';
    case 'CSR_DETAILS':
    case 'CSR_AND_CONTRACT_DETAILS':
      return 'csr_details_date';
    case 'CUT_SHEET_REVIEW':
    case 'CUT_SHEET':
    case 'SOF_WAITING':
      return 'cut_sheet_review_date';
    case 'PORTING_SUBMITTED':
    case 'SUBMITTED':
    case 'IN_PROGRESS':
      return 'porting_submitted_date';
    case 'FOC_RECEIVED':
    case 'FOC_CONFIRMED':
      return 'foc_confirmed_date';
    case 'COMPLETED':
    case 'ONBOARDED':
      return 'live_cutover_date';
    default:
      return null;
  }
}

export function parseNotesMetadata(rawNotes?: string | null): {
  cleanNotes: string;
  stage_dates: Record<string, any>;
  stage_assignments: Record<string, any>;
  property_details: Record<string, any>;
  attachments: any[];
  effective_stage?: string;
} {
  const result = {
    cleanNotes: rawNotes || '',
    stage_dates: {} as Record<string, any>,
    stage_assignments: {} as Record<string, any>,
    property_details: {} as Record<string, any>,
    attachments: [] as any[],
    effective_stage: undefined as string | undefined,
  };
  if (rawNotes && typeof rawNotes === 'string' && rawNotes.includes('<!--METADATA:')) {
    const match = rawNotes.match(/<!--METADATA:([\s\S]*?)-->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.stage_dates) result.stage_dates = parsed.stage_dates;
        if (parsed.stage_assignments) result.stage_assignments = parsed.stage_assignments;
        if (parsed.property_details) result.property_details = parsed.property_details;
        if (Array.isArray(parsed.attachments)) result.attachments = parsed.attachments;
        if (parsed.effective_stage) result.effective_stage = parsed.effective_stage;
      } catch {}
    }
    result.cleanNotes = rawNotes.replace(/<!--METADATA:[\s\S]*?-->/, '').trim();
  }
  return result;
}
