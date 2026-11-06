import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { data_circuit_id, month_key, revenue_received, notes } = body;

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
    const shareAmt =
      circuit.monthly_revenue_share_amount !== null && circuit.monthly_revenue_share_amount !== undefined && Number(circuit.monthly_revenue_share_amount) > 0
        ? Number(circuit.monthly_revenue_share_amount)
        : Math.round(price * (pct / 100) * 100) / 100;

    const isReceivedBool = Boolean(revenue_received);
    const nowIso = new Date().toISOString();

    const { data: upserted, error: uErr } = await db
      .from('data_circuit_monthly_revenues')
      .upsert(
        {
          data_circuit_id,
          property_id: circuit.property_id,
          month_key: String(month_key).trim(),
          wholesaler_name: circuit.wholesaler_name || null,
          carrier_name: circuit.carrier_name || null,
          circuit_monthly_price: price,
          revenue_share_percentage: pct,
          revenue_share_amount: shareAmt,
          revenue_received: isReceivedBool,
          received_at: isReceivedBool ? nowIso : null,
          updated_by: user?.id || null,
          notes: notes !== undefined ? notes : null,
          updated_at: nowIso,
        },
        { onConflict: 'data_circuit_id,month_key' }
      )
      .select('*')
      .single();

    if (uErr) {
      return NextResponse.json({ success: false, error: uErr.message }, { status: 400 });
    }

    const propName = circuit.property?.name || 'Property';

    await logAuditEvent({
      action: isReceivedBool ? 'DATA_CIRCUIT_REVENUE_RECEIVED_YES' : 'DATA_CIRCUIT_REVENUE_RECEIVED_NO',
      entity_type: 'DATA_CIRCUIT_REVENUE',
      entity_id: upserted.id,
      entity_name: `${propName} (${month_key})`,
      description: `Marked Data Circuit monthly revenue share ($${shareAmt.toFixed(2)}) for '${propName}' in ${month_key} as ${isReceivedBool ? 'RECEIVED (Yes)' : 'NOT RECEIVED (No)'}`,
      changes: {
        data_circuit_id,
        property_id: circuit.property_id,
        month_key,
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

