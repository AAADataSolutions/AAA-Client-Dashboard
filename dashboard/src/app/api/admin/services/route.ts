import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const serviceType = searchParams.get('serviceType') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. Fetch Real KPI Metrics directly from DB
    const { count: totalServicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    const { count: activeServicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    const { count: assignedLinksCount } = await supabase
      .from('organization_property_services')
      .select('*', { count: 'exact', head: true });

    const { count: inactiveOrSuspendedCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'ACTIVE');

    // 2. Query Services with Relational Joins
    let query = supabase
      .from('services')
      .select(`
        *,
        service_type:service_types(id, name, description),
        property_links:organization_property_services(
          id,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state, address),
            organization:organizations(id, name)
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: rawServices, error, count } = await query;

    if (error) {
      // Fallback query if joins fail
      const { data: simpleServices, error: sErr } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      const totalSimple = simpleServices?.length || 0;
      const paginated = (simpleServices || []).slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginated.map((s: any) => ({
          ...s,
          service_type: 'Voice Line / DID',
          attached_properties: [],
          attached_property_name: 'Unassigned',
          attached_organization_name: 'Unassigned',
        })),
        pagination: {
          totalCount: totalSimple,
          totalPages: Math.ceil(totalSimple / limit) || 1,
          currentPage: page,
          limit,
        },
        metrics: {
          totalServicesCount: totalServicesCount || totalSimple,
          activeServicesCount: activeServicesCount || 0,
          assignedServicesCount: assignedLinksCount || 0,
          inactiveOrSuspendedCount: inactiveOrSuspendedCount || 0,
        },
      });
    }

    // 3. Format and attach property/org associations
    let formatted = (rawServices || []).map((s: any) => {
      const links = Array.isArray(s.property_links) ? s.property_links : (s.property_links ? [s.property_links] : []);
      
      const attached_properties = links.map((l: any) => {
        const orgProp = l.org_property;
        return {
          link_id: l.id,
          org_property_id: orgProp?.id || '',
          property_id: orgProp?.property?.id || '',
          name: orgProp?.property?.name || 'Unknown Property',
          city: orgProp?.property?.city || '',
          state: orgProp?.property?.state || '',
          address: orgProp?.property?.address || '',
          organization_id: orgProp?.organization?.id || '',
          organization_name: orgProp?.organization?.name || 'Unassigned Organization',
        };
      }).filter((p: any) => p.name !== 'Unknown Property');

      const primaryProp = attached_properties[0];

      return {
        id: s.id,
        phone_number: s.phone_number,
        service_type: s.service_type?.name || 'Voice Line / DID',
        service_type_id: s.service_type_id,
        description: s.description,
        status: s.status,
        attached_properties: attached_properties,
        attached_property_name: primaryProp ? primaryProp.name : 'Unassigned',
        attached_organization_name: primaryProp ? primaryProp.organization_name : 'Unassigned',
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    // 4. In-memory Filter for Service Type (if join filtered)
    if (serviceType !== 'ALL') {
      formatted = formatted.filter((s: any) => s.service_type.toLowerCase() === serviceType.toLowerCase());
    }

    // 5. Sorting
    if (sortBy === 'NUMBER_ASC') {
      formatted.sort((a: any, b: any) => a.phone_number.localeCompare(b.phone_number));
    } else if (sortBy === 'NUMBER_DESC') {
      formatted.sort((a: any, b: any) => b.phone_number.localeCompare(a.phone_number));
    } else if (sortBy === 'TYPE_ASC') {
      formatted.sort((a: any, b: any) => a.service_type.localeCompare(b.service_type));
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
        totalServicesCount: totalServicesCount || filteredTotal,
        activeServicesCount: activeServicesCount || 0,
        assignedServicesCount: assignedLinksCount || 0,
        inactiveOrSuspendedCount: inactiveOrSuspendedCount || 0,
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
      phone_number,
      service_type_id,
      service_type_name,
      org_property_id,
      description,
      status,
    } = body;

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone number / DID identifier is required.' }, { status: 400 });
    }

    let typeId = service_type_id;

    // Resolve service type
    if (!typeId && service_type_name) {
      const { data: existingType } = await supabase
        .from('service_types')
        .select('id')
        .ilike('name', service_type_name)
        .maybeSingle();

      if (existingType) {
        typeId = existingType.id;
      } else {
        const { data: newType } = await supabase
          .from('service_types')
          .insert({ name: service_type_name, description: `${service_type_name} Service` })
          .select('id')
          .single();
        typeId = newType?.id;
      }
    }

    // 1. Insert Service
    const { data: newService, error: sErr } = await supabase
      .from('services')
      .insert({
        phone_number: phone_number.trim(),
        service_type_id: typeId,
        description: description?.trim() || null,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (sErr) {
      return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
    }

    // 2. Link to organization_property if provided
    if (org_property_id && newService) {
      await supabase.from('organization_property_services').insert({
        organization_property_id: org_property_id,
        service_id: newService.id,
      });
    }

    return NextResponse.json({ success: true, data: newService });
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
      phone_number,
      service_type_id,
      service_type_name,
      description,
      status,
      org_property_id,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    let typeId = service_type_id;

    if (!typeId && service_type_name) {
      const { data: existingType } = await supabase
        .from('service_types')
        .select('id')
        .ilike('name', service_type_name)
        .maybeSingle();

      if (existingType) {
        typeId = existingType.id;
      }
    }

    const updates: any = {};
    if (phone_number !== undefined) updates.phone_number = phone_number.trim();
    if (typeId !== undefined) updates.service_type_id = typeId;
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const { data: updatedService, error: uErr } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 400 });
    }

    // If org_property_id assignment is specified
    if (org_property_id !== undefined) {
      // Remove old property links
      await supabase
        .from('organization_property_services')
        .delete()
        .eq('service_id', id);

      // If assigning a valid org_property_id, insert link
      if (org_property_id && org_property_id !== 'UNASSIGNED') {
        await supabase
          .from('organization_property_services')
          .insert({
            organization_property_id: org_property_id,
            service_id: id,
          });
      }
    }

    return NextResponse.json({ success: true, data: updatedService });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
