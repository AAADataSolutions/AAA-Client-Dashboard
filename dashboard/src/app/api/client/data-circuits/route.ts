import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve tenant membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { totalCircuits: 0, installedCircuits: 0, inProgressCircuits: 0 },
      });
    }

    const dbClient = createAdminClient() || supabase;

    // 1. Fetch organization properties assigned to this client tenant
    const { data: orgProps, error: orgErr } = await dbClient
      .from('organization_properties')
      .select(`
        id,
        property_id,
        property:properties(id, name, address, city, state, zip_code, main_phone)
      `)
      .eq('organization_id', member.organization_id);

    if (orgErr) {
      return NextResponse.json({ success: false, error: orgErr.message }, { status: 400 });
    }

    const propMap = new Map<string, any>();
    const propIds: string[] = [];

    (orgProps || []).forEach((op: any) => {
      const p = op.property;
      const pid = op.property_id || p?.id;
      if (pid) {
        propIds.push(pid);
        if (p) propMap.set(pid, p);
      }
    });

    if (propIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { totalCircuits: 0, installedCircuits: 0, inProgressCircuits: 0 },
      });
    }

    // 2. Fetch Data Circuits for assigned properties
    const { data: circuitsRaw, error: dcErr } = await dbClient
      .from('data_circuits')
      .select(`
        id,
        property_id,
        status,
        connectivity_type,
        carrier_name,
        bandwidth,
        circuit_monthly_price,
        site_survey_status,
        site_survey_notes,
        foc_status,
        foc_date,
        foc_pending_actions_notes,
        technical_details,
        agreement_file_name,
        agreement_file_url,
        agreement_file_size,
        paperwork_signed_at,
        quotation_sent_at,
        installed_at,
        created_at,
        updated_at
      `)
      .in('property_id', propIds)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    if (dcErr) {
      return NextResponse.json({ success: false, error: dcErr.message }, { status: 400 });
    }

    // Fetch sanitized carrier quotes (strictly excluding wholesaler_name and revenue share)
    const circuitIds = (circuitsRaw || []).map((c: any) => c.id);
    const quotesByCircuit = new Map<string, any[]>();
    if (circuitIds.length > 0) {
      const { data: quotesRaw } = await dbClient
        .from('data_circuit_quotes')
        .select('id, data_circuit_id, carrier_name, bandwidth, quoted_monthly_price, is_selected, created_at')
        .in('data_circuit_id', circuitIds)
        .order('created_at', { ascending: true });

      (quotesRaw || []).forEach((q: any) => {
        const list = quotesByCircuit.get(q.data_circuit_id) || [];
        list.push({
          id: q.id,
          carrier_name: q.carrier_name,
          bandwidth: q.bandwidth || '1 Gig',
          quoted_monthly_price: Number(q.quoted_monthly_price || 0),
          is_selected: Boolean(q.is_selected),
          created_at: q.created_at,
        });
        quotesByCircuit.set(q.data_circuit_id, list);
      });
    }

    // 3. Format and sanitize circuit records for client (read-only view)
    const formatted = (circuitsRaw || []).map((c: any) => {
      const prop = propMap.get(c.property_id);
      const propAddress = prop?.address
        ? `${prop.address}${prop.city ? `, ${prop.city}` : ''}${prop.state ? `, ${prop.state}` : ''}`
        : '';

      return {
        id: c.id,
        property_id: c.property_id,
        property_name: prop?.name || 'Property',
        property_address: propAddress || '—',
        property_phone: prop?.main_phone || '',
        connectivity_type: c.connectivity_type || 'DATA_CIRCUITED',
        status: c.status || 'STARTED',
        carrier_name: c.carrier_name || 'Carrier Pending',
        bandwidth: c.bandwidth || '1 Gig',
        circuit_monthly_price: Number(c.circuit_monthly_price || 0),
        site_survey_status: c.site_survey_status || 'PENDING',
        site_survey_notes: c.site_survey_notes || '',
        foc_status: c.foc_status || 'PENDING_ACTIONS',
        foc_date: c.foc_date || null,
        foc_pending_actions_notes: c.foc_pending_actions_notes || '',
        technical_details: c.technical_details || '',
        agreement_file_name: c.agreement_file_name || null,
        agreement_file_url: c.agreement_file_url || null,
        agreement_file_size: c.agreement_file_size || null,
        paperwork_signed_at: c.paperwork_signed_at || null,
        quotation_sent_at: c.quotation_sent_at || null,
        installed_at: c.installed_at || null,
        quotes: quotesByCircuit.get(c.id) || [],
        created_at: c.created_at,
        updated_at: c.updated_at,
      };
    });

    const metrics = {
      totalCircuits: formatted.length,
      installedCircuits: formatted.filter((c: any) => c.status === 'INSTALLED').length,
      inProgressCircuits: formatted.filter((c: any) => c.status !== 'INSTALLED').length,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      metrics,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

