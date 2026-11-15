import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    // 1. Fetch Complete Property Record
    const { data: prop, error: propErr } = await db
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propErr || !prop) {
      return NextResponse.json(
        { success: false, error: propErr?.message || 'Property not found' },
        { status: 404 }
      );
    }

    // 2. Fetch Channel Partner, Server & Vendor if assigned
    let partnerData: any = null;
    if (prop.partner_id) {
      const { data: partner } = await db
        .from('partners')
        .select('*')
        .eq('id', prop.partner_id)
        .maybeSingle();
      partnerData = partner || null;
    }

    let serverData: any = null;
    if (prop.server_id) {
      const { data: srv } = await db
        .from('servers')
        .select('id, name, provider, status')
        .eq('id', prop.server_id)
        .maybeSingle();
      serverData = srv || null;
    }

    let vendorData: any = null;
    if (prop.vendor_id) {
      const { data: vnd } = await db
        .from('vendors')
        .select('id, name, category, status')
        .eq('id', prop.vendor_id)
        .maybeSingle();
      vendorData = vnd || null;
    }

    // 3. Fetch Organization Link & Onboarding
    const { data: orgProps } = await db
      .from('organization_properties')
      .select(`
        id,
        organization_id,
        status,
        organization:organizations(*),
        onboardings(*)
      `)
      .eq('property_id', propertyId);

    const primaryOrgProp = orgProps?.[0] || null;
    const organizationData = primaryOrgProp?.organization || null;
    const onboardingData = primaryOrgProp?.onboardings?.[0] || null;
    const orgPropIds = (orgProps || []).map((op: any) => op.id);

    // 4. Fetch Property Contacts
    const { data: contacts } = await db
      .from('property_contacts')
      .select('*')
      .eq('property_id', propertyId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    // Fallback: Add GM to contacts list if not present
    const contactsList: any[] = contacts ? [...contacts] : [];
    const hasGmContact = contactsList.some((c) =>
      c.email && prop.general_manager_email && c.email.toLowerCase() === prop.general_manager_email.toLowerCase()
    );
    if (!hasGmContact && prop.general_manager_name) {
      contactsList.unshift({
        id: `gm-record-${prop.id}`,
        property_id: prop.id,
        name: prop.general_manager_name,
        email: prop.general_manager_email || '',
        phone: prop.general_manager_phone || prop.main_phone || '',
        role: 'General Manager',
        is_primary: true,
        status: 'ACTIVE',
        created_at: prop.created_at,
      });
    }

    // 5. Fetch Assigned Services (both direct and via organization_property_services)
    let orgLinkedServices: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: linkedServices } = await db
        .from('organization_property_services')
        .select(`
          id,
          service_id,
          service:services(
            *,
            service_type:service_types(id, name, description)
          )
        `)
        .in('organization_property_id', orgPropIds);
      orgLinkedServices = linkedServices || [];
    }

    const { data: directServices } = await db
      .from('services')
      .select(`
        *,
        service_type:service_types(id, name, description)
      `)
      .eq('property_id', propertyId)
      .neq('status', 'DISCONNECTED');

    const serviceMap = new Map<string, any>();
    (directServices || []).forEach((s: any) => {
      serviceMap.set(s.id, {
        id: s.id,
        phone_number: s.phone_number,
        service_name: s.service_name || '',
        custom_service_id: s.custom_service_id || '',
        service_type: s.service_type?.name || 'Voice Trunk / DID',
        service_type_description: s.service_type?.description || '',
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
          service_type_description: s.service_type?.description || '',
          description: s.description || '',
          price: Number(s.price || 0),
          status: s.status || 'ACTIVE',
          created_at: s.created_at,
        });
      }
    });
    const assignedServices = Array.from(serviceMap.values());

    // 6. Fetch Available (Unassigned) Services for quick assignment
    const { data: allServices } = await db
      .from('services')
      .select(`
        id,
        phone_number,
        service_name,
        custom_service_id,
        price,
        status,
        property_id,
        service_type:service_types(id, name)
      `)
      .neq('status', 'DISCONNECTED')
      .limit(150);

    const availableServices = (allServices || [])
      .filter((s: any) => !serviceMap.has(s.id))
      .map((s: any) => ({
        id: s.id,
        phone_number: s.phone_number,
        service_name: s.service_name || '',
        custom_service_id: s.custom_service_id || '',
        service_type: s.service_type?.name || 'Voice Trunk',
        price: Number(s.price || 0),
      }));

    // 7. Fetch E911 Records for this property
    let e911Record: any = null;
    if (orgPropIds.length > 0) {
      const { data: e911s } = await db
        .from('e911_records')
        .select('*')
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false })
        .limit(1);

      if (e911s && e911s.length > 0) {
        e911Record = e911s[0];
      }
    }

    // 8. Fetch Data Circuit and its Quotes & Revenues
    let dataCircuit: any = null;
    const { data: circuit } = await db
      .from('data_circuits')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();

    if (circuit) {
      // Fetch competing quotes
      const { data: quotes } = await db
        .from('data_circuit_quotes')
        .select('*')
        .eq('data_circuit_id', circuit.id)
        .order('created_at', { ascending: true });

      // Fetch monthly revenue records
      const { data: revenues } = await db
        .from('data_circuit_monthly_revenues')
        .select('*')
        .eq('data_circuit_id', circuit.id)
        .order('month_key', { ascending: false })
        .limit(12);

      dataCircuit = {
        ...circuit,
        quotes: quotes || [],
        monthly_revenues: revenues || [],
      };
    }

    // 9. Financial Summary Calculations
    // 8b. Fetch Porting Documents & Images (from porting_requests, porting_attachments, onboardings, and properties)
    const portingDocsList: any[] = [];
    const seenStoragePaths = new Set<string>();
    const pushAttachment = (att: any) => {
      if (Array.isArray(att)) {
        att.forEach(pushAttachment);
        return;
      }
      if (!att || !att.storage_path) return;
      if (seenStoragePaths.has(att.storage_path)) return;
      seenStoragePaths.add(att.storage_path);
      portingDocsList.push({
        id: att.id || att.storage_path,
        file_name: att.file_name || att.storage_path.split('/').pop() || 'Document',
        file_size: Number(att.file_size || 0),
        mime_type: att.mime_type || 'application/octet-stream',
        storage_path: att.storage_path,
        created_at: att.created_at || prop.created_at,
      });
    };

    if (Array.isArray(prop.attachments)) {
      prop.attachments.forEach(pushAttachment);
    }
    if (Array.isArray(onboardingData?.attachments)) {
      onboardingData.attachments.forEach(pushAttachment);
    }

    // Match porting_requests by property_id, organization_property_id, or property_name
    const { data: allPortingReqs } = await db
      .from('porting_requests')
      .select(`
        id,
        property_id,
        organization_property_id,
        property_name,
        notes,
        attachments,
        porting_attachments(id, file_name, file_size, mime_type, storage_path, created_at)
      `);

    const propNameClean = (prop.name || '').trim().toLowerCase();
    (allPortingReqs || []).forEach((pr: any) => {
      const isMatchByPropId = pr.property_id && pr.property_id === propertyId;
      const isMatchByOpId = pr.organization_property_id && orgPropIds.includes(pr.organization_property_id);
      const isMatchByName = pr.property_name && pr.property_name.trim().toLowerCase() === propNameClean;
      if (isMatchByPropId || isMatchByOpId || isMatchByName) {
        if (Array.isArray(pr.porting_attachments)) {
          pr.porting_attachments.forEach(pushAttachment);
        }
        if (Array.isArray(pr.attachments)) {
          pr.attachments.forEach(pushAttachment);
        }
        if (typeof pr.notes === 'string') {
          const metaMatch = pr.notes.match(/<!--METADATA:([\s\S]*?)-->/);
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1]);
              if (Array.isArray(meta?.attachments)) {
                meta.attachments.forEach(pushAttachment);
              }
            } catch {
              // ignore invalid metadata JSON
            }
          }
        }
      }
    });
    const servicesMonthlyTotal = assignedServices.reduce((sum, s) => sum + (s.price || 0), 0);
    const baseMonthlyPrice = Number(prop.base_price !== null && prop.base_price !== undefined ? prop.base_price : prop.monthly_price || 0);
    const totalMonthlyRevenue = Number(prop.monthly_price || baseMonthlyPrice + servicesMonthlyTotal);

    return NextResponse.json({
      success: true,
      data: {
        property: prop,
        organization: organizationData,
        partner: partnerData,
        server: serverData,
        vendor: vendorData,
        contacts: contactsList,
        services: assignedServices,
        available_services: availableServices,
        e911: {
          record: e911Record,
          ray_baud_and_logs_enabled: Boolean(prop.ray_baud_and_logs_enabled),
          ray_baum_status: prop.ray_baum_status || 'INACTIVE',
          property_e911_status: prop.e911_status || (e911Record?.status || 'PENDING'),
          registered_address: e911Record?.emergency_address || `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`,
          correction_notes: e911Record?.correction_notes || null,
          verified_at: e911Record?.verified_at || null,
        },
        data_circuit: dataCircuit,
        onboarding: onboardingData,
        porting_attachments: portingDocsList,
        stats: {
          total_services: assignedServices.length,
          services_monthly_total: servicesMonthlyTotal,
          base_price: baseMonthlyPrice,
          total_monthly_revenue: totalMonthlyRevenue,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch property full details' },
      { status: 500 }
    );
  }
}

