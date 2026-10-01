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

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search')?.trim();

    const dbClient = createAdminClient() || supabase;

    // Fetch user's org properties
    const { data: memberData } = await dbClient
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!memberData?.organization_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: orgProps } = await dbClient
      .from('organization_properties')
      .select('property_id')
      .eq('organization_id', memberData.organization_id);

    const allowedPropertyIds = (orgProps || []).map((p: any) => p.property_id).filter(Boolean);

    if (allowedPropertyIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = dbClient
      .from('ray_baum_records')
      .select(`
        *,
        property:properties(id, name, address, city, state, zip_code, main_phone)
      `)
      .in('property_id', allowedPropertyIds)
      .order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'ALL' && allowedPropertyIds.includes(propertyId)) {
      query = query.eq('property_id', propertyId);
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,assigned_to_room.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
