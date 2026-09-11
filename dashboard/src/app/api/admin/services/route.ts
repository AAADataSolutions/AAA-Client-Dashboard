import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const orgId = searchParams.get('orgId');

    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        service_type:service_types(id, name, description),
        property_links:organization_property_services(
          id,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state),
            organization:organizations(id, name)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: simpleServices, error: sErr } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleServices || [] });
    }

    return NextResponse.json({ success: true, data: services || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      phone_number,
      service_type_id,
      service_type_name,
      organization_property_id,
      description,
      status,
    } = body;

    if (!phone_number || !phone_number.trim()) {
      return NextResponse.json({ success: false, error: 'Phone number / DID string is required.' }, { status: 400 });
    }

    let typeId = service_type_id;

    // Resolve or create service type if not provided
    if (!typeId && service_type_name) {
      const { data: existingType } = await supabase
        .from('service_types')
        .select('id')
        .eq('name', service_type_name)
        .maybeSingle();

      if (existingType) {
        typeId = existingType.id;
      } else {
        const { data: newType } = await supabase
          .from('service_types')
          .insert({ name: service_type_name, description: `${service_type_name} Service` })
          .select('id')
          .single();
        typeId = newType?.id;
      }
    }

    // 1. Insert Service
    const { data: newService, error: sErr } = await supabase
      .from('services')
      .insert({
        phone_number: phone_number.trim(),
        service_type_id: typeId,
        description: description?.trim() || null,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (sErr) {
      return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
    }

    // 2. Link to organization_property if provided
    if (organization_property_id && newService) {
      await supabase.from('organization_property_services').insert({
        organization_property_id,
        service_id: newService.id,
      });
    }

    return NextResponse.json({ success: true, data: newService });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
