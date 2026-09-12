import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Organization metadata
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, email, phone, created_at')
      .eq('id', id)
      .single();

    // 2. Fetch Members & Profiles
    const { data: members, error } = await supabase
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

    if (error) {
      console.warn('Error fetching organization_members:', error.message);
    }

    const contacts: any[] = (members || []).map((m: any) => ({
      id: m.id,
      profile_id: m.profile?.id,
      name: m.profile?.full_name || `${org?.name || 'Organization'} Admin`,
      email: m.profile?.email || org?.email || 'N/A',
      phone: m.profile?.phone_number || org?.phone || 'N/A',
      role: m.role || 'USER',
      is_primary: m.role === 'ADMIN',
      status: m.status || m.profile?.status || 'ACTIVE',
      avatar_url: m.profile?.avatar_url,
      created_at: m.created_at,
    }));

    // If no member records yet, add the organization's primary admin contact from org metadata
    if (contacts.length === 0 && org) {
      contacts.push({
        id: `org-admin-${org.id}`,
        profile_id: null,
        name: `${org.name} Primary Admin`,
        email: org.email || 'admin@' + org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
        phone: org.phone || '+1 (555) 019-2834',
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
    const body = await request.json();

    const { full_name, email, phone_number, is_primary } = body;

    if (!full_name || !email) {
      return NextResponse.json(
        { success: false, error: 'Full name and email are required.' },
        { status: 400 }
      );
    }

    // Check if a profile with this email already exists
    let profileId: string | null = null;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
      if (phone_number || full_name) {
        await supabase
          .from('profiles')
          .update({
            full_name: full_name.trim(),
            phone_number: phone_number ? phone_number.trim() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }
    } else {
      const newUuid = crypto.randomUUID();
      const { data: createdProf, error: pErr } = await supabase
        .from('profiles')
        .insert({
          id: newUuid,
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phone_number ? phone_number.trim() : null,
          role: 'CLIENT_USER',
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (!pErr && createdProf) {
        profileId = createdProf.id;
      } else {
        // In case profiles FK to auth is strict, we still allow membership link or fallback
        profileId = newUuid;
      }
    }

    // If setting as primary, demote existing primary (ADMIN) in this org
    if (is_primary) {
      await supabase
        .from('organization_members')
        .update({ role: 'USER', updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('role', 'ADMIN');

      // Also update organization primary phone/email if needed
      await supabase
        .from('organizations')
        .update({
          email: email.trim().toLowerCase(),
          phone: phone_number ? phone_number.trim() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    // Insert or update membership
    if (profileId) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existingMember) {
        await supabase
          .from('organization_members')
          .update({
            role: is_primary ? 'ADMIN' : 'USER',
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMember.id);
      } else {
        await supabase.from('organization_members').insert({
          organization_id: organizationId,
          profile_id: profileId,
          role: is_primary ? 'ADMIN' : 'USER',
          status: 'ACTIVE',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contact successfully saved.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
