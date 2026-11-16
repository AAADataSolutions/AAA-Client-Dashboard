import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const circuitId = searchParams.get('data_circuit_id');

    if (!circuitId) {
      return NextResponse.json(
        { success: false, error: 'data_circuit_id is required.' },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from('data_circuit_monthly_revenues')
      .select('*')
      .eq('data_circuit_id', circuitId)
      .order('month_key', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { data_circuit_id, month_key, revenue_received, paid_date, revenue_share_amount, notes } = body;

    if (!data_circuit_id || !month_key) {
      return NextResponse.json(
        { success: false, error: 'data_circuit_id and month_key (YYYY-MM) are required.' },
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

    const shareAmt =
      revenue_share_amount !== undefined &&
      revenue_share_amount !== null &&
      revenue_share_amount !== '' &&
      !isNaN(Number(revenue_share_amount))
        ? Math.max(0, Number(revenue_share_amount))
        : defaultShareAmt;

    const isReceivedBool = Boolean(revenue_received);
    const nowIso = new Date().toISOString();
    const cleanPaidDate =
      isReceivedBool && paid_date && /^\d{4}-\d{2}-\d{2}$/.test(String(paid_date).trim())
        ? String(paid_date).trim()
        : isReceivedBool
        ? nowIso.slice(0, 10)
        : null;

    const receivedAtIso = isReceivedBool
      ? cleanPaidDate
        ? `${cleanPaidDate}T12:00:00.000Z`
        : nowIso
      : null;

    const upsertPayload: Record<string, any> = {
      data_circuit_id,
      property_id: circuit.property_id,
      month_key: String(month_key).trim(),
      wholesaler_name: circuit.wholesaler_name || null,
      carrier_name: circuit.carrier_name || null,
      circuit_monthly_price: price,
      revenue_share_percentage: pct,
      revenue_share_amount: shareAmt,
      revenue_received: isReceivedBool,
      paid_date: cleanPaidDate,
      received_at: receivedAtIso,
      updated_by: user?.id || null,
      notes: notes !== undefined ? notes : null,
      updated_at: nowIso,
    };

    let { data: upserted, error: uErr } = await db
      .from('data_circuit_monthly_revenues')
      .upsert(upsertPayload, { onConflict: 'data_circuit_id,month_key' })
      .select('*')
      .single();

    if (uErr && uErr.message?.includes('paid_date')) {
      const { paid_date: _omitPaidDate, ...withoutPaidDate } = upsertPayload;
      const retry = await db
        .from('data_circuit_monthly_revenues')
        .upsert(withoutPaidDate, { onConflict: 'data_circuit_id,month_key' })
        .select('*')
        .single();
      upserted = retry.data;
      uErr = retry.error;
    }

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 400 });
    }

    const propName = circuit.property?.name || 'Property';

    await logAuditEvent({
      action: isReceivedBool ? 'DATA_CIRCUIT_REVENUE_RECEIVED_YES' : 'DATA_CIRCUIT_REVENUE_RECEIVED_NO',
      entity_type: 'DATA_CIRCUIT_REVENUE',
      entity_id: upserted.id,
      entity_name: `${propName} (${month_key})`,
      description: `Marked Data Circuit monthly revenue share ($${shareAmt.toFixed(2)}) for '${propName}' in ${month_key} as ${isReceivedBool ? `RECEIVED (${cleanPaidDate || 'Yes'})` : 'NOT RECEIVED (No)'}`,
      changes: {
        data_circuit_id,
        property_id: circuit.property_id,
        month_key,
        paid_date: cleanPaidDate,
        revenue_received: isReceivedBool,
        revenue_share_amount: shareAmt,
      },
    });

    return NextResponse.json({ success: true, data: upserted });
  } catch (err: any) {
    console.error('[Data Circuit Monthly Revenue POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
