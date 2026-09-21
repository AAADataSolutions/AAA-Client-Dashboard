import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dbClient = createAdminClient() || supabase;

    const { data: profile } = await dbClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: member } = await dbClient
      .from('organization_members')
      .select('*, organization:organizations(*)')
      .eq('profile_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      profile,
      organization: member?.organization || null,
      membership: member || null,
    });
  } catch (err: any) {
    console.error('Client Profile API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone_number } = body;

    const trimmedName = full_name !== undefined ? (full_name ? full_name.trim() : null) : undefined;
    const trimmedPhone = phone_number !== undefined ? (phone_number ? phone_number.trim() : null) : undefined;

    // 1. Try calling the dedicated RPC function which runs with SECURITY DEFINER to bypass any RLS recursion
    let updatedProfile: any = null;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_own_profile', {
        p_full_name: trimmedName ?? null,
        p_phone_number: trimmedPhone ?? null,
      });

      if (!rpcError && rpcData) {
        updatedProfile = rpcData;
      }
    } catch (rpcErr) {
      console.warn('update_own_profile RPC not available, falling back to direct table update:', rpcErr);
    }

    // 2. If RPC was not used or failed, fallback to direct table update with adminClient or authenticated supabase
    if (!updatedProfile) {
      const updates: any = { updated_at: new Date().toISOString() };
      if (trimmedName !== undefined) updates.full_name = trimmedName;
      if (trimmedPhone !== undefined) updates.phone_number = trimmedPhone;

      const dbClient = createAdminClient() || supabase;

      const { data, error } = await dbClient
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      updatedProfile = data;
    }

    // 3. Keep Supabase Auth user_metadata in sync so JWT reflects the new full_name
    if (trimmedName) {
      try {
        await supabase.auth.updateUser({
          data: { full_name: trimmedName, name: trimmedName },
        });
      } catch (authUpdateErr) {
        console.warn('Could not sync user_metadata:', authUpdateErr);
      }
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully.',
    });
  } catch (err: any) {
    console.error('Client Profile update error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

