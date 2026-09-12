import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // 2. Fetch Properties with Org Links
    let query = supabase
      .from('properties')
      .select(`
        *,
        org_links:organization_properties(
          id,
          status,
          organization:organizations(id, name, email, phone)
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,address.ilike.%${search}%,general_manager_name.ilike.%${search}%,contact_person_name.ilike.%${search}%`);
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
        organizations_count: 0,
        organizations: [],
        services_count: 0,
        e911_status: p.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
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

      const words = (prop.name || 'Prop').split(' ');
      const initials =
        words.length > 1
          ? `${words[0][0]}${words[1][0]}`.toUpperCase()
          : prop.name.substring(0, 2).toUpperCase();

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
        general_manager_name: prop.general_manager_name,
        ray_baud_and_logs_enabled: Boolean(prop.ray_baud_and_logs_enabled),
        status: prop.status || 'ACTIVE',
        organizations_count: orgs.length,
        organizations: orgs,
        primary_organization: primaryOrg,
        services_count: 6, // Provisioned SIP Trunks & DIDs
        e911_status: prop.ray_baud_and_logs_enabled ? 'VERIFIED' : 'AUDIT_REQUIRED',
        created_at: prop.created_at,
        updated_at: prop.updated_at || prop.created_at,
      };
    });

    // 4. Filter by Organization if requested
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
        ray_baud_and_logs_enabled: ray_baud_and_logs_enabled ?? true,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    // Link to organization if specified
    if (organization_id) {
      await supabase.from('organization_properties').insert({
        organization_id,
        property_id: newProp.id,
        status: status || 'ACTIVE',
      });
    }

    return NextResponse.json({ success: true, data: newProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
