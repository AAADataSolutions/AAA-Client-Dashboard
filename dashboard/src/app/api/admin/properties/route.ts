import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const orgId = searchParams.get('orgId') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const e911Filter = searchParams.get('e911') || 'ALL';
    const rayBaumFilter = searchParams.get('rayBaum') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NAME_ASC';

    // 1. Fetch Global DB Metrics
    const { count: totalPropertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedE911Count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('ray_baud_and_logs_enabled', true);

    const { count: totalServicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    const { count: pendingOrInactiveCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'ACTIVE');

    // 2. Fetch Properties
    let query = supabase.from('properties').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,address.ilike.%${search}%,general_manager_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,general_manager_email.ilike.%${search}%`);
    }

    if (status !== 'ALL') {
      if (status === 'UNASSIGNED') {
        // Will be filtered in memory
      } else {
        query = query.eq('status', status);
      }
    }

    if (e911Filter === 'VERIFIED') {
      query = query.eq('ray_baud_and_logs_enabled', true);
    } else if (e911Filter === 'AUDIT_REQUIRED') {
      query = query.eq('ray_baud_and_logs_enabled', false);
    }

    const { data: rawProps, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const propList = rawProps || [];
    const propIds = propList.map((p: any) => p.id);

    // 3. Fetch Organization Properties links
    let allOrgProps: any[] = [];
    if (propIds.length > 0) {
      const { data: opData } = await supabase
        .from('organization_properties')
        .select(`
          id,
          property_id,
          status,
          organization:organizations(id, name, email, phone),
          onboardings(id, status, target_date)
        `)
        .in('property_id', propIds);
      allOrgProps = opData || [];
    }

    // 4. Fetch Services linked via organization_property_services
    const opIds = allOrgProps.map((op: any) => op.id);
    let allServicesLinks: any[] = [];
    if (opIds.length > 0) {
      const { data: opsData } = await supabase
        .from('organization_property_services')
        .select('id, organization_property_id, service_id')
        .in('organization_property_id', opIds);
      allServicesLinks = opsData || [];
    }

    // 5. Map and combine
    let processed = propList.map((prop: any, idx: number) => {
      const matchingOps = allOrgProps.filter((op: any) => op.property_id === prop.id);
      const matchingOpIds = matchingOps.map((op: any) => op.id);
      const orgs = matchingOps.map((op: any) => op.organization).filter(Boolean);
      const primaryOrg = orgs[0] || null;

      // Count actual services linked to this property
      const dynamicServiceCount = allServicesLinks.filter((sl: any) =>
        matchingOpIds.includes(sl.organization_property_id)
      ).length;

      // Calculate onboarding stage
      const STAGE_MAP: Record<string, string> = {
        DRAFT: 'Draft Initialized',
        CONTRACT_SENT: 'Contract Sent',
        SIGNED: 'Contract Signed & Waiting for LOA',
        PORTING_WAITING: 'Contract Signed & Waiting for LOA',
        PORTING_SUBMITTED: 'Porting Submitted',
        SOF_WAITING: 'SOF Review',
        FOC_RECEIVED: 'FOC Confirmed',
        COMPLETED: 'Onboarded',
      };
      let stage = 'Draft Initialized';
      for (const op of matchingOps) {
        if (Array.isArray(op.onboardings) && op.onboardings.length > 0) {
          const onb = op.onboardings[0];
          if (onb?.status) {
            stage = STAGE_MAP[onb.status] || onb.status.replace(/_/g, ' ');
            break;
          }
        }
      }

      const gmName = prop.general_manager_name || prop.contact_person_name || 'N/A';
      const gmPhone = prop.general_manager_phone || prop.main_phone || 'N/A';
      const gmEmail = prop.general_manager_email || prop.contact_person_email || 'N/A';

      const isE911Verified = Boolean(prop.ray_baud_and_logs_enabled);
      const isAssigned = Boolean(primaryOrg || orgs.length > 0);

      return {
        id: prop.id,
        code: `PR-${100 + idx}`,
        name: prop.name,
        address: prop.address,
        city: prop.city,
        state: prop.state,
        zip_code: prop.zip_code,
        country: prop.country || 'USA',
        main_phone: prop.main_phone,
        fax: prop.fax,
        contact_person_name: prop.contact_person_name,
        contact_person_email: prop.contact_person_email,
        general_manager_name: gmName,
        general_manager_phone: gmPhone,
        general_manager_email: gmEmail,
        ray_baud_and_logs_enabled: isE911Verified,
        status: isAssigned ? (prop.status || 'ACTIVE') : 'UNASSIGNED',
        is_assigned: isAssigned,
        organizations_count: orgs.length,
        organizations: orgs,
        primary_organization: primaryOrg,
        organization_name: primaryOrg?.name || 'Unassigned',
        org_property_id: matchingOps[0]?.id || null,
        org_links: matchingOps,
        services_count: dynamicServiceCount,
        onboarding_stage: stage,
        e911_status: isE911Verified ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: prop.ray_baum_status === 'ACTIVE' ? 'Active' : 'Inactive',
        created_at: prop.created_at,
        updated_at: prop.updated_at || prop.created_at,
      };
    });

    // Filter by Ray Baum status if requested
    if (rayBaumFilter === 'ACTIVE') {
      processed = processed.filter((p: any) => p.ray_baum_status === 'Active');
    } else if (rayBaumFilter === 'INACTIVE') {
      processed = processed.filter((p: any) => p.ray_baum_status === 'Inactive');
    }

    // Filter by Organization if requested
    if (orgId !== 'ALL') {
      processed = processed.filter((p: any) =>
        p.organizations.some((o: any) => o.id === orgId)
      );
    }

    if (status === 'UNASSIGNED') {
      processed = processed.filter((p: any) => !p.is_assigned);
    }

    // Sorting
    processed.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'NEWEST':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'ORGS_DESC':
          return (b.organizations_count || 0) - (a.organizations_count || 0);
        case 'SERVICES_DESC':
          return (b.services_count || 0) - (a.services_count || 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    const totalFiltered = processed.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = processed.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        totalCount: totalFiltered,
        totalPages,
        currentPage: page,
        limit,
      },
      metrics: {
        totalProperties: totalPropertiesCount || processed.length,
        e911VerifiedCount: verifiedE911Count || processed.filter((p: any) => p.ray_baud_and_logs_enabled).length,
        totalServicesCount: totalServicesCount || processed.reduce((acc: number, p: any) => acc + (p.services_count || 0), 0),
        pendingOrInactiveCount: pendingOrInactiveCount || processed.filter((p: any) => p.status !== 'ACTIVE').length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      organization_id,
      address,
      city,
      state,
      zip_code,
      country,
      main_phone,
      fax,
      contact_person_name,
      contact_person_email,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      ray_baud_and_logs_enabled,
      ray_baum_status,
      e911_status,
      status,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Property name is required.' }, { status: 400 });
    }

    if (!address || !city || !state || !zip_code) {
      return NextResponse.json({
        success: false,
        error: 'Complete street address, city, state, and zip code are required for E911 dispatch.',
      }, { status: 400 });
    }

    // Determine E911 and Ray Baum status
    const isE911Verified =
      ray_baud_and_logs_enabled !== undefined
        ? Boolean(ray_baud_and_logs_enabled)
        : (e911_status === 'VERIFIED' || e911_status === 'ACTIVE');

    const resolvedRayBaum = ray_baum_status || (isE911Verified ? 'ACTIVE' : 'INACTIVE');
    const resolvedStatus = status || (organization_id ? 'ACTIVE' : 'INACTIVE');

    const { data: newProp, error: propErr } = await supabase
      .from('properties')
      .insert({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: zip_code.trim(),
        country: country?.trim() || 'USA',
        main_phone: main_phone?.trim() || null,
        fax: fax?.trim() || null,
        contact_person_name: contact_person_name?.trim() || null,
        contact_person_email: contact_person_email?.trim() || null,
        general_manager_name: general_manager_name?.trim() || null,
        general_manager_phone: general_manager_phone?.trim() || null,
        general_manager_email: general_manager_email?.trim() || null,
        ray_baud_and_logs_enabled: isE911Verified,
        ray_baum_status: resolvedRayBaum,
        status: resolvedStatus,
      })
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    // Link to organization if specified (Rule 1: One property can be assigned to only one organization)
    let orgName = 'Unassigned';
    if (organization_id) {
      const { data: org } = await supabase.from('organizations').select('name').eq('id', organization_id).maybeSingle();
      if (org) orgName = org.name;

      const { data: newOp } = await supabase
        .from('organization_properties')
        .insert({
          organization_id,
          property_id: newProp.id,
          status: resolvedStatus,
        })
        .select('id')
        .single();

      if (newOp) {
        // Auto-create onboarding record (Rule 3)
        await supabase.from('onboardings').insert({
          organization_property_id: newOp.id,
          status: 'DRAFT',
        });

        // Auto-create e911 record
        await supabase.from('e911_records').insert({
          organization_property_id: newOp.id,
          emergency_address: `${address.trim()}, ${city.trim()}, ${state.trim()} ${zip_code.trim()}`,
          status: isE911Verified ? 'VERIFIED' : 'PENDING',
          verified_at: isE911Verified ? new Date().toISOString() : null,
        });
      }
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'PROPERTY_CREATED',
      entity_type: 'PROPERTY',
      entity_id: newProp.id,
      entity_name: newProp.name,
      changes: {
        name: newProp.name,
        address: newProp.address,
        city: newProp.city,
        state: newProp.state,
        zip_code: newProp.zip_code,
        organization_id,
        organization_name: orgName,
        status: newProp.status,
        e911_status: isE911Verified ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: resolvedRayBaum,
      },
    });

    return NextResponse.json({ success: true, data: newProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
