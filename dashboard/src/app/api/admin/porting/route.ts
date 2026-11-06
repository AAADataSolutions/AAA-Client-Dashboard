import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

function toSafeLegacyEnum(status?: string | null): string {
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

function getStageDateKeyForStatus(status?: string | null): string | null {
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

function parseNotesMetadata(rawNotes?: string | null): {
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. Fetch porting requests with joined data (no fragile enum filters in SQL; filter in JS so unmigrated enums never break GET)
    let { data: rawPortings, error } = await db
      .from('porting_requests')
      .select(`
        *,
        organization:organizations(id, name, type),
        organization_property:organization_properties(
          id,
          status,
          property:properties(*),
          organization:organizations(id, name, type),
          onboardings(*)
        ),
        porting_attachments:porting_attachments(
          id, file_name, file_size, mime_type, storage_path, created_at
        ),
        services:porting_request_services(
          id,
          service:services(id, phone_number, price, status, description, service_type:service_types(name))
        )
      `)
      .order('created_at', { ascending: false });

    // If joined query fails for any schema reason, fetch porting_requests + attachments + properties separately
    if (error || !rawPortings) {
      const { data: simplePortings, error: fErr } = await db
        .from('porting_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fErr) {
        return NextResponse.json({ success: false, error: fErr.message }, { status: 400 });
      }

      const prIds = (simplePortings || []).map((p: any) => p.id).filter(Boolean);
      const { data: allAtts } = prIds.length > 0
        ? await db.from('porting_attachments').select('*').in('porting_request_id', prIds)
        : { data: [] as any[] };

      const orgIds = Array.from(new Set((simplePortings || []).map((p: any) => p.organization_id).filter(Boolean)));
      const { data: allOrgs } = orgIds.length > 0
        ? await db.from('organizations').select('id, name, type').in('id', orgIds)
        : { data: [] as any[] };

      const opIds = Array.from(new Set((simplePortings || []).map((p: any) => p.organization_property_id).filter(Boolean)));
      const { data: allOps } = opIds.length > 0
        ? await db.from('organization_properties').select('id, status, organization_id, property_id, property:properties(*), onboardings(*)').in('id', opIds)
        : { data: [] as any[] };

      rawPortings = (simplePortings || []).map((p: any) => ({
        ...p,
        organization: (allOrgs || []).find((o: any) => o.id === p.organization_id) || null,
        organization_property: (allOps || []).find((op: any) => op.id === p.organization_property_id) || null,
        porting_attachments: (allAtts || []).filter((a: any) => a.porting_request_id === p.id),
        services: [],
      }));
    }

    // 2. Collect all property names & property_ids for fallback lookup
    const missingPropNames = (rawPortings || [])
      .filter((item: any) => !item.organization_property?.property)
      .map((item: any) => item.property_name)
      .filter(Boolean);

    const directPropIds = (rawPortings || [])
      .filter((item: any) => !item.organization_property?.property && item.property_id)
      .map((item: any) => item.property_id)
      .filter(Boolean);

    let fallbackPropsByName: Record<string, any> = {};
    let fallbackPropsById: Record<string, any> = {};

    if (missingPropNames.length > 0) {
      const { data: fbProps } = await db
        .from('properties')
        .select('*')
        .in('name', missingPropNames);
      (fbProps || []).forEach((p: any) => {
        if (p.name) fallbackPropsByName[p.name.toLowerCase().trim()] = p;
        if (p.id) fallbackPropsById[p.id] = p;
      });
    }

    if (directPropIds.length > 0) {
      const { data: fbPropsByIdData } = await db
        .from('properties')
        .select('*')
        .in('id', directPropIds);
      (fbPropsByIdData || []).forEach((p: any) => {
        if (p.id) fallbackPropsById[p.id] = p;
        if (p.name) fallbackPropsByName[p.name.toLowerCase().trim()] = p;
      });
    }

    // 3. Map and format records
    let allFormatted = (rawPortings || []).map((item: any) => {
      const orgProp = item.organization_property;
      const matchedById = item.property_id ? fallbackPropsById[item.property_id] : null;
      const matchedByName = item.property_name ? fallbackPropsByName[item.property_name.toLowerCase().trim()] : null;
      const prop = (Array.isArray(orgProp?.property) ? orgProp?.property[0] : orgProp?.property) || matchedById || matchedByName;
      const directOrg = Array.isArray(item.organization) ? item.organization[0] : item.organization;
      const org = directOrg || (Array.isArray(orgProp?.organization) ? orgProp?.organization[0] : orgProp?.organization);
      const ob = Array.isArray(orgProp?.onboardings) ? orgProp?.onboardings[0] : orgProp?.onboardings;

      // Extract metadata from item.notes if present
      const parsedMeta = parseNotesMetadata(item.notes);
      const metaStageDates = parsedMeta.stage_dates;
      const metaStageAssignments = parsedMeta.stage_assignments;
      const metaProp = parsedMeta.property_details;
      const metaAtts = parsedMeta.attachments;
      const cleanNotes = parsedMeta.cleanNotes;

      const services = (item.services || []).map((s: any) => {
        const svc = s.service || s;
        return {
          id: svc?.id || s.id,
          phone_number: svc?.phone_number || '—',
          status: svc?.status || 'ACTIVE',
          price: Number(svc?.price || 0),
          description: svc?.description || '',
          service_type: svc?.service_type?.name || svc?.service_type || 'Voice Line',
        };
      });

      const servicesTotal = services.reduce((acc: number, s: any) => acc + (Number(s.price) || 0), 0);
      const propPrice = prop?.base_price !== null && prop?.base_price !== undefined
        ? Number(prop.base_price)
        : (prop?.monthly_price !== null && prop?.monthly_price !== undefined ? Number(prop.monthly_price) : null);
      const metaPrice = metaProp.monthly_price !== null && metaProp.monthly_price !== undefined && metaProp.monthly_price !== ''
        ? Number(metaProp.monthly_price)
        : null;
      const rawBase = propPrice !== null ? propPrice : metaPrice;

      const computedMonthly = rawBase !== null ? rawBase + servicesTotal : (servicesTotal > 0 ? servicesTotal : null);

      // Determine effective 8-stage status (preferring exact stage saved in metadata if DB column fell back to IN_PROGRESS)
      let effectiveStatus = item.status || ob?.status || 'DRAFT';
      const metaEffectiveStage = parsedMeta.effective_stage || metaStageDates.effective_stage || metaStageAssignments.effective_stage;
      if (item.status === 'COMPLETED' || item.status === 'ONBOARDED' || ob?.status === 'COMPLETED') {
        effectiveStatus = 'COMPLETED';
      } else if (metaEffectiveStage) {
        effectiveStatus = metaEffectiveStage;
      } else if (ob?.status && ob.status !== 'IN_PROGRESS') {
        effectiveStatus = ob.status;
      }

      let progressPct = 12.5;
      switch (effectiveStatus) {
        case 'DRAFT': progressPct = 12.5; break;
        case 'CONTRACT_SENT': progressPct = 25; break;
        case 'SIGNED':
        case 'CONTRACT_SIGNED': progressPct = 37.5; break;
        case 'CSR_DETAILS':
        case 'CSR_AND_CONTRACT_DETAILS': progressPct = 50; break;
        case 'CUT_SHEET_REVIEW':
        case 'SOF_WAITING':
        case 'CUT_SHEET': progressPct = 62.5; break;
        case 'PORTING_SUBMITTED':
        case 'SUBMITTED':
        case 'IN_PROGRESS': progressPct = 75; break;
        case 'FOC_RECEIVED':
        case 'FOC_CONFIRMED': progressPct = 87.5; break;
        case 'COMPLETED':
        case 'ONBOARDED': progressPct = 100; break;
        default: progressPct = 12.5;
      }

      // Merge attachments from all sources: porting_attachments table, item.attachments, ob.attachments, prop.attachments, and metadata
      const rawAtts = [
        ...(Array.isArray(item.porting_attachments) ? item.porting_attachments : []),
        ...(Array.isArray(item.attachments) ? item.attachments : []),
        ...(Array.isArray(ob?.attachments) ? ob.attachments : []),
        ...(Array.isArray(prop?.attachments) ? prop.attachments : []),
        ...(Array.isArray(metaAtts) ? metaAtts : []),
      ];
      const mergedAtts: any[] = [];
      rawAtts.forEach((att: any) => {
        if (!att || (!att.storage_path && !att.file_name)) return;
        const exists = mergedAtts.some(
          (a: any) =>
            (att.storage_path && a.storage_path === att.storage_path) ||
            (att.id && a.id === att.id)
        );
        if (!exists) {
          mergedAtts.push(att);
        }
      });

      const resolvedTargetDate = item.target_date || ob?.target_date || metaStageDates.target_date || null;
      const currentStageDateKey = getStageDateKeyForStatus(effectiveStatus);

      const resolvedDates: Record<string, string | null> = {
        draft_date: ob?.draft_date || metaStageDates.draft_date || (effectiveStatus === 'DRAFT' ? (resolvedTargetDate || item.created_at) : null),
        contract_sent_date: ob?.contract_sent_date || metaStageDates.contract_sent_date || null,
        signed_date: ob?.signed_date || metaStageDates.signed_date || null,
        csr_details_date: ob?.csr_details_date || metaStageDates.csr_details_date || null,
        cut_sheet_review_date: ob?.cut_sheet_review_date || ob?.sof_review_date || metaStageDates.cut_sheet_review_date || null,
        porting_submitted_date: ob?.porting_submitted_date || metaStageDates.porting_submitted_date || null,
        sof_review_date: ob?.sof_review_date || metaStageDates.sof_review_date || null,
        foc_confirmed_date: ob?.foc_confirmed_date || metaStageDates.foc_confirmed_date || null,
        live_cutover_date: ob?.live_cutover_date || item.completed_at || metaStageDates.live_cutover_date || null,
      };

      // If the active stage's specific date is still null, fallback to target_date or created_at so the table UI always shows the stage date
      if (currentStageDateKey && !resolvedDates[currentStageDateKey]) {
        resolvedDates[currentStageDateKey] = resolvedTargetDate || item.created_at || null;
      }

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        onboarding_id: ob?.id || null,
        property_id: prop?.id || item.property_id || '',
        property_name: item.property_name || prop?.name || 'New Property',
        property_address: item.property_address || (prop?.address
          ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`.trim()
          : (metaProp.street_address ? `${metaProp.street_address}, ${metaProp.city || ''}, ${metaProp.state || ''} ${metaProp.zip_code || ''}`.trim() : 'Address pending')),
        partner_id: prop?.partner_id || metaProp.partner_id || null,
        partner_commission_override: prop?.partner_commission_override ?? metaProp.partner_commission_override ?? null,
        property_phone: item.property_phone || prop?.main_phone || metaProp.property_phone || '—',
        fax: item.fax || prop?.fax || metaProp.fax || '—',
        monthly_price: computedMonthly,
        base_price: rawBase,
        general_manager_name: prop?.general_manager_name || prop?.contact_person_name || metaProp.general_manager_name || 'N/A',
        general_manager_phone: prop?.general_manager_phone || prop?.main_phone || metaProp.general_manager_phone || 'N/A',
        general_manager_email: prop?.general_manager_email || prop?.contact_person_email || metaProp.general_manager_email || 'N/A',
        city: prop?.city || metaProp.city || '',
        state: prop?.state || metaProp.state || '',
        zip_code: prop?.zip_code || metaProp.zip_code || '',
        country: prop?.country || metaProp.country || 'USA',
        e911_status: (prop?.ray_baud_and_logs_enabled || prop?.status === 'ACTIVE' || metaProp.e911_status === 'VERIFIED') ? 'VERIFIED' : (metaProp.e911_status || 'AUDIT_REQUIRED'),
        ray_baud_and_logs_enabled: prop?.ray_baud_and_logs_enabled ?? (metaProp.ray_baum_status === 'ACTIVE' ? true : false),
        ray_baum_status: prop?.ray_baum_status || metaProp.ray_baum_status || (prop?.ray_baud_and_logs_enabled ? 'ACTIVE' : 'INACTIVE'),
        carrier_details: item.carrier_details || '',
        organization_id: org?.id || item.organization_id || '',
        organization_name: (org?.name && org.name !== 'Organization' && org.name !== 'Unassigned Organization' && org.name !== 'Direct Portfolio') ? org.name : 'Unassigned',
        organization_type: org?.type || 'GROUP',
        status: effectiveStatus,
        stage: effectiveStatus,
        progress_pct: progressPct,
        target_date: resolvedTargetDate,
        draft_date: resolvedDates.draft_date,
        contract_sent_date: resolvedDates.contract_sent_date,
        signed_date: resolvedDates.signed_date,
        csr_details_date: resolvedDates.csr_details_date,
        cut_sheet_review_date: resolvedDates.cut_sheet_review_date,
        porting_submitted_date: resolvedDates.porting_submitted_date,
        sof_review_date: resolvedDates.sof_review_date,
        foc_confirmed_date: resolvedDates.foc_confirmed_date,
        live_cutover_date: resolvedDates.live_cutover_date,
        assigned_to: ob?.assigned_to || metaStageAssignments.assigned_to || null,
        assigned_to_name: ob?.assigned_to_name || metaStageAssignments.assigned_to_name || null,
        internal_notes: ob?.internal_notes || cleanNotes || null,
        stage3_assigned_to: ob?.stage3_assigned_to || ob?.assigned_to || metaStageAssignments.stage3_assigned_to || null,
        stage3_assigned_to_name: ob?.stage3_assigned_to_name || ob?.assigned_to_name || metaStageAssignments.stage3_assigned_to_name || null,
        stage3_notes: ob?.stage3_notes || ob?.internal_notes || metaStageAssignments.stage3_notes || null,
        stage4_assigned_to: ob?.stage4_assigned_to || metaStageAssignments.stage4_assigned_to || null,
        stage4_assigned_to_name: ob?.stage4_assigned_to_name || metaStageAssignments.stage4_assigned_to_name || null,
        stage4_notes: ob?.stage4_notes || metaStageAssignments.stage4_notes || null,
        stage_assignments: {
          ...(metaStageAssignments.all_stages || {}),
          ...(ob?.stage_assignments || {}),
          ...(item.stage_assignments || {}),
          ...(ob?.stage3_assigned_to || ob?.stage3_assigned_to_name || ob?.stage3_notes || metaStageAssignments.stage3_assigned_to_name ? {
            SIGNED: {
              assigned_to: ob?.stage3_assigned_to || metaStageAssignments.stage3_assigned_to || '',
              assigned_to_name: ob?.stage3_assigned_to_name || metaStageAssignments.stage3_assigned_to_name || '',
              notes: ob?.stage3_notes || metaStageAssignments.stage3_notes || '',
              ...(ob?.stage_assignments?.SIGNED || item.stage_assignments?.SIGNED || metaStageAssignments.all_stages?.SIGNED || {})
            }
          } : {}),
          ...(ob?.stage4_assigned_to || ob?.stage4_assigned_to_name || ob?.stage4_notes || metaStageAssignments.stage4_assigned_to_name ? {
            CSR_DETAILS: {
              assigned_to: ob?.stage4_assigned_to || metaStageAssignments.stage4_assigned_to || '',
              assigned_to_name: ob?.stage4_assigned_to_name || metaStageAssignments.stage4_assigned_to_name || '',
              notes: ob?.stage4_notes || metaStageAssignments.stage4_notes || '',
              ...(ob?.stage_assignments?.CSR_DETAILS || item.stage_assignments?.CSR_DETAILS || metaStageAssignments.all_stages?.CSR_DETAILS || {})
            }
          } : {}),
        },
        billing_status: prop?.billing_status || item.billing_status || ob?.billing_status || metaStageAssignments.billing_status || 'BILLING_PENDING',
        completed_at: item.completed_at,
        rejection_reason: item.rejection_reason,
        notes: cleanNotes || ob?.internal_notes || null,
        is_activated: item.is_activated || false,
        attachments: mergedAtts,
        services_count: services.length,
        services: services,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      };
    });

    // Compute KPI counts from allFormatted so they are 100% accurate across all 8 stages
    const totalCount = allFormatted.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'ONBOARDED').length;
    const completedCount = allFormatted.filter((p: any) => p.status === 'COMPLETED' || p.status === 'ONBOARDED').length;
    const focReceivedCount = allFormatted.filter((p: any) => p.status === 'FOC_RECEIVED' || p.status === 'FOC_CONFIRMED').length;
    const submittedCount = allFormatted.filter((p: any) => p.status === 'PORTING_SUBMITTED' || p.status === 'SUBMITTED').length;
    const inProgressCount = allFormatted.filter((p: any) =>
      ['IN_PROGRESS', 'SUBMITTED', 'PORTING_SUBMITTED', 'CONTRACT_SENT', 'SIGNED', 'CSR_DETAILS', 'CUT_SHEET_REVIEW'].includes(p.status)
    ).length;
    const actionRequiredCount = allFormatted.filter((p: any) =>
      ['REJECTED', 'CANCELLED', 'PENDING'].includes(p.status)
    ).length;

    // 4. Filter by statusFilter
    let formatted = allFormatted;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        formatted = formatted.filter((p: any) => ['REJECTED', 'CANCELLED', 'PENDING'].includes(p.status));
      } else if (statusFilter === 'IN_PROGRESS_ALL') {
        formatted = formatted.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'ONBOARDED');
      } else {
        formatted = formatted.filter((p: any) => p.status === statusFilter);
      }
    } else {
      formatted = formatted.filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'ONBOARDED');
    }

    // 5. Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      formatted = formatted.filter(
        (p: any) =>
          p.property_name.toLowerCase().includes(lowerSearch) ||
          p.organization_name.toLowerCase().includes(lowerSearch) ||
          p.property_phone.toLowerCase().includes(lowerSearch) ||
          (p.notes && p.notes.toLowerCase().includes(lowerSearch))
      );
    }

    // 6. Sorting
    formatted.sort((a: any, b: any) => {
      if (sortBy === 'OLDEST') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'PROPERTY_ASC') return a.property_name.localeCompare(b.property_name);
      if (sortBy === 'ORG_ASC') return a.organization_name.localeCompare(b.organization_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const totalCountFiltered = formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        totalCount: totalCountFiltered,
        totalPages: Math.ceil(totalCountFiltered / limit) || 1,
        currentPage: page,
        pageSize: limit,
      },
      metrics: {
        totalRequests: totalCount,
        inProgressCount,
        focReceivedCount,
        completedCount,
        actionRequiredCount,
        submittedCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      organization_id,
      property_name,
      property_address,
      city,
      state,
      zip_code,
      country,
      property_phone,
      fax,
      monthly_price,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      partner_id,
      partner_commission_override,
      e911_status,
      ray_baud_and_logs_enabled,
      ray_baum_status,
      target_date,
      carrier_details,
      status,
      attachments,
    } = body;

    if (!property_name?.trim() || !property_phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Property Name and Phone Number are required.' },
        { status: 400 }
      );
    }

    const isE911 = ray_baud_and_logs_enabled !== undefined
      ? Boolean(ray_baud_and_logs_enabled)
      : (e911_status === 'VERIFIED');

    const fullAddress = property_address?.trim() || 'Address Pending';
    const finalCity = city?.trim() || 'Pending';
    const finalState = state?.trim() || 'Pending';
    const finalZip = zip_code?.trim() || '00000';
    const numericPrice = monthly_price !== null && monthly_price !== undefined && monthly_price !== '' ? Number(monthly_price) : null;
    const requestedStatus = status || 'DRAFT';
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeStageDateKey = getStageDateKeyForStatus(requestedStatus) || 'draft_date';
    const initialStageDateVal = body[activeStageDateKey] || target_date || todayStr;

    let createdOpId: string | null = null;
    let newProp: any = null;

    // 1. ALWAYS create property record in properties table (whether organization_id is provided or unassigned!)
    const propInsertPayload: Record<string, any> = {
      name: property_name.trim(),
      address: fullAddress,
      city: finalCity,
      state: finalState,
      zip_code: finalZip,
      country: country?.trim() || 'USA',
      main_phone: property_phone.trim(),
      fax: fax ? fax.trim() : null,
      base_price: numericPrice,
      monthly_price: numericPrice,
      partner_id: partner_id || null,
      partner_commission_override:
        partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
          ? Number(partner_commission_override)
          : null,
      general_manager_name: general_manager_name ? general_manager_name.trim() : null,
      general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
      general_manager_email: general_manager_email ? general_manager_email.trim() : null,
      ray_baud_and_logs_enabled: isE911,
      status: requestedStatus === 'COMPLETED' ? 'ACTIVE' : 'ONBOARDING',
    };

    const { data: propData, error: propErr } = await db
      .from('properties')
      .insert({
        ...propInsertPayload,
        ray_baum_status: ray_baum_status || (isE911 ? 'ACTIVE' : 'INACTIVE'),
      })
      .select()
      .single();

    if (propErr) {
      // Fallback insert without optional newer columns if any column doesn't exist yet
      const { data: fallbackProp } = await db
        .from('properties')
        .insert({
          name: property_name.trim(),
          address: fullAddress,
          city: finalCity,
          state: finalState,
          zip_code: finalZip,
          country: country?.trim() || 'USA',
          main_phone: property_phone.trim(),
          fax: fax ? fax.trim() : null,
          monthly_price: numericPrice,
          general_manager_name: general_manager_name ? general_manager_name.trim() : null,
          general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
          general_manager_email: general_manager_email ? general_manager_email.trim() : null,
          ray_baud_and_logs_enabled: isE911,
          status: requestedStatus === 'COMPLETED' ? 'ACTIVE' : 'ONBOARDING',
        })
        .select()
        .single();
      newProp = fallbackProp;
    } else {
      newProp = propData;
    }

    if (organization_id && newProp) {
      // 2. Link in organization_properties
      const { data: newOp } = await db
        .from('organization_properties')
        .insert({
          organization_id,
          property_id: newProp.id,
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (newOp) {
        createdOpId = newOp.id;

        // 3. Create initial onboarding record with initial stage and dates
        const onboardingData: Record<string, any> = {
          organization_property_id: newOp.id,
          status: requestedStatus,
          target_date: target_date || initialStageDateVal,
          draft_date: body.draft_date || todayStr,
          [activeStageDateKey]: initialStageDateVal,
        };
        if (body.contract_sent_date) onboardingData.contract_sent_date = body.contract_sent_date;
        if (body.signed_date) onboardingData.signed_date = body.signed_date;
        if (body.csr_details_date) onboardingData.csr_details_date = body.csr_details_date;
        if (body.cut_sheet_review_date) onboardingData.cut_sheet_review_date = body.cut_sheet_review_date;
        if (body.porting_submitted_date) onboardingData.porting_submitted_date = body.porting_submitted_date;
        if (body.sof_review_date) onboardingData.sof_review_date = body.sof_review_date;
        if (body.foc_confirmed_date) onboardingData.foc_confirmed_date = body.foc_confirmed_date;
        if (body.live_cutover_date) onboardingData.live_cutover_date = body.live_cutover_date;
        if (body.assigned_to) onboardingData.assigned_to = body.assigned_to;
        if (body.assigned_to_name) onboardingData.assigned_to_name = body.assigned_to_name;
        if (body.internal_notes) onboardingData.internal_notes = body.internal_notes;

        const { error: obInsertErr } = await db.from('onboardings').insert(onboardingData);
        if (obInsertErr) {
          // Retry with safe legacy enum & core columns if enum/columns aren't migrated yet
          await db.from('onboardings').insert({
            organization_property_id: newOp.id,
            status: toSafeLegacyEnum(requestedStatus),
            target_date: target_date || initialStageDateVal,
          });
        }

        // 4. Create e911 record
        await db.from('e911_records').insert({
          organization_property_id: newOp.id,
          emergency_address: `${fullAddress}, ${finalCity}, ${finalState} ${finalZip}`,
          status: isE911 ? 'VERIFIED' : 'PENDING',
          verified_at: isE911 ? new Date().toISOString() : null,
        });
      }
    }

    // Build initial metadata to store in porting_requests.notes so monthly_price, stage_dates, effective_stage, and attachments are 100% persisted
    const initialMeta = {
      effective_stage: requestedStatus,
      stage_dates: {
        effective_stage: requestedStatus,
        target_date: target_date || initialStageDateVal,
        draft_date: body.draft_date || todayStr,
        [activeStageDateKey]: initialStageDateVal,
        ...(body.contract_sent_date ? { contract_sent_date: body.contract_sent_date } : {}),
        ...(body.signed_date ? { signed_date: body.signed_date } : {}),
        ...(body.csr_details_date ? { csr_details_date: body.csr_details_date } : {}),
        ...(body.cut_sheet_review_date ? { cut_sheet_review_date: body.cut_sheet_review_date } : {}),
        ...(body.porting_submitted_date ? { porting_submitted_date: body.porting_submitted_date } : {}),
        ...(body.foc_confirmed_date ? { foc_confirmed_date: body.foc_confirmed_date } : {}),
        ...(body.live_cutover_date ? { live_cutover_date: body.live_cutover_date } : {}),
      },
      stage_assignments: {
        effective_stage: requestedStatus,
        ...(body.assigned_to ? { assigned_to: body.assigned_to } : {}),
        ...(body.assigned_to_name ? { assigned_to_name: body.assigned_to_name } : {}),
        ...(body.stage_assignments ? { all_stages: body.stage_assignments } : {}),
      },
      property_details: {
        street_address: fullAddress,
        city: finalCity,
        state: finalState,
        zip_code: finalZip,
        country: country?.trim() || 'USA',
        property_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        monthly_price: numericPrice,
        partner_id: partner_id || null,
        partner_commission_override:
          partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
            ? Number(partner_commission_override)
            : null,
        general_manager_name: general_manager_name ? general_manager_name.trim() : null,
        general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
        general_manager_email: general_manager_email ? general_manager_email.trim() : null,
        e911_status: isE911 ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: ray_baum_status || (isE911 ? 'ACTIVE' : 'INACTIVE'),
      },
      attachments: Array.isArray(attachments) ? attachments : [],
    };
    const metaNotesString = `<!--METADATA:${JSON.stringify(initialMeta)}-->${body.internal_notes ? `\n${body.internal_notes}` : ''}`;

    // 5. Insert porting request (with automatic fallback if status enum isn't migrated yet)
    const basePrPayload = {
      organization_id: organization_id || null,
      organization_property_id: createdOpId,
      created_by: user?.id || null,
      property_name: property_name.trim(),
      property_address: `${fullAddress}${finalCity !== 'Pending' ? `, ${finalCity}, ${finalState} ${finalZip}` : ''}`,
      property_phone: property_phone.trim(),
      fax: fax ? fax.trim() : null,
      carrier_details: carrier_details ? carrier_details.trim() : null,
      target_date: target_date || initialStageDateVal,
      notes: metaNotesString,
      is_activated: false,
    };

    let { data: newPorting, error: insertErr } = await db
      .from('porting_requests')
      .insert({
        ...basePrPayload,
        status: requestedStatus,
      })
      .select()
      .single();

    if (insertErr && insertErr.message?.includes('invalid input value for enum')) {
      const retry = await db
        .from('porting_requests')
        .insert({
          ...basePrPayload,
          status: toSafeLegacyEnum(requestedStatus),
        })
        .select()
        .single();
      newPorting = retry.data;
      insertErr = retry.error;
    }

    if (insertErr || !newPorting) {
      return NextResponse.json({ success: false, error: insertErr?.message || 'Failed to create porting request' }, { status: 400 });
    }

    // 6. Insert attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attRows = attachments.map((att: any) => ({
        porting_request_id: newPorting.id,
        uploaded_by: user?.id || null,
        file_name: att.file_name,
        file_size: att.file_size || 0,
        mime_type: att.mime_type || 'application/pdf',
        storage_path: att.storage_path,
      }));

      await db.from('porting_attachments').insert(attRows);
      if (newProp?.id) {
        await db.from('properties').update({ attachments }).eq('id', newProp.id);
      }
      await db.from('porting_requests').update({ property_id: newProp?.id || null, attachments }).eq('id', newPorting.id);
    } else if (newProp?.id) {
      await db.from('porting_requests').update({ property_id: newProp.id }).eq('id', newPorting.id);
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_CREATED',
      entity_type: 'PORTING_REQUEST',
      entity_id: newPorting.id,
      entity_name: newPorting.property_name,
      changes: body,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newPorting,
        status: requestedStatus,
        stage: requestedStatus,
        monthly_price: numericPrice,
        attachments: Array.isArray(attachments) ? attachments : [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const body = await request.json();
    const {
      id,
      status,
      foc_date,
      target_date,
      rejection_reason,
      notes,
      draft_date,
      contract_sent_date,
      signed_date,
      csr_details_date,
      cut_sheet_review_date,
      porting_submitted_date,
      sof_review_date,
      foc_confirmed_date,
      live_cutover_date,
      completed_at,
      assigned_to,
      assigned_to_name,
      internal_notes,
      attachments,
      property_name,
      property_address,
      city,
      state,
      zip_code,
      country,
      property_phone,
      fax,
      monthly_price,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      partner_id,
      partner_commission_override,
      e911_status,
      ray_baud_and_logs_enabled,
      ray_baum_status,
      carrier_details,
      organization_id,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    // Fetch existing porting request first so we can merge metadata cleanly
    const { data: existingPr } = await db
      .from('porting_requests')
      .select('*, organization_property:organization_properties(id, property_id)')
      .eq('id', id)
      .maybeSingle();

    if (!existingPr) {
      return NextResponse.json({ success: false, error: 'Porting request not found.' }, { status: 404 });
    }

    const parsedMeta = parseNotesMetadata(existingPr.notes);
    const effectiveStatus =
      status !== undefined
        ? (status === 'COMPLETED' || status === 'ONBOARDED' ? 'COMPLETED' : status)
        : (parsedMeta.effective_stage || existingPr.status || 'DRAFT');

    const isCompletedOrOnboarded = effectiveStatus === 'COMPLETED' || effectiveStatus === 'ONBOARDED';
    const activeStageDateKey = getStageDateKeyForStatus(effectiveStatus);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Merge stage dates into metadata
    const mergedDates: Record<string, any> = {
      ...parsedMeta.stage_dates,
      effective_stage: effectiveStatus,
      ...(target_date !== undefined ? { target_date } : {}),
      ...(draft_date !== undefined ? { draft_date } : {}),
      ...(contract_sent_date !== undefined ? { contract_sent_date } : {}),
      ...(signed_date !== undefined ? { signed_date } : {}),
      ...(csr_details_date !== undefined ? { csr_details_date } : {}),
      ...(cut_sheet_review_date !== undefined ? { cut_sheet_review_date } : {}),
      ...(porting_submitted_date !== undefined ? { porting_submitted_date } : {}),
      ...(sof_review_date !== undefined ? { sof_review_date } : {}),
      ...(foc_confirmed_date !== undefined || foc_date !== undefined
        ? { foc_confirmed_date: foc_confirmed_date !== undefined ? foc_confirmed_date : foc_date }
        : {}),
      ...(live_cutover_date !== undefined ? { live_cutover_date } : {}),
    };

    // Ensure the active stage has a date if status changed or date was provided via target_date
    if (activeStageDateKey && !mergedDates[activeStageDateKey]) {
      mergedDates[activeStageDateKey] = target_date || mergedDates.target_date || todayStr;
    }

    // Merge stage assignments into metadata
    const mergedAssignments: Record<string, any> = {
      ...parsedMeta.stage_assignments,
      effective_stage: effectiveStatus,
      ...(assigned_to !== undefined ? { assigned_to } : {}),
      ...(assigned_to_name !== undefined ? { assigned_to_name } : {}),
      ...(body.stage3_assigned_to !== undefined ? { stage3_assigned_to: body.stage3_assigned_to } : {}),
      ...(body.stage3_assigned_to_name !== undefined ? { stage3_assigned_to_name: body.stage3_assigned_to_name } : {}),
      ...(body.stage3_notes !== undefined ? { stage3_notes: body.stage3_notes } : {}),
      ...(body.stage4_assigned_to !== undefined ? { stage4_assigned_to: body.stage4_assigned_to } : {}),
      ...(body.stage4_assigned_to_name !== undefined ? { stage4_assigned_to_name: body.stage4_assigned_to_name } : {}),
      ...(body.stage4_notes !== undefined ? { stage4_notes: body.stage4_notes } : {}),
      ...(body.stage_assignments !== undefined ? { all_stages: body.stage_assignments } : {}),
      ...(body.billing_status !== undefined ? { billing_status: body.billing_status } : {}),
    };

    // Merge property details into metadata
    const mergedPropDetails: Record<string, any> = {
      ...parsedMeta.property_details,
      ...(property_address !== undefined ? { street_address: property_address.trim() } : {}),
      ...(city !== undefined ? { city: city.trim() } : {}),
      ...(state !== undefined ? { state: state.trim() } : {}),
      ...(zip_code !== undefined ? { zip_code: zip_code.trim() } : {}),
      ...(country !== undefined ? { country: country.trim() } : {}),
      ...(property_phone !== undefined ? { property_phone: property_phone.trim() } : {}),
      ...(fax !== undefined ? { fax: fax ? fax.trim() : null } : {}),
      ...(monthly_price !== undefined
        ? { monthly_price: monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null }
        : {}),
      ...(partner_id !== undefined ? { partner_id: partner_id || null } : {}),
      ...(partner_commission_override !== undefined
        ? {
            partner_commission_override:
              partner_commission_override !== null && partner_commission_override !== ''
                ? Number(partner_commission_override)
                : null,
          }
        : {}),
      ...(general_manager_name !== undefined ? { general_manager_name: general_manager_name ? general_manager_name.trim() : null } : {}),
      ...(general_manager_phone !== undefined ? { general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null } : {}),
      ...(general_manager_email !== undefined ? { general_manager_email: general_manager_email ? general_manager_email.trim() : null } : {}),
      ...(e911_status !== undefined ? { e911_status } : {}),
      ...(ray_baum_status !== undefined ? { ray_baum_status } : {}),
    };

    const mergedMetaAttachments =
      attachments !== undefined && Array.isArray(attachments)
        ? attachments
        : parsedMeta.attachments;

    const userNotes =
      notes !== undefined || internal_notes !== undefined
        ? (internal_notes ?? notes ?? '')
        : parsedMeta.cleanNotes;

    const metaString = `<!--METADATA:${JSON.stringify({
      effective_stage: effectiveStatus,
      stage_dates: mergedDates,
      stage_assignments: mergedAssignments,
      property_details: mergedPropDetails,
      attachments: mergedMetaAttachments,
    })}-->`;
    const finalNotes = `${metaString}${userNotes ? `\n${userNotes}` : ''}`;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      notes: finalNotes,
    };
    if (status !== undefined) updatePayload.status = isCompletedOrOnboarded ? 'COMPLETED' : status;
    if (target_date !== undefined) updatePayload.target_date = target_date;
    if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
    if (property_name !== undefined) updatePayload.property_name = property_name.trim();
    if (property_address !== undefined) updatePayload.property_address = property_address.trim();
    if (property_phone !== undefined) updatePayload.property_phone = property_phone.trim();
    if (fax !== undefined) updatePayload.fax = fax ? fax.trim() : null;
    if (carrier_details !== undefined) updatePayload.carrier_details = carrier_details ? carrier_details.trim() : null;
    if (organization_id !== undefined) {
      updatePayload.organization_id = organization_id || null;
      if (!organization_id) {
        updatePayload.organization_property_id = null;
      }
    }
    if (isCompletedOrOnboarded) {
      updatePayload.status = 'COMPLETED';
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.is_activated = true;
    }

    let { data: updated, error } = await db
      .from('porting_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*, organization_property:organization_properties(id, property_id)')
      .single();

    // If PostgreSQL enum porting_status_enum hasn't had the new stage value added yet, fallback to safe legacy enum
    if (error && error.message?.includes('invalid input value for enum')) {
      const retryPayload = {
        ...updatePayload,
        status: toSafeLegacyEnum(updatePayload.status),
      };
      const retry = await db
        .from('porting_requests')
        .update(retryPayload)
        .eq('id', id)
        .select('*, organization_property:organization_properties(id, property_id)')
        .single();
      updated = retry.data;
      error = retry.error;
    }

    if (error || !updated) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update porting request' }, { status: 400 });
    }

    let orgPropId = updated?.organization_property_id;
    let propId = updated?.organization_property?.property_id || updated?.property_id;

    // Fallback: If propId is not found via organization_property, look up property by name
    if (!propId) {
      const pName = (property_name?.trim() || updated?.property_name || '').trim();
      if (pName) {
        const { data: matchedProp } = await db
          .from('properties')
          .select('id')
          .ilike('name', pName)
          .maybeSingle();
        if (matchedProp) {
          propId = matchedProp.id;
        }
      }
    }

    // If porting request doesn't have an organization_property link yet, auto-create one when organization is assigned
    const effectiveOrgId = organization_id !== undefined ? organization_id : updated?.organization_id;
    if (effectiveOrgId && (!orgPropId || !propId)) {
      const isE911Initial = ray_baud_and_logs_enabled !== undefined ? Boolean(ray_baud_and_logs_enabled) : (e911_status === 'VERIFIED');
      const initPrice = monthly_price !== undefined
        ? (monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null)
        : (mergedPropDetails.monthly_price ?? null);

      if (!propId) {
        const { data: createdProp } = await db
          .from('properties')
          .insert({
            name: property_name?.trim() || updated.property_name || 'Property',
            address: property_address?.trim() || updated.property_address || 'Address pending',
            city: city?.trim() || mergedPropDetails.city || 'City',
            state: state?.trim() || mergedPropDetails.state || 'IL',
            zip_code: zip_code?.trim() || mergedPropDetails.zip_code || '00000',
            country: country?.trim() || mergedPropDetails.country || 'USA',
            main_phone: property_phone?.trim() || updated.property_phone || null,
            fax: fax ? fax.trim() : null,
            base_price: initPrice,
            monthly_price: initPrice,
            partner_id: partner_id || mergedPropDetails.partner_id || null,
            partner_commission_override:
              partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
                ? Number(partner_commission_override)
                : (mergedPropDetails.partner_commission_override ?? null),
            general_manager_name: general_manager_name ? general_manager_name.trim() : (mergedPropDetails.general_manager_name || null),
            general_manager_phone: general_manager_phone ? general_manager_phone.trim() : (mergedPropDetails.general_manager_phone || null),
            general_manager_email: general_manager_email ? general_manager_email.trim() : (mergedPropDetails.general_manager_email || null),
            ray_baud_and_logs_enabled: isE911Initial,
            status: isCompletedOrOnboarded ? 'ACTIVE' : 'ONBOARDING',
            onboarding_date: isCompletedOrOnboarded
              ? (live_cutover_date || completed_at || updated.completed_at || todayStr).slice(0, 10)
              : null,
          })
          .select('id')
          .single();

        if (createdProp) {
          propId = createdProp.id;
        }
      }

      if (propId && !orgPropId) {
        const { data: createdOp } = await db
          .from('organization_properties')
          .insert({
            organization_id: effectiveOrgId,
            property_id: propId,
            status: 'ACTIVE',
          })
          .select('id')
          .single();

        if (createdOp) {
          orgPropId = createdOp.id;
          await db
            .from('porting_requests')
            .update({ organization_property_id: createdOp.id })
            .eq('id', id);

          const obInsertPayload = {
            organization_property_id: createdOp.id,
            status: effectiveStatus,
            target_date: mergedDates.target_date || null,
            draft_date: mergedDates.draft_date || null,
            contract_sent_date: mergedDates.contract_sent_date || null,
            signed_date: mergedDates.signed_date || null,
            csr_details_date: mergedDates.csr_details_date || null,
            cut_sheet_review_date: mergedDates.cut_sheet_review_date || null,
            porting_submitted_date: mergedDates.porting_submitted_date || null,
            sof_review_date: mergedDates.sof_review_date || null,
            foc_confirmed_date: mergedDates.foc_confirmed_date || null,
            live_cutover_date: mergedDates.live_cutover_date || null,
          };

          const { error: obCreateErr } = await db.from('onboardings').insert(obInsertPayload);
          if (obCreateErr) {
            await db.from('onboardings').insert({
              organization_property_id: createdOp.id,
              status: toSafeLegacyEnum(effectiveStatus),
              target_date: mergedDates.target_date || null,
            });
          }

          await db.from('e911_records').insert({
            organization_property_id: createdOp.id,
            emergency_address: property_address?.trim() || updated.property_address || 'Address pending',
            status: isE911Initial ? 'VERIFIED' : 'PENDING',
            verified_at: isE911Initial ? new Date().toISOString() : null,
          });
        }
      }
    }

    // If propId is STILL missing (e.g. unassigned porting with no properties row yet), create it in properties table
    if (!propId) {
      const isE911Initial = ray_baud_and_logs_enabled !== undefined ? Boolean(ray_baud_and_logs_enabled) : (e911_status === 'VERIFIED');
      const initPrice = monthly_price !== undefined
        ? (monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null)
        : (mergedPropDetails.monthly_price ?? null);

      const { data: createdProp } = await db
        .from('properties')
        .insert({
          name: property_name?.trim() || updated.property_name || 'Property',
          address: property_address?.trim() || updated.property_address || 'Address pending',
          city: city?.trim() || mergedPropDetails.city || 'City',
          state: state?.trim() || mergedPropDetails.state || 'IL',
          zip_code: zip_code?.trim() || mergedPropDetails.zip_code || '00000',
          country: country?.trim() || mergedPropDetails.country || 'USA',
          main_phone: property_phone?.trim() || updated.property_phone || null,
          fax: fax ? fax.trim() : null,
          base_price: initPrice,
          monthly_price: initPrice,
          general_manager_name: general_manager_name ? general_manager_name.trim() : (mergedPropDetails.general_manager_name || null),
          general_manager_phone: general_manager_phone ? general_manager_phone.trim() : (mergedPropDetails.general_manager_phone || null),
          general_manager_email: general_manager_email ? general_manager_email.trim() : (mergedPropDetails.general_manager_email || null),
          ray_baud_and_logs_enabled: isE911Initial,
          status: isCompletedOrOnboarded ? 'ACTIVE' : 'ONBOARDING',
          onboarding_date: isCompletedOrOnboarded
            ? (live_cutover_date || completed_at || updated.completed_at || todayStr).slice(0, 10)
            : null,
        })
        .select('id')
        .single();
      if (createdProp) {
        propId = createdProp.id;
      }
    }

    // Calculate total services price currently assigned to this porting request
    const { data: prServices } = await db
      .from('porting_request_services')
      .select('service:services(price)')
      .eq('porting_request_id', id);
    const servicesTotal = (prServices || []).reduce((acc: number, item: any) => {
      const p = Number((item.service as any)?.price || 0);
      return acc + p;
    }, 0);

    // 1. Update Property table if propId exists
    if (propId) {
      const propUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (property_name !== undefined) propUpdate.name = property_name.trim();
      if (property_address !== undefined) propUpdate.address = property_address.trim();
      if (city !== undefined) propUpdate.city = city.trim();
      if (state !== undefined) propUpdate.state = state.trim();
      if (zip_code !== undefined) propUpdate.zip_code = zip_code.trim();
      if (country !== undefined) propUpdate.country = country.trim();
      if (property_phone !== undefined) propUpdate.main_phone = property_phone.trim();
      if (fax !== undefined) propUpdate.fax = fax ? fax.trim() : null;
      if (monthly_price !== undefined) {
        const rawBase = (monthly_price !== null && monthly_price !== '' && monthly_price !== undefined) ? Number(monthly_price) : null;
        propUpdate.base_price = rawBase;
        propUpdate.monthly_price = rawBase !== null ? (rawBase + servicesTotal) : (servicesTotal > 0 ? servicesTotal : null);
      } else if (servicesTotal > 0) {
        const { data: curProp } = await db.from('properties').select('base_price, monthly_price').eq('id', propId).maybeSingle();
        const base = Number(curProp?.base_price ?? curProp?.monthly_price ?? 0);
        propUpdate.monthly_price = base + servicesTotal;
      }
      if (partner_id !== undefined) propUpdate.partner_id = partner_id || null;
      if (partner_commission_override !== undefined) {
        propUpdate.partner_commission_override =
          partner_commission_override !== null && partner_commission_override !== ''
            ? Number(partner_commission_override)
            : null;
      }
      if (general_manager_name !== undefined) propUpdate.general_manager_name = general_manager_name ? general_manager_name.trim() : null;
      if (general_manager_phone !== undefined) propUpdate.general_manager_phone = general_manager_phone ? general_manager_phone.trim() : null;
      if (general_manager_email !== undefined) propUpdate.general_manager_email = general_manager_email ? general_manager_email.trim() : null;

      const isE911 = ray_baud_and_logs_enabled !== undefined
        ? Boolean(ray_baud_and_logs_enabled)
        : (e911_status === 'VERIFIED');
      if (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined) {
        propUpdate.ray_baud_and_logs_enabled = isE911;
      }
      if (ray_baum_status !== undefined) {
        propUpdate.ray_baum_status = ray_baum_status;
      } else if (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined) {
        propUpdate.ray_baum_status = isE911 ? 'ACTIVE' : 'INACTIVE';
      }

      if (body.onboarding_date !== undefined) {
        propUpdate.onboarding_date = body.onboarding_date ? String(body.onboarding_date).trim() : null;
        if (isCompletedOrOnboarded) propUpdate.status = 'ACTIVE';
      } else if (isCompletedOrOnboarded) {
        propUpdate.status = 'ACTIVE';
        const effectiveOnbDate = live_cutover_date || completed_at || updated.completed_at || todayStr;
        propUpdate.onboarding_date = effectiveOnbDate.slice(0, 10);
      }

      if (body.billing_status !== undefined) propUpdate.billing_status = body.billing_status;
      if (attachments !== undefined && Array.isArray(attachments)) propUpdate.attachments = attachments;

      const { error: propUpdErr } = await db.from('properties').update(propUpdate).eq('id', propId);
      if (propUpdErr) {
        // Fallback update with guaranteed core columns
        const corePropUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        if (propUpdate.name !== undefined) corePropUpdate.name = propUpdate.name;
        if (propUpdate.address !== undefined) corePropUpdate.address = propUpdate.address;
        if (propUpdate.city !== undefined) corePropUpdate.city = propUpdate.city;
        if (propUpdate.state !== undefined) corePropUpdate.state = propUpdate.state;
        if (propUpdate.zip_code !== undefined) corePropUpdate.zip_code = propUpdate.zip_code;
        if (propUpdate.main_phone !== undefined) corePropUpdate.main_phone = propUpdate.main_phone;
        if (propUpdate.fax !== undefined) corePropUpdate.fax = propUpdate.fax;
        if (propUpdate.monthly_price !== undefined) corePropUpdate.monthly_price = propUpdate.monthly_price;
        if (propUpdate.status !== undefined) corePropUpdate.status = propUpdate.status;
        if (propUpdate.onboarding_date !== undefined) corePropUpdate.onboarding_date = propUpdate.onboarding_date;
        await db.from('properties').update(corePropUpdate).eq('id', propId);
      }

      // Sync e911_records if orgPropId exists
      if (orgPropId && (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined)) {
        await db
          .from('e911_records')
          .update({
            status: isE911 ? 'VERIFIED' : 'PENDING',
            verified_at: isE911 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_property_id', orgPropId);
      }
    }

    // 2. Sync organization_properties if linked
    if (orgPropId) {
      const orgPropUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (organization_id) orgPropUpdate.organization_id = organization_id;
      if (isCompletedOrOnboarded) orgPropUpdate.status = 'ACTIVE';

      if (Object.keys(orgPropUpdate).length > 1) {
        await db
          .from('organization_properties')
          .update(orgPropUpdate)
          .eq('id', orgPropId);
      }
    }

    // 3. Sync onboarding table if linked (resilient to enum or missing optional column errors)
    if (orgPropId) {
      const obUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (status !== undefined) obUpdate.status = isCompletedOrOnboarded ? 'COMPLETED' : status;
      if (target_date !== undefined) obUpdate.target_date = target_date;
      if (mergedDates.draft_date !== undefined) obUpdate.draft_date = mergedDates.draft_date;
      if (mergedDates.contract_sent_date !== undefined) obUpdate.contract_sent_date = mergedDates.contract_sent_date;
      if (mergedDates.signed_date !== undefined) obUpdate.signed_date = mergedDates.signed_date;
      if (mergedDates.csr_details_date !== undefined) obUpdate.csr_details_date = mergedDates.csr_details_date;
      if (mergedDates.cut_sheet_review_date !== undefined) obUpdate.cut_sheet_review_date = mergedDates.cut_sheet_review_date;
      if (mergedDates.porting_submitted_date !== undefined) obUpdate.porting_submitted_date = mergedDates.porting_submitted_date;
      if (mergedDates.sof_review_date !== undefined) obUpdate.sof_review_date = mergedDates.sof_review_date;
      if (mergedDates.foc_confirmed_date !== undefined) obUpdate.foc_confirmed_date = mergedDates.foc_confirmed_date;
      if (mergedDates.live_cutover_date !== undefined) obUpdate.live_cutover_date = mergedDates.live_cutover_date;
      if (assigned_to !== undefined) obUpdate.assigned_to = assigned_to;
      if (assigned_to_name !== undefined) obUpdate.assigned_to_name = assigned_to_name;
      if (internal_notes !== undefined) obUpdate.internal_notes = internal_notes;
      if (body.stage3_assigned_to !== undefined) obUpdate.stage3_assigned_to = body.stage3_assigned_to;
      if (body.stage3_assigned_to_name !== undefined) obUpdate.stage3_assigned_to_name = body.stage3_assigned_to_name;
      if (body.stage3_notes !== undefined) obUpdate.stage3_notes = body.stage3_notes;
      if (body.stage4_assigned_to !== undefined) obUpdate.stage4_assigned_to = body.stage4_assigned_to;
      if (body.stage4_assigned_to_name !== undefined) obUpdate.stage4_assigned_to_name = body.stage4_assigned_to_name;
      if (body.stage4_notes !== undefined) obUpdate.stage4_notes = body.stage4_notes;
      if (attachments !== undefined) obUpdate.attachments = attachments;
      if (body.stage_assignments !== undefined) obUpdate.stage_assignments = body.stage_assignments;
      if (body.billing_status !== undefined) obUpdate.billing_status = body.billing_status;
      if (isCompletedOrOnboarded) obUpdate.completed_at = new Date().toISOString();

      const { data: existingOb } = await db
        .from('onboardings')
        .select('id')
        .eq('organization_property_id', orgPropId)
        .maybeSingle();

      if (existingOb) {
        const { error: obErr } = await db
          .from('onboardings')
          .update(obUpdate)
          .eq('id', existingOb.id);
        if (obErr) {
          // Retry with safe legacy enum and core columns so it never blocks stage transition
          const safeObUpdate: Record<string, any> = {
            updated_at: new Date().toISOString(),
          };
          if (status !== undefined) safeObUpdate.status = toSafeLegacyEnum(obUpdate.status);
          if (target_date !== undefined) safeObUpdate.target_date = target_date;
          if (isCompletedOrOnboarded) safeObUpdate.completed_at = new Date().toISOString();
          await db.from('onboardings').update(safeObUpdate).eq('id', existingOb.id);
        }
      } else {
        const { error: obErr } = await db
          .from('onboardings')
          .insert({
            organization_property_id: orgPropId,
            status: obUpdate.status || 'DRAFT',
            ...obUpdate,
          });
        if (obErr) {
          await db.from('onboardings').insert({
            organization_property_id: orgPropId,
            status: toSafeLegacyEnum(obUpdate.status || 'DRAFT'),
            target_date: target_date || null,
          });
        }
      }
    }

    // 4. Sync optional columns on porting_requests & porting_attachments table
    const prExtraUpdate: Record<string, any> = {};
    if (propId) prExtraUpdate.property_id = propId;
    if (body.stage_assignments !== undefined) prExtraUpdate.stage_assignments = body.stage_assignments;
    if (body.billing_status !== undefined) prExtraUpdate.billing_status = body.billing_status;
    if (attachments !== undefined && Array.isArray(attachments)) prExtraUpdate.attachments = attachments;
    if (Object.keys(prExtraUpdate).length > 0) {
      await db.from('porting_requests').update(prExtraUpdate).eq('id', id);
    }

    if (attachments !== undefined && Array.isArray(attachments)) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Sync porting_attachments table: remove deleted ones and insert new ones
      const { data: existingAttRows } = await db
        .from('porting_attachments')
        .select('id, storage_path')
        .eq('porting_request_id', id);

      const keepPaths = new Set(attachments.map((a: any) => a.storage_path).filter(Boolean));
      const toDeleteIds = (existingAttRows || [])
        .filter((row: any) => row.storage_path && !keepPaths.has(row.storage_path))
        .map((row: any) => row.id);

      if (toDeleteIds.length > 0) {
        await db.from('porting_attachments').delete().in('id', toDeleteIds);
      }

      const existingPaths = new Set((existingAttRows || []).map((r: any) => r.storage_path));
      const newAtts = attachments.filter((a: any) => a.storage_path && !existingPaths.has(a.storage_path));
      if (newAtts.length > 0) {
        const attRows = newAtts.map((att: any) => ({
          porting_request_id: id,
          uploaded_by: user?.id || null,
          file_name: att.file_name,
          file_size: att.file_size || 0,
          mime_type: att.mime_type || 'application/pdf',
          storage_path: att.storage_path,
        }));
        await db.from('porting_attachments').insert(attRows);
      }
    }

    await logAuditEvent({
      action: 'PORTING_STATUS_CHANGED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: updated.property_name || 'Porting Request',
      changes: updatePayload,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        status: effectiveStatus,
        stage: effectiveStatus,
        attachments: mergedMetaAttachments,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    const { error } = await db.from('porting_requests').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_DELETED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: `Porting Request ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Porting request deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
