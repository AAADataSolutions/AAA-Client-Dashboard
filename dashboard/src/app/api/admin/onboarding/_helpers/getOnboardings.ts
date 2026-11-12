import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function handleGetOnboardings(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const stageFilter = searchParams.get('stage') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. Fetch Real KPI Counts directly from DB
    const { count: totalOnboardingCount } = await db
      .from('onboardings')
      .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await db
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');

    const { count: inProgressCount } = await db
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PORTING_WAITING', 'PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED']);

    const { count: pendingReviewCount } = await db
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['DRAFT', 'CONTRACT_SENT', 'SIGNED']);

    // 2. Query Onboardings with joined Property and Organization
    let query = db
      .from('onboardings')
      .select(`
        *,
        org_property:organization_properties(
          id,
          property:properties(*),
          organization:organizations(*)
        )
      `, { count: 'exact' });

    if (stageFilter !== 'ALL') {
      query = query.eq('status', stageFilter);
    }

    const { data: rawOnboardings, error } = await query;

    if (error) {
      const { data: fallbackList, error: fErr } = await db
        .from('onboardings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fErr) {
        return NextResponse.json({ success: false, error: fErr.message }, { status: 400 });
      }

      const totalSimple = fallbackList?.length || 0;
      const paginated = (fallbackList || []).slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginated.map((item: any) => ({
          ...item,
          property_name: 'New Property',
          organization_name: 'Direct Portfolio',
          property_details: null,
          organization_details: null,
          progress_pct: item.status === 'COMPLETED' ? 100 : 30,
          assigned_to: item.assigned_to || null,
          assigned_to_name: item.assigned_to_name || null,
          assigned_at: item.assigned_at || null,
          internal_notes: item.internal_notes || null,
          attachments: item.attachments || [],
        })),
        pagination: {
          totalCount: totalSimple,
          totalPages: Math.ceil(totalSimple / limit) || 1,
          currentPage: page,
          limit,
        },
        metrics: {
          totalOnboardings: totalOnboardingCount || totalSimple,
          completedCount: completedCount || 0,
          inProgressCount: inProgressCount || 0,
          pendingReviewCount: pendingReviewCount || 0,
        },
      });
    }

    // Query onboarding_attachments if any
    const onboardingIds = (rawOnboardings || []).map((o: any) => o.id);
    const attachmentsByOnboarding: Record<string, any[]> = {};
    if (onboardingIds.length > 0) {
      try {
        const { data: attList } = await db
          .from('onboarding_attachments')
          .select('id, onboarding_id, file_name, file_size, mime_type, storage_path, created_at')
          .in('onboarding_id', onboardingIds);
        if (attList && Array.isArray(attList)) {
          attList.forEach((att: any) => {
            if (!attachmentsByOnboarding[att.onboarding_id]) {
              attachmentsByOnboarding[att.onboarding_id] = [];
            }
            attachmentsByOnboarding[att.onboarding_id].push(att);
          });
        }
      } catch (err) {
        // Table may not exist yet
      }
    }

    // 3. Process & Map Records
    let formatted = (rawOnboardings || []).map((item: any) => {
      const orgProp = item.org_property;
      const prop = orgProp?.property;
      const org = orgProp?.organization;

      let pct = 12.5;
      switch (item.status) {
        case 'DRAFT': pct = 12.5; break;
        case 'CONTRACT_SENT': pct = 25; break;
        case 'SIGNED': pct = 37.5; break;
        case 'CSR_DETAILS':
        case 'CSR_AND_CONTRACT_DETAILS': pct = 50; break;
        case 'CUT_SHEET_REVIEW':
        case 'SOF_WAITING':
        case 'CUT_SHEET': pct = 62.5; break;
        case 'PORTING_SUBMITTED':
        case 'SUBMITTED':
        case 'IN_PROGRESS': pct = 75; break;
        case 'FOC_RECEIVED': pct = 87.5; break;
        case 'COMPLETED': pct = 100; break;
        default: pct = 12.5;
      }

      // Merge relational attachments and JSONB attachments
      const tableAtts = attachmentsByOnboarding[item.id] || [];
      const jsonAtts = Array.isArray(item.attachments) ? item.attachments : [];
      const combinedAtts = [...tableAtts];
      jsonAtts.forEach((ja: any) => {
        if (!combinedAtts.some((ta: any) => ta.storage_path === ja.storage_path || (ta.id && ta.id === ja.id))) {
          combinedAtts.push(ja);
        }
      });

      return {
        id: item.id,
        status: item.status || 'DRAFT',
        stage: item.status || 'DRAFT',
        target_date: item.target_date,
        contract_sent_at: item.contract_sent_at,
        signed_at: item.signed_at,
        porting_waiting_at: item.porting_waiting_at,
        porting_submitted_at: item.porting_submitted_at,
        sof_waiting_at: item.sof_waiting_at,
        foc_received_at: item.foc_received_at,
        completed_at: item.completed_at,
        draft_date: item.draft_date,
        contract_sent_date: item.contract_sent_date,
        signed_date: item.signed_date,
        porting_submitted_date: item.porting_submitted_date,
        sof_review_date: item.sof_review_date,
        foc_confirmed_date: item.foc_confirmed_date,
        live_cutover_date: item.live_cutover_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
        progress_pct: pct,
        assigned_to: item.assigned_to || null,
        assigned_to_name: item.assigned_to_name || null,
        assigned_at: item.assigned_at || null,
        internal_notes: item.internal_notes || null,
        attachments: combinedAtts,
        property_id: prop?.id || '',
        property_name: prop?.name || 'New Property',
        property_address: prop?.address || '',
        property_city: prop?.city || '',
        property_state: prop?.state || '',
        property_zip: prop?.zip_code || '',
        general_manager_name: prop?.general_manager_name || prop?.contact_person_name || 'N/A',
        general_manager_phone: prop?.general_manager_phone || prop?.main_phone || 'N/A',
        general_manager_email: prop?.general_manager_email || prop?.contact_person_email || 'N/A',
        property_status: prop?.status || 'INACTIVE',
        ray_baud_and_logs_enabled: prop?.ray_baud_and_logs_enabled ?? false,
        organization_id: org?.id || '',
        organization_name: org?.name || 'Unassigned Organization',
        property_details: prop || null,
        organization_details: org || null,
      };
    });

    // 4. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      formatted = formatted.filter(
        (o: any) =>
          o.property_name.toLowerCase().includes(lowerSearch) ||
          o.organization_name.toLowerCase().includes(lowerSearch) ||
          o.property_address.toLowerCase().includes(lowerSearch) ||
          o.general_manager_name.toLowerCase().includes(lowerSearch) ||
          (o.assigned_to_name && o.assigned_to_name.toLowerCase().includes(lowerSearch)) ||
          (o.internal_notes && o.internal_notes.toLowerCase().includes(lowerSearch))
      );
    }

    // 5. Sorting
    if (sortBy === 'PROP_ASC') {
      formatted.sort((a: any, b: any) => a.property_name.localeCompare(b.property_name));
    } else if (sortBy === 'ORG_ASC') {
      formatted.sort((a: any, b: any) => a.organization_name.localeCompare(b.organization_name));
    } else if (sortBy === 'STATUS') {
      formatted.sort((a: any, b: any) => b.progress_pct - a.progress_pct);
    } else {
      formatted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const filteredTotal = formatted.length;
    const paginatedData = formatted.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        totalCount: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
        currentPage: page,
        limit,
      },
      metrics: {
        totalOnboardings: totalOnboardingCount || filteredTotal,
        completedCount: completedCount || 0,
        inProgressCount: inProgressCount || 0,
        pendingReviewCount: pendingReviewCount || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
