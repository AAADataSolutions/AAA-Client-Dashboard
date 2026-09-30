import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    let partnerQuery = db.from('partners').select('*');
    if (user) {
      partnerQuery = partnerQuery.or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);
    }

    const { data: partnerRecords } = await partnerQuery;
    const partner = partnerRecords?.[0] || null;

    if (!partner) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: invoices, error } = await db
      .from('partner_invoices')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: invoices || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const { data: { user } } = await supabase.auth.getUser();
    const body = await request.json();

    let partnerQuery = db.from('partners').select('*');
    if (body.partner_id) {
      partnerQuery = partnerQuery.eq('id', body.partner_id);
    } else if (user) {
      partnerQuery = partnerQuery.or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`);
    }

    const { data: partnerRecords } = await partnerQuery;
    const partner = partnerRecords?.[0] || null;

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner record not found.' }, { status: 404 });
    }

    const { period_start, period_end, notes } = body;

    if (!period_start || !period_end) {
      return NextResponse.json({ success: false, error: 'Period start and end dates are required.' }, { status: 400 });
    }

    // Fetch active properties assigned to partner
    const { data: props } = await db
      .from('properties')
      .select('id, name, address, city, state, monthly_price, partner_commission_override')
      .eq('partner_id', partner.id)
      .eq('status', 'ACTIVE');

    const activeProps = props || [];

    const lineItems = activeProps.map((p) => {
      const commRate = p.partner_commission_override !== null && p.partner_commission_override !== undefined
        ? Number(p.partner_commission_override)
        : Number(partner.default_commission_rate || 10);
      const price = Number(p.monthly_price || 0);
      const commission = price * (commRate / 100);

      return {
        property_id: p.id,
        property_name: p.name,
        property_location: `${p.city || ''}, ${p.state || ''}`,
        monthly_price: price,
        commission_rate: commRate,
        commission_amount: commission,
      };
    });

    const grossRevenue = lineItems.reduce((sum, item) => sum + item.monthly_price, 0);
    const totalCommission = lineItems.reduce((sum, item) => sum + item.commission_amount, 0);

    const invoiceNumber = `INV-PARTNER-${Date.now().toString().slice(-6)}`;

    const { data: newInvoice, error: invErr } = await db
      .from('partner_invoices')
      .insert({
        partner_id: partner.id,
        invoice_number: invoiceNumber,
        period_start,
        period_end,
        total_properties: lineItems.length,
        gross_revenue: grossRevenue,
        commission_amount: totalCommission,
        status: 'SUBMITTED',
        line_items: lineItems,
        notes: notes || null,
      })
      .select()
      .single();

    if (invErr) {
      return NextResponse.json({ success: false, error: invErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_INVOICE_GENERATED',
      entity_type: 'PARTNER_INVOICE',
      entity_id: newInvoice.id,
      entity_name: invoiceNumber,
      changes: newInvoice,
    });

    return NextResponse.json({ success: true, data: newInvoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
