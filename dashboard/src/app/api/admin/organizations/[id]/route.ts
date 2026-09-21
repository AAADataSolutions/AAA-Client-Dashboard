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

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Fetch Organization core data
    const { data: org, error: orgErr } = await dbClient
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // 2. Fetch Organization Properties
    const { data: orgProps } = await dbClient
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
          status,
          ray_baud_and_logs_enabled,
          ray_baum_status,
          created_at
        ),
        onboardings(
          id,
          status,
          target_date,
          contract_sent_at,
          signed_at,
          porting_waiting_at,
          porting_submitted_at,
          sof_waiting_at,
          foc_received_at,
          completed_at,
          created_at
        )
      `)
      .eq('organization_id', id);

    const orgPropIds = (orgProps || []).map((op) => op.id);

    // Fetch actual service counts per organization property
    let serviceCountMap: Record<string, number> = {};
    if (orgPropIds.length > 0) {
      const { data: opsData } = await dbClient
        .from('organization_property_services')
        .select('organization_property_id')
        .in('organization_property_id', orgPropIds);

      (opsData || []).forEach((ops: any) => {
        serviceCountMap[ops.organization_property_id] = (serviceCountMap[ops.organization_property_id] || 0) + 1;
      });
    }

    // Fetch actual E911 status per organization property
    let e911Map: Record<string, string> = {};
    if (orgPropIds.length > 0) {
      const { data: e911Data } = await dbClient
        .from('e911_records')
        .select('organization_property_id, status')
        .in('organization_property_id', orgPropIds);

      (e911Data || []).forEach((e: any) => {
        e911Map[e.organization_property_id] = e.status;
      });
    }

    const properties = (orgProps || []).map((op: any) => {
      const p = op.property;
      const fullAddress = p?.address ? `${p.address}, ${p.city || ''}, ${p.state || ''} ${p.zip_code || ''}`.trim() : 'Address not specified';
      const isRayBaumActive = p?.ray_baum_status === 'ACTIVE' || p?.ray_baum_status === 'VERIFIED' || !!p?.ray_baud_and_logs_enabled;
      const rawE911 = e911Map[op.id];
      const e911Status = rawE911 === 'VERIFIED' ? 'Verified' : rawE911 === 'CORRECTION_REQUIRED' ? 'Correction Required' : 'Pending Validation';
      const onb = Array.isArray(op.onboardings) && op.onboardings.length > 0 ? op.onboardings[0] : null;

      return {
        org_property_id: op.id,
        link_id: op.id,
        id: p?.id,
        name: p?.name || 'Property',
        address: fullAddress,
        street_address: p?.address || '',
        city: p?.city || '',
        state: p?.state || '',
        zip_code: p?.zip_code || '',
        country: p?.country || 'USA',
        main_phone: p?.main_phone || '—',
        status: p?.status || op.status || 'ACTIVE',
        onboarding_stage: onb?.status || 'DRAFT',
        stage: onb?.status || 'DRAFT',
        services_count: serviceCountMap[op.id] || 0,
        general_manager_name: p?.general_manager_name || p?.contact_person_name || '—',
        general_manager_phone: p?.general_manager_phone || p?.main_phone || '—',
        general_manager_email: p?.general_manager_email || p?.contact_person_email || '—',
        ray_baum_status: isRayBaumActive ? 'Active' : 'Inactive',
        e911_status: e911Status,
        created_at: p?.created_at || op.created_at,
      };
    });

    // 3. Fetch Organization Contacts (Directory / Address Book for Admin)
    const { data: rawOrgContacts } = await dbClient
      .from('organization_contacts')
      .select('*')
      .eq('organization_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    const contacts: any[] = (rawOrgContacts || []).map((oc: any) => ({
      id: oc.id,
      name: oc.name,
      email: oc.email,
      phone: oc.phone || '—',
      role: oc.role || 'Contact',
      is_primary: Boolean(oc.is_primary),
      status: 'ACTIVE',
      created_at: oc.created_at,
    }));

    // Fallback if no contacts yet
    if (contacts.length === 0 && org.email) {
      contacts.push({
        id: `org-contact-default-${org.id}`,
        name: org.contact_name || `${org.name} Contact`,
        email: org.email,
        phone: org.phone || '—',
        role: 'Primary Contact',
        is_primary: true,
        status: 'ACTIVE',
        created_at: org.created_at,
      });
    }

    contacts.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

    const primaryContact = contacts.find((c) => c.is_primary) || contacts[0] || {
      name: org.contact_name || `${org.name} Contact`,
      email: org.email || '—',
      phone: org.phone || '—',
      role: 'Primary Contact',
      is_primary: true,
      status: 'ACTIVE',
    };

    // 4. Fetch Onboarding Records for this Org
    let onboardings: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: onbData } = await dbClient
        .from('onboardings')
        .select(`
          id,
          status,
          target_date,
          contract_sent_at,
          signed_at,
          porting_waiting_at,
          porting_submitted_at,
          sof_waiting_at,
          foc_received_at,
          completed_at,
          created_at,
          organization_property:organization_properties(
            id,
            property:properties(id, name, address, city, state, general_manager_name, general_manager_phone, general_manager_email)
          )
        `)
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false });

      onboardings = (onbData || []).map((o: any) => {
        const prop = o.organization_property?.property;
        return {
          id: o.id,
          property_id: prop?.id,
          property_name: prop?.name || 'Property',
          property_address: prop?.address || (prop ? `${prop.city}, ${prop.state}` : '—'),
          property_location: prop ? `${prop.city}, ${prop.state}` : '',
          general_manager_name: prop?.general_manager_name || '—',
          general_manager_phone: prop?.general_manager_phone || '—',
          general_manager_email: prop?.general_manager_email || '—',
          stage: o.status || 'DRAFT',
          status: o.status || 'DRAFT',
          target_date: o.target_date,
          contract_sent_date: o.contract_sent_at,
          signed_date: o.signed_at,
          porting_submitted_date: o.porting_submitted_at,
          sof_review_date: o.sof_waiting_at,
          foc_confirmed_date: o.foc_received_at,
          live_cutover_date: o.completed_at,
          created_at: o.created_at,
        };
      });
    }

    // 5. Fetch Services & Lines for this Org
    let services: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: opsData } = await dbClient
        .from('organization_property_services')
        .select(`
          id,
          organization_property:organization_properties(
            id,
            property:properties(id, name)
          ),
          service:services(
            id,
            phone_number,
            status,
            description,
            service_type:service_types(name)
          )
        `)
        .in('organization_property_id', orgPropIds);

      services = (opsData || []).map((ops: any) => {
        const s = ops.service;
        const prop = ops.organization_property?.property;
        return {
          id: s?.id || ops.id,
          property_id: prop?.id || null,
          property_name: prop?.name || 'Property',
          service_type: s?.service_type?.name || 'Voice Line',
          phone_number: s?.phone_number || '—',
          status: s?.status || 'ACTIVE',
          description: s?.description || 'Standard Voice Line',
        };
      });
    }

    // 6. Fetch Porting Requests for this Org
    let portings: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: portData } = await dbClient
        .from('porting_requests')
        .select(`
          id,
          status,
          target_date,
          completed_at,
          notes,
          created_at,
          organization_property:organization_properties(
            id,
            property:properties(id, name)
          ),
          porting_request_services(
            service:services(phone_number)
          )
        `)
        .in('organization_property_id', orgPropIds)
        .order('created_at', { ascending: false });

      portings = (portData || []).map((p: any) => {
        const prop = p.organization_property?.property;
        const nums = (p.porting_request_services || []).map((prs: any) => prs.service?.phone_number).filter(Boolean);
        return {
          id: p.id,
          property_name: prop?.name || 'Property',
          numbers_count: nums.length,
          numbers_preview: nums.join(', '),
          status: p.status,
          target_date: p.target_date,
          completed_at: p.completed_at,
          notes: p.notes,
          created_at: p.created_at,
        };
      });
    }

    // 7. Fetch E911 Compliance for this Org
    let e911Records: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: e911Data } = await dbClient
        .from('organization_properties')
        .select(`
          id,
          property:properties(id, name, address, city, state, zip_code),
          e911:e911_records(id, status, emergency_address, verified_at, correction_notes)
        `)
        .in('id', orgPropIds);

      e911Records = (e911Data || []).map((op: any) => {
        const prop = op.property;
        const e911 = Array.isArray(op.e911) && op.e911.length > 0 ? op.e911[0] : null;
        const defaultAddr = prop ? `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code || ''}`.trim() : '—';
        return {
          id: e911?.id || `e911-${op.id}`,
          property_name: prop?.name || 'Property',
          emergency_address: e911?.emergency_address || defaultAddr,
          status: e911?.status || 'PENDING',
          verified_at: e911?.verified_at || null,
          correction_notes: e911?.correction_notes || null,
        };
      });
    }

    // 8. Fetch Invitations
    const { data: invites } = await dbClient
      .from('invitations')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false });

    const formattedInvites = (invites || []).map((inv: any) => {
      const isExpired = new Date(inv.expires_at) < new Date();
      return {
        id: inv.id,
        email: inv.email,
        token_hash: inv.token_hash,
        status: isExpired && inv.status === 'PENDING' ? 'EXPIRED' : inv.status,
        invite_type: inv.invite_type,
        target_org_role: inv.target_org_role,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
        invite_url: `${baseUrl}/invite/${inv.token_hash}`,
      };
    });

    const activeInvite = formattedInvites.find((i: any) => i.status === 'PENDING') || formattedInvites[0] || null;

    // Address formatted string
    const addressParts = [org.address, org.city, org.state, org.zip_code].filter(Boolean);
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not specified';

    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        type: org.type || 'Client Organization',
        address: formattedAddress,
        street_address: org.address || '',
        city: org.city || '',
        state: org.state || '',
        zip_code: org.zip_code || '',
        country: org.country || 'USA',
        phone: org.phone || '—',
        email: org.email || '—',
        status: org.status || 'ACTIVE',
        created_at: org.created_at,
        updated_at: org.updated_at || org.created_at,
        primary_contact: primaryContact,
        contacts,
        properties,
        onboardings,
        services,
        portings,
        e911: e911Records,
        invitations: formattedInvites,
        activeInvite,
        stats: {
          propertiesCount: properties.length,
          contactsCount: contacts.length,
          servicesCount: services.length,
          onboardingsCount: onboardings.length,
          portingsCount: portings.length,
        },
      },
    });
  } catch (err: any) {
    console.error('Fetch organization detail error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
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
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.email !== undefined) updatePayload.email = body.email ? body.email.trim() : null;
    if (body.phone !== undefined) updatePayload.phone = body.phone ? body.phone.trim() : null;
    if (body.address !== undefined) updatePayload.address = body.address ? body.address.trim() : null;
    if (body.city !== undefined) updatePayload.city = body.city ? body.city.trim() : null;
    if (body.state !== undefined) updatePayload.state = body.state ? body.state.trim() : null;
    if (body.zip_code !== undefined) updatePayload.zip_code = body.zip_code ? body.zip_code.trim() : null;
    if (body.country !== undefined) updatePayload.country = body.country ? body.country.trim() : 'USA';
    if (body.logo_url !== undefined) updatePayload.logo_url = body.logo_url ? body.logo_url.trim() : null;
    if (body.status !== undefined) updatePayload.status = body.status;

    const { data: updatedOrg, error } = await dbClient
      .from('organizations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Log Audit Event
    await logAdminAction({
      action: body.status !== undefined ? 'ORGANIZATION_STATUS_CHANGED' : 'ORGANIZATION_UPDATED',
      entity_type: 'ORGANIZATION',
      entity_id: id,
      entity_name: updatedOrg.name,
      organization_id: id,
      description: body.status !== undefined
        ? `Changed organization '${updatedOrg.name}' status to ${body.status}`
        : `Updated organization details for '${updatedOrg.name}'`,
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updatedOrg, message: 'Organization updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    // Fetch org name for audit
    const { data: orgData } = await dbClient
      .from('organizations')
      .select('name')
      .eq('id', id)
      .maybeSingle();

    if (!orgData) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Try hard deletion by unlinking dependencies first
    try {
      await dbClient.from('organization_members').delete().eq('organization_id', id);
      await dbClient.from('invitations').delete().eq('organization_id', id);
      await dbClient.from('organization_properties').delete().eq('organization_id', id);
      const { error: delErr } = await dbClient.from('organizations').delete().eq('id', id);
      if (delErr) {
        // Fallback to ARCHIVED if constraint still prevents hard delete
        await dbClient
          .from('organizations')
          .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    } catch {
      await dbClient
        .from('organizations')
        .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Log Audit Event
    await logAdminAction({
      action: 'ORGANIZATION_DELETED',
      entity_type: 'ORGANIZATION',
      entity_id: id,
      entity_name: orgData.name || `Organization ${id}`,
      organization_id: id,
      description: `Deleted organization '${orgData.name || id}'`,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, message: 'Organization deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

