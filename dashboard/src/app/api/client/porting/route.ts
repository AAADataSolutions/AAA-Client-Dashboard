import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPortingEmail } from '@/lib/email/mailer';

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

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role, organization:organizations(name)')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        metrics: { total: 0, inProgress: 0, focReceived: 0, completed: 0, actionRequired: 0 },
        filters: { properties: [] },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const dbClient = createAdminClient() || supabase;

    // 1. Fetch organization property IDs for this organization
    const { data: orgProps } = await dbClient
      .from('organization_properties')
      .select('id')
      .eq('organization_id', member.organization_id);

    const orgPropIds = (orgProps || []).map((op: any) => op.id);

    // 2. Fetch porting requests matching this organization
    let portQuery = dbClient
      .from('porting_requests')
      .select(`
        *,
        organization_property:organization_properties(
          id,
          property:properties(id, name, address, city, state, zip_code, main_phone)
        ),
        attachments:porting_attachments(
          id, file_name, file_size, mime_type, storage_path, created_at
        ),
        services:porting_request_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        )
      `)
      .order('created_at', { ascending: false });

    if (orgPropIds.length > 0) {
      portQuery = portQuery.or(`organization_id.eq.${member.organization_id},organization_property_id.in.(${orgPropIds.join(',')})`);
    } else {
      portQuery = portQuery.eq('organization_id', member.organization_id);
    }

    const { data: portRecords, error } = await portQuery;

    if (error) {
      console.error('Client porting query error:', error);
      // Fallback simple query with attachments
      const { data: simpleRecords } = await dbClient
        .from('porting_requests')
        .select(`
          *,
          attachments:porting_attachments(id, file_name, file_size, mime_type, storage_path, created_at)
        `)
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        data: (simpleRecords || []).map((item: any) => ({
          ...item,
          property_name: item.property_name || 'Property',
          property_address: item.property_address || '',
          property_phone: item.property_phone || '',
          attachments: item.attachments || [],
          services: [],
          services_count: 0,
        })),
        total: simpleRecords?.length || 0,
        metrics: { total: simpleRecords?.length || 0, inProgress: 0, focReceived: 0, completed: 0, actionRequired: 0 },
        filters: { properties: [] },
      });
    }

    const allPortings = (portRecords || []).map((item: any) => {
      const prop = item.organization_property?.property;
      const services = (item.services || []).map((s: any) => {
        const svc = s.service || s;
        return {
          id: svc?.id || s.id,
          phone_number: svc?.phone_number || '—',
          status: svc?.status || 'ACTIVE',
          description: svc?.description || '',
          service_type: svc?.service_type?.name || svc?.service_type || 'Voice Line',
        };
      });

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        property_id: prop?.id || null,
        property_name: item.property_name || prop?.name || 'New Property',
        property_address: item.property_address || prop?.address || '—',
        property_phone: item.property_phone || prop?.main_phone || '—',
        fax: item.fax || '—',
        carrier_details: item.carrier_details || '',
        status: item.status,
        foc_date: item.foc_date || null,
        target_date: item.target_date || null,
        rejection_reason: item.rejection_reason || null,
        notes: item.notes || '',
        is_activated: item.is_activated || false,
        created_at: item.created_at,
        updated_at: item.updated_at,
        attachments: item.attachments || [],
        services: services,
        services_count: services.length,
      };
    });

    let filtered = allPortings;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        filtered = filtered.filter((p) => ['REJECTED', 'CANCELLED', 'PENDING'].includes(p.status));
      } else if (statusFilter === 'IN_PROGRESS_ALL') {
        filtered = filtered.filter((p) => ['IN_PROGRESS', 'SUBMITTED', 'DRAFT'].includes(p.status));
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.property_name.toLowerCase().includes(search) ||
          p.property_phone.toLowerCase().includes(search) ||
          p.property_address.toLowerCase().includes(search) ||
          p.id.toLowerCase().includes(search)
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      metrics: {
        total: allPortings.length,
        inProgress: allPortings.filter((p) => ['IN_PROGRESS', 'SUBMITTED'].includes(p.status)).length,
        focReceived: allPortings.filter((p) => p.status === 'FOC_RECEIVED').length,
        completed: allPortings.filter((p) => p.status === 'COMPLETED').length,
        actionRequired: allPortings.filter((p) => ['REJECTED', 'CANCELLED', 'PENDING'].includes(p.status)).length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get member org
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organization:organizations(name), profile:profiles(full_name, email)')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: false, error: 'User is not associated with an organization.' }, { status: 403 });
    }

    const body = await request.json();
    const { property_name, property_address, property_phone, fax, carrier_details, attachments } = body;

    if (!property_name?.trim() || !property_phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Property Name and Phone Number to port are required.' },
        { status: 400 }
      );
    }

    const dbClient = createAdminClient() || supabase;

    // Insert porting request
    const { data: newPorting, error: insertErr } = await dbClient
      .from('porting_requests')
      .insert({
        organization_id: member.organization_id,
        created_by: user.id,
        property_name: property_name.trim(),
        property_address: property_address ? property_address.trim() : null,
        property_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        carrier_details: carrier_details ? carrier_details.trim() : null,
        status: 'SUBMITTED',
        is_activated: false,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    // Insert attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attRows = attachments.map((att: any) => ({
        porting_request_id: newPorting.id,
        uploaded_by: user.id,
        file_name: att.file_name,
        file_size: att.file_size || 0,
        mime_type: att.mime_type || 'application/pdf',
        storage_path: att.storage_path,
      }));

      await dbClient.from('porting_attachments').insert(attRows);
    }

    // Send email alert via SMTP
    const orgName = (member.organization as any)?.name || 'Client Organization';
    const profile = (member.profile as any) || { full_name: 'User', email: user.email };

    await sendPortingEmail({
      portingRequestId: newPorting.id,
      propertyName: newPorting.property_name,
      propertyAddress: newPorting.property_address || 'Address pending',
      propertyPhone: newPorting.property_phone,
      fax: newPorting.fax || '',
      carrierDetails: newPorting.carrier_details || '',
      organizationName: orgName,
      submittedByName: profile.full_name || 'Client Member',
      submittedByEmail: profile.email || user.email || '',
      attachmentCount: attachments?.length || 0,
    });

    // Notify all admins via in-app notifications
    const { data: admins } = await dbClient
      .from('profiles')
      .select('id')
      .in('role', ['SUPER_ADMIN', 'SUB_SUPER_ADMIN'])
      .eq('status', 'ACTIVE');

    if (admins && admins.length > 0) {
      const notifs = admins.map((a: any) => ({
        recipient_id: a.id,
        sender_id: user.id,
        type: 'NEW_PORTING_REQUEST',
        title: `New Porting Request: ${newPorting.property_name}`,
        message: `${profile.full_name || 'A client'} from ${orgName} submitted a porting request for ${newPorting.property_phone}.`,
        entity_type: 'porting_request',
        entity_id: newPorting.id,
        organization_id: member.organization_id,
      }));

      await dbClient.from('notifications').insert(notifs);
    }

    return NextResponse.json({ success: true, data: newPorting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
