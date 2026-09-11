import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: records, error } = await supabase
      .from('e911_records')
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
      const { data: simpleRecords, error: sErr } = await supabase
        .from('e911_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: simpleRecords || [] });
    }

    return NextResponse.json({ success: true, data: records || [] });
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
      emergency_address,
      status,
      correction_notes,
    } = body;

    if (!emergency_address || !emergency_address.trim()) {
      return NextResponse.json({ success: false, error: 'Emergency dispatch address is required.' }, { status: 400 });
    }

    const { data: newRecord, error } = await supabase
      .from('e911_records')
      .insert({
        organization_property_id,
        emergency_address: emergency_address.trim(),
        status: status || 'PENDING',
        correction_notes: correction_notes?.trim() || null,
        verified_at: status === 'VERIFIED' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: newRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
