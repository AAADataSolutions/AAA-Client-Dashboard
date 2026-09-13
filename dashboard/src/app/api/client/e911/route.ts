import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { total: 0, verified: 0, pending: 0, actionRequired: 0 },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';

    const dbClient = createAdminClient() || supabase;

    // Get organization_properties with property and e911_records
    const { data: orgProps, error } = await dbClient
      .from('organization_properties')
      .select(`
        id,
        created_at,
        property:properties(id, name, address, city, state, zip_code, main_phone, ray_baud_and_logs_enabled),
        e911:e911_records(id, status, emergency_address, correction_notes, verified_at, updated_at)
      `)
      .eq('organization_id', member.organization_id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const allRecords = (orgProps || [])
      .map((op: any) => {
        const prop: any = op.property;
        if (!prop) return null;
        const e911 = Array.isArray(op.e911) && op.e911.length > 0 ? op.e911[0] : null;

        return {
          id: e911?.id || `e911-placeholder-${op.id}`,
          org_property_id: op.id,
          property_id: prop.id,
          property_name: prop.name,
          property_location: `${prop.city}, ${prop.state}`,
          property_phone: prop.main_phone,
          property_address: `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`,
          emergency_address: e911?.emergency_address || `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}`,
          status: e911?.status || 'PENDING',
          correction_notes: e911?.correction_notes || (e911?.status === 'VERIFIED' ? 'Verified with local PSAP dispatch database.' : null),
          verified_at: e911?.verified_at || null,
          ray_baud_and_logs_enabled: prop.ray_baud_and_logs_enabled,
          updated_at: e911?.updated_at || op.created_at,
        };
      })
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    // Metrics as specified in Task.md:
    // Total Properties, Verified, Pending, Action Required (Correction Required + Failed)
    const total = allRecords.length;
    const verified = allRecords.filter((r) => r.status === 'VERIFIED').length;
    const pending = allRecords.filter((r) => r.status === 'PENDING').length;
    const correctionRequired = allRecords.filter((r) => r.status === 'CORRECTION_REQUIRED').length;
    const failed = allRecords.filter((r) => r.status === 'FAILED').length;
    const actionRequired = correctionRequired + failed;

    let filtered = allRecords;
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.property_name.toLowerCase().includes(search) ||
          r.emergency_address.toLowerCase().includes(search) ||
          r.property_address.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        filtered = filtered.filter((r) => r.status === 'CORRECTION_REQUIRED' || r.status === 'FAILED');
      } else {
        filtered = filtered.filter((r) => r.status === statusFilter);
      }
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics: {
        total,
        verified,
        pending,
        actionRequired,
        correctionRequired,
        failed,
      },
    });
  } catch (err: any) {
    console.error('Client E911 API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch E911 records' },
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

    // Role check: Only Client Admin can update emergency address
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member || member.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Organization Admins can update E911 address information.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { org_property_id, emergency_address, e911_id, notes } = body;

    if (!org_property_id || !emergency_address?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization Property ID and Emergency Address are required.' },
        { status: 400 }
      );
    }

    const dbClient = createAdminClient() || supabase;

    let updatedRecord;
    if (e911_id && !e911_id.startsWith('e911-placeholder')) {
      const { data, error } = await dbClient
        .from('e911_records')
        .update({
          emergency_address: emergency_address.trim(),
          status: 'PENDING',
          correction_notes: notes?.trim() || 'Updated by client admin, awaiting carrier verification.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', e911_id)
        .select()
        .single();

      if (error) throw error;
      updatedRecord = data;
    } else {
      const { data, error } = await dbClient
        .from('e911_records')
        .insert({
          organization_property_id: org_property_id,
          emergency_address: emergency_address.trim(),
          status: 'PENDING',
          correction_notes: notes?.trim() || 'Created by client admin, awaiting carrier verification.',
        })
        .select()
        .single();

      if (error) throw error;
      updatedRecord = data;
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: 'Emergency address submitted for PSAP re-verification.',
    });
  } catch (err: any) {
    console.error('Client E911 update error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update E911 address' },
      { status: 500 }
    );
  }
}
