import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

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

    // 1. KPI Counts
    const { count: totalCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');

    const { count: inProgressCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['IN_PROGRESS', 'SUBMITTED']);

    const { count: focReceivedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FOC_RECEIVED');

    const { count: actionRequiredCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['REJECTED', 'CANCELLED', 'PENDING']);

    const { count: submittedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUBMITTED');

    // 2. Fetch porting requests with joined data
    let query = db
      .from('porting_requests')
      .select(`
        *,
        organization_property:organization_properties(
          id,
          property:properties(id, name, address, city, state, zip_code, main_phone),
          organization:organizations(id, name)
        ),
        porting_request_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        )
      `, { count: 'exact' });

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        query = query.in('status', ['REJECTED', 'CANCELLED', 'PENDING']);
      } else if (statusFilter === 'IN_PROGRESS_ALL') {
        query = query.in('status', ['IN_PROGRESS', 'SUBMITTED', 'DRAFT']);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    const { data: rawPortings, error } = await query;

    if (error) {
      // Fallback: flat query without joins
      const { data: fallbackList, error: fErr } = await db
        .from('porting_requests')
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
          property_name: 'Property',
          property_address: '',
          property_location: '',
          property_phone: '',
          organization_name: 'Organization',
          services_count: 0,
          services: [],
        })),
        pagination: {
          totalCount: totalSimple,
          totalPages: Math.ceil(totalSimple / limit) || 1,
          currentPage: page,
          pageSize: limit,
        },
        metrics: {
          totalRequests: totalCount || totalSimple,
          inProgressCount: inProgressCount || 0,
          focReceivedCount: focReceivedCount || 0,
          completedCount: completedCount || 0,
          actionRequiredCount: actionRequiredCount || 0,
          submittedCount: submittedCount || 0,
        },
      });
    }

    // 3. Map and format records
    let formatted = (rawPortings || []).map((item: any) => {
      const orgProp = item.organization_property;
      const prop = Array.isArray(orgProp?.property) ? orgProp?.property[0] : orgProp?.property;
      const org = Array.isArray(orgProp?.organization) ? orgProp?.organization[0] : orgProp?.organization;

      const services = (item.porting_request_services || [])
        .map((prs: any) => {
          const s = prs.service;
          if (!s) return null;
          return {
            id: s.id,
            phone_number: s.phone_number,
            status: s.status,
            description: s.description,
            service_type: s.service_type?.name || 'Voice Line',
          };
        })
        .filter(Boolean);

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        property_id: prop?.id || '',
        property_name: prop?.name || 'Property',
        property_address: prop?.address
          ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`.trim()
          : '',
        property_location: prop ? `${prop.city || ''}, ${prop.state || ''}`.trim() : '',
        property_phone: prop?.main_phone || '',
        organization_id: org?.id || '',
        organization_name: org?.name || 'Organization',
        status: item.status || 'DRAFT',
        target_date: item.target_date,
        completed_at: item.completed_at,
        notes: item.notes,
        services_count: services.length,
        services,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      };
    });

    // 4. Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      formatted = formatted.filter(
        (p: any) =>
          p.property_name.toLowerCase().includes(lowerSearch) ||
          p.organization_name.toLowerCase().includes(lowerSearch) ||
          (p.notes && p.notes.toLowerCase().includes(lowerSearch)) ||
          p.services.some((s: any) => s.phone_number?.toLowerCase().includes(lowerSearch))
      );
    }

    // 5. Sorting
    if (sortBy === 'PROP_ASC') {
      formatted.sort((a: any, b: any) => a.property_name.localeCompare(b.property_name));
    } else if (sortBy === 'ORG_ASC') {
      formatted.sort((a: any, b: any) => a.organization_name.localeCompare(b.organization_name));
    } else if (sortBy === 'STATUS') {
      const statusOrder: Record<string, number> = {
        DRAFT: 0, SUBMITTED: 1, IN_PROGRESS: 2, PENDING: 3,
        FOC_RECEIVED: 4, COMPLETED: 5, REJECTED: 6, CANCELLED: 7,
      };
      formatted.sort((a: any, b: any) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99));
    } else if (sortBy === 'TARGET_DATE') {
      formatted.sort((a: any, b: any) => {
        if (!a.target_date && !b.target_date) return 0;
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      });
    } else {
      // NEWEST (default)
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
        pageSize: limit,
      },
      metrics: {
        totalRequests: totalCount || filteredTotal,
        inProgressCount: inProgressCount || 0,
        focReceivedCount: focReceivedCount || 0,
        completedCount: completedCount || 0,
        actionRequiredCount: actionRequiredCount || 0,
        submittedCount: submittedCount || 0,
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
    const body = await request.json();

    const { organization_property_id, target_date, notes, service_ids } = body;

    if (!organization_property_id) {
      return NextResponse.json(
        { success: false, error: 'Organization property is required.' },
        { status: 400 }
      );
    }

    // Create the porting request
    const { data: portRequest, error: portErr } = await db
      .from('porting_requests')
      .insert({
        organization_property_id,
        status: 'SUBMITTED',
        target_date: target_date || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (portErr || !portRequest) {
      return NextResponse.json(
        { success: false, error: portErr?.message || 'Failed to create porting request' },
        { status: 400 }
      );
    }

    // Attach services if provided
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      const inserts = service_ids.map((sid: string) => ({
        porting_request_id: portRequest.id,
        service_id: sid,
      }));

      await db.from('porting_request_services').insert(inserts);

      // Mark services as PENDING_PORT
      await db
        .from('services')
        .update({ status: 'PENDING_PORT', updated_at: new Date().toISOString() })
        .in('id', service_ids);
    }

    // Get property name for audit log
    const { data: orgProp } = await db
      .from('organization_properties')
      .select('property:properties(name)')
      .eq('id', organization_property_id)
      .maybeSingle();

    const propName = Array.isArray((orgProp as any)?.property)
      ? (orgProp as any)?.property[0]?.name
      : (orgProp as any)?.property?.name;

    await logAuditEvent({
      action: 'PORTING_REQUEST_CREATED',
      entity_type: 'PORTING',
      entity_id: portRequest.id,
      entity_name: propName || 'Property',
      changes: {
        organization_property_id,
        target_date,
        services_attached: service_ids?.length || 0,
        initial_status: 'SUBMITTED',
      },
    });

    return NextResponse.json({
      success: true,
      data: portRequest,
      message: 'Porting request created successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const body = await request.json();

    const { id, status, target_date, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting request ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
      const now = new Date().toISOString();
      if (status === 'SUBMITTED') updates.submitted_at = now;
      if (status === 'IN_PROGRESS') updates.in_progress_at = now;
      if (status === 'FOC_RECEIVED') updates.foc_received_at = now;
      if (status === 'COMPLETED') updates.completed_at = now;
    }
    if (target_date !== undefined) updates.target_date = target_date;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await db
      .from('porting_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        organization_property:organization_properties(
          id,
          property_id,
          property:properties(id, name, status)
        )
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // If completed, update services status to ACTIVE
    if (status === 'COMPLETED') {
      const { data: portServices } = await db
        .from('porting_request_services')
        .select('service_id')
        .eq('porting_request_id', id);

      if (portServices && portServices.length > 0) {
        const serviceIds = portServices.map((ps: any) => ps.service_id);
        await db
          .from('services')
          .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
          .in('id', serviceIds);
      }
    }

    // Audit log
    const prop = Array.isArray(updated.organization_property?.property)
      ? updated.organization_property?.property[0]
      : updated.organization_property?.property;
    const propName = prop?.name || 'Property';

    await logAuditEvent({
      action: status === 'COMPLETED' ? 'PORTING_COMPLETED' : 'PORTING_STATUS_UPDATED',
      entity_type: 'PORTING',
      entity_id: id,
      entity_name: propName,
      changes: {
        status,
        target_date: target_date !== undefined ? target_date : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
