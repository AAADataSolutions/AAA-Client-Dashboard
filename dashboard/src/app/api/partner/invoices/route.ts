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
    const requestedPartnerId = searchParams.get('partner_id');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let partner: any = null;

    if (requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    if (!partner && user) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const { data: byEmail } = await db.from('partners').select('*').ilike('email', cleanEmail).maybeSingle();
        if (byEmail) {
          partner = byEmail;
          if (!byEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byEmail.id);
          }
        }
      }
    }

    if (!partner && user) {
      const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profile?.email) {
        const { data: byProfileEmail } = await db
          .from('partners')
          .select('*')
          .ilike('email', profile.email.trim().toLowerCase())
          .maybeSingle();
        if (byProfileEmail) {
          partner = byProfileEmail;
          if (!byProfileEmail.user_id) {
            await db.from('partners').update({ user_id: user.id }).eq('id', byProfileEmail.id);
          }
        }
      }
    }

    if (!partner) {
      const { data: allPartners } = await db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (allPartners && allPartners.length > 0) {
        partner = allPartners[0];
      }
    }

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const body = await request.json();

    let partner: any = null;

    if (body.partner_id) {
      const { data } = await db.from('partners').select('*').eq('id', body.partner_id).maybeSingle();
      if (data) partner = data;
    }

    if (!partner && user) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else if (user.email) {
        const cleanEmail = user.email.trim().toLowerCase();
        const { data: byEmail } = await db.from('partners').select('*').ilike('email', cleanEmail).maybeSingle();
        if (byEmail) partner = byEmail;
      }
    }

    if (!partner) {
      const { data: allPartners } = await db
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (allPartners && allPartners.length > 0) partner = allPartners[0];
    }

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner record not found.' }, { status: 404 });
    }

    const { period_start, period_end, notes, selected_property_ids, custom_amount, line_items: clientLineItems } = body;

    if (!period_start || !period_end) {
      return NextResponse.json({ success: false, error: 'Period start and end dates are required.' }, { status: 400 });
    }

    // Fetch properties assigned to partner
    const { data: props } = await db
      .from('properties')
      .select('id, name, address, city, state, monthly_price, partner_commission_override')
      .eq('partner_id', partner.id);

    const allPartnerProps = props || [];
    
    // Filter by selected properties if provided, else include all assigned properties
    const targetProps = selected_property_ids && Array.isArray(selected_property_ids) && selected_property_ids.length > 0
      ? allPartnerProps.filter((p) => selected_property_ids.includes(p.id))
      : allPartnerProps;

    let lineItems = clientLineItems || targetProps.map((p) => {
      const commRate = p.partner_commission_override !== null && p.partner_commission_override !== undefined
        ? Number(p.partner_commission_override)
        : Number(partner.default_commission_rate || 10);
      const price = Number(p.monthly_price || 0);
      const commission = price * (commRate / 100);

      return {
        property_id: p.id,
        property_name: p.name,
        property_location: `${p.city || ''}${p.state ? `, ${p.state}` : ''}`,
        monthly_price: price,
        commission_rate: commRate,
        commission_amount: commission,
      };
    });

    const calculatedGross = lineItems.reduce((sum: number, item: any) => sum + Number(item.monthly_price || 0), 0);
    const calculatedCommission = lineItems.reduce((sum: number, item: any) => sum + Number(item.commission_amount || 0), 0);

    // If custom_amount is specified, use that for commission_amount
    const finalCommissionAmount = custom_amount !== undefined && custom_amount !== null && custom_amount !== ''
      ? Number(custom_amount)
      : calculatedCommission;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: newInvoice, error: invErr } = await db
      .from('partner_invoices')
      .insert({
        partner_id: partner.id,
        invoice_number: invoiceNumber,
        period_start,
        period_end,
        total_properties: lineItems.length,
        gross_revenue: calculatedGross,
        commission_amount: finalCommissionAmount,
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
