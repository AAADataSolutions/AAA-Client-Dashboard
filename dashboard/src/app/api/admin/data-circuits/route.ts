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
    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const propertyId = searchParams.get('propertyId') || 'ALL';
    const now = new Date();
    const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthKey = searchParams.get('month') || defaultMonthKey;

    // 1. Fetch all properties for dropdowns & joining
    const { data: propertiesData } = await db
      .from('properties')
      .select(`
        id,
        name,
        address,
        city,
        state,
        zip_code,
        country,
        main_phone,
        general_manager_name,
        general_manager_phone,
        general_manager_email,
        contact_person_name,
        contact_person_email,
        connectivity_type,
        status,
        monthly_price
      `)
      .order('name', { ascending: true });

    const allProperties = propertiesData || [];
    const propMap = new Map<string, any>(allProperties.map((p: any) => [p.id, p]));

    // 2. Fetch Data Circuits
    const { data: circuitsRaw, error: circuitsErr } = await db
      .from('data_circuits')
      .select('*')
      .order('created_at', { ascending: false });

    if (circuitsErr) {
      const isMissing =
        circuitsErr.message?.includes('does not exist') ||
        circuitsErr.message?.includes('schema cache');
      if (isMissing) {
        return NextResponse.json({
          success: true,
          tableMissing: true,
          message: 'Data Circuits tables have not been initialized yet. Please run 24_data_circuits_schema.sql.',
          data: [],
          properties: allProperties,
          monthlyRevenueRows: [],
          metrics: {
            totalCircuits: 0,
            installedCircuits: 0,
            inProgressCircuits: 0,
            expectedMonthlyRevShare: 0,
            receivedMonthlyRevShare: 0,
            pendingMonthlyRevShare: 0,
          },
        });
      }
      return NextResponse.json({ success: false, error: circuitsErr.message }, { status: 400 });
    }

    const circuits = circuitsRaw || [];
    const circuitIds = circuits.map((c: any) => c.id);

    // 3. Fetch Competing Wholesaler Quotes
    let allQuotes: any[] = [];
    if (circuitIds.length > 0) {
      const { data: qData } = await db
        .from('data_circuit_quotes')
        .select('*')
        .in('data_circuit_id', circuitIds)
        .order('quoted_monthly_price', { ascending: true });
      allQuotes = qData || [];
    }

    // 4. Fetch Monthly Revenue Share records for all months (or target month)
    let allMonthlyRevs: any[] = [];
    if (circuitIds.length > 0) {
      const { data: mData } = await db
        .from('data_circuit_monthly_revenues')
        .select('*')
        .in('data_circuit_id', circuitIds)
        .order('month_key', { ascending: false });
      allMonthlyRevs = mData || [];
    }

    const quotesByCircuit = new Map<string, any[]>();
    allQuotes.forEach((q: any) => {
      const list = quotesByCircuit.get(q.data_circuit_id) || [];
      list.push(q);
      quotesByCircuit.set(q.data_circuit_id, list);
    });

    const revByCircuitMonth = new Map<string, any>();
    allMonthlyRevs.forEach((r: any) => {
      revByCircuitMonth.set(`${r.data_circuit_id}_${r.month_key}`, r);
    });

    // 5. Enrich circuits
    let enriched = circuits.map((c: any) => {
      const prop = propMap.get(c.property_id) || null;
      const quotes = quotesByCircuit.get(c.id) || [];
      const price = Number(c.circuit_monthly_price || 0);
      const pct = Number(c.revenue_share_percentage || 0);
      const revShareAmt =
        c.monthly_revenue_share_amount !== null && c.monthly_revenue_share_amount !== undefined && Number(c.monthly_revenue_share_amount) > 0
          ? Number(c.monthly_revenue_share_amount)
          : Math.round(price * (pct / 100) * 100) / 100;

      const monthRevRecord = revByCircuitMonth.get(`${c.id}_${monthKey}`) || null;

      return {
        ...c,
        circuit_monthly_price: price,
        revenue_share_percentage: pct,
        monthly_revenue_share_amount: revShareAmt,
        property_name: prop?.name || 'Unknown Property',
        property_address: prop ? `${prop.address}, ${prop.city}, ${prop.state} ${prop.zip_code}` : '',
        property_city: prop?.city || '',
        property_state: prop?.state || '',
        property_connectivity_type: prop?.connectivity_type || 'DATA_CIRCUITED',
        property: prop,
        quotes,
        current_month_revenue: {
          month_key: monthKey,
          record_id: monthRevRecord?.id || null,
          revenue_received: Boolean(monthRevRecord?.revenue_received),
          received_at: monthRevRecord?.received_at || null,
          expected_amount: monthRevRecord ? Number(monthRevRecord.revenue_share_amount || revShareAmt) : revShareAmt,
        },
      };
    });

    // Global metrics before filtering
    const totalCircuits = enriched.length;
    const installedList = enriched.filter((c: any) => c.status === 'INSTALLED');
    const installedCircuits = installedList.length;
    const inProgressCircuits = enriched.filter((c: any) => c.status !== 'INSTALLED' && c.status !== 'CANCELLED').length;

    let expectedMonthlyRevShare = 0;
    let receivedMonthlyRevShare = 0;

    // Build monthly revenue tracker rows for all active/installed circuits (or circuits with pricing)
    const monthlyRevenueRows = enriched
      .filter((c: any) => c.status !== 'CANCELLED' && (c.status === 'INSTALLED' || c.circuit_monthly_price > 0))
      .map((c: any) => {
        const expected = Number(c.current_month_revenue.expected_amount || c.monthly_revenue_share_amount || 0);
        const isRec = Boolean(c.current_month_revenue.revenue_received);
        expectedMonthlyRevShare += expected;
        if (isRec) {
          receivedMonthlyRevShare += expected;
        }
        return {
          circuit_id: c.id,
          property_id: c.property_id,
          property_name: c.property_name,
          property_address: c.property_address,
          status: c.status,
          wholesaler_name: c.wholesaler_name || '—',
          carrier_name: c.carrier_name || '—',
          bandwidth: c.bandwidth || '—',
          circuit_monthly_price: c.circuit_monthly_price,
          revenue_share_percentage: c.revenue_share_percentage,
          revenue_share_amount: expected,
          month_key: monthKey,
          revenue_received: isRec,
          received_at: c.current_month_revenue.received_at,
        };
      });

    // Apply filters
    if (propertyId !== 'ALL') {
      enriched = enriched.filter((c: any) => c.property_id === propertyId);
    }
    if (statusFilter !== 'ALL') {
      enriched = enriched.filter((c: any) => c.status === statusFilter);
    }
    if (search) {
      enriched = enriched.filter(
        (c: any) =>
          (c.property_name || '').toLowerCase().includes(search) ||
          (c.wholesaler_name || '').toLowerCase().includes(search) ||
          (c.carrier_name || '').toLowerCase().includes(search) ||
          (c.bandwidth || '').toLowerCase().includes(search) ||
          (c.technical_details || '').toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      monthKey,
      data: enriched,
      properties: allProperties,
      monthlyRevenueRows,
      metrics: {
        totalCircuits,
        installedCircuits,
        inProgressCircuits,
        expectedMonthlyRevShare: Math.round(expectedMonthlyRevShare * 100) / 100,
        receivedMonthlyRevShare: Math.round(receivedMonthlyRevShare * 100) / 100,
        pendingMonthlyRevShare: Math.round(Math.max(0, expectedMonthlyRevShare - receivedMonthlyRevShare) * 100) / 100,
      },
    });
  } catch (err: any) {
    console.error('[Data Circuits GET] Error:', err);
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
    const {
      property_id,
      status = 'STARTED',
      wholesaler_name,
      carrier_name,
      bandwidth,
      circuit_monthly_price = 0,
      revenue_share_percentage = 0,
      connectivity_type,
      technical_details,
      internal_admin_notes,
      quotes = [],
    } = body;

    if (!property_id) {
      return NextResponse.json({ success: false, error: 'Property selection is required.' }, { status: 400 });
    }

    const priceNum = Math.max(0, Number(circuit_monthly_price || 0));
    const pctNum = Math.max(0, Number(revenue_share_percentage || 0));
    const shareAmt = Math.round(priceNum * (pctNum / 100) * 100) / 100;

    // 1. Insert the Data Circuit
    const { data: newCircuit, error: createErr } = await db
      .from('data_circuits')
      .insert({
        property_id,
        status,
        wholesaler_name: wholesaler_name?.trim() || null,
        carrier_name: carrier_name?.trim() || null,
        bandwidth: bandwidth?.trim() || '1 Gig',
        circuit_monthly_price: priceNum,
        revenue_share_percentage: pctNum,
        monthly_revenue_share_amount: shareAmt,
        quotation_sent_at: status === 'QUOTATION_SENT' ? new Date().toISOString() : null,
        technical_details: technical_details || null,
        internal_admin_notes: internal_admin_notes || null,
        created_by: user?.id || null,
      })
      .select('*')
      .single();

    if (createErr) {
      return NextResponse.json({ success: false, error: createErr.message }, { status: 400 });
    }

    // 2. Insert initial wholesaler quotes if provided
    let selectedQuoteId: string | null = null;
    if (Array.isArray(quotes) && quotes.length > 0) {
      for (const q of quotes) {
        if (!q.wholesaler_name && !q.carrier_name) continue;
        const qPrice = Math.max(0, Number(q.quoted_monthly_price || 0));
        const qPct = Math.max(0, Number(q.proposed_rev_share_percentage || 0));
        const qAmt = Math.round(qPrice * (qPct / 100) * 100) / 100;

        const { data: insertedQuote } = await db
          .from('data_circuit_quotes')
          .insert({
            data_circuit_id: newCircuit.id,
            wholesaler_name: (q.wholesaler_name || 'Wholesaler').trim(),
            carrier_name: (q.carrier_name || 'Carrier').trim(),
            bandwidth: (q.bandwidth || '1 Gig').trim(),
            quoted_monthly_price: qPrice,
            proposed_rev_share_percentage: qPct,
            proposed_rev_share_amount: qAmt,
            is_selected: Boolean(q.is_selected),
            notes: q.notes || null,
          })
          .select('id, is_selected, wholesaler_name, carrier_name, bandwidth, quoted_monthly_price, proposed_rev_share_percentage, proposed_rev_share_amount')
          .single();

        if (insertedQuote?.is_selected) {
          selectedQuoteId = insertedQuote.id;
          await db
            .from('data_circuits')
            .update({
              selected_quote_id: insertedQuote.id,
              wholesaler_name: insertedQuote.wholesaler_name,
              carrier_name: insertedQuote.carrier_name,
              bandwidth: insertedQuote.bandwidth,
              circuit_monthly_price: insertedQuote.quoted_monthly_price,
              revenue_share_percentage: insertedQuote.proposed_rev_share_percentage,
              monthly_revenue_share_amount: insertedQuote.proposed_rev_share_amount,
            })
            .eq('id', newCircuit.id);
        }
      }
    }

    // 3. Update property connectivity_type ('PORTED', 'DATA_CIRCUITED', 'BOTH')
    if (connectivity_type && ['PORTED', 'DATA_CIRCUITED', 'BOTH'].includes(connectivity_type)) {
      await db
        .from('properties')
        .update({ connectivity_type, updated_at: new Date().toISOString() })
        .eq('id', property_id);
    } else {
      // Check if property already has voice services; if so -> BOTH, else DATA_CIRCUITED
      const { count: svcCount } = await db
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', property_id);
      const nextConnType = (svcCount || 0) > 0 ? 'BOTH' : 'DATA_CIRCUITED';
      await db
        .from('properties')
        .update({ connectivity_type: nextConnType, updated_at: new Date().toISOString() })
        .eq('id', property_id);
    }

    await logAuditEvent({
      action: 'DATA_CIRCUIT_CREATED',
      entity_type: 'DATA_CIRCUIT',
      entity_id: newCircuit.id,
      entity_name: `${carrier_name || 'Data Circuit'} (${bandwidth || '1 Gig'})`,
      description: `Created Data Circuit request for property ${property_id}`,
      changes: { property_id, status, carrier_name, circuit_monthly_price: priceNum, selectedQuoteId },
    });

    return NextResponse.json({ success: true, data: newCircuit });
  } catch (err: any) {
    console.error('[Data Circuits POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Data Circuit ID is required.' }, { status: 400 });
    }

    // Fetch existing circuit
    const { data: existing, error: fetchErr } = await db
      .from('data_circuits')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ success: false, error: 'Data Circuit not found.' }, { status: 404 });
    }

    // Action A: Add a new competing wholesaler quote
    if (action === 'ADD_QUOTE') {
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

    // Action B: Select a winning quote & optionally mark Quotation Sent
    if (action === 'SELECT_QUOTE') {
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

    // Action C: Delete a quote
    if (action === 'DELETE_QUOTE') {
      const { quote_id } = body;
      await db.from('data_circuit_quotes').delete().eq('id', quote_id);
      return NextResponse.json({ success: true });
    }

    // Standard Stage & Details Update
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const nowIso = new Date().toISOString();
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
  } catch (err: any) {
    console.error('[Data Circuits PATCH] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Circuit ID is required.' }, { status: 400 });
    }

    const { error } = await db.from('data_circuits').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
