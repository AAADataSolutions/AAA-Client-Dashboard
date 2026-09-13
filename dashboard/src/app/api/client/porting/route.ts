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
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        metrics: { total: 0, inProgress: 0, focReceived: 0, completed: 0, actionRequired: 0 },
        filters: { properties: [] },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const propertyFilter = searchParams.get('property_id') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const dbClient = createAdminClient() || supabase;

    // Get organization_properties for tenant
    const { data: orgProps } = await dbClient
      .from('organization_properties')
      .select('id, property:properties(id, name, address, city, state, zip_code, main_phone)')
      .eq('organization_id', member.organization_id);

    const orgPropIds = (orgProps || []).map((op) => op.id);

    if (orgPropIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        metrics: { total: 0, inProgress: 0, focReceived: 0, completed: 0, actionRequired: 0 },
        filters: { properties: [] },
      });
    }

    const { data: portRecords, error } = await dbClient
      .from('porting_requests')
      .select(`
        *,
        organization_property:organization_properties(
          id,
          property:properties(id, name, address, city, state, zip_code, main_phone)
        ),
        porting_request_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        )
      `)
      .in('organization_property_id', orgPropIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const allPortings = (portRecords || []).map((item: any) => {
      const prop = item.organization_property?.property;
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
        property_id: prop?.id || null,
        property_name: prop?.name || 'Property Location',
        property_address: prop?.address ? `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code || ''}`.trim() : '',
        property_location: prop ? `${prop.city}, ${prop.state}` : '',
        property_phone: prop?.main_phone || '',
        status: item.status,
        target_date: item.target_date,
        completed_at: item.completed_at,
        notes: item.notes,
        services_count: services.length,
        services,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      };
    });

    // KPI Cards per Task.md:
    // Total Porting Requests, In Progress, FOC Received, Completed, Action Required (Rejected/Cancelled/Pending)
    const total = allPortings.length;
    const completed = allPortings.filter((p) => p.status === 'COMPLETED').length;
    const focReceived = allPortings.filter((p) => p.status === 'FOC_RECEIVED').length;
    const inProgress = allPortings.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'SUBMITTED' || p.status === 'DRAFT'
    ).length;
    const actionRequired = allPortings.filter(
      (p) => p.status === 'REJECTED' || p.status === 'CANCELLED' || p.status === 'PENDING'
    ).length;

    let filtered = allPortings;
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.property_name.toLowerCase().includes(search) ||
          (p.notes && p.notes.toLowerCase().includes(search)) ||
          p.services.some((s: any) => s.phone_number?.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        filtered = filtered.filter((p) => p.status === 'REJECTED' || p.status === 'CANCELLED' || p.status === 'PENDING');
      } else if (statusFilter === 'IN_PROGRESS_ALL') {
        filtered = filtered.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'SUBMITTED' || p.status === 'DRAFT');
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    if (propertyFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.property_id === propertyFilter);
    }

    // Unique properties for filter dropdown
    const propertyOptions = Array.from(
      new Map(
        allPortings
          .filter((p) => p.property_id)
          .map((p) => [p.property_id, { id: p.property_id, name: p.property_name }])
      ).values()
    );

    const totalFiltered = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total: totalFiltered,
      page,
      limit,
      metrics: {
        total,
        inProgress,
        focReceived,
        completed,
        actionRequired,
      },
      filters: {
        properties: propertyOptions,
      },
    });
  } catch (err: any) {
    console.error('Client Porting API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch porting records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only Client Admin can submit porting requests
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Organization Admins can submit porting requests.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organization_property_id, target_date, notes, service_ids } = body;

    if (!organization_property_id) {
      return NextResponse.json(
        { success: false, error: 'Please select a destination property location.' },
        { status: 400 }
      );
    }

    const dbClient = createAdminClient() || supabase;

    // Insert porting request in SUBMITTED state
    const { data: portRequest, error: portErr } = await dbClient
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
      throw portErr || new Error('Failed to create porting request');
    }

    // Attach services if provided
    if (Array.isArray(service_ids) && service_ids.length > 0) {
      const inserts = service_ids.map((sid: string) => ({
        porting_request_id: portRequest.id,
        service_id: sid,
      }));

      await dbClient.from('porting_request_services').insert(inserts);

      // Update service status to PENDING_PORT
      await dbClient
        .from('services')
        .update({ status: 'PENDING_PORT', updated_at: new Date().toISOString() })
        .in('id', service_ids);
    }

    return NextResponse.json({
      success: true,
      data: portRequest,
      message: 'Porting order submitted successfully to AAA Carrier Operations.',
    });
  } catch (err: any) {
    console.error('Client Porting Creation error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit porting order' },
      { status: 500 }
    );
  }
}
