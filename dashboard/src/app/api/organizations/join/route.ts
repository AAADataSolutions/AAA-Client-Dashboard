import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { organization_id } = body;

    if (!organization_id || !organization_id.trim()) {
      return NextResponse.json({ success: false, error: 'Organization ID is required.' }, { status: 400 });
    }

    const orgId = organization_id.trim();

    // 1. Check if organization exists in DB
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, name, status')
      .eq('id', orgId)
      .maybeSingle();

    if (orgErr || !org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found. Please verify the Organization ID with your administrator.' },
        { status: 404 }
      );
    }

    // 2. Check if user is already a member of an organization
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id, organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (existingMember) {
      if (existingMember.organization_id === org.id) {
        return NextResponse.json({
          success: true,
          message: `You are already a member of ${org.name}.`,
          organization: org,
        });
      }
      return NextResponse.json(
        { success: false, error: 'You already belong to another active organization.' },
        { status: 400 }
      );
    }

    // 3. Insert user into organization_members
    const { data: newMember, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        profile_id: user.id,
        role: 'USER',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (memberError || !newMember) {
      return NextResponse.json(
        { success: false, error: memberError?.message || 'Failed to join organization.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${org.name}.`,
      organization: org,
      member: newMember,
    });
  } catch (err: any) {
    console.error('Join organization error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
