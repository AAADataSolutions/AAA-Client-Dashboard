import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
          status,
          ray_baud_and_logs_enabled
        )
      `)
      .eq('organization_id', id);

    const orgPropIds = (orgProps || []).map((op) => op.id);
    const properties = (orgProps || []).map((op: any) => ({
      org_property_id: op.id,
      id: op.property?.id,
      name: op.property?.name || 'Property',
      address: op.property?.address ? `${op.property.address}, ${op.property.city}, ${op.property.state} ${op.property.zip_code || ''}`.trim() : 'Address not specified',
      city: op.property?.city,
      state: op.property?.state,
      main_phone: op.property?.main_phone || '—',
      status: op.status || op.property?.status || 'ACTIVE',
      e911_status: op.property?.ray_baud_and_logs_enabled ? 'VERIFIED' : 'PENDING',
      services_count: 6,
      created_at: op.created_at,
    }));

    // 3. Fetch Contacts / Members & Invitations
    const { data: members } = await dbClient
      .from('organization_members')
      .select(`
        id,
        role,
        status,
        created_at,
        profile:profiles(
          id,
          full_name,
          email,
          phone_number,
          avatar_url,
          status
        )
      `)
      .eq('organization_id', id)
      .order('created_at', { ascending: false });

    const { data: rawInvites } = await dbClient
      .from('invitations')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: false });

    const contacts: any[] = [];
    const seenEmails = new Set<string>();

    for (const m of (members || []) as any[]) {
      const prof: any = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      const email = prof?.email || org.email || '—';
      seenEmails.add(email.toLowerCase());
      contacts.push({
        id: m.id,
        profile_id: prof?.id,
        name: prof?.full_name || (m.role === 'ADMIN' ? `${org.name} Admin` : 'Contact Member'),
        email: email,
        phone: prof?.phone_number || org.phone || '—',
        role: m.role || 'USER',
        is_primary: m.role === 'ADMIN',
        status: m.status || prof?.status || 'ACTIVE',
        avatar_url: prof?.avatar_url,
        created_at: m.created_at,
      });
    }

    for (const inv of rawInvites || []) {
      const cleanEmail = inv.email?.toLowerCase() || '';
      if (cleanEmail && !seenEmails.has(cleanEmail) && inv.status !== 'REVOKED') {
        seenEmails.add(cleanEmail);
        const isExpired = new Date(inv.expires_at) < new Date();
        contacts.push({
          id: `invite-${inv.id}`,
          invitation_id: inv.id,
          profile_id: null,
          name: inv.email.split('@')[0],
          email: inv.email,
          phone: org.phone || '—',
          role: inv.target_org_role || 'USER',
          is_primary: inv.target_org_role === 'ADMIN',
          status: isExpired && inv.status === 'PENDING' ? 'EXPIRED' : (inv.status === 'PENDING' ? 'INVITED' : inv.status),
          invite_url: `${baseUrl}/invite/${inv.token_hash}`,
          created_at: inv.created_at,
        });
      }
    }

    // Fallback if no contacts yet
    if (contacts.length === 0 && org.email) {
      contacts.push({
        id: `org-admin-${org.id}`,
        profile_id: null,
        name: org.contact_name || `${org.name} Admin`,
        email: org.email,
        phone: org.phone || '—',
        role: 'ADMIN',
        is_primary: true,
        status: 'ACTIVE',
        created_at: org.created_at,
      });
    }

    contacts.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

    const primaryContact = contacts.find((c) => c.is_primary) || contacts[0] || {
      name: org.contact_name || `${org.name} Admin`,
      email: org.email || '—',
      phone: org.phone || '—',
      role: 'ADMIN',
      is_primary: true,
      status: 'ACTIVE',
    };

    // 4. Fetch Onboarding Records for this Org
    let onboardings: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: onbData } = await dbClient
        .from('property_onboardings')
        .select(`
          id,
          status,
          current_stage,
          target_completion_date,
          created_at,
          organization_property:organization_properties(
            id,
            property:properties(id, name, city, state)
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
          property_location: prop ? `${prop.city}, ${prop.state}` : '',
          stage: o.current_stage || o.status || 'DRAFT',
          status: o.status,
          target_date: o.target_completion_date,
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

    const { error } = await dbClient
      .from('organizations')
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Organization archived successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
