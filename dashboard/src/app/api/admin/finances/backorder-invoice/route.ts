import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { enqueuePartnerInvoiceEmails } from '@/lib/email/email-queue';
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

    return NextResponse.json({
      success: true,
      properties: allProps,
      total_partner_properties: allProps.length,
      eligible_count: allProps.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const { partner_id, period_month, property_ids, custom_commission_rate, status, notes, send_email } = body;

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

    // 3. Fetch properties (selected properties irrespective of month)
    let query = supabase.from('properties').select('id, name, address, city, state, monthly_price, partner_commission_override, created_at');
    if (property_ids && Array.isArray(property_ids) && property_ids.length > 0) {
      query = query.in('id', property_ids);
    } else {
      query = query.eq('partner_id', partner_id);
    }

    const { data: propsData, error: propsErr } = await query;
    let properties = propsData || [];

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

    const validStatus = status && ['PAID', 'APPROVED', 'SUBMITTED', 'DRAFT'].includes(String(status).toUpperCase())
      ? String(status).toUpperCase()
      : 'SUBMITTED';

    const newInvoicePayload = {
      partner_id: partner.id,
      invoice_number: invoiceNumber,
      period_start: periodStart,
      period_end: periodEnd,
      total_properties: properties.length,
      gross_revenue: Math.round(grossRevenue * 100) / 100,
      commission_amount: Math.round(totalCommission * 100) / 100,
      status: validStatus,
      line_items: lineItems,
      notes: notes || `Historical back-ordered revenue share invoice for ${period_month}. Generated on-demand.`,
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

    let emailQueued = false;
    if (send_email && partner.email) {
      const qRes = enqueuePartnerInvoiceEmails([
        {
          invoiceId: createdInv.id,
          invoiceNumber: createdInv.invoice_number,
          periodStart: createdInv.period_start,
          periodEnd: createdInv.period_end,
          status: createdInv.status,
          totalProperties: createdInv.total_properties,
          grossRevenue: Number(createdInv.gross_revenue || 0),
          commissionAmount: Number(createdInv.commission_amount || 0),
          notes: createdInv.notes,
          createdAt: createdInv.created_at,
          partnerId: partner.id,
          partnerName: partner.name,
          partnerEmail: partner.email,
          partnerPhone: partner.phone,
          partnerCompanyName: partner.company_name,
          lineItems: createdInv.line_items || lineItems,
          triggerSource: 'BACKORDER',
        },
      ]);
      emailQueued = qRes.queuedCount > 0 || qRes.alreadyQueuedCount > 0;
    }

    return NextResponse.json({
      success: true,
      data: createdInv,
      emailQueued,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
