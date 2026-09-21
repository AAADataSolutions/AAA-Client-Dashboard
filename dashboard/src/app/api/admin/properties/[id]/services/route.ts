import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    // Find organization_property record for this property
    const { data: orgProps, error: opErr } = await supabase
      .from('organization_properties')
      .select('id, organization_id, organization:organizations(id, name)')
      .eq('property_id', propertyId);

    if (opErr) {
      return NextResponse.json({ success: false, error: opErr.message }, { status: 400 });
    }

    const orgPropIds = (orgProps || []).map((op: any) => op.id);

    if (orgPropIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get services linked to these org_property records
    const { data: linkedServices, error: lsErr } = await supabase
      .from('organization_property_services')
      .select(`
        id,
        service_id,
        service:services(
          id,
          phone_number,
          description,
          status,
          service_name,
          custom_service_id,
          service_type:service_types(id, name),
          created_at
        )
      `)
      .in('organization_property_id', orgPropIds);

    if (lsErr) {
      return NextResponse.json({ success: false, error: lsErr.message }, { status: 400 });
    }

    let services = (linkedServices || [])
      .map((item: any) => item.service)
      .filter(Boolean)
      .map((s: any) => ({
        id: s.id,
        phone_number: s.phone_number,
        service_name: s.service_name || '',
        custom_service_id: s.custom_service_id || '',
        service_type: s.service_type?.name || 'Voice Trunk / DID',
        description: s.description || '',
        status: s.status || 'ACTIVE',
        created_at: s.created_at,
      }));

    // If nested join returned empty but links exist, fetch directly
    if (services.length === 0 && (linkedServices || []).length > 0) {
      const sIds = (linkedServices || []).map((ls: any) => ls.service_id).filter(Boolean);
      if (sIds.length > 0) {
        const { data: directSvcs } = await supabase
          .from('services')
          .select(`
            id,
            phone_number,
            description,
            status,
            service_name,
            custom_service_id,
            service_type:service_types(id, name),
            created_at
          `)
          .in('id', sIds);

        if (directSvcs && directSvcs.length > 0) {
          services = directSvcs.map((s: any) => ({
            id: s.id,
            phone_number: s.phone_number,
            service_name: s.service_name || '',
            custom_service_id: s.custom_service_id || '',
            service_type: s.service_type?.name || 'Voice Trunk / DID',
            description: s.description || '',
            status: s.status || 'ACTIVE',
            created_at: s.created_at,
          }));
        }
      }
    }

    return NextResponse.json({ success: true, data: services });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { service_id } = body;
    if (!service_id) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    // 1. Find or verify organization_property link for this property
    const { data: orgProp } = await supabase
      .from('organization_properties')
      .select('id, organization_id, property:properties(name)')
      .eq('property_id', propertyId)
      .maybeSingle();

    if (!orgProp) {
      return NextResponse.json({
        success: false,
        error: 'Property is not assigned to any organization yet. Please assign the property to an organization before assigning services.',
      }, { status: 400 });
    }

    // 2. Enforce Rule 2: One service can only be assigned to one property. Remove any prior assignments!
    await supabase.from('organization_property_services').delete().eq('service_id', service_id);

    // 3. Link service to this property
    const { data: newLink, error: linkErr } = await supabase
      .from('organization_property_services')
      .insert({
        organization_property_id: orgProp.id,
        service_id: service_id,
      })
      .select()
      .single();

    if (linkErr) {
      return NextResponse.json({ success: false, error: linkErr.message }, { status: 400 });
    }

    // Fetch service info for audit log
    const { data: svc } = await supabase.from('services').select('phone_number').eq('id', service_id).maybeSingle();

    // 4. Audit Log
    const propName = Array.isArray((orgProp as any)?.property)
      ? (orgProp as any)?.property[0]?.name
      : (orgProp as any)?.property?.name;

    await logAuditEvent({
      action: 'SERVICE_ASSIGNED_TO_PROPERTY',
      entity_type: 'PROPERTY',
      entity_id: propertyId,
      entity_name: propName || 'Property',
      changes: {
        property_id: propertyId,
        service_id: service_id,
        service_number: svc?.phone_number || service_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service assigned to property successfully.',
      data: newLink,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'Service ID is required.' }, { status: 400 });
    }

    // Get org_properties for this property
    const { data: orgProps } = await supabase
      .from('organization_properties')
      .select('id')
      .eq('property_id', propertyId);

    const orgPropIds = (orgProps || []).map((op: any) => op.id);

    if (orgPropIds.length > 0) {
      await supabase
        .from('organization_property_services')
        .delete()
        .eq('service_id', serviceId)
        .in('organization_property_id', orgPropIds);
    }

    // Audit Log
    await logAuditEvent({
      action: 'SERVICE_UNASSIGNED_FROM_PROPERTY',
      entity_type: 'PROPERTY',
      entity_id: propertyId,
      entity_name: `Property ID ${propertyId}`,
      changes: { property_id: propertyId, service_id: serviceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Service unassigned from property successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
