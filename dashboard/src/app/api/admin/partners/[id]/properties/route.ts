import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

/**
 * If the partner already has an unpaid (SUBMITTED or DRAFT) invoice for the current month,
 * keep its line_items and totals synced when properties are assigned/unassigned or overrides change.
 * Does NOT create any new invoice mid-month.
 */
async function syncCurrentMonthPendingInvoice(dbClient: any, partnerId: string) {
  try {
    const now = new Date();
    const periodStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
      .toISOString()
      .split('T')[0];

    const { data: pendingInv } = await dbClient
      .from('partner_invoices')
      .select('id, status')
      .eq('partner_id', partnerId)
      .eq('period_start', periodStart)
      .in('status', ['SUBMITTED', 'DRAFT'])
      .maybeSingle();

    if (!pendingInv) {
      return;
    }

    const [{ data: partner }, { data: assignedProps }] = await Promise.all([
      dbClient.from('partners').select('default_commission_rate').eq('id', partnerId).maybeSingle(),
      dbClient
        .from('properties')
        .select('id, name, address, city, state, monthly_price, partner_commission_override, status')
        .eq('partner_id', partnerId),
    ]);

    const activeProps = assignedProps || [];

    const defaultRate = Number(partner?.default_commission_rate || 10);
    let grossRevenue = 0;
    let totalCommission = 0;

    const lineItems = activeProps.map((p: any) => {
      const rate =
        p.partner_commission_override !== null &&
        p.partner_commission_override !== undefined &&
        p.partner_commission_override !== ''
          ? Number(p.partner_commission_override)
          : defaultRate;

      const price = Number(p.monthly_price || 0);
      const commission = price * (rate / 100);

      grossRevenue += price;
      totalCommission += commission;

      return {
        property_id: p.id,
        property_name: p.name,
        address: [p.address, p.city, p.state].filter(Boolean).join(', '),
        monthly_price: price,
        commission_rate: rate,
        commission_amount: Math.round(commission * 100) / 100,
      };
    });

    await dbClient
      .from('partner_invoices')
      .update({
        total_properties: activeProps.length,
        gross_revenue: Math.round(grossRevenue * 100) / 100,
        commission_amount: Math.round(totalCommission * 100) / 100,
        line_items: lineItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingInv.id);
  } catch (syncErr) {
    console.warn('[Partner Property Sync] Non-fatal invoice sync warning:', syncErr);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    const supabase = await createClient();
    const dbClient = createAdminClient() || supabase;
    const body = await request.json();

    const { property_id, action, commission_override } = body;

    if (!property_id) {
      return NextResponse.json({ success: false, error: 'Property ID is required.' }, { status: 400 });
    }

    if (action === 'UNASSIGN') {
      const { error } = await dbClient
        .from('properties')
        .update({ partner_id: null, partner_commission_override: null, updated_at: new Date().toISOString() })
        .eq('id', property_id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      await syncCurrentMonthPendingInvoice(dbClient, partnerId);

      await logAuditEvent({
        action: 'PARTNER_PROPERTY_UNASSIGNED',
        entity_type: 'PARTNER',
        entity_id: partnerId,
        changes: { property_id, action: 'UNASSIGN' },
      });

      return NextResponse.json({ success: true, message: 'Property unassigned from partner.' });
    }

    // Default action: ASSIGN or UPDATE_OVERRIDE
    const updatePayload: Record<string, any> = {
      partner_id: partnerId,
      updated_at: new Date().toISOString(),
    };

    if (commission_override !== undefined && commission_override !== '' && commission_override !== null) {
      updatePayload.partner_commission_override = Number(commission_override);
    } else {
      updatePayload.partner_commission_override = null;
    }

    const { data: updatedProp, error: propErr } = await dbClient
      .from('properties')
      .update(updatePayload)
      .eq('id', property_id)
      .select('id, name, monthly_price, partner_id, partner_commission_override')
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: propErr.message }, { status: 400 });
    }

    await syncCurrentMonthPendingInvoice(dbClient, partnerId);

    await logAuditEvent({
      action: 'PARTNER_PROPERTY_ASSIGNED',
      entity_type: 'PARTNER',
      entity_id: partnerId,
      changes: { property_id, partner_id: partnerId, commission_override: updatePayload.partner_commission_override },
    });

    return NextResponse.json({ success: true, data: updatedProp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
