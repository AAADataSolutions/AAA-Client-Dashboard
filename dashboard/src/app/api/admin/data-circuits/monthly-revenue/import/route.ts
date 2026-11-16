import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

function normalizePaidDate(raw: string): string | null {
  const s = (raw || '').trim();
  if (!s) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // MM/DD/YYYY or MM-DD-YYYY
  const usMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    const m = usMatch[1].padStart(2, '0');
    const d = usMatch[2].padStart(2, '0');
    const y = usMatch[3];
    if (Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data_circuit_id, rows } = body;

    if (!data_circuit_id || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'data_circuit_id and non-empty rows array are required.' },
        { status: 400 }
      );
    }

    const { data: circuit, error: cErr } = await db
      .from('data_circuits')
      .select('*, property:properties(id, name)')
      .eq('id', data_circuit_id)
      .single();

    if (cErr || !circuit) {
      return NextResponse.json({ success: false, error: 'Data Circuit not found.' }, { status: 404 });
    }

    const price = Number(circuit.circuit_monthly_price || 0);
    const pct = Number(circuit.revenue_share_percentage || 0);
    const defaultShareAmt =
      circuit.monthly_revenue_share_amount !== null &&
      circuit.monthly_revenue_share_amount !== undefined &&
      Number(circuit.monthly_revenue_share_amount) > 0
        ? Number(circuit.monthly_revenue_share_amount)
        : Math.round(price * (pct / 100) * 100) / 100;

    const nowIso = new Date().toISOString();
    const upsertRows: Record<string, any>[] = [];
    const errors: { row: number; reason: string }[] = [];

    rows.forEach((row: any, idx: number) => {
      const rawDate = row.paid_date || row['Paid Date'] || row.date || row['Date'] || '';
      const paidDate = normalizePaidDate(String(rawDate));
      if (!paidDate) {
        errors.push({ row: idx + 1, reason: `Invalid or missing date "${rawDate}"` });
        return;
      }

      const monthKey = paidDate.slice(0, 7);
      const rawAmt = row.amount ?? row.Amount ?? row['Revenue Amount'] ?? row.revenue_share_amount;
      const parsedAmt =
        rawAmt !== undefined && rawAmt !== null && String(rawAmt).trim() !== ''
          ? parseFloat(String(rawAmt).replace(/[^0-9.]/g, ''))
          : defaultShareAmt;
      const shareAmt = !isNaN(parsedAmt) && parsedAmt >= 0 ? parsedAmt : defaultShareAmt;
      const notes = (row.notes ?? row.Notes ?? '').toString().trim() || null;

      upsertRows.push({
        data_circuit_id,
        property_id: circuit.property_id,
        month_key: monthKey,
        wholesaler_name: circuit.wholesaler_name || null,
        carrier_name: circuit.carrier_name || null,
        circuit_monthly_price: price,
        revenue_share_percentage: pct,
        revenue_share_amount: shareAmt,
        revenue_received: true,
        paid_date: paidDate,
        received_at: `${paidDate}T12:00:00.000Z`,
        updated_by: user.id,
        notes,
        updated_at: nowIso,
      });
    });

    if (upsertRows.length === 0) {
      return NextResponse.json(
        { success: false, error: errors[0]?.reason || 'No valid payment date rows found.' },
        { status: 400 }
      );
    }

    // Deduplicate by month_key (keep latest entry in batch)
    const dedupMap = new Map<string, Record<string, any>>();
    upsertRows.forEach((r) => dedupMap.set(r.month_key, r));
    const finalRows = Array.from(dedupMap.values());

    let { error: uErr } = await db
      .from('data_circuit_monthly_revenues')
      .upsert(finalRows, { onConflict: 'data_circuit_id,month_key' });

    if (uErr && uErr.message?.includes('paid_date')) {
      const withoutPaidDate = finalRows.map(({ paid_date: _omit, ...rest }) => rest);
      const retry = await db
        .from('data_circuit_monthly_revenues')
        .upsert(withoutPaidDate, { onConflict: 'data_circuit_id,month_key' });
      uErr = retry.error;
    }

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 400 });
    }

    const propName = circuit.property?.name || 'Property';
    await logAuditEvent({
      action: 'DATA_CIRCUIT_REVENUE_HISTORY_IMPORTED',
      entity_type: 'DATA_CIRCUIT_REVENUE',
      entity_id: data_circuit_id,
      entity_name: propName,
      description: `Imported ${finalRows.length} historical revenue payment date(s) for '${propName}'`,
      changes: { data_circuit_id, imported_months: finalRows.map((r) => r.month_key) },
    });

    return NextResponse.json({
      success: true,
      importedCount: finalRows.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Imported ${finalRows.length} monthly payment record(s) for ${propName}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
