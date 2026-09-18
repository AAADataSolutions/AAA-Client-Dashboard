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

    // 2. Query Services with Joins
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

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: rawServices, error } = await query;

    if (error) {
      const { data: fallbackList } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      const totalSimple = fallbackList?.length || 0;
      const paginated = (fallbackList || []).slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginated.map((s: any, idx: number) => ({
          ...s,
          custom_service_id: s.custom_service_id || s.id.slice(0, 8).toUpperCase(),
          service_name: s.service_name || `Service Line ${idx + 1}`,
          service_type: 'Voice Trunk / DID',
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
    let formatted = (rawServices || []).map((s: any, idx: number) => {
      const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];

      const attached_properties = links
        .map((l: any) => {
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
        })
        .filter((p: any) => p.name !== 'Unknown Property');

      const primaryProp = attached_properties[0];

      return {
        id: s.id,
        custom_service_id: s.custom_service_id || `SVC-${s.id.slice(0, 6).toUpperCase()}`,
        service_name: s.service_name || `Service ${s.phone_number}`,
        phone_number: s.phone_number,
        service_type: s.service_type?.name || 'Voice Line / DID',
        service_type_id: s.service_type_id,
        description: s.description,
        status: s.status || 'ACTIVE',
        property_id: primaryProp ? primaryProp.property_id : null,
        attached_properties: attached_properties,
        attached_property_name: primaryProp ? primaryProp.name : 'Unassigned',
        attached_organization_name: primaryProp ? primaryProp.organization_name : 'Unassigned',
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    // 4. In-memory Filter for Search
    if (search) {
      const lower = search.toLowerCase();
      formatted = formatted.filter(
        (s: any) =>
          s.custom_service_id.toLowerCase().includes(lower) ||
          s.service_name.toLowerCase().includes(lower) ||
          s.phone_number.toLowerCase().includes(lower) ||
          s.attached_property_name.toLowerCase().includes(lower) ||
          s.attached_organization_name.toLowerCase().includes(lower) ||
          s.service_type.toLowerCase().includes(lower)
      );
    }

    // 5. In-memory Filter for Service Type
    if (serviceType !== 'ALL') {
      formatted = formatted.filter((s: any) => s.service_type.toLowerCase() === serviceType.toLowerCase());
    }

    // 6. Sorting
    if (sortBy === 'NUMBER_ASC') {
      formatted.sort((a: any, b: any) => a.phone_number.localeCompare(b.phone_number));
    } else if (sortBy === 'NUMBER_DESC') {
      formatted.sort((a: any, b: any) => b.phone_number.localeCompare(a.phone_number));
    } else if (sortBy === 'TYPE_ASC') {
      formatted.sort((a: any, b: any) => a.service_type.localeCompare(b.service_type));
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
      custom_service_id,
      service_name,
      phone_number,
      service_type_id,
      service_type_name,
      property_id,
      description,
      status,
    } = body;

    const trimmedId = (custom_service_id || '').trim();
    if (!trimmedId || trimmedId.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Service ID is mandatory and must be at least 6 characters.' },
        { status: 400 }
      );
    }

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Service number / Phone number is required.' }, { status: 400 });
    }

    let typeId = service_type_id;

    // Resolve or insert custom service type
    if (!typeId && service_type_name) {
      const { data: existingType } = await supabase
        .from('service_types')
        .select('id')
        .ilike('name', service_type_name.trim())
        .maybeSingle();

      if (existingType) {
        typeId = existingType.id;
      } else {
        const { data: newType } = await supabase
          .from('service_types')
          .insert({ name: service_type_name.trim(), description: `${service_type_name} Service` })
          .select('id')
          .single();
        typeId = newType?.id;
      }
    }

    // 1. Insert Service
    const { data: newService, error: sErr } = await supabase
      .from('services')
      .insert({
        custom_service_id: trimmedId,
        service_name: service_name?.trim() || `Service ${phone_number.trim()}`,
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

    // 2. Attach to Property if specified (Rule 2: One service can only be assigned to one property)
    let assignedPropName = 'Unassigned';
    if (property_id) {
      const { data: orgProp } = await supabase
        .from('organization_properties')
        .select('id, property:properties(name)')
        .eq('property_id', property_id)
        .maybeSingle();

      if (orgProp) {
        const pName = Array.isArray((orgProp as any)?.property)
          ? (orgProp as any)?.property[0]?.name
          : (orgProp as any)?.property?.name;
        assignedPropName = pName || 'Property';
        await supabase.from('organization_property_services').insert({
          organization_property_id: orgProp.id,
          service_id: newService.id,
        });
      }
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'SERVICE_CREATED',
      entity_type: 'SERVICE',
      entity_id: newService.id,
      entity_name: newService.service_name || trimmedId,
      changes: {
        custom_service_id: trimmedId,
        phone_number: newService.phone_number,
        service_name: newService.service_name,
        property_id,
        assigned_property: assignedPropName,
        status: newService.status,
      },
    });

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
      custom_service_id,
      service_name,
      phone_number,
      service_type_id,
      service_type_name,
      property_id,
      description,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    let typeId = service_type_id;
    if (!typeId && service_type_name) {
      const { data: existingType } = await supabase
        .from('service_types')
        .select('id')
        .ilike('name', service_type_name.trim())
        .maybeSingle();

      if (existingType) {
        typeId = existingType.id;
      }
    }

    const updates: any = {};
    if (custom_service_id !== undefined) updates.custom_service_id = custom_service_id.trim();
    if (service_name !== undefined) updates.service_name = service_name.trim();
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

    // Reassign property if specified
    if (property_id !== undefined) {
      // Remove old property links
      await supabase.from('organization_property_services').delete().eq('service_id', id);

      if (property_id && property_id !== 'UNASSIGNED') {
        const { data: orgProp } = await supabase
          .from('organization_properties')
          .select('id')
          .eq('property_id', property_id)
          .maybeSingle();

        if (orgProp) {
          await supabase.from('organization_property_services').insert({
            organization_property_id: orgProp.id,
            service_id: id,
          });
        }
      }
    }

    // Central Audit Log
    await logAuditEvent({
      action: status && status !== updatedService.status ? 'SERVICE_STATUS_CHANGED' : 'SERVICE_UPDATED',
      entity_type: 'SERVICE',
      entity_id: id,
      entity_name: updatedService.service_name || updatedService.phone_number,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedService });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
