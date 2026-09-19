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

    const updates: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name ? full_name.trim() : null;
    if (phone_number !== undefined) updates.phone_number = phone_number ? phone_number.trim() : null;

    const dbClient = createAdminClient() || supabase;

    const { data: updatedProfile, error } = await dbClient
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

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

