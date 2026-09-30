import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient() || (await createClient());

    const { data: partner, error: partnerErr } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (partnerErr || !partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 });
    }

    // Get assigned properties
    const { data: assignedProps } = await supabase
      .from('properties')
      .select('*')
      .eq('partner_id', id);

    // Get partner invoices
    const { data: invoices } = await supabase
      .from('partner_invoices')
      .select('*')
      .eq('partner_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        ...partner,
        properties: assignedProps || [],
        invoices: invoices || [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient() || (await createClient());
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.email !== undefined) updatePayload.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updatePayload.phone = body.phone ? body.phone.trim() : null;
    if (body.company_name !== undefined) updatePayload.company_name = body.company_name ? body.company_name.trim() : null;
    if (body.default_commission_rate !== undefined) updatePayload.default_commission_rate = Number(body.default_commission_rate);
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.notes !== undefined) updatePayload.notes = body.notes ? body.notes.trim() : null;
    if (body.payment_info !== undefined) updatePayload.payment_info = body.payment_info;

    const { data: updatedPartner, error: updateErr } = await supabase
      .from('partners')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_UPDATED',
      entity_type: 'PARTNER',
      entity_id: id,
      entity_name: updatedPartner.name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: updatedPartner });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Unlink properties first
    await supabase.from('properties').update({ partner_id: null, partner_commission_override: null }).eq('partner_id', id);

    const { error: delErr } = await supabase.from('partners').delete().eq('id', id);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PARTNER_DELETED',
      entity_type: 'PARTNER',
      entity_id: id,
      changes: { deleted: true },
    });

    return NextResponse.json({ success: true, message: 'Partner removed successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
