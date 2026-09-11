import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    let query = supabase
      .from('properties')
      .select(`
        *,
        org_links:organization_properties(
          id,
          status,
          organization:organizations(id, name, email)
        )
      `)
      .order('created_at', { ascending: false });

    if (orgId) {
      // Filter by org if specified
      const { data: orgPropLinks } = await supabase
        .from('organization_properties')
        .select('property_id')
        .eq('organization_id', orgId);

      const propIds = orgPropLinks?.map((l) => l.property_id) || [];
      if (propIds.length > 0) {
        query = query.in('id', propIds);
      } else {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    const { data: properties, error } = await query;

    if (error) {
      const { data: simpleProps, error: sErr } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleProps || [] });
    }

    return NextResponse.json({ success: true, data: properties || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      organization_id,
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
      ray_baud_and_logs_enabled,
      status,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Property name is required.' }, { status: 400 });
    }

    if (!address || !city || !state || !zip_code) {
      return NextResponse.json({ success: false, error: 'Complete street address, city, state, and zip code are required for E911 dispatch.' }, { status: 400 });
    }

    // 1. Insert Property
    const { data: newProp, error: propErr } = await supabase
      .from('properties')
      .insert({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zip_code: zip_code.trim(),
        country: country?.trim() || 'USA',
        main_phone: main_phone?.trim() || null,
        fax: fax?.trim() || null,
        contact_person_name: contact_person_name?.trim() || null,
        contact_person_email: contact_person_email?.trim() || null,
        general_manager_name: general_manager_name?.trim() || null,
        ray_baud_and_logs_enabled: ray_baud_and_logs_enabled ?? true,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    // 2. Link to organization if provided
    if (organization_id) {
      await supabase.from('organization_properties').insert({
        organization_id,
        property_id: newProp.id,
        status: status || 'ACTIVE',
      });
    }

    return NextResponse.json({ success: true, data: newProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
