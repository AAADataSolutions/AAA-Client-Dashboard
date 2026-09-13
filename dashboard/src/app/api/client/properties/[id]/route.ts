import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Verify property belongs to user's organization
    const { data: orgProp, error } = await supabase
      .from('organization_properties')
      .select(`
        id,
        status,
        created_at,
        property:properties(*),
        services:organization_property_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        ),
        e911:e911_records(*),
        onboardings(*),
        tickets(
          id,
          subject,
          description,
          status,
          priority,
          created_at,
          creator:profiles!tickets_created_by_fkey(full_name, email)
        )
      `)
      .eq('organization_id', member.organization_id)
      .eq('property_id', id)
      .maybeSingle();

    if (error || !orgProp) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    const prop: any = orgProp.property;
    const servicesList = (orgProp.services || []).map((s: any) => s.service).filter(Boolean);
    const e911Record = Array.isArray(orgProp.e911) && orgProp.e911.length > 0 ? orgProp.e911[0] : null;
    const onboardingRecord = Array.isArray(orgProp.onboardings) && orgProp.onboardings.length > 0 ? orgProp.onboardings[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        ...prop,
        org_property_id: orgProp.id,
        org_property_status: orgProp.status,
        services: servicesList,
        e911_record: e911Record,
        onboarding: onboardingRecord,
        tickets: orgProp.tickets || [],
      },
    });
  } catch (err: any) {
    console.error('Client Single Property API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}
