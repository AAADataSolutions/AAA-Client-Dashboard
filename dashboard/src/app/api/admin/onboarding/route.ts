import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const stageFilter = searchParams.get('stage') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. Fetch Real KPI Counts directly from DB
    const { count: totalOnboardingCount } = await supabase
      .from('onboardings')
      .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await supabase
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');

    const { count: inProgressCount } = await supabase
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PORTING_WAITING', 'PORTING_SUBMITTED', 'SOF_WAITING', 'FOC_RECEIVED']);

    const { count: pendingReviewCount } = await supabase
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['DRAFT', 'CONTRACT_SENT', 'SIGNED']);

    // 2. Query Onboardings with joined Property and Organization
    let query = supabase
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
      // Fallback query
      const { data: fallbackList, error: fErr } = await supabase
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

    // 3. Process & Map Records
    let formatted = (rawOnboardings || []).map((item: any) => {
      const orgProp = item.org_property;
      const prop = orgProp?.property;
      const org = orgProp?.organization;

      let pct = 10;
      switch (item.status) {
        case 'DRAFT': pct = 10; break;
        case 'CONTRACT_SENT': pct = 25; break;
        case 'SIGNED': pct = 40; break;
        case 'PORTING_WAITING': pct = 55; break;
        case 'PORTING_SUBMITTED': pct = 70; break;
        case 'SOF_WAITING': pct = 80; break;
        case 'FOC_RECEIVED': pct = 90; break;
        case 'COMPLETED': pct = 100; break;
      }

      return {
        id: item.id,
        status: item.status || 'DRAFT',
        target_date: item.target_date,
        contract_sent_at: item.contract_sent_at,
        signed_at: item.signed_at,
        porting_waiting_at: item.porting_waiting_at,
        porting_submitted_at: item.porting_submitted_at,
        sof_waiting_at: item.sof_waiting_at,
        foc_received_at: item.foc_received_at,
        completed_at: item.completed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        progress_pct: pct,
        property_id: prop?.id || '',
        property_name: prop?.name || 'New Property',
        organization_id: org?.id || '',
        organization_name: org?.name || 'Direct Portfolio',
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
          o.organization_name.toLowerCase().includes(lowerSearch)
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
      // NEWEST
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      property_name,
      address,
      city,
      state,
      zip_code,
      main_phone,
      contact_person_name,
      contact_person_email,
      general_manager_name,
      status,
      target_date,
    } = body;

    if (!property_name || !property_name.trim()) {
      return NextResponse.json({ success: false, error: 'Property name is required.' }, { status: 400 });
    }

    // 1. Create the brand new property in `public.properties`
    const { data: newProp, error: propErr } = await supabase
      .from('properties')
      .insert({
        name: property_name.trim(),
        address: address?.trim() || 'Pending Address',
        city: city?.trim() || 'TBD',
        state: state?.trim() || 'TBD',
        zip_code: zip_code?.trim() || '00000',
        country: 'USA',
        main_phone: main_phone?.trim() || null,
        contact_person_name: contact_person_name?.trim() || null,
        contact_person_email: contact_person_email?.trim() || null,
        general_manager_name: general_manager_name?.trim() || null,
        status: 'ACTIVE',
        ray_baud_and_logs_enabled: false,
      })
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: `Failed to create property: ${propErr.message}` }, { status: 400 });
    }

    // 2. Fetch the default / first client organization to associate with
    let targetOrgId = body.organization_id;
    if (!targetOrgId) {
      const { data: firstOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();

      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) {
      // If no organization exists, create a default Primary Portfolio organization
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .insert({
          name: 'Primary Portfolio',
          primary_email: 'admin@aaasolutions.com',
          status: 'ACTIVE',
        })
        .select('id')
        .single();
      targetOrgId = defaultOrg?.id;
    }

    // 3. Link this new property in `public.organization_properties`
    const { data: newLink, error: linkErr } = await supabase
      .from('organization_properties')
      .insert({
        organization_id: targetOrgId,
        property_id: newProp.id,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (linkErr) {
      return NextResponse.json({ success: false, error: `Failed to link property: ${linkErr.message}` }, { status: 400 });
    }

    // 4. Create the onboarding record in `public.onboardings` (WITHOUT notes column)
    const initialStatus = status || 'DRAFT';
    const { data: newOnboarding, error: onbErr } = await supabase
      .from('onboardings')
      .insert({
        organization_property_id: newLink.id,
        status: initialStatus,
        target_date: target_date || null,
        contract_sent_at: initialStatus === 'CONTRACT_SENT' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (onbErr) {
      return NextResponse.json({ success: false, error: `Failed to create onboarding tracker: ${onbErr.message}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...newOnboarding,
        property: newProp,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      id,
      status,
      target_date,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Onboarding ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
      const now = new Date().toISOString();
      if (status === 'CONTRACT_SENT') updates.contract_sent_at = now;
      if (status === 'SIGNED') updates.signed_at = now;
      if (status === 'PORTING_WAITING') updates.porting_waiting_at = now;
      if (status === 'PORTING_SUBMITTED') updates.porting_submitted_at = now;
      if (status === 'SOF_WAITING') updates.sof_waiting_at = now;
      if (status === 'FOC_RECEIVED') updates.foc_received_at = now;
      if (status === 'COMPLETED') updates.completed_at = now;
    }
    if (target_date !== undefined) updates.target_date = target_date;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('onboardings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
