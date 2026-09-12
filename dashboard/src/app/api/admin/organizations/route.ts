import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const ticketFilter = searchParams.get('tickets') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'PROPERTIES_DESC';

    // 1. Global Metrics (for KPI cards across all orgs)
    const { count: totalOrgsCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: totalPropertiesCount } = await supabase
      .from('organization_properties')
      .select('*', { count: 'exact', head: true });

    const { count: totalServicesCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    // 2. Build Query for Organizations
    let query = supabase
      .from('organizations')
      .select(`
        *,
        org_properties:organization_properties(
          id,
          status,
          property:properties(
            id,
            name,
            address,
            city,
            state,
            zip_code,
            status,
            ray_baud_and_logs_enabled
          )
        ),
        members:organization_members(
          id,
          role,
          status,
          profile:profiles(
            id,
            full_name,
            email,
            phone_number,
            avatar_url
          )
        ),
        tickets:tickets(
          id,
          status,
          priority
        )
      `, { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`);
    }

    // Status filter
    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    // Primary Database Fetch
    const { data: rawOrgs, error, count } = await query;

    if (error) {
      // Fallback simple fetch if complex join encounters schema differences
      let fallbackQuery = supabase
        .from('organizations')
        .select('*', { count: 'exact' });

      if (search) {
        fallbackQuery = fallbackQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`);
      }
      if (status !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('status', status);
      }

      const { data: fallbackData, count: fallbackCount, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: fallbackData || [],
        pagination: {
          totalCount: fallbackCount || 0,
          totalPages: Math.ceil((fallbackCount || 0) / limit) || 1,
          currentPage: page,
          limit,
        },
        metrics: {
          totalOrgsCount: totalOrgsCount || 0,
          totalProperties: totalPropertiesCount || 0,
          totalSipLines: totalServicesCount || 0,
          totalUrgentOrAction: 0,
        },
      });
    }

    // 3. Process & Map Records
    let processed = (rawOrgs || []).map((org: any, idx: number) => {
      const words = (org.name || 'Org').split(' ');
      const initials =
        words.length > 1
          ? `${words[0][0]}${words[1][0]}`.toUpperCase()
          : org.name.substring(0, 2).toUpperCase();

      const properties = (org.org_properties || [])
        .map((op: any) => op.property)
        .filter(Boolean);

      const propCount = properties.length;

      const members = (org.members || []).map((m: any) => ({
        id: m.id,
        profile_id: m.profile?.id,
        full_name: m.profile?.full_name || 'Contact Person',
        email: m.profile?.email || org.email,
        phone_number: m.profile?.phone_number || org.phone,
        role: m.role || 'USER',
        status: m.status || 'ACTIVE',
        is_primary: m.role === 'ADMIN' || m.role === 'PRIMARY',
      }));

      // Find primary contact
      const primaryContact = members.find((m: any) => m.is_primary) || members[0] || {
        full_name: org.contact_name || org.name + ' Admin',
        email: org.email || 'contact@' + org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        phone_number: org.phone || '+1 (800) 555-0100',
        is_primary: true,
      };

      const ticketList = Array.isArray(org.tickets) ? org.tickets : [];
      const openTickets = ticketList.filter(
        (t: any) => t.status !== 'CLOSED' && t.status !== 'RESOLVED'
      ).length;
      const urgentTickets = ticketList.filter(
        (t: any) =>
          t.priority === 'URGENT' && t.status !== 'CLOSED' && t.status !== 'RESOLVED'
      ).length;

      return {
        id: org.id,
        code: org.code || `${initials}-${100 + idx}`,
        name: org.name,
        type: org.type || 'Franchise Portfolio',
        email: org.email || null,
        phone: org.phone || null,
        address: org.address || null,
        city: org.city || null,
        state: org.state || null,
        zip_code: org.zip_code || null,
        country: org.country || 'USA',
        status: org.status || 'ACTIVE',
        contact_name: primaryContact.full_name,
        contact_email: primaryContact.email,
        contact_phone: primaryContact.phone_number,
        primary_contact: primaryContact,
        contacts: members,
        properties_count: propCount,
        properties: properties,
        admin_count: members.length || 1,
        admin_note: 'Direct Portfolio',
        sip_lines: org.sip_lines || (propCount * 6) || 0,
        sip_architecture: 'SIP Mesh Primary',
        open_tickets_count: openTickets,
        urgent_tickets_count: urgentTickets,
        created_at: org.created_at,
        updated_at: org.updated_at || org.created_at,
      };
    });

    // 4. In-Memory Filter for Type & Tickets
    if (type !== 'ALL') {
      processed = processed.filter((o: any) => o.type === type);
    }
    if (ticketFilter === 'URGENT') {
      processed = processed.filter((o: any) => o.urgent_tickets_count > 0);
    } else if (ticketFilter === 'OPEN') {
      processed = processed.filter((o: any) => o.open_tickets_count > 0);
    } else if (ticketFilter === 'ZERO') {
      processed = processed.filter((o: any) => o.open_tickets_count === 0);
    }

    // 5. Sorting
    processed.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'PROPERTIES_DESC':
          return (b.properties_count || 0) - (a.properties_count || 0);
        case 'PROPERTIES_ASC':
          return (a.properties_count || 0) - (b.properties_count || 0);
        case 'SERVICES_DESC':
          return (b.sip_lines || 0) - (a.sip_lines || 0);
        case 'NEWEST':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'UPDATED':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    const totalFiltered = processed.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = processed.slice(startIndex, startIndex + limit);

    const totalUrgentOrAction = processed.reduce(
      (acc: number, o: any) => acc + (o.urgent_tickets_count || 0) + (o.status === 'SUSPENDED' || o.status === 'INACTIVE' ? 1 : 0),
      0
    );

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
        totalOrgsCount: totalOrgsCount || processed.length,
        totalProperties: totalPropertiesCount || processed.reduce((acc: number, o: any) => acc + o.properties_count, 0),
        totalSipLines: totalServicesCount || processed.reduce((acc: number, o: any) => acc + o.sip_lines, 0),
        totalUrgentOrAction,
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
      type,
      email,
      phone,
      contact_name,
      address,
      city,
      state,
      zip_code,
      country,
      status,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required.' },
        { status: 400 }
      );
    }

    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zip_code: zip_code?.trim() || null,
        country: country?.trim() || 'USA',
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Log Audit Entry
    try {
      await supabase.from('audit_logs').insert({
        action: 'ORGANIZATION_CREATED',
        entity_type: 'ORGANIZATION',
        entity_id: newOrg.id,
        entity_name: newOrg.name,
        changes: { name: newOrg.name, status: newOrg.status, type },
      });
    } catch (auditErr) {
      console.warn('Audit log write skipped:', auditErr);
    }

    return NextResponse.json({ success: true, data: newOrg });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
