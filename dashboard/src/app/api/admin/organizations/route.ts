import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminAction } from '@/lib/audit/logger';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status') || 'ALL';
    const hasPropertiesFilter = searchParams.get('has_properties') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Fetch Organizations with relations
    const { data: rawOrgs, error } = await dbClient
      .from('organizations')
      .select(`
        *,
        org_properties:organization_properties(
          id,
          status,
          property:properties(id, name, address, city, state, zip_code, main_phone, status)
        ),
        members:organization_members(
          id,
          role,
          status,
          profile:profiles(id, full_name, email, phone_number, avatar_url, status)
        ),
        invitations:invitations(
          id,
          email,
          token_hash,
          status,
          expires_at,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying organizations:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 2. Process & map each organization
    const allProcessed = (rawOrgs || []).map((org: any) => {
      const properties = (org.org_properties || [])
        .map((op: any) => op.property)
        .filter(Boolean);

      const propCount = properties.length;

      const members = ((org.members || []) as any[]).map((m: any) => {
        const prof: any = Array.isArray(m.profile) ? m.profile[0] : m.profile;
        return {
          id: m.id,
          profile_id: prof?.id,
          full_name: prof?.full_name || 'Contact Person',
          email: prof?.email || org.email,
          phone_number: prof?.phone_number || org.phone,
          role: m.role || 'USER',
          status: m.status || 'ACTIVE',
          is_primary: m.role === 'ADMIN' || m.role === 'PRIMARY',
        };
      });

      const primaryMember = members.find((m: any) => m.is_primary) || members[0] || null;

      // Find latest invitation
      const invitesList = Array.isArray(org.invitations) ? [...org.invitations] : [];
      invitesList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestInvite = invitesList[0] || null;

      const primaryContactName = primaryMember?.full_name || org.contact_name || (latestInvite?.email ? latestInvite.email.split('@')[0] : 'Not Configured');
      const primaryContactEmail = primaryMember?.email || org.email || latestInvite?.email || '—';
      const primaryContactPhone = primaryMember?.phone_number || org.phone || '—';

      // Format formatted full address
      const addressParts = [org.address, org.city, org.state, org.zip_code].filter(Boolean);
      const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not specified';

      let inviteStatus = 'NO_INVITE';
      let inviteUrl = null;
      let inviteExpiresAt = null;

      if (latestInvite) {
        const isExpired = new Date(latestInvite.expires_at) < new Date();
        inviteStatus = isExpired && latestInvite.status === 'PENDING' ? 'EXPIRED' : latestInvite.status;
        inviteUrl = `${baseUrl}/invite/${latestInvite.token_hash}`;
        inviteExpiresAt = latestInvite.expires_at;
      }

      return {
        id: org.id,
        name: org.name,
        logo_url: org.logo_url || null,
        type: org.type || 'Client Organization',
        address: formattedAddress,
        street_address: org.address || '',
        city: org.city || '',
        state: org.state || '',
        zip_code: org.zip_code || '',
        country: org.country || 'USA',
        primary_contact_name: primaryContactName,
        email: primaryContactEmail,
        phone: primaryContactPhone,
        properties_count: propCount,
        properties,
        status: org.status || 'ACTIVE',
        invite: {
          status: inviteStatus,
          url: inviteUrl,
          expires_at: inviteExpiresAt,
          id: latestInvite?.id || null,
        },
        members,
        contacts_count: members.length,
        created_at: org.created_at,
        updated_at: org.updated_at || org.created_at,
      };
    });

    // 3. Compute 5 KPI Cards per Task.md:
    // Total Organizations, Active Organizations, Pending / Invited, Total Properties, Organizations with No Properties
    const totalOrganizations = allProcessed.length;
    const activeOrganizations = allProcessed.filter((o: any) => o.status === 'ACTIVE').length;
    const pendingOrInvited = allProcessed.filter(
      (o: any) =>
        o.status === 'PENDING_ONBOARDING' ||
        o.invite.status === 'PENDING' ||
        o.invite.status === 'INVITED'
    ).length;
    const totalProperties = allProcessed.reduce((acc: number, o: any) => acc + (o.properties_count || 0), 0);
    const noPropertiesOrganizations = allProcessed.filter((o: any) => o.properties_count === 0).length;

    // 4. In-Memory Search & Filtering
    let filtered = allProcessed;

    if (search) {
      filtered = filtered.filter(
        (o: any) =>
          o.name.toLowerCase().includes(search) ||
          o.address.toLowerCase().includes(search) ||
          o.primary_contact_name.toLowerCase().includes(search) ||
          o.email.toLowerCase().includes(search) ||
          o.phone.toLowerCase().includes(search)
      );
    }

    if (status !== 'ALL') {
      filtered = filtered.filter((o: any) => o.status === status);
    }

    if (hasPropertiesFilter === 'NO_PROPERTIES') {
      filtered = filtered.filter((o: any) => o.properties_count === 0);
    } else if (hasPropertiesFilter === 'HAS_PROPERTIES') {
      filtered = filtered.filter((o: any) => o.properties_count > 0);
    }

    // 5. Sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'PROPERTIES_DESC':
          return (b.properties_count || 0) - (a.properties_count || 0);
        case 'PROPERTIES_ASC':
          return (a.properties_count || 0) - (b.properties_count || 0);
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'NEWEST':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    // 6. Pagination
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        totalCount: totalFiltered,
        totalPages,
        currentPage: page,
        limit,
      },
      metrics: {
        totalOrganizations,
        activeOrganizations,
        pendingOrInvited,
        totalProperties,
        noPropertiesOrganizations,
      },
    });
  } catch (err: any) {
    console.error('Admin Organizations API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      city,
      state,
      zip_code,
      country = 'USA',
      phone,
      email,
      contact_name,
      contact_email,
      contact_phone,
      status = 'ACTIVE',
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required.' },
        { status: 400 }
      );
    }

    const adminContactEmail = (contact_email || email || '').trim().toLowerCase();

    // 1. Insert Organization record
    const { data: newOrg, error: orgErr } = await dbClient
      .from('organizations')
      .insert({
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zip_code: zip_code?.trim() || null,
        country: country?.trim() || 'USA',
        phone: phone?.trim() || contact_phone?.trim() || null,
        email: adminContactEmail || null,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (orgErr || !newOrg) {
      throw orgErr || new Error('Failed to create organization');
    }

    // 2. If an admin contact email is provided, generate an invitation automatically
    let inviteInfo: any = null;
    if (adminContactEmail) {
      const rawToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invite, error: inviteErr } = await dbClient
        .from('invitations')
        .insert({
          email: adminContactEmail,
          token_hash: rawToken,
          invite_type: 'CLIENT_MEMBER',
          organization_id: newOrg.id,
          target_org_role: 'ADMIN',
          invited_by: user.id,
          status: 'PENDING',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (!inviteErr && invite) {
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
        const inviteUrl = `${baseUrl}/invite/${rawToken}`;

        inviteInfo = {
          id: invite.id,
          rawToken,
          inviteUrl,
          expires_at: expiresAt,
          email: adminContactEmail,
          contact_name: contact_name || 'Organization Admin',
        };
      }
    }

    // 3. Log Central Audit Entry
    await logAdminAction({
      action: 'ORGANIZATION_CREATED',
      entity_type: 'ORGANIZATION',
      entity_id: newOrg.id,
      entity_name: newOrg.name,
      organization_id: newOrg.id,
      description: `Created new organization '${newOrg.name}' with status ${newOrg.status}`,
      changes: {
        id: newOrg.id,
        name: newOrg.name,
        status: newOrg.status,
        address: newOrg.address,
        city: newOrg.city,
        state: newOrg.state,
        zip_code: newOrg.zip_code,
        phone: newOrg.phone,
        email: adminContactEmail,
      },
    });

    if (inviteInfo) {
      await logAdminAction({
        action: 'INVITATION_SENT',
        entity_type: 'INVITATION',
        entity_id: inviteInfo.id,
        entity_name: adminContactEmail,
        organization_id: newOrg.id,
        description: `Generated organization administrator invitation for '${adminContactEmail}'`,
        changes: {
          invitation_id: inviteInfo.id,
          email: adminContactEmail,
          target_role: 'ADMIN',
          organization_name: newOrg.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: newOrg,
      invitation: inviteInfo,
      message: 'Organization created successfully with admin invitation generated.',
    });
  } catch (err: any) {
    console.error('Admin create organization error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
