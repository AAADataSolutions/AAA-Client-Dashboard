import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const complianceFilter = searchParams.get('compliance') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. Fetch Real KPI Counts directly from DB
    const { count: totalRecordsCount } = await supabase
      .from('e911_records')
      .select('*', { count: 'exact', head: true });

    const { count: verifiedCount } = await supabase
      .from('e911_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'VERIFIED');

    const { count: correctionRequiredCount } = await supabase
      .from('e911_records')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'CORRECTION_REQUIRED');

    const { count: pendingOrFailedCount } = await supabase
      .from('e911_records')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING', 'FAILED']);

    // 2. Query E911 Records with Joined Property and Organization
    let query = supabase
      .from('e911_records')
      .select(`
        *,
        org_property:organization_properties(
          id,
          property:properties(*),
          organization:organizations(*)
        )
      `, { count: 'exact' });

    if (statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data: rawRecords, error } = await query;

    if (error) {
      // Fallback query
      const { data: simpleRecords, error: sErr } = await supabase
        .from('e911_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (sErr) {
        return NextResponse.json({ success: false, error: sErr.message }, { status: 400 });
      }

      const totalSimple = simpleRecords?.length || 0;
      const paginated = (simpleRecords || []).slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginated.map((r: any) => ({
          ...r,
          property_name: 'Unassigned Property',
          organization_name: 'Unassigned Organization',
          property_details: null,
          organization_details: null,
        })),
        pagination: {
          totalCount: totalSimple,
          totalPages: Math.ceil(totalSimple / limit) || 1,
          currentPage: page,
          limit,
        },
        metrics: {
          totalRecordsCount: totalRecordsCount || totalSimple,
          verifiedCount: verifiedCount || 0,
          correctionRequiredCount: correctionRequiredCount || 0,
          pendingOrFailedCount: pendingOrFailedCount || 0,
        },
      });
    }

    // 3. Process & Map Records
    let formatted = (rawRecords || []).map((item: any) => {
      const orgProp = item.org_property;
      const prop = orgProp?.property;
      const org = orgProp?.organization;

      return {
        id: item.id,
        emergency_address: item.emergency_address || prop?.address || 'No dispatch address registered',
        psap_id: item.psap_id || `PSAP-${item.id.slice(0, 5).toUpperCase()}`,
        status: item.status || 'PENDING',
        correction_notes: item.correction_notes || null,
        verified_at: item.verified_at,
        ray_baum_compliant: prop?.ray_baud_and_logs_enabled ?? true,
        karys_law_direct_dial: true,
        karis_law_direct_dial: true,
        created_at: item.created_at,
        updated_at: item.updated_at,
        property_id: prop?.id || '',
        property_name: prop?.name || 'Unassigned Property',
        organization_id: org?.id || '',
        organization_name: org?.name || 'Unassigned Organization',
        property_details: prop || null,
        organization_details: org || null,
      };
    });

    // 4. Compliance Filter
    if (complianceFilter === 'COMPLIANT') {
      formatted = formatted.filter((r: any) => r.ray_baum_compliant === true);
    } else if (complianceFilter === 'NON_COMPLIANT') {
      formatted = formatted.filter((r: any) => r.ray_baum_compliant === false);
    }

    // 5. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      formatted = formatted.filter(
        (r: any) =>
          r.property_name.toLowerCase().includes(lowerSearch) ||
          r.organization_name.toLowerCase().includes(lowerSearch) ||
          r.emergency_address.toLowerCase().includes(lowerSearch) ||
          (r.psap_id && r.psap_id.toLowerCase().includes(lowerSearch))
      );
    }

    // 6. Sorting
    if (sortBy === 'PROP_ASC') {
      formatted.sort((a: any, b: any) => a.property_name.localeCompare(b.property_name));
    } else if (sortBy === 'ORG_ASC') {
      formatted.sort((a: any, b: any) => a.organization_name.localeCompare(b.organization_name));
    } else if (sortBy === 'STATUS') {
      formatted.sort((a: any, b: any) => a.status.localeCompare(b.status));
    } else {
      // NEWEST
      formatted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const filteredTotal = formatted.length;
    const paginatedData = formatted.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        totalCount: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit) || 1,
        currentPage: page,
        limit,
      },
      metrics: {
        totalRecordsCount: totalRecordsCount || filteredTotal,
        verifiedCount: verifiedCount || 0,
        correctionRequiredCount: correctionRequiredCount || 0,
        pendingOrFailedCount: pendingOrFailedCount || 0,
      },
    });
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
      psap_id,
    } = body;

    if (!emergency_address || !emergency_address.trim()) {
      return NextResponse.json({ success: false, error: 'Emergency dispatch address is required.' }, { status: 400 });
    }

    const { data: newRecord, error } = await supabase
      .from('e911_records')
      .insert({
        organization_property_id,
        emergency_address: emergency_address.trim(),
        psap_id: psap_id?.trim() || null,
        status: status || 'PENDING',
        correction_notes: correction_notes?.trim() || null,
        verified_at: status === 'VERIFIED' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Audit Log
    await logAdminAction({
      action: 'E911_RECORD_CREATED',
      entity_type: 'E911',
      entity_id: newRecord.id,
      entity_name: emergency_address,
      description: `Registered new E911 emergency dispatch address '${emergency_address}' with status ${status || 'PENDING'}`,
      changes: {
        e911_id: newRecord.id,
        emergency_address,
        status: newRecord.status,
        psap_id,
      },
    });

    return NextResponse.json({ success: true, data: newRecord });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      id,
      emergency_address,
      status,
      correction_notes,
      append_correction_note,
      psap_id,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'E911 Record ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (emergency_address !== undefined) updates.emergency_address = emergency_address.trim();
    if (psap_id !== undefined) updates.psap_id = psap_id.trim();

    const isTargetVerified = status === 'VERIFIED' || status === 'ACTIVE';
    if (status !== undefined) {
      updates.status = isTargetVerified ? 'VERIFIED' : status;
      if (isTargetVerified) {
        updates.verified_at = new Date().toISOString();
      } else if (status === 'PENDING') {
        updates.verified_at = null;
      }
    }

    if (append_correction_note) {
      const { data: current } = await supabase
        .from('e911_records')
        .select('correction_notes')
        .eq('id', id)
        .single();

      const existingNotes = current?.correction_notes || '';
      const timestamp = new Date().toLocaleString();
      const newEntry = `[${timestamp}] ${append_correction_note.trim()}`;
      updates.correction_notes = existingNotes ? `${existingNotes}\n\n${newEntry}` : newEntry;
    } else if (correction_notes !== undefined) {
      updates.correction_notes = correction_notes ? correction_notes.trim() : null;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('e911_records')
      .update(updates)
      .eq('id', id)
      .select('*, org_property:organization_properties(property_id)')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Keep the associated property's ray_baud_and_logs_enabled and ray_baum_status in 100% sync
    if (status !== undefined && updated?.org_property?.property_id) {
      const propId = updated.org_property.property_id;
      await supabase
        .from('properties')
        .update({
          ray_baud_and_logs_enabled: isTargetVerified,
          ray_baum_status: isTargetVerified ? 'ACTIVE' : 'INACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', propId);
    }

    // Audit Log
    const actionType = status === 'VERIFIED'
      ? 'E911_VERIFIED'
      : (append_correction_note ? 'E911_CORRECTION_NOTE_ADDED' : 'E911_RECORD_UPDATED');

    await logAdminAction({
      action: actionType,
      entity_type: 'E911',
      entity_id: id,
      entity_name: updated.emergency_address,
      description: status === 'VERIFIED'
        ? `Verified and approved E911 compliance for '${updated.emergency_address}'`
        : (append_correction_note
            ? `Appended compliance audit note to E911 record '${updated.emergency_address}'`
            : `Updated E911 record for '${updated.emergency_address}'`),
      changes: updates,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
