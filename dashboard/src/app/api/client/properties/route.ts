import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Resolve tenant membership
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
          totalProperties: 0,
          activeProperties: 0,
          onboardingProperties: 0,
          e911VerifiedProperties: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const onboardingFilter = searchParams.get('onboarding') || 'ALL';
    const stateFilter = searchParams.get('state') || 'ALL';
    const rayBaumFilter = searchParams.get('rayBaum') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Query organization_properties joined with property, services, e911, onboarding, and tickets
    const { data: orgProps, error } = await supabase
      .from('organization_properties')
      .select(`
        id,
        status,
        created_at,
        organization:organizations(id, name),
        property:properties(
          id,
          name,
          monthly_price,
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
          ray_baum_status,
          ray_baud_and_logs_enabled,
          status,
          created_at
        ),
        services:organization_property_services(
          id,
          service:services(id, phone_number, status, service_type_id, service_type:service_types(name))
        ),
        e911:e911_records(id, status, emergency_address, verified_at),
        onboardings(id, status, target_date),
        tickets(id, status, priority, subject)
      `)
      .eq('organization_id', member.organization_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Transform and calculate metrics
    let totalServicesCount = 0;
    let attentionServicesCount = 0;
    let totalOpenTicketsCount = 0;

    const allRecords = (orgProps || [])
      .map((op: any) => {
        const prop: any = op.property;
        if (!prop) return null;

        const servicesList = (op.services || []).map((s: any) => s.service).filter(Boolean);
        const e911Record = Array.isArray(op.e911) && op.e911.length > 0 ? op.e911[0] : null;
        const onboardingRecord = Array.isArray(op.onboardings) && op.onboardings.length > 0 ? op.onboardings[0] : null;
        const ticketsList = op.tickets || [];

        // Aggregate service counts
        totalServicesCount += servicesList.length;
        servicesList.forEach((s: any) => {
          if (s.status === 'PENDING_PORT' || s.status === 'PORTING' || s.status === 'DISCONNECTED') {
            attentionServicesCount++;
          }
        });

        // Aggregate open tickets
        const openTix = ticketsList.filter(
          (t: any) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_ON_CLIENT'
        );
        totalOpenTicketsCount += openTix.length;

        const propStatus = op.status || prop.status || 'ACTIVE';
        const gmName = prop.general_manager_name || prop.contact_person_name || 'N/A';
        const gmPhone = prop.general_manager_phone || prop.main_phone || 'N/A';
        const gmEmail = prop.general_manager_email || prop.contact_person_email || 'N/A';

        return {
          id: prop.id,
          org_property_id: op.id,
          name: prop.name,
          monthly_price: prop.monthly_price ?? null,
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zip_code: prop.zip_code,
          country: prop.country,
          main_phone: prop.main_phone,
          fax: prop.fax,
          organization_name: op.organization?.name || 'Organization',
          contact_person_name: prop.contact_person_name || prop.general_manager_name,
          contact_person_email: prop.contact_person_email,
          general_manager_name: gmName,
          general_manager_phone: gmPhone,
          general_manager_email: gmEmail,
          ray_baud_and_logs_enabled: prop.ray_baud_and_logs_enabled ?? true,
          ray_baum_status: (prop.ray_baum_status === 'ACTIVE' || prop.ray_baud_and_logs_enabled) ? 'Active' : 'Inactive',
          status: propStatus,
          stage: onboardingRecord?.status || (propStatus === 'ACTIVE' ? 'COMPLETED' : 'DRAFT'),
          services_count: servicesList.length,
          services: servicesList,
          e911_status: e911Record?.status || 'PENDING',
          e911_verified_at: e911Record?.verified_at || null,
          e911_record: e911Record,
          onboarding_status: onboardingRecord?.status || null,
          onboarding_target_date: onboardingRecord?.target_date || null,
          open_tickets_count: openTix.length,
          tickets: ticketsList,
          created_at: prop.created_at,
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));


    // Global Metrics for Donut & KPI Cards
    const totalProperties = allRecords.length;
    const activeProperties = allRecords.filter((p) => p.status === 'ACTIVE').length;
    const onboardingProperties = allRecords.filter((p) => p.status === 'ONBOARDING' || (p.onboarding_status && p.onboarding_status !== 'COMPLETED')).length;
    const inactiveProperties = allRecords.filter((p) => p.status === 'INACTIVE' || p.status === 'OFFBOARDED').length;
    const e911VerifiedProperties = allRecords.filter((p) => p.e911_status === 'VERIFIED').length;

    // Apply In-Memory Filters & Search
    let filtered = allRecords;

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search) ||
          p.state.toLowerCase().includes(search) ||
          p.address.toLowerCase().includes(search) ||
          (p.main_phone && p.main_phone.toLowerCase().includes(search)) ||
          (p.contact_person_name && p.contact_person_name.toLowerCase().includes(search))
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (onboardingFilter !== 'ALL') {
      if (onboardingFilter === 'ONBOARDING') {
        filtered = filtered.filter((p) => p.status === 'ONBOARDING' || (p.onboarding_status && p.onboarding_status !== 'COMPLETED'));
      } else if (onboardingFilter === 'COMPLETED') {
        filtered = filtered.filter((p) => p.onboarding_status === 'COMPLETED');
      } else if (onboardingFilter === 'NONE') {
        filtered = filtered.filter((p) => !p.onboarding_status);
      } else {
        filtered = filtered.filter((p) => p.onboarding_status === onboardingFilter);
      }
    }

    if (stateFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.state === stateFilter);
    }

    if (rayBaumFilter === 'ACTIVE') {
      filtered = filtered.filter((p) => p.ray_baum_status === 'Active');
    } else if (rayBaumFilter === 'INACTIVE') {
      filtered = filtered.filter((p) => p.ray_baum_status === 'Inactive');
    }

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'NEWEST';
    if (sortBy === 'NAME_ASC') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'NAME_DESC') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'SERVICES_DESC') {
      filtered.sort((a, b) => (b.services_count || 0) - (a.services_count || 0));
    } else if (sortBy === 'TICKETS_DESC') {
      filtered.sort((a, b) => (b.open_tickets_count || 0) - (a.open_tickets_count || 0));
    } else {
      // NEWEST
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Pagination
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      metrics: {
        totalProperties,
        activeProperties,
        onboardingProperties,
        inactiveProperties,
        e911VerifiedProperties,
        totalServices: totalServicesCount,
        servicesAttention: attentionServicesCount,
        openTickets: totalOpenTicketsCount,
      },
    });
  } catch (err: any) {
    console.error('Client Properties API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
