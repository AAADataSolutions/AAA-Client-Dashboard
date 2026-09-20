import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        metrics: {
          totalServices: 0,
          activeServices: 0,
          pendingPortingServices: 0,
          disconnectedServices: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const typeFilter = searchParams.get('type') || 'ALL';
    const statusFilter = searchParams.get('status') || 'ALL';
    const propertyFilter = searchParams.get('property_id') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const dbClient = createAdminClient() || supabase;

    // Get all organization_properties for this tenant
    const { data: orgProps } = await dbClient
      .from('organization_properties')
      .select('id, property:properties(id, name, city, state, address, main_phone)')
      .eq('organization_id', member.organization_id);

    const orgPropIds = (orgProps || []).map((op) => op.id);

    if (orgPropIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        metrics: {
          totalServices: 0,
          activeServices: 0,
          pendingPortingServices: 0,
          disconnectedServices: 0,
        },
      });
    }

    // Query organization_property_services with service and type
    const { data: opsRecords, error } = await dbClient
      .from('organization_property_services')
      .select(`
        id,
        created_at,
        organization_property:organization_properties(
          id,
          organization:organizations(id, name),
          property:properties(id, name, address, city, state, main_phone)
        ),
        service:services(
          id,
          phone_number,
          service_name,
          custom_service_id,
          status,
          description,
          created_at,
          updated_at,
          service_type:service_types(id, name, description),
          porting_links:porting_request_services(
            id,
            porting_request:porting_requests(id, status, target_date, notes)
          )
        )
      `)
      .in('organization_property_id', orgPropIds);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const allServices = (opsRecords || [])
      .map((ops: any, idx: number) => {
        const s = ops.service;
        if (!s) return null;
        const prop = ops.organization_property?.property;
        const org = ops.organization_property?.organization;
        const portingLink = Array.isArray(s.porting_links) && s.porting_links.length > 0 ? s.porting_links[0] : null;
        const portingReq = portingLink?.porting_request;

        return {
          id: s.id,
          ops_id: ops.id,
          custom_service_id: s.custom_service_id || `SVC-${s.id.slice(0, 6).toUpperCase()}`,
          service_name: s.service_name || s.description || `Line ${idx + 1}`,
          phone_number: s.phone_number,
          service_type: s.service_type?.name || 'Voice Line',
          service_type_description: s.service_type?.description || '',
          organization_name: org?.name || 'Organization',
          description: s.description || 'Standard Voice Line',
          status: s.status,
          property_id: prop?.id || null,
          property_name: prop?.name || 'Unassigned Property',
          property_location: prop ? `${prop.city}, ${prop.state}` : '',
          property_address: prop?.address || '',
          is_porting: s.status === 'PORTING' || s.status === 'PENDING_PORT' || !!portingReq,
          porting_request_id: portingReq?.id || null,
          porting_status: portingReq?.status || null,
          porting_foc_date: portingReq?.target_date || null,
          created_at: s.created_at,
          updated_at: s.updated_at || s.created_at,
        };
      })
      .filter((s): s is NonNullable<typeof s> => Boolean(s));


    // KPI Cards:
    // Total Services, Active Services, Pending / Porting, Disconnected
    const totalServices = allServices.length;
    const activeServices = allServices.filter((s) => s.status === 'ACTIVE').length;
    const pendingPortingServices = allServices.filter(
      (s) => s.status === 'PORTING' || s.status === 'PENDING_PORT'
    ).length;
    const disconnectedServices = allServices.filter((s) => s.status === 'DISCONNECTED').length;

    // Apply In-Memory Filters & Search
    let filtered = allServices;

    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.phone_number.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.property_name.toLowerCase().includes(search) ||
          s.service_type.toLowerCase().includes(search)
      );
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.service_type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PORTING_ALL') {
        filtered = filtered.filter((s) => s.status === 'PORTING' || s.status === 'PENDING_PORT');
      } else {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }
    }

    if (propertyFilter !== 'ALL') {
      filtered = filtered.filter((s) => s.property_id === propertyFilter);
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'NEWEST';
    if (sortBy === 'NUMBER_ASC') {
      filtered.sort((a, b) => a.phone_number.localeCompare(b.phone_number));
    } else if (sortBy === 'NUMBER_DESC') {
      filtered.sort((a, b) => b.phone_number.localeCompare(a.phone_number));
    } else if (sortBy === 'TYPE_ASC') {
      filtered.sort((a, b) => a.service_type.localeCompare(b.service_type));
    } else if (sortBy === 'PROP_ASC') {
      filtered.sort((a, b) => a.property_name.localeCompare(b.property_name));
    } else {
      // NEWEST
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    // Extract unique properties and service types for dropdown filters
    const propertyOptions = Array.from(
      new Map(
        allServices
          .filter((s) => s.property_id)
          .map((s) => [s.property_id, { id: s.property_id, name: s.property_name }])
      ).values()
    );

    const typeOptions = Array.from(new Set(allServices.map((s) => s.service_type).filter(Boolean)));

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      metrics: {
        totalServices,
        activeServices,
        pendingPortingServices,
        disconnectedServices,
      },
      filters: {
        properties: propertyOptions,
        types: typeOptions,
      },
    });
  } catch (err: any) {
    console.error('Client Services API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
