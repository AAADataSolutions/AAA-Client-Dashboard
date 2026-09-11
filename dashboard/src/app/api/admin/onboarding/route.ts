import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    const { data: onboardings, error } = await supabase
      .from('onboardings')
      .select(`
        *,
        org_property:organization_properties(
          id,
          property:properties(*),
          organization:organizations(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: simpleOnboardings, error: sErr } = await supabase
        .from('onboardings')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleOnboardings || [] });
    }

    return NextResponse.json({ success: true, data: onboardings || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      organization_property_id,
      organization_id,
      property_id,
      status,
      target_date,
    } = body;

    let orgPropertyId = organization_property_id;

    if (!orgPropertyId && organization_id && property_id) {
      const { data: existingLink } = await supabase
        .from('organization_properties')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('property_id', property_id)
        .maybeSingle();

      if (existingLink) {
        orgPropertyId = existingLink.id;
      } else {
        const { data: newLink } = await supabase
          .from('organization_properties')
          .insert({ organization_id, property_id, status: 'ONBOARDING' })
          .select('id')
          .single();
        orgPropertyId = newLink?.id;
      }
    }

    if (!orgPropertyId) {
      return NextResponse.json({ success: false, error: 'Valid property and organization are required.' }, { status: 400 });
    }

    const { data: newOnboarding, error } = await supabase
      .from('onboardings')
      .insert({
        organization_property_id: orgPropertyId,
        status: status || 'DRAFT',
        target_date: target_date || null,
        contract_sent_at: status === 'CONTRACT_SENT' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newOnboarding });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
