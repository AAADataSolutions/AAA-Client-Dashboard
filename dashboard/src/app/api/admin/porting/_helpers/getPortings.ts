import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStageDateKeyForStatus, parseNotesMetadata } from './portingMetadata';

export async function handleGetPortings(request: NextRequest) {
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
      ].flat(Infinity);
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
