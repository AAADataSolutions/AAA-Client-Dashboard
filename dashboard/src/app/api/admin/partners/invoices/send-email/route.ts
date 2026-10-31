import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  enqueuePartnerInvoiceEmails,
  getInvoiceEmailQueueSnapshot,
  PartnerInvoiceQueuePayload,
} from '@/lib/email/email-queue';

export async function GET() {
  try {
    const snapshot = getInvoiceEmailQueueSnapshot();
    return NextResponse.json({
      success: true,
      ...snapshot,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await authClient.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient() || authClient;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'SUB_SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawIds: string[] = [];

    if (body?.invoice_id && typeof body.invoice_id === 'string') {
      rawIds.push(body.invoice_id);
    }
    if (Array.isArray(body?.invoice_ids)) {
      for (const id of body.invoice_ids) {
        if (typeof id === 'string' && id.trim() && !rawIds.includes(id.trim())) {
          rawIds.push(id.trim());
        }
      }
    }

    if (rawIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one invoice_id is required.' },
        { status: 400 }
      );
    }

    const { data: invoices, error: invErr } = await supabase
      .from('partner_invoices')
      .select(
        `
        *,
        partner:partners(id, name, email, phone, company_name, default_commission_rate)
      `
      )
      .in('id', rawIds);

    if (invErr) {
      return NextResponse.json({ success: false, error: invErr.message }, { status: 400 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching partner invoices found.' },
        { status: 404 }
      );
    }

    // Preserve requested order
    const invoiceMap = new Map((invoices || []).map((inv: any) => [inv.id, inv]));
    const orderedInvoices = rawIds.map((id) => invoiceMap.get(id)).filter(Boolean);

    const payloads: PartnerInvoiceQueuePayload[] = orderedInvoices.map((inv: any) => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoice_number,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      status: inv.status || 'SUBMITTED',
      totalProperties: Number(inv.total_properties || 0),
      grossRevenue: Number(inv.gross_revenue || 0),
      commissionAmount: Number(inv.commission_amount || 0),
      notes: inv.notes || undefined,
      createdAt: inv.created_at,
      partnerId: inv.partner_id,
      partnerName: inv.partner?.name || 'Channel Partner',
      partnerEmail: inv.partner?.email || '',
      partnerPhone: inv.partner?.phone || null,
      partnerCompanyName: inv.partner?.company_name || null,
      lineItems: Array.isArray(inv.line_items) ? inv.line_items : [],
      triggerSource: rawIds.length > 1 ? 'MANUAL_BULK' : 'MANUAL_SINGLE',
    }));

    const queueResult = enqueuePartnerInvoiceEmails(payloads);
    const snapshot = getInvoiceEmailQueueSnapshot();

    return NextResponse.json({
      success: true,
      queuedCount: queueResult.queuedCount,
      alreadyQueuedCount: queueResult.alreadyQueuedCount,
      queueLength: queueResult.queueLength,
      jobs: queueResult.states,
      snapshot,
      message:
        queueResult.queuedCount > 1
          ? `${queueResult.queuedCount} invoice emails added to queue and will be dispatched one by one with PDF attachments.`
          : queueResult.queuedCount === 1
          ? `Invoice email queued for ${payloads[0]?.partnerEmail} with PDF attachment.`
          : `Invoice email is already queued or sending.`,
    });
  } catch (err: any) {
    console.error('[Partner Invoice Send Email POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

