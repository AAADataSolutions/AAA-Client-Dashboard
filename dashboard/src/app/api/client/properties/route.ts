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
        organization:organizations(id, name, type),
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
          connectivity_type,
          status,
          onboarding_date,
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

    // Fetch active (incomplete) porting requests to exclude from Properties until onboarded/completed
    const { data: activePortings } = await supabase
      .from('porting_requests')
      .select('organization_property_id')
      .not('status', 'in', '("COMPLETED","ONBOARDED")')
      .not('organization_property_id', 'is', null);

    const activeOpIds = new Set((activePortings || []).map((p: any) => p.organization_property_id).filter(Boolean));

    // Fetch direct services linked to these properties (direct property_id)
    const propIds = (orgProps || []).map((op: any) => op.property?.id).filter(Boolean);
    let directServices: any[] = [];
    if (propIds.length > 0) {
      const { data: directData } = await supabase
        .from('services')
        .select('id, property_id, phone_number, status, service_type_id, service_type:service_types(name)')
        .in('property_id', propIds)
        .neq('status', 'DISCONNECTED');
      directServices = directData || [];
    }

    // Fetch Data Circuits linked to these properties — STRICT CLIENT PRIVACY:
    // Never select or return wholesaler_name, revenue_share_percentage, monthly_revenue_share_amount, or internal_admin_notes!
    let clientDataCircuits: any[] = [];
    if (propIds.length > 0) {
      try {
        const { data: dcData } = await supabase
          .from('data_circuits')
          .select('id, property_id, status, carrier_name, bandwidth, circuit_monthly_price, site_survey_status, foc_status, foc_date, installed_at, technical_details, agreement_file_name, agreement_file_url, agreement_file_size, paperwork_signed_at, created_at')
          .in('property_id', propIds)
          .neq('status', 'CANCELLED')
          .order('created_at', { ascending: false });
        clientDataCircuits = dcData || [];
      } catch {
        clientDataCircuits = [];
      }
    }

    // Transform and calculate metrics
    let totalServicesCount = 0;
    let attentionServicesCount = 0;
    let totalOpenTicketsCount = 0;

    const allRecords = (orgProps || [])
      .filter((op: any) => !activeOpIds.has(op.id))
      .map((op: any) => {
        const prop: any = op.property;
        if (!prop) return null;

        const opsServices = (op.services || []).map((s: any) => s.service).filter(Boolean);
        const directForProp = directServices.filter((ds: any) => ds.property_id === prop.id);
        const serviceMap = new Map<string, any>();
        opsServices.forEach((s: any) => { if (s?.id) serviceMap.set(s.id, s); });
        directForProp.forEach((s: any) => { if (s?.id && !serviceMap.has(s.id)) serviceMap.set(s.id, s); });
        const servicesList = Array.from(serviceMap.values());
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
        const gmName = prop.general_manager_name || prop.contact_person_name || null;
        const gmPhone = prop.general_manager_phone || prop.main_phone || null;
        const gmEmail = prop.general_manager_email || prop.contact_person_email || null;

        const isE911Verified = Boolean(prop.ray_baud_and_logs_enabled);
        const e911StatusStr = isE911Verified ? 'VERIFIED' : 'AUDIT_REQUIRED';

        const propCircuits = clientDataCircuits.filter((dc: any) => dc.property_id === prop.id);
        const primaryCircuit = propCircuits[0] || null;

        let resolvedConnectivityType: 'PORTED' | 'DATA_CIRCUITED' | 'BOTH' =
          prop.connectivity_type && ['PORTED', 'DATA_CIRCUITED', 'BOTH'].includes(prop.connectivity_type)
            ? prop.connectivity_type
            : 'PORTED';

        if (primaryCircuit && servicesList.length > 0 && !prop.connectivity_type) {
          resolvedConnectivityType = 'BOTH';
        } else if (primaryCircuit && !prop.connectivity_type) {
          resolvedConnectivityType = 'DATA_CIRCUITED';
        }

        return {
          id: prop.id,
          org_property_id: op.id,
          name: prop.name,
          monthly_price: prop.monthly_price ?? null,
          connectivity_type: resolvedConnectivityType,
          data_circuit: primaryCircuit,
          data_circuits: propCircuits,
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zip_code: prop.zip_code,
          country: prop.country,
          main_phone: prop.main_phone,
          fax: prop.fax,
          organization_name: op.organization?.name || 'Organization',
          organization_type: op.organization?.type || 'GROUP',
          contact_person_name: prop.contact_person_name || prop.general_manager_name || null,
          contact_person_email: prop.contact_person_email || prop.general_manager_email || null,
          general_manager_name: gmName,
          general_manager_phone: gmPhone,
          general_manager_email: gmEmail,
          ray_baud_and_logs_enabled: isE911Verified,
          ray_baum_status: prop.ray_baum_status === 'ACTIVE' ? 'Active' : 'Inactive',
          status: propStatus,
          stage: onboardingRecord?.status || (propStatus === 'ACTIVE' ? 'COMPLETED' : 'DRAFT'),
          services_count: servicesList.length,
          services: servicesList,
          e911_status: e911StatusStr,
          e911_verified_at: isE911Verified ? (e911Record?.verified_at || prop.created_at) : null,
          e911_record: e911Record,
          onboarding_status: onboardingRecord?.status || null,
          onboarding_target_date: onboardingRecord?.target_date || null,
          open_tickets_count: openTix.length,
          tickets: ticketsList,
          onboarding_date: prop.onboarding_date || (prop.created_at ? prop.created_at.slice(0, 10) : null),
          created_at: prop.created_at,
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));


    // Global Metrics for Donut & KPI Cards
    const totalProperties = allRecords.length;
    const activeProperties = allRecords.filter((p) => p.status === 'ACTIVE').length;
    const onboardingProperties = allRecords.filter((p) => p.status === 'ONBOARDING' || (p.onboarding_status && p.onboarding_status !== 'COMPLETED')).length;
    const inactiveProperties = allRecords.filter((p) => p.status === 'INACTIVE' || p.status === 'OFFBOARDED').length;
    const e911VerifiedProperties = allRecords.filter((p) => p.ray_baud_and_logs_enabled).length;

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
      const sUpper = statusFilter.toUpperCase();
      filtered = filtered.filter((p) => (p.status || '').toUpperCase() === sUpper);
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
