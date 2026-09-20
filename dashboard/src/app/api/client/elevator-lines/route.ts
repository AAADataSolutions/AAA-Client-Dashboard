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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const propertyId = searchParams.get('propertyId');

    const { data: memberData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!memberData?.organization_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: orgProps } = await supabase
      .from('organization_properties')
      .select('property_id')
      .eq('organization_id', memberData.organization_id);

    const allowedPropertyIds = (orgProps || []).map((p) => p.property_id);

    if (allowedPropertyIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabase
      .from('elevator_lines')
      .select(`
        *,
        property:properties(id, name, address, city, state),
        service:services(id, service_name, phone_number)
      `)
      .in('property_id', allowedPropertyIds)
      .order('created_at', { ascending: false });

    if (propertyId && propertyId !== 'ALL' && allowedPropertyIds.includes(propertyId)) {
      query = query.eq('property_id', propertyId);
    }

    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,extension.ilike.%${search}%,description.ilike.%${search}%,status.ilike.%${search}%`);
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
