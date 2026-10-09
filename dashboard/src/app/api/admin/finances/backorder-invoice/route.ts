import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const { partner_id, period_month, property_ids, custom_commission_rate, notes } = body;

    if (!partner_id) {
      return NextResponse.json({ success: false, error: 'Partner ID is required.' }, { status: 400 });
    }
    if (!period_month) {
      return NextResponse.json({ success: false, error: 'Period month (YYYY-MM) is required.' }, { status: 400 });
    }

    // 1. Fetch partner details
    const { data: partner, error: partnerErr } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partner_id)
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ success: false, error: 'Partner not found.' }, { status: 404 });
    }

    // 2. Calculate period start and end dates
    const [yearStr, monthStr] = period_month.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));
    const periodStart = startDate.toISOString().split('T')[0];
    const periodEnd = endDate.toISOString().split('T')[0];
    const monthCode = `${year}${String(month + 1).padStart(2, '0')}`;

    // 3. Fetch properties
    let query = supabase.from('properties').select('id, name, address, city, state, monthly_price, partner_commission_override');
    if (property_ids && Array.isArray(property_ids) && property_ids.length > 0) {
      query = query.in('id', property_ids);
    } else {
      query = query.eq('partner_id', partner_id);
    }

    const { data: propsData, error: propsErr } = await query;
    const properties = propsData || [];

    const defaultRate = custom_commission_rate !== undefined ? Number(custom_commission_rate) : Number(partner.default_commission_rate || 10);
    let grossRevenue = 0;
    let totalCommission = 0;

    const lineItems = properties.map((p: any) => {
      const rate =
        custom_commission_rate !== undefined
          ? Number(custom_commission_rate)
          : p.partner_commission_override !== null && p.partner_commission_override !== undefined
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
        commission_amount: commission,
      };
    });

    const rawSlug = (partner.company_name || partner.name || 'PTR')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 5)
      .toUpperCase();
    const randHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    const invoiceNumber = `INV-${rawSlug || 'PTR'}-${monthCode}-BACK-${randHex}`;

    const newInvoicePayload = {
      partner_id: partner.id,
      invoice_number: invoiceNumber,
      period_start: periodStart,
      period_end: periodEnd,
      total_properties: properties.length,
      gross_revenue: Math.round(grossRevenue * 100) / 100,
      commission_amount: Math.round(totalCommission * 100) / 100,
      status: 'SUBMITTED',
      line_items: lineItems,
      notes: notes || `Historical back-ordered commission invoice for ${period_month}. Generated on-demand.`,
    };

    const { data: createdInv, error: insertErr } = await supabase
      .from('partner_invoices')
      .insert(newInvoicePayload)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_BACKORDER_INVOICE_GENERATED',
      entity_type: 'PARTNER_INVOICE',
      entity_id: createdInv.id,
      entity_name: createdInv.invoice_number,
      changes: newInvoicePayload,
    });

    return NextResponse.json({
      success: true,
      data: createdInv,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
