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

export async function PATCH(
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

    // Verify property belongs to user's organization (either property.id or organization_property.id)
    const { data: orgProp, error: checkErr } = await supabase
      .from('organization_properties')
      .select('id, property_id')
      .eq('organization_id', member.organization_id)
      .or(`property_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (checkErr || !orgProp) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    const targetPropertyId = orgProp.property_id || id;
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.general_manager_name !== undefined) {
      updatePayload.general_manager_name = body.general_manager_name ? body.general_manager_name.trim() : null;
      updatePayload.contact_person_name = updatePayload.general_manager_name;
    }
    if (body.general_manager_phone !== undefined) {
      updatePayload.general_manager_phone = body.general_manager_phone ? body.general_manager_phone.trim() : null;
      updatePayload.main_phone = updatePayload.general_manager_phone;
    }
    if (body.general_manager_email !== undefined) {
      updatePayload.general_manager_email = body.general_manager_email ? body.general_manager_email.trim() : null;
      updatePayload.contact_person_email = updatePayload.general_manager_email;
    }

    const { data: updatedProp, error: updateErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', targetPropertyId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: updatedProp,
      message: 'Property details updated successfully.',
    });
  } catch (err: any) {
    console.error('Client Property PATCH error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}
