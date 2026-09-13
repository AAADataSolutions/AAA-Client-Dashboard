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

    // Resolve tenant membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('q') || '').trim();

    const dbClient = createAdminClient() || supabase;

    // 1. Try RPC function first (bypasses restrictive RLS via SECURITY DEFINER)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_unassigned_properties_for_client', {
      p_search: search,
    });

    if (!rpcErr && rpcData) {
      return NextResponse.json({ success: true, data: rpcData });
    }

    // 2. Direct fallback query
    // Fetch assigned property IDs for this organization
    const { data: assignedLinks } = await dbClient
      .from('organization_properties')
      .select('property_id')
      .eq('organization_id', member.organization_id);

    const assignedPropertyIds = (assignedLinks || []).map((l: any) => l.property_id);

    let query = dbClient
      .from('properties')
      .select('id, name, address, city, state, zip_code, country, main_phone, contact_person_name, general_manager_name, status')
      .order('name', { ascending: true })
      .limit(100);

    if (search) {
      query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
    }

    const { data: properties, error } = await query;

    if (error) {
      // If table query is blocked by RLS, return gracefully
      console.warn('Properties fallback query notice:', error.message);
      return NextResponse.json({ success: true, data: [] });
    }

    // Filter out properties already in this organization
    const unassociatedProperties = (properties || []).filter(
      (p: any) => !assignedPropertyIds.includes(p.id)
    );

    return NextResponse.json({ success: true, data: unassociatedProperties });
  } catch (err: any) {
    console.error('Properties search error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to search properties' },
      { status: 500 }
    );
  }
}
