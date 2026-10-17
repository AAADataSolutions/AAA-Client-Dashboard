import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partner_id');
    const periodMonth = searchParams.get('period_month'); // YYYY-MM

    if (!partnerId) {
      return NextResponse.json({ success: true, properties: [] });
    }

    const { data: props, error } = await supabase
      .from('properties')
      .select('id, name, address, city, state, monthly_price, partner_id, partner_commission_override, created_at, status')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const allProps = props || [];

    // Filter candidate properties: properties created on or before the period_month
    const filtered = allProps.filter((p: any) => {
      if (periodMonth) {
        const pCreatedMonth = p.created_at ? p.created_at.substring(0, 7) : '9999-99';
        return pCreatedMonth <= periodMonth;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      properties: filtered,
      total_partner_properties: allProps.length,
      eligible_count: filtered.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

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
    let query = supabase.from('properties').select('id, name, address, city, state, monthly_price, partner_commission_override, created_at');
    if (property_ids && Array.isArray(property_ids) && property_ids.length > 0) {
      query = query.in('id', property_ids);
    } else {
      query = query.eq('partner_id', partner_id);
    }

    const { data: propsData, error: propsErr } = await query;
    let properties = propsData || [];

    // If explicit property_ids were NOT provided, automatically filter out properties created AFTER period_month
    if (!property_ids || !Array.isArray(property_ids) || property_ids.length === 0) {
      properties = properties.filter((p: any) => {
        const pCreatedMonth = p.created_at ? p.created_at.substring(0, 7) : '9999-99';
        return pCreatedMonth <= period_month;
      });
    }

    const hasCustomRate =
      custom_commission_rate !== undefined &&
      custom_commission_rate !== null &&
      String(custom_commission_rate).trim() !== '';

    const defaultRate = hasCustomRate
      ? Number(custom_commission_rate)
      : Number(partner.default_commission_rate || 10);
    let grossRevenue = 0;
    let totalCommission = 0;

    const lineItems = properties.map((p: any) => {
      const rate = hasCustomRate
        ? Number(custom_commission_rate)
        : p.partner_commission_override !== null &&
          p.partner_commission_override !== undefined &&
          String(p.partner_commission_override).trim() !== ''
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
