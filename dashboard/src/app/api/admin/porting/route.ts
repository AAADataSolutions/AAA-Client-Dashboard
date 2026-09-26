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
        organization:organizations(id, name),
        organization_property:organization_properties(
          id,
          property:properties(id, name, address, city, state, zip_code, main_phone),
          organization:organizations(id, name)
        ),
        attachments:porting_attachments(
          id, file_name, file_size, mime_type, storage_path, created_at
        ),
        services:porting_request_services(
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
      // Fallback simple query
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
          property_name: item.property_name || 'Property',
          property_address: item.property_address || '',
          property_phone: item.property_phone || '',
          organization_name: 'Organization',
          is_activated: item.is_activated || false,
          attachments: [],
          services: [],
          services_count: 0,
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
      const directOrg = Array.isArray(item.organization) ? item.organization[0] : item.organization;
      const org = directOrg || (Array.isArray(orgProp?.organization) ? orgProp?.organization[0] : orgProp?.organization);

      const services = (item.services || []).map((s: any) => {
        const svc = s.service || s;
        return {
          id: svc?.id || s.id,
          phone_number: svc?.phone_number || '—',
          status: svc?.status || 'ACTIVE',
          description: svc?.description || '',
          service_type: svc?.service_type?.name || svc?.service_type || 'Voice Line',
        };
      });

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        property_id: prop?.id || '',
        property_name: item.property_name || prop?.name || 'New Property',
        property_address: item.property_address || (prop?.address
          ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`.trim()
          : 'Address pending'),
        property_phone: item.property_phone || prop?.main_phone || '—',
        fax: item.fax || '—',
        carrier_details: item.carrier_details || '',
        organization_id: org?.id || item.organization_id || '',
        organization_name: org?.name || 'Organization',
        status: item.status || 'SUBMITTED',
        target_date: item.target_date,
        foc_date: item.foc_date,
        completed_at: item.completed_at,
        rejection_reason: item.rejection_reason,
        notes: item.notes,
        is_activated: item.is_activated || false,
        attachments: item.attachments || [],
        services_count: services.length,
        services: services,
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
          p.property_phone.toLowerCase().includes(lowerSearch) ||
          (p.notes && p.notes.toLowerCase().includes(lowerSearch))
      );
    }

    // 5. Sorting
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
        totalRequests: totalCount || totalCountFiltered,
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      organization_id,
      property_name,
      property_address,
      property_phone,
      fax,
      carrier_details,
      status,
      attachments,
    } = body;

    if (!property_name?.trim() || !property_phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Property Name and Phone Number are required.' },
        { status: 400 }
      );
    }

    // Insert porting request
    const { data: newPorting, error: insertErr } = await db
      .from('porting_requests')
      .insert({
        organization_id: organization_id || null,
        created_by: user?.id || null,
        property_name: property_name.trim(),
        property_address: property_address ? property_address.trim() : null,
        property_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        carrier_details: carrier_details ? carrier_details.trim() : null,
        status: status || 'SUBMITTED',
        is_activated: false,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    // Insert attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attRows = attachments.map((att: any) => ({
        porting_request_id: newPorting.id,
        uploaded_by: user?.id || null,
        file_name: att.file_name,
        file_size: att.file_size || 0,
        mime_type: att.mime_type || 'application/pdf',
        storage_path: att.storage_path,
      }));

      await db.from('porting_attachments').insert(attRows);
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_CREATED',
      entity_type: 'PORTING_REQUEST',
      entity_id: newPorting.id,
      entity_name: newPorting.property_name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newPorting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const body = await request.json();
    const { id, status, foc_date, target_date, rejection_reason, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updatePayload.status = status;
    if (foc_date !== undefined) updatePayload.foc_date = foc_date;
    if (target_date !== undefined) updatePayload.target_date = target_date;
    if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
    if (notes !== undefined) updatePayload.notes = notes;
    if (status === 'COMPLETED') updatePayload.completed_at = new Date().toISOString();

    const { data: updated, error } = await db
      .from('porting_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PORTING_STATUS_CHANGED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: updated.property_name || 'Porting Request',
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    const { error } = await db.from('porting_requests').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_DELETED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: `Porting Request ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Porting request deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
