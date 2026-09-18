import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    // 1. Fetch organization properties with full relations
    const { data: links, error } = await dbClient
      .from('organization_properties')
      .select(`
        id,
        status,
        created_at,
        property:properties(
          id,
          name,
          address,
          city,
          state,
          zip_code,
          country,
          main_phone,
          fax,
          general_manager_name,
          general_manager_phone,
          general_manager_email,
          contact_person_name,
          contact_person_email,
          ray_baud_and_logs_enabled,
          ray_baum_status,
          status,
          created_at
        )
      `)
      .eq('organization_id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const orgPropIds = (links || []).map((l: any) => l.id);

    // 2. Fetch service counts for these org properties
    const { data: opsData } = await dbClient
      .from('organization_property_services')
      .select('id, organization_property_id')
      .in('organization_property_id', orgPropIds.length > 0 ? orgPropIds : ['00000000-0000-0000-0000-000000000000']);

    const serviceCountMap: Record<string, number> = {};
    (opsData || []).forEach((ops: any) => {
      serviceCountMap[ops.organization_property_id] = (serviceCountMap[ops.organization_property_id] || 0) + 1;
    });

    // 3. Fetch onboarding records for stage
    const { data: onbData } = await dbClient
      .from('onboardings')
      .select('id, organization_property_id, status')
      .in('organization_property_id', orgPropIds.length > 0 ? orgPropIds : ['00000000-0000-0000-0000-000000000000']);

    const stageMap: Record<string, string> = {};
    (onbData || []).forEach((o: any) => {
      stageMap[o.organization_property_id] = o.status;
    });

    // 4. Fetch E911 status
    const { data: e911Data } = await dbClient
      .from('e911_records')
      .select('id, organization_property_id, status')
      .in('organization_property_id', orgPropIds.length > 0 ? orgPropIds : ['00000000-0000-0000-0000-000000000000']);

    const e911Map: Record<string, string> = {};
    (e911Data || []).forEach((e: any) => {
      e911Map[e.organization_property_id] = e.status;
    });

    const properties = (links || []).map((link: any) => {
      const p = link.property;
      const fullAddress = p?.address ? `${p.address}, ${p.city || ''}, ${p.state || ''} ${p.zip_code || ''}`.trim() : 'Address not specified';
      const isRayBaumVerified = p?.ray_baum_status === 'VERIFIED' || !!p?.ray_baud_and_logs_enabled;
      const rawE911 = e911Map[link.id];
      const e911Status = rawE911 === 'VERIFIED' ? 'Verified' : rawE911 === 'CORRECTION_REQUIRED' ? 'Correction Required' : 'Pending Validation';

      return {
        link_id: link.id,
        id: p?.id,
        name: p?.name || 'Property',
        address: fullAddress,
        street_address: p?.address || '',
        city: p?.city || '',
        state: p?.state || '',
        zip_code: p?.zip_code || '',
        country: p?.country || 'USA',
        main_phone: p?.main_phone || '—',
        status: p?.status || link.status || 'ACTIVE',
        onboarding_stage: stageMap[link.id] || 'COMPLETED',
        services_count: serviceCountMap[link.id] || 0,
        general_manager_name: p?.general_manager_name || p?.contact_person_name || '—',
        general_manager_phone: p?.general_manager_phone || p?.main_phone || '—',
        general_manager_email: p?.general_manager_email || p?.contact_person_email || '—',
        ray_baum_status: isRayBaumVerified ? 'Verified' : 'Not-Verified',
        e911_status: e911Status,
        created_at: p?.created_at,
      };
    });

    return NextResponse.json({ success: true, data: properties });
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { property_id, status } = body;

    if (!property_id) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required to assign property.' },
        { status: 400 }
      );
    }

    // Rule 1: Remove any previous assignment if needed (One property to only one organization)
    await dbClient
      .from('organization_properties')
      .delete()
      .eq('property_id', property_id);

    const { data: newLink, error } = await dbClient
      .from('organization_properties')
      .insert({
        organization_id: organizationId,
        property_id,
        status: status || 'ACTIVE',
      })
      .select(`
        id,
        property:properties(*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const propObj: any = (newLink as any)?.property;
    const propName = Array.isArray(propObj) ? propObj[0]?.name : propObj?.name;

    await logAdminAction({
      action: 'PROPERTY_ASSIGNED_TO_ORGANIZATION',
      entityType: 'ORGANIZATION_PROPERTY',
      entityId: newLink.id,
      entityName: propName || 'Assigned Property',
      organizationId,
      description: `Assigned property '${propName || property_id}' to organization`,
      changes: { organization_id: organizationId, property_id },
    });

    return NextResponse.json({ success: true, data: newLink });
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId query param is required' },
        { status: 400 }
      );
    }

    const { error } = await dbClient
      .from('organization_properties')
      .delete()
      .eq('organization_id', organizationId)
      .eq('property_id', propertyId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAdminAction({
      action: 'PROPERTY_UNASSIGNED_FROM_ORGANIZATION',
      entityType: 'ORGANIZATION_PROPERTY',
      entityId: propertyId,
      organizationId,
      description: `Unassigned property '${propertyId}' from organization`,
    });

    return NextResponse.json({ success: true, message: 'Property unassigned successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
