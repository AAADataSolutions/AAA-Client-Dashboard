import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { generateMonthlyPartnerInvoices } from '@/lib/partners/monthly-invoices';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'ALL';
    const partnerId = searchParams.get('partner_id');
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    // Automatically ensure monthly gross revenue partner invoices are up to date
    try {
      await generateMonthlyPartnerInvoices();
    } catch (autoGenErr) {
      console.warn('[Admin Invoices GET] Background invoice auto-gen notice:', autoGenErr);
    }

    let query = supabase
      .from('partner_invoices')
      .select(`
        *,
        partner:partners(id, name, email, phone, company_name, default_commission_rate)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data: invoicesData, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    let filtered = invoicesData || [];
    if (search) {
      filtered = filtered.filter(
        (inv: any) =>
          inv.invoice_number?.toLowerCase().includes(search) ||
          inv.partner?.name?.toLowerCase().includes(search) ||
          inv.partner?.email?.toLowerCase().includes(search) ||
          inv.partner?.company_name?.toLowerCase().includes(search)
      );
    }

    const allInvoices = invoicesData || [];
    const totalInvoiced = allInvoices.reduce((sum: number, inv: any) => sum + Number(inv.commission_amount || 0), 0);
    const pendingPayout = allInvoices
      .filter((inv: any) => inv.status === 'SUBMITTED' || inv.status === 'APPROVED')
      .reduce((sum: number, inv: any) => sum + Number(inv.commission_amount || 0), 0);
    const totalPaid = allInvoices
      .filter((inv: any) => inv.status === 'PAID')
      .reduce((sum: number, inv: any) => sum + Number(inv.commission_amount || 0), 0);

    const metrics = {
      totalInvoicesCount: allInvoices.length,
      totalInvoiced,
      pendingPayout,
      totalPaid,
    };

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const { id, status, payment_reference, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updatePayload.status = status;
      if (status === 'PAID') {
        updatePayload.paid_at = new Date().toISOString();
      }
    }
    if (payment_reference !== undefined) {
      updatePayload.payment_reference = payment_reference;
    }
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data: updatedInvoice, error } = await supabase
      .from('partner_invoices')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        partner:partners(id, name, email, phone, company_name)
      `)
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_INVOICE_UPDATED',
      entity_type: 'PARTNER_INVOICE',
      entity_id: id,
      entity_name: updatedInvoice.invoice_number,
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
