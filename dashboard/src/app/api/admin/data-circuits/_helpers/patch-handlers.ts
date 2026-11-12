import { NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit/logger';

export async function handleAddQuote(db: any, id: string, body: any) {
  const qPrice = Math.max(0, Number(body.quoted_monthly_price || 0));
  const qPct = Math.max(0, Number(body.proposed_rev_share_percentage || 0));
  const qAmt = Math.round(qPrice * (qPct / 100) * 100) / 100;

  const { data: newQuote, error: qErr } = await db
    .from('data_circuit_quotes')
    .insert({
      data_circuit_id: id,
      wholesaler_name: (body.wholesaler_name || '').trim(),
      carrier_name: (body.carrier_name || '').trim(),
      bandwidth: (body.bandwidth || '1 Gig').trim(),
      quoted_monthly_price: qPrice,
      proposed_rev_share_percentage: qPct,
      proposed_rev_share_amount: qAmt,
      is_selected: Boolean(body.is_selected),
      notes: body.notes?.trim() || null,
    })
    .select('*')
    .single();

  if (qErr) {
    return NextResponse.json({ success: false, error: qErr.message }, { status: 400 });
  }

  if (body.is_selected && newQuote) {
    await db.from('data_circuit_quotes').update({ is_selected: false }).eq('data_circuit_id', id).neq('id', newQuote.id);
    await db
      .from('data_circuits')
      .update({
        selected_quote_id: newQuote.id,
        wholesaler_name: newQuote.wholesaler_name,
        carrier_name: newQuote.carrier_name,
        bandwidth: newQuote.bandwidth,
        circuit_monthly_price: newQuote.quoted_monthly_price,
        revenue_share_percentage: newQuote.proposed_rev_share_percentage,
        monthly_revenue_share_amount: newQuote.proposed_rev_share_amount,
      })
      .eq('id', id);
  }

  return NextResponse.json({ success: true, quote: newQuote });
}

export async function handleSelectQuote(db: any, id: string, existing: any, body: any) {
  const { quote_id, send_quotation, custom_client_price, custom_rev_share_pct } = body;
  const { data: targetQuote, error: tErr } = await db
    .from('data_circuit_quotes')
    .select('*')
    .eq('id', quote_id)
    .single();

  if (tErr || !targetQuote) {
    return NextResponse.json({ success: false, error: 'Quote not found.' }, { status: 404 });
  }

  await db.from('data_circuit_quotes').update({ is_selected: false }).eq('data_circuit_id', id);
  await db.from('data_circuit_quotes').update({ is_selected: true }).eq('id', quote_id);

  const finalPrice =
    custom_client_price !== undefined && custom_client_price !== '' && !isNaN(Number(custom_client_price))
      ? Number(custom_client_price)
      : Number(targetQuote.quoted_monthly_price || 0);

  const finalPct =
    custom_rev_share_pct !== undefined && custom_rev_share_pct !== '' && !isNaN(Number(custom_rev_share_pct))
      ? Number(custom_rev_share_pct)
      : Number(targetQuote.proposed_rev_share_percentage || 0);

  const finalShareAmt = Math.round(finalPrice * (finalPct / 100) * 100) / 100;

  const updateFields: Record<string, any> = {
    selected_quote_id: quote_id,
    wholesaler_name: targetQuote.wholesaler_name,
    carrier_name: targetQuote.carrier_name,
    bandwidth: targetQuote.bandwidth,
    circuit_monthly_price: finalPrice,
    revenue_share_percentage: finalPct,
    monthly_revenue_share_amount: finalShareAmt,
    updated_at: new Date().toISOString(),
  };

  if (send_quotation) {
    updateFields.status = 'QUOTATION_SENT';
    updateFields.quotation_sent_at = new Date().toISOString();
  } else if (existing.status === 'STARTED' || existing.status === 'REQUESTED') {
    updateFields.status = 'PRICING_FINALIZED';
  }

  const { data: updatedCircuit, error: uErr } = await db
    .from('data_circuits')
    .update(updateFields)
    .eq('id', id)
    .select('*')
    .single();

  if (uErr) {
    return NextResponse.json({ success: false, error: uErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: updatedCircuit });
}

export async function handleStandardCircuitUpdate(db: any, id: string, existing: any, body: any) {
  const nextStatus = body.status || existing.status;

  // HARD GATE: Cannot advance to PAPERWORK_SIGNED, SITE_SURVEY, FOC_STAGE, or INSTALLED without Agreement PDF
  const stagesRequiringPdf = ['PAPERWORK_SIGNED', 'SITE_SURVEY', 'FOC_STAGE', 'INSTALLED'];
  const hasAgreementPdf = Boolean(
    existing.agreement_storage_path ||
    existing.agreement_file_url ||
    existing.agreement_file_name ||
    body.agreement_storage_path ||
    body.agreement_file_url ||
    body.agreement_file_name
  );

  if (stagesRequiringPdf.includes(nextStatus) && !hasAgreementPdf) {
    return NextResponse.json(
      {
        success: false,
        error: 'Signed Agreement PDF is required before advancing to Paperwork Signed, Site Survey, FOC, or Installed.',
      },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: nowIso,
  };

  if (body.status !== undefined) {
    updatePayload.status = body.status;
    if (body.status === 'QUOTATION_SENT' && !existing.quotation_sent_at) updatePayload.quotation_sent_at = nowIso;
    if (body.status === 'PAPERWORK_SIGNED' && !existing.paperwork_signed_at) updatePayload.paperwork_signed_at = nowIso;
    if (body.status === 'INSTALLED' && !existing.installed_at) updatePayload.installed_at = nowIso;
  }

  if (body.wholesaler_name !== undefined) updatePayload.wholesaler_name = body.wholesaler_name ? body.wholesaler_name.trim() : null;
  if (body.carrier_name !== undefined) updatePayload.carrier_name = body.carrier_name ? body.carrier_name.trim() : null;
  if (body.bandwidth !== undefined) updatePayload.bandwidth = body.bandwidth ? body.bandwidth.trim() : null;

  const newPrice =
    body.circuit_monthly_price !== undefined
      ? Math.max(0, Number(body.circuit_monthly_price || 0))
      : Number(existing.circuit_monthly_price || 0);
  const newPct =
    body.revenue_share_percentage !== undefined
      ? Math.max(0, Number(body.revenue_share_percentage || 0))
      : Number(existing.revenue_share_percentage || 0);

  if (body.circuit_monthly_price !== undefined || body.revenue_share_percentage !== undefined) {
    updatePayload.circuit_monthly_price = newPrice;
    updatePayload.revenue_share_percentage = newPct;
    updatePayload.monthly_revenue_share_amount = Math.round(newPrice * (newPct / 100) * 100) / 100;
  }

  if (body.quotation_notes !== undefined) updatePayload.quotation_notes = body.quotation_notes;
  if (body.site_survey_status !== undefined) {
    updatePayload.site_survey_status = body.site_survey_status;
    if (body.site_survey_status === 'COMPLETED' && !existing.site_survey_completed_at) {
      updatePayload.site_survey_completed_at = nowIso;
    }
  }
  if (body.site_survey_notes !== undefined) updatePayload.site_survey_notes = body.site_survey_notes;
  if (body.foc_status !== undefined) updatePayload.foc_status = body.foc_status;
  if (body.foc_date !== undefined) updatePayload.foc_date = body.foc_date || null;
  if (body.foc_pending_actions_notes !== undefined) updatePayload.foc_pending_actions_notes = body.foc_pending_actions_notes;
  if (body.technical_details !== undefined) updatePayload.technical_details = body.technical_details;
  if (body.internal_admin_notes !== undefined) updatePayload.internal_admin_notes = body.internal_admin_notes;

  const { data: updated, error: updErr } = await db
    .from('data_circuits')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();

  if (updErr) {
    return NextResponse.json({ success: false, error: updErr.message }, { status: 400 });
  }

  // Update property connectivity_type if requested
  if (body.connectivity_type && ['PORTED', 'DATA_CIRCUITED', 'BOTH'].includes(body.connectivity_type)) {
    await db
      .from('properties')
      .update({ connectivity_type: body.connectivity_type, updated_at: nowIso })
      .eq('id', existing.property_id);
  }

  await logAuditEvent({
    action: 'DATA_CIRCUIT_UPDATED',
    entity_type: 'DATA_CIRCUIT',
    entity_id: id,
    entity_name: `${updated.carrier_name || 'Data Circuit'} (${updated.status})`,
    description: `Updated Data Circuit ${id} to stage ${updated.status}`,
    changes: updatePayload,
  });

  return NextResponse.json({ success: true, data: updated });
}
