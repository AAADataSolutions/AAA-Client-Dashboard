import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Fetch Organization metadata
    const { data: org } = await dbClient
      .from('organizations')
      .select('id, name, email, phone, contact_name, created_at')
      .eq('id', orgId)
      .single();

    // 2. Fetch Members & Profiles
    const { data: members, error } = await dbClient
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
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching organization_members:', error.message);
    }

    // 3. Fetch Invitations for this Organization
    const { data: invites } = await dbClient
      .from('invitations')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    const contacts: any[] = [];
    const seenEmails = new Set<string>();

    // Add active members
    for (const m of (members || []) as any[]) {
      const prof: any = Array.isArray(m.profile) ? m.profile[0] : m.profile;
      const email = prof?.email || org?.email || 'N/A';
      seenEmails.add(email.toLowerCase());
      contacts.push({
        id: m.id,
        profile_id: prof?.id,
        name: prof?.full_name || (m.role === 'ADMIN' ? `${org?.name || 'Org'} Admin` : 'Member'),
        email: email,
        phone: prof?.phone_number || org?.phone || '—',
        role: m.role || 'USER',
        is_primary: m.role === 'ADMIN',
        status: m.status || prof?.status || 'ACTIVE',
        avatar_url: prof?.avatar_url,
        created_at: m.created_at,
      });
    }

    // Add pending invitations whose emails are not yet registered members
    for (const inv of invites || []) {
      const isExpired = new Date(inv.expires_at) < new Date();
      const inviteStatus = isExpired && inv.status === 'PENDING' ? 'EXPIRED' : inv.status;
      const cleanEmail = inv.email?.toLowerCase() || '';

      if (cleanEmail && !seenEmails.has(cleanEmail) && inv.status !== 'REVOKED') {
        seenEmails.add(cleanEmail);
        contacts.push({
          id: `invite-${inv.id}`,
          invitation_id: inv.id,
          profile_id: null,
          name: inv.email.split('@')[0],
          email: inv.email,
          phone: org?.phone || '—',
          role: inv.target_org_role || 'USER',
          is_primary: inv.target_org_role === 'ADMIN',
          status: inviteStatus === 'PENDING' ? 'INVITED' : inviteStatus,
          invite_url: `${baseUrl}/invite/${inv.token_hash}`,
          created_at: inv.created_at,
        });
      }
    }

    // If no contacts yet, add the organization's primary contact from metadata
    if (contacts.length === 0 && org) {
      contacts.push({
        id: `org-admin-${org.id}`,
        profile_id: null,
        name: org.contact_name || `${org.name} Admin`,
        email: org.email || '—',
        phone: org.phone || '—',
        role: 'ADMIN',
        is_primary: true,
        status: 'ACTIVE',
        created_at: org.created_at,
      });
    }

    // Sort so primary contacts are listed first
    contacts.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

    return NextResponse.json({ success: true, data: contacts });
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
    const adminClient = createAdminClient();

    const {
      data: { user: callerUser },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { full_name, email, phone_number, is_primary, role } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();
    const cleanPhone = phone_number ? phone_number.trim() : null;
    const contactRole = is_primary ? 'ADMIN' : (role || 'USER');

    let profileId: string | null = null;

    // 1. Check if profile already exists by email
    const { data: existingProfile } = await dbClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
      // Update profile info
      await dbClient
        .from('profiles')
        .update({
          full_name: cleanName,
          phone_number: cleanPhone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
    } else if (adminClient) {
      // 2. Try creating in auth.users via service role if available
      try {
        const { data: authList } = await adminClient.auth.admin.listUsers();
        const existingAuth = authList?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (existingAuth) {
          profileId = existingAuth.id;
        } else {
          const { data: newAuthUser, error: authCreateErr } = await adminClient.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              initial_org_id: organizationId,
              initial_org_role: contactRole,
            },
          });

          if (!authCreateErr && newAuthUser?.user) {
            profileId = newAuthUser.user.id;
          }
        }

        if (profileId) {
          await dbClient
            .from('profiles')
            .upsert(
              {
                id: profileId,
                full_name: cleanName,
                email: cleanEmail,
                phone_number: cleanPhone,
                role: 'CLIENT_USER',
                status: 'ACTIVE',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'id' }
            );
        }
      } catch (authErr) {
        console.warn('Admin auth user creation skipped/failed:', authErr);
      }
    }

    // If profile exists, link to organization_members
    let memberRecord: any = null;
    if (profileId) {
      // If setting as primary ADMIN, demote other admins
      if (is_primary || contactRole === 'ADMIN') {
        await dbClient
          .from('organization_members')
          .update({ role: 'USER', updated_at: new Date().toISOString() })
          .eq('organization_id', organizationId)
          .eq('role', 'ADMIN');
      }

      const { data: mem, error: memErr } = await dbClient
        .from('organization_members')
        .upsert(
          {
            organization_id: organizationId,
            profile_id: profileId,
            role: contactRole,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,profile_id' }
        )
        .select()
        .single();

      if (!memErr) {
        memberRecord = mem;
      }
    }

    // If primary, also update organization primary metadata
    if (is_primary || contactRole === 'ADMIN') {
      await dbClient
        .from('organizations')
        .update({
          contact_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    // Determine a valid inviter profile ID for the foreign key
    let inviterId: string | null = callerUser?.id || null;
    if (inviterId) {
      const { data: inviterProfile } = await dbClient
        .from('profiles')
        .select('id')
        .eq('id', inviterId)
        .maybeSingle();

      if (!inviterProfile) {
        const { data: anyAdmin } = await dbClient
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle();
        inviterId = anyAdmin?.id || null;
      }
    } else {
      const { data: anyAdmin } = await dbClient
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();
      inviterId = anyAdmin?.id || null;
    }

    // Generate secure invitation record for this contact
    const rawToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (inviterId) {
      await dbClient.from('invitations').insert({
        email: cleanEmail,
        token_hash: rawToken,
        invite_type: 'CLIENT_MEMBER',
        organization_id: organizationId,
        target_org_role: contactRole,
        invited_by: inviterId,
        status: 'PENDING',
        expires_at: expiresAt,
      });
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const inviteUrl = `${protocol}://${host}/invite/${rawToken}`;

    return NextResponse.json({
      success: true,
      data: memberRecord || {
        id: `contact-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: contactRole,
        is_primary: is_primary || contactRole === 'ADMIN',
        status: 'INVITED',
      },
      inviteUrl,
      message: 'Contact added and invitation generated successfully.',
    });
  } catch (err: any) {
    console.error('Add contact error:', err);
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { member_id, role, status, full_name, phone_number } = body;

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'member_id is required' }, { status: 400 });
    }

    if (member_id.startsWith('invite-')) {
      const inviteId = member_id.replace('invite-', '');
      const updates: any = { updated_at: new Date().toISOString() };
      if (role && ['ADMIN', 'USER'].includes(role)) updates.target_org_role = role;
      if (status && ['PENDING', 'REVOKED', 'ACCEPTED', 'APPROVED'].includes(status)) updates.status = status;

      const { data: updatedInvite, error } = await dbClient
        .from('invitations')
        .update(updates)
        .eq('id', inviteId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        success: true,
        data: updatedInvite,
        message: 'Invitation updated successfully.',
      });
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (role && ['ADMIN', 'USER'].includes(role)) updates.role = role;
    if (status && ['ACTIVE', 'SUSPENDED', 'INVITED'].includes(status)) updates.status = status;

    const { data: updatedMember, error: memErr } = await dbClient
      .from('organization_members')
      .update(updates)
      .eq('id', member_id)
      .eq('organization_id', organizationId)
      .select('*, profile:profiles(*)')
      .single();

    if (memErr) throw memErr;

    // If full_name or phone_number provided, update profile
    if ((full_name || phone_number) && updatedMember?.profile_id) {
      await dbClient
        .from('profiles')
        .update({
          full_name: full_name ? full_name.trim() : undefined,
          phone_number: phone_number ? phone_number.trim() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedMember.profile_id);
    }

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: 'Contact updated successfully.',
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
    const { id: organizationId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json({ success: false, error: 'member_id query param is required' }, { status: 400 });
    }

    if (memberId.startsWith('invite-')) {
      const inviteId = memberId.replace('invite-', '');
      const { error } = await dbClient
        .from('invitations')
        .update({ status: 'REVOKED', updated_at: new Date().toISOString() })
        .eq('id', inviteId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Invitation revoked successfully.' });
    }

    const { error } = await dbClient
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Contact removed successfully.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
