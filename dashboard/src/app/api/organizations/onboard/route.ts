import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, city, state, zip_code, country } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 });
    }

    // 1. Try atomic RPC function first (handles RLS bypass cleanly)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'create_organization_with_admin',
      {
        p_name: name.trim(),
        p_email: email ? email.trim() : user.email,
        p_phone: phone ? phone.trim() : null,
        p_address: address ? address.trim() : null,
        p_city: city ? city.trim() : null,
        p_state: state ? state.trim() : null,
        p_zip_code: zip_code ? zip_code.trim() : null,
        p_country: country || 'USA',
      }
    );

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        organization: rpcData,
        message: 'Organization onboarded successfully.',
      });
    }

    // 2. Direct fallback if RPC is not yet created in PostgreSQL
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (existingMember?.organization_id) {
      return NextResponse.json(
        { error: 'You already belong to an active organization.' },
        { status: 400 }
      );
    }

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        email: email ? email.trim() : user.email,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        zip_code: zip_code ? zip_code.trim() : null,
        country: country || 'USA',
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (orgError || !orgData) {
      return NextResponse.json(
        { error: orgError?.message || rpcError?.message || 'Failed to create organization.' },
        { status: 500 }
      );
    }

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        profile_id: user.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      });

    if (memberError) {
      return NextResponse.json(
        { error: memberError.message || 'Failed to link organization membership.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: orgData,
      message: 'Organization onboarded successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
