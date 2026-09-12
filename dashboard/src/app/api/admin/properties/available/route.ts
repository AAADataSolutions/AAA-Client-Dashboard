import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const search = (searchParams.get('search') || '').trim();
    const excludeOrgId = searchParams.get('excludeOrgId') || '';

    // 1. Fetch assigned property IDs for this organization
    let assignedPropertyIds: string[] = [];
    if (excludeOrgId) {
      const { data: existingLinks } = await supabase
        .from('organization_properties')
        .select('property_id')
        .eq('organization_id', excludeOrgId);

      if (existingLinks && existingLinks.length > 0) {
        assignedPropertyIds = existingLinks.map((l: any) => l.property_id);
      }
    }

    // 2. Fetch properties from DB
    let query = supabase
      .from('properties')
      .select('id, name, address, city, state, zip_code, country, status, main_phone, ray_baud_and_logs_enabled, created_at')
      .order('name', { ascending: true })
      .limit(50);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: properties, error } = await query;

    if (error) {
      console.warn('Properties query error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // If properties table is currently empty, seed a few standard hotel properties
    if ((!properties || properties.length === 0) && !search) {
      const sampleProps = [
        {
          name: 'The Grand Del Mar Resort',
          address: '5300 Grand Del Mar Ct',
          city: 'San Diego',
          state: 'CA',
          zip_code: '92130',
          country: 'USA',
          main_phone: '+1 (858) 314-2000',
          ray_baud_and_logs_enabled: true,
          status: 'ACTIVE',
        },
        {
          name: 'Omni Berkshire Place',
          address: '21 E 52nd St',
          city: 'New York',
          state: 'NY',
          zip_code: '10022',
          country: 'USA',
          main_phone: '+1 (212) 753-5800',
          ray_baud_and_logs_enabled: true,
          status: 'ACTIVE',
        },
        {
          name: 'The Ritz-Carlton Georgetown',
          address: '3100 South St NW',
          city: 'Washington',
          state: 'DC',
          zip_code: '20007',
          country: 'USA',
          main_phone: '+1 (202) 912-4100',
          ray_baud_and_logs_enabled: true,
          status: 'ACTIVE',
        },
        {
          name: 'JW Marriott Austin Downtown',
          address: '110 E 2nd St',
          city: 'Austin',
          state: 'TX',
          zip_code: '78701',
          country: 'USA',
          main_phone: '+1 (512) 474-4777',
          ray_baud_and_logs_enabled: true,
          status: 'ACTIVE',
        },
      ];

      const { data: seeded } = await supabase
        .from('properties')
        .insert(sampleProps)
        .select();

      const mappedSeeded = (seeded || []).map((p: any) => ({
        ...p,
        is_assigned_to_current_org: assignedPropertyIds.includes(p.id),
      }));

      return NextResponse.json({
        success: true,
        data: mappedSeeded,
      });
    }

    // If search was provided, also support city/address matching in memory if needed
    let filtered = properties || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.city && p.city.toLowerCase().includes(s)) ||
          (p.zip_code && p.zip_code.toLowerCase().includes(s)) ||
          (p.address && p.address.toLowerCase().includes(s))
      );
    }

    const available = filtered.map((p: any) => ({
      ...p,
      is_assigned_to_current_org: assignedPropertyIds.includes(p.id),
    }));

    return NextResponse.json({
      success: true,
      data: available,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
