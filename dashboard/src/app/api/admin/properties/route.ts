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

    // 2. Fetch Properties with Org Links, Onboardings & Services
    let query = supabase
      .from('properties')
      .select(`
        *,
        org_links:organization_properties(
          id,
          status,
          organization:organizations(id, name, email, phone),
          onboardings(id, status, target_date),
          services_links:organization_property_services(id, service_id)
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,address.ilike.%${search}%,general_manager_name.ilike.%${search}%,contact_person_name.ilike.%${search}%,general_manager_email.ilike.%${search}%`);
    }

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (e911Filter === 'VERIFIED') {
      query = query.eq('ray_baud_and_logs_enabled', true);
    } else if (e911Filter === 'AUDIT_REQUIRED') {
      query = query.eq('ray_baud_and_logs_enabled', false);
    }

    const { data: rawProps, error } = await query;

    if (error) {
      // Fallback
      const { data: fallbackProps, error: fbErr } = await supabase
        .from('properties')
        .select('*');

      if (fbErr) {
        return NextResponse.json({ success: false, error: fbErr.message }, { status: 400 });
      }

      const processedFallback = (fallbackProps || []).map((p: any) => ({
        ...p,
        general_manager_name: p.general_manager_name || p.contact_person_name || 'N/A',
        general_manager_phone: p.general_manager_phone || p.main_phone || 'N/A',
        general_manager_email: p.general_manager_email || p.contact_person_email || 'N/A',
        organizations_count: 0,
        organizations: [],
        services_count: 0,
        onboarding_stage: 'Draft Initialized',
        e911_status: p.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: (p.ray_baum_status === 'ACTIVE' || p.ray_baud_and_logs_enabled) ? 'Active' : 'Inactive',
      }));

      return NextResponse.json({
        success: true,
        data: processedFallback.slice((page - 1) * limit, page * limit),
        pagination: {
          totalCount: processedFallback.length,
          totalPages: Math.ceil(processedFallback.length / limit) || 1,
          currentPage: page,
          limit,
        },
        metrics: {
          totalProperties: totalPropertiesCount || processedFallback.length,
          e911VerifiedCount: verifiedE911Count || 0,
          totalServicesCount: totalServicesCount || 0,
          pendingOrInactiveCount: pendingOrInactiveCount || 0,
        },
      });
    }

    // 3. Process & Map Records
    let processed = (rawProps || []).map((prop: any, idx: number) => {
      const orgLinks = Array.isArray(prop.org_links) ? prop.org_links : [];
      const orgs = orgLinks.map((ol: any) => ol.organization).filter(Boolean);
      const primaryOrg = orgs[0] || null;

      // Calculate dynamic count of services
      let dynamicServiceCount = 0;
      orgLinks.forEach((ol: any) => {
        if (Array.isArray(ol.services_links)) {
          dynamicServiceCount += ol.services_links.length;
        }
      });

      // Calculate onboarding stage
      let stage = 'Draft Initialized';
      orgLinks.forEach((ol: any) => {
        if (Array.isArray(ol.onboardings) && ol.onboardings.length > 0) {
          const onb = ol.onboardings[0];
          if (onb.status) {
            stage = onb.status.replace(/_/g, ' ');
          }
        }
      });

      const gmName = prop.general_manager_name || prop.contact_person_name || 'N/A';
      const gmPhone = prop.general_manager_phone || prop.main_phone || 'N/A';
      const gmEmail = prop.general_manager_email || prop.contact_person_email || 'N/A';

      const isE911Verified = Boolean(prop.ray_baud_and_logs_enabled);

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
        status: prop.status || 'ACTIVE',
        organizations_count: orgs.length,
        organizations: orgs,
        primary_organization: primaryOrg,
        services_count: dynamicServiceCount,
        onboarding_stage: stage,
        e911_status: isE911Verified ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: (prop.ray_baum_status === 'ACTIVE' || isE911Verified) ? 'Active' : 'Inactive',
        created_at: prop.created_at,
        updated_at: prop.updated_at || prop.created_at,
      };
    });

    // 4. Filter by Ray Baum status if requested
    if (rayBaumFilter === 'ACTIVE') {
      processed = processed.filter((p: any) => p.ray_baum_status === 'Active');
    } else if (rayBaumFilter === 'INACTIVE') {
      processed = processed.filter((p: any) => p.ray_baum_status === 'Inactive');
    }

    // 5. Filter by Organization if requested
    if (orgId !== 'ALL') {
      processed = processed.filter((p: any) =>
        p.organizations.some((o: any) => o.id === orgId)
      );
    }

    // 5. Sorting
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
        ray_baud_and_logs_enabled: ray_baud_and_logs_enabled ?? true,
        status: status || 'ACTIVE',
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

      await supabase.from('organization_properties').insert({
        organization_id,
        property_id: newProp.id,
        status: status || 'ACTIVE',
      });
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
      },
    });

    return NextResponse.json({ success: true, data: newProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
