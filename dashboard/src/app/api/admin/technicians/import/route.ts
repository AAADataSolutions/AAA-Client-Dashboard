import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();
    const rows = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No technician rows provided for import.' }, { status: 400 });
    }

    const validRows: any[] = [];
    const errors: Array<{ row: number; name: string; reason: string }> = [];

    rows.forEach((r, idx) => {
      const name = (r.name || r['Technician Name'] || r['Name'] || '').trim();
      const area_name = (r.area_name || r['Area Name'] || r['Area'] || r['Location'] || '').trim();
      const phone_no = (r.phone_no || r['Phone No'] || r['Phone Number'] || r['Phone'] || '').trim();

      if (!name) {
        errors.push({ row: idx + 1, name: 'Unknown', reason: 'Missing technician name' });
        return;
      }
      if (!area_name) {
        errors.push({ row: idx + 1, name, reason: 'Missing service area name' });
        return;
      }
      if (!phone_no) {
        errors.push({ row: idx + 1, name, reason: 'Missing phone number' });
        return;
      }

      validRows.push({
        name,
        area_name,
        phone_no,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'None of the provided rows had valid Name, Area Name, and Phone Number.',
          errors,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('technicians')
      .insert(validRows)
      .select();

    if (error) {
      console.error('[Technicians Bulk Import Error]:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      importedCount: validRows.length,
      errors,
      message: `Successfully imported ${validRows.length} technician${validRows.length === 1 ? '' : 's'}.`,
    });
  } catch (err: any) {
    console.error('[Technicians Import Catch]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
