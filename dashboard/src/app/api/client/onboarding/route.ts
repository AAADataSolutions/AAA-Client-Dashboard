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

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { total: 0, active: 0, completed: 0, waitingSignoff: 0 },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q')?.toLowerCase() || '';
    const statusFilter = searchParams.get('status') || 'ALL';

    // Get organization_properties for tenant
    const { data: orgProps } = await supabase
      .from('organization_properties')
      .select(`
        id,
        property:properties(id, name, address, city, state, zip_code, main_phone, contact_person_name, general_manager_name),
        services:organization_property_services(id, service:services(id, phone_number, status, service_type_id, service_type:service_types(name)))
      `)
      .eq('organization_id', member.organization_id);

    const orgPropIds = (orgProps || []).map((op) => op.id);

    if (orgPropIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metrics: { total: 0, inProgress: 0, waitingOnClient: 0, completed: 0 },
      });
    }

    const { data: onbRecords, error } = await supabase
      .from('onboardings')
      .select(`
        *,
        organization_property:organization_properties(
          id,
          property:properties(id, name, address, city, state, zip_code, main_phone, contact_person_name, general_manager_name),
          services:organization_property_services(id, service:services(id, phone_number, status, service_type_id, service_type:service_types(name)))
        )
      `)
      .in('organization_property_id', orgPropIds)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    const stageWeights: Record<string, { percent: number; stepIndex: number; label: string; waitingClient: boolean }> = {
      DRAFT: { percent: 12.5, stepIndex: 1, label: 'Draft', waitingClient: false },
      CONTRACT_SENT: { percent: 25, stepIndex: 2, label: 'Contract Sent', waitingClient: true },
      SIGNED: { percent: 37.5, stepIndex: 3, label: 'Contract Signed', waitingClient: false },
      PORTING_WAITING: { percent: 50, stepIndex: 4, label: 'Porting Waiting', waitingClient: false },
      PORTING_SUBMITTED: { percent: 62.5, stepIndex: 5, label: 'Porting Submitted', waitingClient: false },
      SOF_WAITING: { percent: 75, stepIndex: 6, label: 'SOF Waiting', waitingClient: true },
      FOC_RECEIVED: { percent: 87.5, stepIndex: 7, label: 'FOC Received', waitingClient: false },
      COMPLETED: { percent: 100, stepIndex: 8, label: 'Completed', waitingClient: false },
    };

    const allOnboardings = (onbRecords || []).map((item: any) => {
      const op = item.organization_property;
      const prop = op?.property;
      const services = (op?.services || []).map((s: any) => s.service).filter(Boolean);
      const stageInfo = stageWeights[item.status] || { percent: 12.5, stepIndex: 1, label: item.status, waitingClient: false };

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        property_id: prop?.id,
        property_name: prop?.name || 'Property Location',
        property_address: prop?.address || '',
        property_location: prop ? `${prop.city}, ${prop.state}` : '',
        property_phone: prop?.main_phone || '',
        contact_person_name: prop?.contact_person_name || prop?.general_manager_name || '—',
        services: services,
        services_count: services.length,
        status: item.status,
        stage_label: stageInfo.label,
        step_index: stageInfo.stepIndex,
        is_waiting_on_client: stageInfo.waitingClient,
        target_date: item.target_date,
        progress_percentage: stageInfo.percent,
        milestones: {
          contract_sent_at: item.contract_sent_at,
          signed_at: item.signed_at,
          porting_waiting_at: item.porting_waiting_at,
          porting_submitted_at: item.porting_submitted_at,
          sof_waiting_at: item.sof_waiting_at,
          foc_received_at: item.foc_received_at,
          completed_at: item.completed_at,
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
    });

    const total = allOnboardings.length;
    const completed = allOnboardings.filter((o) => o.status === 'COMPLETED').length;
    const inProgress = allOnboardings.filter((o) => o.status !== 'COMPLETED').length;
    const waitingOnClient = allOnboardings.filter(
      (o) => o.is_waiting_on_client || o.status === 'CONTRACT_SENT' || o.status === 'SOF_WAITING'
    ).length;

    let filtered = allOnboardings;
    if (search) {
      filtered = filtered.filter(
        (o) =>
          o.property_name.toLowerCase().includes(search) ||
          o.property_location.toLowerCase().includes(search) ||
          o.property_address.toLowerCase().includes(search) ||
          o.stage_label.toLowerCase().includes(search)
      );
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_PROGRESS') {
        filtered = filtered.filter((o) => o.status !== 'COMPLETED');
      } else if (statusFilter === 'WAITING_ON_CLIENT') {
        filtered = filtered.filter((o) => o.is_waiting_on_client || o.status === 'CONTRACT_SENT' || o.status === 'SOF_WAITING');
      } else {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      metrics: {
        total,
        inProgress,
        waitingOnClient,
        completed,
      },
    });
  } catch (err: any) {
    console.error('Client Onboarding API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch onboarding tracker' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'Organization tenant not found for this user' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      mode,
      property_id,
      name,
      address,
      city,
      state,
      zip_code,
      country = 'USA',
      main_phone,
      fax,
      contact_person_name,
      contact_person_email,
      general_manager_name,
      target_date,
      notes,
    } = body;

    // 1. Attempt Atomic RPC execution first (bypasses RLS issues via SECURITY DEFINER)
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('client_start_onboarding', {
      p_mode: mode,
      p_property_id: property_id || null,
      p_name: name?.trim() || null,
      p_address: address?.trim() || null,
      p_city: city?.trim() || null,
      p_state: state?.trim() || null,
      p_zip_code: zip_code?.trim() || null,
      p_country: country?.trim() || 'USA',
      p_main_phone: main_phone?.trim() || null,
      p_fax: fax?.trim() || null,
      p_contact_person_name: contact_person_name?.trim() || null,
      p_contact_person_email: contact_person_email?.trim() || null,
      p_general_manager_name: general_manager_name?.trim() || null,
      p_target_date: target_date || null,
      p_notes: notes?.trim() || null,
    });

    if (!rpcErr && rpcResult) {
      return NextResponse.json({
        success: true,
        data: rpcResult,
        message: 'Onboarding request submitted successfully with status DRAFT.',
      });
    }

    if (rpcErr && !rpcErr.message.includes('function') && !rpcErr.message.includes('not found')) {
      // Meaningful business logic error from RPC
      return NextResponse.json({ success: false, error: rpcErr.message }, { status: 400 });
    }

    // 2. Direct Fallback if RPC is not installed
    const dbClient = createAdminClient() || supabase;
    let propertyIdToUse: string;
    let orgPropertyId: string;

    if (mode === 'EXISTING_PROPERTY') {
      propertyIdToUse = property_id;
      if (!propertyIdToUse) {
        return NextResponse.json(
          { success: false, error: 'Please select a valid property from the catalog.' },
          { status: 400 }
        );
      }

      // Check if property exists
      const { data: prop, error: propErr } = await dbClient
        .from('properties')
        .select('id, name, address, city, state, zip_code')
        .eq('id', propertyIdToUse)
        .single();

      if (propErr || !prop) {
        return NextResponse.json(
          { success: false, error: 'Selected property could not be found.' },
          { status: 404 }
        );
      }

      // Check or create organization_properties link
      const { data: existingLink } = await dbClient
        .from('organization_properties')
        .select('id, status, onboardings(id, status)')
        .eq('organization_id', member.organization_id)
        .eq('property_id', propertyIdToUse)
        .maybeSingle();

      if (existingLink) {
        orgPropertyId = existingLink.id;

        // Check if an active onboarding is already in progress
        const activeOnb = Array.isArray(existingLink.onboardings)
          ? existingLink.onboardings.find((o: any) => o.status !== 'COMPLETED')
          : null;

        if (activeOnb) {
          return NextResponse.json(
            {
              success: false,
              error: `An onboarding process is already in progress for ${prop.name} (Status: ${activeOnb.status}).`,
            },
            { status: 400 }
          );
        }

        // Update organization_properties status if needed
        await dbClient
          .from('organization_properties')
          .update({ status: 'ONBOARDING' })
          .eq('id', orgPropertyId);
      } else {
        // Create link
        const { data: newLink, error: linkErr } = await dbClient
          .from('organization_properties')
          .insert({
            organization_id: member.organization_id,
            property_id: propertyIdToUse,
            status: 'ONBOARDING',
          })
          .select('id')
          .single();

        if (linkErr || !newLink) {
          return NextResponse.json(
            { success: false, error: linkErr?.message || 'Failed to link property to organization' },
            { status: 400 }
          );
        }
        orgPropertyId = newLink.id;
      }
    } else if (mode === 'NEW_PROPERTY') {
      // Case 2: New property to be created
      const {
        name: propName,
        address: propAddress,
        city: propCity,
        state: propState,
        zip_code: propZip,
        country: propCountry = 'USA',
        main_phone: propPhone,
        fax: propFax,
        contact_person_name: propContactName,
        contact_person_email: propContactEmail,
        general_manager_name: propGM,
      } = body;

      if (!propName?.trim() || !propAddress?.trim() || !propCity?.trim() || !propState?.trim() || !propZip?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Property name, address, city, state, and ZIP code are required.' },
          { status: 400 }
        );
      }

      // Insert new property
      const { data: newProp, error: createPropErr } = await dbClient
        .from('properties')
        .insert({
          name: propName.trim(),
          address: propAddress.trim(),
          city: propCity.trim(),
          state: propState.trim(),
          zip_code: propZip.trim(),
          country: propCountry?.trim() || 'USA',
          main_phone: propPhone?.trim() || null,
          fax: propFax?.trim() || null,
          contact_person_name: propContactName?.trim() || null,
          contact_person_email: propContactEmail?.trim() || null,
          general_manager_name: propGM?.trim() || null,
          status: 'ONBOARDING',
          ray_baud_and_logs_enabled: false,
        })
        .select('id')
        .single();

      if (createPropErr || !newProp) {
        return NextResponse.json(
          { success: false, error: createPropErr?.message || 'Failed to create new property record' },
          { status: 400 }
        );
      }

      propertyIdToUse = newProp.id;

      // Create organization_properties link
      const { data: newLink, error: linkErr } = await dbClient
        .from('organization_properties')
        .insert({
          organization_id: member.organization_id,
          property_id: propertyIdToUse,
          status: 'ONBOARDING',
        })
        .select('id')
        .single();

      if (linkErr || !newLink) {
        return NextResponse.json(
          { success: false, error: linkErr?.message || 'Failed to link property to organization' },
          { status: 400 }
        );
      }

      orgPropertyId = newLink.id;

      // Create initial e911 placeholder record
      await dbClient.from('e911_records').insert({
        organization_property_id: orgPropertyId,
        emergency_address: `${propAddress.trim()}, ${propCity.trim()}, ${propState.trim()} ${propZip.trim()}`,
        status: 'PENDING',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid mode. Must be EXISTING_PROPERTY or NEW_PROPERTY.' },
        { status: 400 }
      );
    }

    // Insert new onboarding record starting at DRAFT
    const { data: newOnboarding, error: onbErr } = await dbClient
      .from('onboardings')
      .insert({
        organization_property_id: orgPropertyId,
        status: 'DRAFT',
        target_date: target_date || null,
      })
      .select('*')
      .single();

    if (onbErr || !newOnboarding) {
      return NextResponse.json(
        { success: false, error: onbErr?.message || 'Failed to create onboarding record' },
        { status: 400 }
      );
    }

    // Optionally create an audit log or ticket comment
    return NextResponse.json({
      success: true,
      data: newOnboarding,
      message: 'Onboarding request submitted successfully with status DRAFT.',
    });
  } catch (err: any) {
    console.error('Client Start Onboarding API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initiate onboarding request' },
      { status: 500 }
    );
  }
}

