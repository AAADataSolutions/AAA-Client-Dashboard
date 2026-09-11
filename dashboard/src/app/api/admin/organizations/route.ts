import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select(`
        *,
        properties:properties(count),
        members:organization_members(count),
        tickets:support_tickets(id, status, priority)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback query if relationships aren't loaded in schema
      const { data: simpleOrgs, error: simpleError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (simpleError) {
        return NextResponse.json({ success: false, error: simpleError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleOrgs || [] });
    }

    return NextResponse.json({ success: true, data: orgs || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, email, phone, address, city, state, zip_code, country, status } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Organization name is required.' }, { status: 400 });
    }

    const { data: newOrg, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zip_code: zip_code?.trim() || null,
        country: country?.trim() || 'USA',
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newOrg });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
