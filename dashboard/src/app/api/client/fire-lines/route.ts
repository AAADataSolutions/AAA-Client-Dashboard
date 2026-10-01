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
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const propertyId = searchParams.get('propertyId');

    const db = createAdminClient() || supabase;

    // Get user's org properties
    const { data: memberData } = await db
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!memberData?.organization_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: orgProps } = await db
      .from('organization_properties')
      .select('id, property_id, property:properties(id, name, address, city, state)')
      .eq('organization_id', memberData.organization_id);

    const allowedPropertyIds = (orgProps || []).map((p) => p.property_id).filter(Boolean);
    const orgPropIds = (orgProps || []).map((p) => p.id).filter(Boolean);

    if (allowedPropertyIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 1. Fetch from fire_lines table
    let fireQuery = db
      .from('fire_lines')
      .select(`
        *,
        property:properties(id, name, address, city, state),
        service:services(id, service_name, phone_number, status, description)
      `)
      .in('property_id', allowedPropertyIds);

    const { data: fireData, error: fireErr } = await fireQuery;
    if (fireErr) {
      console.warn('fire_lines query warning:', fireErr.message);
    }

    const existingKeys = new Set<string>();
    const existingServiceIds = new Set<string>();
    const combinedList: any[] = [];

    (fireData || []).forEach((item: any) => {
      if (item.service_id) existingServiceIds.add(item.service_id);
      if (item.phone_number && item.property_id) {
        existingKeys.add(`${item.phone_number.trim()}_${item.property_id}`);
      }
      combinedList.push(item);
    });

    // 2. Also fetch services assigned to these properties that are Fire Lines / Fire Alarms
    if (orgPropIds.length > 0) {
      const { data: opsRecords } = await db
        .from('organization_property_services')
        .select(`
          id,
          organization_property_id,
          organization_property:organization_properties(
            property_id,
            property:properties(id, name, address, city, state)
          ),
          service:services(
            id,
            phone_number,
            service_name,
            custom_service_id,
            status,
            description,
            created_at,
            service_type:service_types(id, name)
          )
        `)
        .in('organization_property_id', orgPropIds);

      for (const link of opsRecords || []) {
        const svc: any = link.service;
        const op: any = link.organization_property;
        if (!svc) continue;

        const typeName = (svc.service_type?.name || '').toLowerCase();
        const svcName = (svc.service_name || '').toLowerCase();
        const desc = (svc.description || '').toLowerCase();

        const isFire =
          typeName.includes('fire') ||
          svcName.includes('fire') ||
          desc.includes('fire');

        if (!isFire) continue;

        const propId = op?.property_id;
        const phone = svc.phone_number?.trim();
        const dedupeKey = `${phone}_${propId}`;

        if (existingServiceIds.has(svc.id) || (phone && propId && existingKeys.has(dedupeKey))) {
          continue;
        }

        // Add to combined list
        existingServiceIds.add(svc.id);
        if (phone && propId) existingKeys.add(dedupeKey);

        const propObj = Array.isArray(op?.property) ? op?.property[0] : op?.property;
        const newItem = {
          id: svc.id,
          service_id: svc.id,
          property_id: propId || null,
          phone_number: svc.phone_number || '',
          device_type: svc.service_type?.name || svc.service_name || 'Fire Alarm Communicator',
          serial_number: null,
          description: svc.description || svc.service_name || 'Fire Life Safety Circuit',
          status: svc.status || 'ACTIVE',
          created_at: svc.created_at || new Date().toISOString(),
          property: propObj || null,
          service: svc,
        };

        combinedList.push(newItem);

        // Auto-backfill to fire_lines table for persistent integrity
        if (propId && phone) {
          db.from('fire_lines')
            .insert({
              property_id: propId,
              service_id: svc.id,
              phone_number: phone,
              device_type: svc.service_type?.name || svc.service_name || 'Fire Alarm Communicator',
              description: svc.description || svc.service_name || null,
            })
            .then(({ error: insertErr }) => {
              if (insertErr) console.warn('Could not backfill fire_lines:', insertErr.message);
            });
        }
      }
    }

    // 3. Filter by propertyId if requested
    let result = combinedList;
    if (propertyId && propertyId !== 'ALL' && allowedPropertyIds.includes(propertyId)) {
      result = result.filter((item) => item.property_id === propertyId);
    }

    // 4. Filter by search query if requested
    if (search) {
      result = result.filter((item) => {
        const pName = item.property?.name?.toLowerCase() || '';
        const phone = (item.phone_number || '').toLowerCase();
        const dType = (item.device_type || '').toLowerCase();
        const sNum = (item.serial_number || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return (
          pName.includes(search) ||
          phone.includes(search) ||
          dType.includes(search) ||
          sNum.includes(search) ||
          desc.includes(search)
        );
      });
    }

    // Sort by created_at descending
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
