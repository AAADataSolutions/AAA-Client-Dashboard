import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, rows } = body;

    if (!property_id) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required for Ray Baum import.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data rows provided for import.' },
        { status: 400 }
      );
    }

    // Verify Property exists
    const { data: prop, error: propErr } = await db
      .from('properties')
      .select('id, name')
      .eq('id', property_id)
      .maybeSingle();

    if (propErr || !prop) {
      return NextResponse.json(
        { success: false, error: 'Target property not found.' },
        { status: 404 }
      );
    }

    const successfulRows: any[] = [];
    const failedRows: { row: number; phone: string; reason: string }[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      const phone = (row.phone_number || row['PHONE NO.'] || row['Phone'] || row['phone'] || '').trim();
      const room = (row.assigned_to_room || row['ASSIGNED TO ROOM'] || row['Room'] || row['room'] || '').trim();
      const location = (row.location || row['LOCATION'] || row['Location'] || '').trim();

      if (!phone) {
        failedRows.push({
          row: rowNumber,
          phone: 'N/A',
          reason: 'Phone number is empty or invalid.',
        });
        continue;
      }

      try {
        // Upsert record: check if phone_number already exists for this property
        const { data: existing } = await db
          .from('ray_baum_records')
          .select('id')
          .eq('property_id', property_id)
          .eq('phone_number', phone)
          .maybeSingle();

        if (existing) {
          const { data: updated, error: uErr } = await db
            .from('ray_baum_records')
            .update({
              assigned_to_room: room || null,
              location: location || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (uErr) {
            failedRows.push({ row: rowNumber, phone, reason: uErr.message });
          } else {
            successfulRows.push(updated);
          }
        } else {
          const { data: inserted, error: iErr } = await db
            .from('ray_baum_records')
            .insert({
              property_id,
              phone_number: phone,
              assigned_to_room: room || null,
              location: location || null,
            })
            .select()
            .single();

          if (iErr) {
            failedRows.push({ row: rowNumber, phone, reason: iErr.message });
          } else {
            successfulRows.push(inserted);
          }
        }
      } catch (rowErr: any) {
        failedRows.push({
          row: rowNumber,
          phone,
          reason: rowErr.message || 'Error processing row.',
        });
      }
    }

    // Ensure property has ray_baud_and_logs_enabled = true if records are present
    if (successfulRows.length > 0) {
      await db
        .from('properties')
        .update({
          ray_baud_and_logs_enabled: true,
          ray_baum_status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', property_id);
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'RAY_BAUM_CSV_IMPORTED',
      entity_type: 'RAY_BAUM',
      entity_id: property_id,
      entity_name: prop.name,
      changes: {
        totalRows: rows.length,
        importedCount: successfulRows.length,
        failedCount: failedRows.length,
      },
    });

    return NextResponse.json({
      success: true,
      importedCount: successfulRows.length,
      failedCount: failedRows.length,
      errors: failedRows,
      message: `Successfully imported ${successfulRows.length} Ray Baum records for ${prop.name}.${failedRows.length > 0 ? ` ${failedRows.length} rows failed.` : ''}`,
    });
  } catch (err: any) {
    console.error('Ray Baum CSV import error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during CSV import' },
      { status: 500 }
    );
  }
}
