import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';
import { syncPropertyMonthlyPrice } from '@/lib/properties/pricing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    // 1. Find organization_property record for this property (if one exists)
    const { data: orgProps } = await supabase
      .from('organization_properties')
      .select('id, organization_id, organization:organizations(id, name)')
      .eq('property_id', propertyId);

    const orgPropIds = (orgProps || []).map((op: any) => op.id);

    // 2. Fetch services linked via organization_property_services
    let orgLinkedServices: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: linkedServices } = await supabase
        .from('organization_property_services')
        .select(`
          id,
          service_id,
          service:services(
            id,
            phone_number,
            description,
            price,
            status,
            service_name,
            custom_service_id,
            service_type:service_types(id, name),
            created_at
          )
        `)
        .in('organization_property_id', orgPropIds);
      orgLinkedServices = linkedServices || [];
    }

    // 3. Fetch services linked directly via services.property_id (supports unassigned properties)
    const { data: directServices } = await supabase
      .from('services')
      .select(`
        id,
        phone_number,
        description,
        price,
        status,
        service_name,
        custom_service_id,
        service_type:service_types(id, name),
        created_at
      `)
      .eq('property_id', propertyId)
      .neq('status', 'DISCONNECTED');

    // Combine and deduplicate by service id
    const serviceMap = new Map<string, any>();

    (directServices || []).forEach((s: any) => {
      serviceMap.set(s.id, {
        id: s.id,
        phone_number: s.phone_number,
        service_name: s.service_name || '',
        custom_service_id: s.custom_service_id || '',
        service_type: s.service_type?.name || 'Voice Trunk / DID',
        description: s.description || '',
        price: Number(s.price || 0),
        status: s.status || 'ACTIVE',
        created_at: s.created_at,
      });
    });

    orgLinkedServices.forEach((item: any) => {
      const s = item.service;
      if (s && !serviceMap.has(s.id)) {
        serviceMap.set(s.id, {
          id: s.id,
          phone_number: s.phone_number,
          service_name: s.service_name || '',
          custom_service_id: s.custom_service_id || '',
          service_type: s.service_type?.name || 'Voice Trunk / DID',
          description: s.description || '',
          price: Number(s.price || 0),
          status: s.status || 'ACTIVE',
          created_at: s.created_at,
        });
      }
    });

    const services = Array.from(serviceMap.values());
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

    // 1. Direct assignment on service row (works whether assigned to org or not)
    await supabase.from('services').update({ property_id: propertyId }).eq('id', service_id);

    // 2. Remove any prior org-property link
    await supabase.from('organization_property_services').delete().eq('service_id', service_id);

    // 3. Find if organization_property exists for this property
    const { data: orgProp } = await supabase
      .from('organization_properties')
      .select('id, organization_id, property:properties(name)')
      .eq('property_id', propertyId)
      .maybeSingle();

    if (orgProp) {
      const { error: linkErr } = await supabase.from('organization_property_services').insert({
        organization_property_id: orgProp.id,
        service_id: service_id,
      });

      if (linkErr) {
        console.warn('Could not insert organization_property_services link:', linkErr.message);
      }
    }

    // Fetch service info for audit log and sync
    const { data: svc } = await supabase
      .from('services')
      .select('id, phone_number, service_name, description, status, price, service_type:service_types(name)')
      .eq('id', service_id)
      .maybeSingle();

    if (svc) {
      const typeName = ((svc.service_type as any)?.name || '').toLowerCase();
      const sName = (svc.service_name || '').toLowerCase();
      const isFire = typeName.includes('fire') || sName.includes('fire');
      const isElevator = typeName.includes('elevator') || sName.includes('elevator');
      const svcPrice = svc.price ? Number(svc.price) : 0;

      if (isFire) {
        const { data: existingFl } = await supabase.from('fire_lines').select('id').eq('service_id', service_id).maybeSingle();
        if (existingFl) {
          await supabase.from('fire_lines').update({
            property_id: propertyId,
            phone_number: svc.phone_number,
            price: svcPrice,
          }).eq('id', existingFl.id);
        } else {
          await supabase.from('fire_lines').insert({
            property_id: propertyId,
            service_id: service_id,
            phone_number: svc.phone_number,
            device_type: (svc.service_type as any)?.name || 'Fire Alarm Communicator',
            description: svc.description || svc.service_name,
            price: svcPrice,
          });
        }
      } else if (isElevator) {
        const { data: existingEl } = await supabase.from('elevator_lines').select('id').eq('service_id', service_id).maybeSingle();
        if (existingEl) {
          await supabase.from('elevator_lines').update({
            property_id: propertyId,
            phone_number: svc.phone_number,
            price: svcPrice,
          }).eq('id', existingEl.id);
        } else {
          await supabase.from('elevator_lines').insert({
            property_id: propertyId,
            service_id: service_id,
            phone_number: svc.phone_number,
            status: svc.status || 'ACTIVE',
            description: svc.description || svc.service_name,
            price: svcPrice,
          });
        }
      }
    }

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

    // 5. Synchronize property monthly price immediately
    const updatedPrice = await syncPropertyMonthlyPrice(supabase, propertyId);

    return NextResponse.json({
      success: true,
      message: 'Service assigned to property successfully.',
      data: { service_id, property_id: propertyId, monthly_price: updatedPrice },
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

    // Clear services.property_id if it pointed to this property
    await supabase.from('services').update({ property_id: null }).eq('id', serviceId).eq('property_id', propertyId);

    // Clean up or unlink from fire_lines / elevator_lines
    await supabase.from('fire_lines').delete().eq('service_id', serviceId).eq('property_id', propertyId);
    await supabase.from('elevator_lines').delete().eq('service_id', serviceId).eq('property_id', propertyId);

    // Synchronize property monthly price immediately
    await syncPropertyMonthlyPrice(supabase, propertyId);

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
