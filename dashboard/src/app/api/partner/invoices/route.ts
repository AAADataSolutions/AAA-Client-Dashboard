import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { generateMonthlyPartnerInvoices } from '@/lib/partners/monthly-invoices';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const requestedPartnerId = searchParams.get('partner_id');

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await db
      .from('profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .maybeSingle();

    const isInternalAdmin = userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'SUB_SUPER_ADMIN';

    let partner: any = null;

    if (isInternalAdmin && requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    if (!partner) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else {
        const userEmail = (user.email || userProfile?.email || '').trim().toLowerCase();
        if (userEmail) {
          const { data: byEmail } = await db.from('partners').select('*').ilike('email', userEmail).maybeSingle();
          if (byEmail) {
            partner = byEmail;
            if (byEmail.user_id !== user.id) {
              await db.from('partners').update({ user_id: user.id, updated_at: new Date().toISOString() }).eq('id', byEmail.id);
            }
          }
        }
      }
    }

    if (!partner) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Automatically ensure this partner's monthly gross revenue invoice exists
    try {
      await generateMonthlyPartnerInvoices();
    } catch (genErr) {
      console.warn('[Partner Invoices] Auto invoice generation notice:', genErr);
    }

    // Fetch STRICTLY this partner's invoices
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

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await db
      .from('profiles')
      .select('id, role, email')
      .eq('id', user.id)
      .maybeSingle();

    const isInternalAdmin = userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'SUB_SUPER_ADMIN';

    const body = await request.json();
    let partner: any = null;

    if (isInternalAdmin && body.partner_id) {
      const { data } = await db.from('partners').select('*').eq('id', body.partner_id).maybeSingle();
      if (data) partner = data;
    }

    if (!partner) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else {
        const userEmail = (user.email || userProfile?.email || '').trim().toLowerCase();
        if (userEmail) {
          const { data: byEmail } = await db.from('partners').select('*').ilike('email', userEmail).maybeSingle();
          if (byEmail) partner = byEmail;
        }
      }
    }

    if (!partner) {
      return NextResponse.json({ success: false, error: 'No partner account associated with your profile.' }, { status: 403 });
    }

    const { period_start, period_end, notes } = body;

    if (!period_start || !period_end) {
      return NextResponse.json({ success: false, error: 'Billing period start and end dates are required.' }, { status: 400 });
    }

    // Fetch STRICTLY properties assigned to THIS partner
    const { data: assignedProps } = await db
      .from('properties')
      .select('id, name, address, city, state, monthly_price, partner_id, partner_commission_override, status')
      .eq('partner_id', partner.id);

    const properties = assignedProps || [];
    const defaultRate = Number(partner.default_commission_rate || 10);

    let grossRevenue = 0;
    let commissionTotal = 0;

    const lineItems = properties.map((p: any) => {
      const rate =
        p.partner_commission_override !== null &&
        p.partner_commission_override !== undefined &&
        p.partner_commission_override !== ''
          ? Number(p.partner_commission_override)
          : defaultRate;

      const price = Number(p.monthly_price || 0);
      const commission = price * (rate / 100);

      grossRevenue += price;
      commissionTotal += commission;

      return {
        property_id: p.id,
        property_name: p.name,
        address: [p.address, p.city, p.state].filter(Boolean).join(', '),
        monthly_price: price,
        commission_rate: rate,
        commission_amount: Math.round(commission * 100) / 100,
      };
    });

    const now = new Date();
    const invoiceNumber = `INV-${partner.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = {
      partner_id: partner.id,
      invoice_number: invoiceNumber,
      period_start,
      period_end,
      total_properties: properties.length,
      gross_revenue: Math.round(grossRevenue * 100) / 100,
      commission_amount: Math.round(commissionTotal * 100) / 100,
      status: 'SUBMITTED',
      line_items: lineItems,
      notes: notes?.trim() || `Partner statement submitted by ${partner.name}.`,
    };

    const { data: created, error } = await db.from('partner_invoices').insert(newInvoice).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_INVOICE_SUBMITTED',
      entity_type: 'PARTNER_INVOICE',
      entity_id: created.id,
      entity_name: invoiceNumber,
      changes: created,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
