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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const sortBy = searchParams.get('sortBy') || 'NEWEST';

    // 1. KPI Counts
    const { count: totalCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true });

    const { count: completedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'COMPLETED');

    const { count: inProgressCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['IN_PROGRESS', 'SUBMITTED']);

    const { count: focReceivedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FOC_RECEIVED');

    const { count: actionRequiredCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['REJECTED', 'CANCELLED', 'PENDING']);

    const { count: submittedCount } = await db
      .from('porting_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUBMITTED');

    // 2. Fetch porting requests with joined data
    let query = db
      .from('porting_requests')
      .select(`
        *,
        organization:organizations(id, name),
        organization_property:organization_properties(
          id,
          status,
          property:properties(*),
          organization:organizations(id, name),
          onboardings(
            id,
            status,
            target_date,
            draft_date,
            contract_sent_date,
            signed_date,
            porting_submitted_date,
            sof_review_date,
            foc_confirmed_date,
            live_cutover_date,
            assigned_to,
            assigned_to_name,
            internal_notes,
            attachments
          )
        ),
        attachments:porting_attachments(
          id, file_name, file_size, mime_type, storage_path, created_at
        ),
        services:porting_request_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        )
      `, { count: 'exact' });

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTION_REQUIRED') {
        query = query.in('status', ['REJECTED', 'CANCELLED', 'PENDING']);
      } else if (statusFilter === 'IN_PROGRESS_ALL') {
        query = query.in('status', ['IN_PROGRESS', 'SUBMITTED', 'DRAFT', 'CONTRACT_SENT', 'SIGNED', 'CUT_SHEET_REVIEW', 'CUT_SHEET', 'PORTING_SUBMITTED', 'SOF_WAITING']);
      } else {
        query = query.eq('status', statusFilter);
      }
    }

    const { data: rawPortings, error } = await query;

    if (error) {
      // Fallback simple query
      const { data: fallbackList, error: fErr } = await db
        .from('porting_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fErr) {
        return NextResponse.json({ success: false, error: fErr.message }, { status: 400 });
      }

      const totalSimple = fallbackList?.length || 0;
      const paginated = (fallbackList || []).slice((page - 1) * limit, page * limit);

      return NextResponse.json({
        success: true,
        data: paginated.map((item: any) => ({
          ...item,
          property_name: item.property_name || 'Property',
          property_address: item.property_address || '',
          property_phone: item.property_phone || '',
          organization_name: 'Organization',
          is_activated: item.is_activated || false,
          attachments: [],
          services: [],
          services_count: 0,
        })),
        pagination: {
          totalCount: totalSimple,
          totalPages: Math.ceil(totalSimple / limit) || 1,
          currentPage: page,
          pageSize: limit,
        },
        metrics: {
          totalRequests: totalCount || totalSimple,
          inProgressCount: inProgressCount || 0,
          focReceivedCount: focReceivedCount || 0,
          completedCount: completedCount || 0,
          actionRequiredCount: actionRequiredCount || 0,
          submittedCount: submittedCount || 0,
        },
      });
    }

    // 3. Map and format records
    let formatted = (rawPortings || []).map((item: any) => {
      const orgProp = item.organization_property;
      const prop = Array.isArray(orgProp?.property) ? orgProp?.property[0] : orgProp?.property;
      const directOrg = Array.isArray(item.organization) ? item.organization[0] : item.organization;
      const org = directOrg || (Array.isArray(orgProp?.organization) ? orgProp?.organization[0] : orgProp?.organization);
      const ob = Array.isArray(orgProp?.onboardings) ? orgProp?.onboardings[0] : orgProp?.onboardings;

      const services = (item.services || []).map((s: any) => {
        const svc = s.service || s;
        return {
          id: svc?.id || s.id,
          phone_number: svc?.phone_number || '—',
          status: svc?.status || 'ACTIVE',
          description: svc?.description || '',
          service_type: svc?.service_type?.name || svc?.service_type || 'Voice Line',
        };
      });

      const effectiveStatus = item.status || ob?.status || 'DRAFT';
      let progressPct = 14;
      switch (effectiveStatus) {
        case 'DRAFT': progressPct = 14; break;
        case 'CONTRACT_SENT': progressPct = 28; break;
        case 'SIGNED': progressPct = 42; break;
        case 'CUT_SHEET_REVIEW':
        case 'SOF_WAITING':
        case 'CUT_SHEET': progressPct = 57; break;
        case 'PORTING_SUBMITTED':
        case 'SUBMITTED':
        case 'IN_PROGRESS': progressPct = 71; break;
        case 'FOC_RECEIVED': progressPct = 85; break;
        case 'COMPLETED': progressPct = 100; break;
        default: progressPct = 14;
      }

      // Merge porting attachments & onboarding attachments
      const rawAtts = item.attachments || [];
      const obAtts = Array.isArray(ob?.attachments) ? ob.attachments : [];
      const mergedAtts = [...rawAtts];
      obAtts.forEach((oa: any) => {
        if (!mergedAtts.some((a: any) => a.storage_path === oa.storage_path || (a.id && a.id === oa.id))) {
          mergedAtts.push(oa);
        }
      });

      return {
        id: item.id,
        org_property_id: item.organization_property_id,
        onboarding_id: ob?.id || null,
        property_id: prop?.id || '',
        property_name: item.property_name || prop?.name || 'New Property',
        property_address: item.property_address || (prop?.address
          ? `${prop.address}, ${prop.city || ''}, ${prop.state || ''} ${prop.zip_code || ''}`.trim()
          : 'Address pending'),
        partner_id: prop?.partner_id || null,
        partner_commission_override: prop?.partner_commission_override ?? null,
        property_phone: item.property_phone || prop?.main_phone || '—',
        fax: item.fax || prop?.fax || '—',
        monthly_price: prop?.monthly_price || null,
        general_manager_name: prop?.general_manager_name || prop?.contact_person_name || 'N/A',
        general_manager_phone: prop?.general_manager_phone || prop?.main_phone || 'N/A',
        general_manager_email: prop?.general_manager_email || prop?.contact_person_email || 'N/A',
        city: prop?.city || '',
        state: prop?.state || '',
        zip_code: prop?.zip_code || '',
        country: prop?.country || 'USA',
        e911_status: (prop?.ray_baud_and_logs_enabled || prop?.status === 'ACTIVE') ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baud_and_logs_enabled: prop?.ray_baud_and_logs_enabled ?? false,
        ray_baum_status: prop?.ray_baum_status || (prop?.ray_baud_and_logs_enabled ? 'ACTIVE' : 'INACTIVE'),
        carrier_details: item.carrier_details || '',
        organization_id: org?.id || item.organization_id || '',
        organization_name: org?.name || 'Organization',
        status: effectiveStatus,
        stage: effectiveStatus,
        progress_pct: progressPct,
        target_date: item.target_date || ob?.target_date || null,
        draft_date: ob?.draft_date || null,
        contract_sent_date: ob?.contract_sent_date || null,
        signed_date: ob?.signed_date || null,
        porting_submitted_date: ob?.porting_submitted_date || null,
        sof_review_date: ob?.sof_review_date || null,
        foc_confirmed_date: ob?.foc_confirmed_date || null,
        live_cutover_date: ob?.live_cutover_date || null,
        assigned_to: ob?.assigned_to || null,
        assigned_to_name: ob?.assigned_to_name || null,
        internal_notes: ob?.internal_notes || item.notes || null,
        foc_date: item.foc_date,
        completed_at: item.completed_at,
        rejection_reason: item.rejection_reason,
        notes: item.notes || ob?.internal_notes || null,
        is_activated: item.is_activated || false,
        attachments: mergedAtts,
        services_count: services.length,
        services: services,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at,
      };
    });

    // 4. Search filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      formatted = formatted.filter(
        (p: any) =>
          p.property_name.toLowerCase().includes(lowerSearch) ||
          p.organization_name.toLowerCase().includes(lowerSearch) ||
          p.property_phone.toLowerCase().includes(lowerSearch) ||
          (p.notes && p.notes.toLowerCase().includes(lowerSearch))
      );
    }

    // 5. Sorting
    formatted.sort((a: any, b: any) => {
      if (sortBy === 'OLDEST') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'PROPERTY_ASC') return a.property_name.localeCompare(b.property_name);
      if (sortBy === 'ORG_ASC') return a.organization_name.localeCompare(b.organization_name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const totalCountFiltered = formatted.length;
    const paginated = formatted.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        totalCount: totalCountFiltered,
        totalPages: Math.ceil(totalCountFiltered / limit) || 1,
        currentPage: page,
        pageSize: limit,
      },
      metrics: {
        totalRequests: totalCount || totalCountFiltered,
        inProgressCount: inProgressCount || 0,
        focReceivedCount: focReceivedCount || 0,
        completedCount: completedCount || 0,
        actionRequiredCount: actionRequiredCount || 0,
        submittedCount: submittedCount || 0,
      },
    });
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
    const {
      organization_id,
      property_name,
      property_address,
      city,
      state,
      zip_code,
      country,
      property_phone,
      fax,
      monthly_price,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      partner_id,
      partner_commission_override,
      e911_status,
      ray_baud_and_logs_enabled,
      ray_baum_status,
      target_date,
      carrier_details,
      status,
      attachments,
    } = body;

    if (!property_name?.trim() || !property_phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Property Name and Phone Number are required.' },
        { status: 400 }
      );
    }

    const isE911 = ray_baud_and_logs_enabled !== undefined
      ? Boolean(ray_baud_and_logs_enabled)
      : (e911_status === 'VERIFIED');

    const fullAddress = property_address?.trim() || 'Address Pending';
    const finalCity = city?.trim() || 'Pending';
    const finalState = state?.trim() || 'Pending';
    const finalZip = zip_code?.trim() || '00000';

    // 1. Create property record in properties table with all details
    const { data: newProp, error: propErr } = await db
      .from('properties')
      .insert({
        name: property_name.trim(),
        address: fullAddress,
        city: finalCity,
        state: finalState,
        zip_code: finalZip,
        country: country?.trim() || 'USA',
        main_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        monthly_price: monthly_price ? Number(monthly_price) : null,
        partner_id: partner_id || null,
        partner_commission_override: partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined ? Number(partner_commission_override) : null,
        general_manager_name: general_manager_name ? general_manager_name.trim() : null,
        general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
        general_manager_email: general_manager_email ? general_manager_email.trim() : null,
        ray_baud_and_logs_enabled: isE911,
        ray_baum_status: ray_baum_status || (isE911 ? 'ACTIVE' : 'INACTIVE'),
        status: 'ONBOARDING',
      })
      .select()
      .single();

    let createdOpId: string | null = null;
    if (newProp && organization_id) {
      // 2. Link in organization_properties
      const { data: newOp } = await db
        .from('organization_properties')
        .insert({
          organization_id,
          property_id: newProp.id,
          status: 'ACTIVE',
        })
        .select('id')
        .single();

      if (newOp) {
        createdOpId = newOp.id;

    // 3. Create initial onboarding record with initial stage and dates
        const onboardingData: Record<string, any> = {
          organization_property_id: newOp.id,
          status: status || 'DRAFT',
          target_date: target_date || null,
        };
        if (body.draft_date) onboardingData.draft_date = body.draft_date;
        if (body.contract_sent_date) onboardingData.contract_sent_date = body.contract_sent_date;
        if (body.signed_date) onboardingData.signed_date = body.signed_date;
        if (body.porting_submitted_date) onboardingData.porting_submitted_date = body.porting_submitted_date;
        if (body.sof_review_date) onboardingData.sof_review_date = body.sof_review_date;
        if (body.foc_confirmed_date) onboardingData.foc_confirmed_date = body.foc_confirmed_date;
        if (body.live_cutover_date) onboardingData.live_cutover_date = body.live_cutover_date;
        if (body.assigned_to) onboardingData.assigned_to = body.assigned_to;
        if (body.assigned_to_name) onboardingData.assigned_to_name = body.assigned_to_name;
        if (body.internal_notes) onboardingData.internal_notes = body.internal_notes;

        await db.from('onboardings').insert(onboardingData);

        // 4. Create e911 record
        await db.from('e911_records').insert({
          organization_property_id: newOp.id,
          emergency_address: `${fullAddress}, ${finalCity}, ${finalState} ${finalZip}`,
          status: isE911 ? 'VERIFIED' : 'PENDING',
          verified_at: isE911 ? new Date().toISOString() : null,
        });
      }
    }

    // 5. Insert porting request
    const { data: newPorting, error: insertErr } = await db
      .from('porting_requests')
      .insert({
        organization_id: organization_id || null,
        organization_property_id: createdOpId,
        created_by: user?.id || null,
        property_name: property_name.trim(),
        property_address: `${fullAddress}${finalCity !== 'Pending' ? `, ${finalCity}, ${finalState} ${finalZip}` : ''}`,
        property_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        carrier_details: carrier_details ? carrier_details.trim() : null,
        target_date: target_date || null,
        status: status || 'DRAFT',
        is_activated: false,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 400 });
    }

    // 6. Insert attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attRows = attachments.map((att: any) => ({
        porting_request_id: newPorting.id,
        uploaded_by: user?.id || null,
        file_name: att.file_name,
        file_size: att.file_size || 0,
        mime_type: att.mime_type || 'application/pdf',
        storage_path: att.storage_path,
      }));

      await db.from('porting_attachments').insert(attRows);
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_CREATED',
      entity_type: 'PORTING_REQUEST',
      entity_id: newPorting.id,
      entity_name: newPorting.property_name,
      changes: body,
    });

    return NextResponse.json({ success: true, data: newPorting });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const body = await request.json();
    const {
      id,
      status,
      foc_date,
      target_date,
      rejection_reason,
      notes,
      draft_date,
      contract_sent_date,
      signed_date,
      porting_submitted_date,
      sof_review_date,
      foc_confirmed_date,
      live_cutover_date,
      assigned_to,
      assigned_to_name,
      internal_notes,
      attachments,
      property_name,
      property_address,
      city,
      state,
      zip_code,
      country,
      property_phone,
      fax,
      monthly_price,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      partner_id,
      partner_commission_override,
      e911_status,
      ray_baud_and_logs_enabled,
      ray_baum_status,
      carrier_details,
      organization_id,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updatePayload.status = status;
    if (foc_date !== undefined) updatePayload.foc_date = foc_date;
    if (target_date !== undefined) updatePayload.target_date = target_date;
    if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
    if (notes !== undefined || internal_notes !== undefined) {
      updatePayload.notes = internal_notes || notes;
    }
    if (property_name !== undefined) updatePayload.property_name = property_name.trim();
    if (property_address !== undefined) updatePayload.property_address = property_address.trim();
    if (property_phone !== undefined) updatePayload.property_phone = property_phone.trim();
    if (fax !== undefined) updatePayload.fax = fax ? fax.trim() : null;
    if (carrier_details !== undefined) updatePayload.carrier_details = carrier_details ? carrier_details.trim() : null;
    if (organization_id !== undefined) updatePayload.organization_id = organization_id || null;
    if (status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.is_activated = true;
    }

    const { data: updated, error } = await db
      .from('porting_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*, organization_property:organization_properties(id, property_id)')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    let orgPropId = updated?.organization_property_id;
    let propId = updated?.organization_property?.property_id;

    // If porting request doesn't have an organization_property link yet, auto-create one
    if (!orgPropId || !propId) {
      const targetOrgId = organization_id || updated?.organization_id;
      if (targetOrgId) {
        const isE911Initial = ray_baud_and_logs_enabled !== undefined ? Boolean(ray_baud_and_logs_enabled) : (e911_status === 'VERIFIED');
        const { data: createdProp } = await db
          .from('properties')
          .insert({
            name: property_name?.trim() || updated.property_name || 'Property',
            address: property_address?.trim() || updated.property_address || 'Address pending',
            city: city?.trim() || 'City',
            state: state?.trim() || 'IL',
            zip_code: zip_code?.trim() || '00000',
            country: country?.trim() || 'USA',
            main_phone: property_phone?.trim() || updated.property_phone || null,
            fax: fax ? fax.trim() : null,
            monthly_price: monthly_price ? Number(monthly_price) : null,
            partner_id: partner_id || null,
            partner_commission_override: partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined ? Number(partner_commission_override) : null,
            general_manager_name: general_manager_name ? general_manager_name.trim() : null,
            general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
            general_manager_email: general_manager_email ? general_manager_email.trim() : null,
            ray_baud_and_logs_enabled: isE911Initial,
            ray_baum_status: ray_baum_status || (isE911Initial ? 'ACTIVE' : 'INACTIVE'),
            status: status === 'COMPLETED' ? 'ACTIVE' : 'ONBOARDING',
          })
          .select('id')
          .single();

        if (createdProp) {
          propId = createdProp.id;
          const { data: createdOp } = await db
            .from('organization_properties')
            .insert({
              organization_id: targetOrgId,
              property_id: createdProp.id,
              status: 'ACTIVE',
            })
            .select('id')
            .single();

          if (createdOp) {
            orgPropId = createdOp.id;
            await db
              .from('porting_requests')
              .update({ organization_property_id: createdOp.id })
              .eq('id', id);

            await db.from('onboardings').insert({
              organization_property_id: createdOp.id,
              status: status || updated.status || 'DRAFT',
              target_date: target_date || null,
            });

            await db.from('e911_records').insert({
              organization_property_id: createdOp.id,
              emergency_address: property_address?.trim() || updated.property_address || 'Address pending',
              status: isE911Initial ? 'VERIFIED' : 'PENDING',
              verified_at: isE911Initial ? new Date().toISOString() : null,
            });
          }
        }
      }
    }

    // 1. Update Property table if property fields were passed
    if (propId) {
      const propUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (property_name !== undefined) propUpdate.name = property_name.trim();
      if (property_address !== undefined) propUpdate.address = property_address.trim();
      if (city !== undefined) propUpdate.city = city.trim();
      if (state !== undefined) propUpdate.state = state.trim();
      if (zip_code !== undefined) propUpdate.zip_code = zip_code.trim();
      if (country !== undefined) propUpdate.country = country.trim();
      if (property_phone !== undefined) propUpdate.main_phone = property_phone.trim();
      if (fax !== undefined) propUpdate.fax = fax ? fax.trim() : null;
      if (monthly_price !== undefined) {
        propUpdate.monthly_price = (monthly_price !== null && monthly_price !== '' && monthly_price !== undefined) ? Number(monthly_price) : null;
      }
      if (partner_id !== undefined) propUpdate.partner_id = partner_id || null;
      if (partner_commission_override !== undefined) {
        propUpdate.partner_commission_override =
          partner_commission_override !== null && partner_commission_override !== ''
            ? Number(partner_commission_override)
            : null;
      }
      if (general_manager_name !== undefined) propUpdate.general_manager_name = general_manager_name ? general_manager_name.trim() : null;
      if (general_manager_phone !== undefined) propUpdate.general_manager_phone = general_manager_phone ? general_manager_phone.trim() : null;
      if (general_manager_email !== undefined) propUpdate.general_manager_email = general_manager_email ? general_manager_email.trim() : null;

      const isE911 = ray_baud_and_logs_enabled !== undefined
        ? Boolean(ray_baud_and_logs_enabled)
        : (e911_status === 'VERIFIED');
      if (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined) {
        propUpdate.ray_baud_and_logs_enabled = isE911;
      }
      if (ray_baum_status !== undefined) {
        propUpdate.ray_baum_status = ray_baum_status;
      } else if (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined) {
        propUpdate.ray_baum_status = isE911 ? 'ACTIVE' : 'INACTIVE';
      }

      if (status === 'COMPLETED') propUpdate.status = 'ACTIVE';

      await db.from('properties').update(propUpdate).eq('id', propId);

      // Sync e911_records if orgPropId exists
      if (orgPropId && (ray_baud_and_logs_enabled !== undefined || e911_status !== undefined)) {
        await db
          .from('e911_records')
          .update({
            status: isE911 ? 'VERIFIED' : 'PENDING',
            verified_at: isE911 ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_property_id', orgPropId);
      }
    }

    // 2. Sync organization_properties if linked
    if (orgPropId) {
      const orgPropUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (organization_id !== undefined) orgPropUpdate.organization_id = organization_id || null;
      if (status === 'COMPLETED') orgPropUpdate.status = 'ACTIVE';

      if (Object.keys(orgPropUpdate).length > 1) {
        await db
          .from('organization_properties')
          .update(orgPropUpdate)
          .eq('id', orgPropId);
      }
    }

    // 3. Sync onboarding table if linked
    if (orgPropId) {
      const obUpdate: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (status !== undefined) obUpdate.status = status;
      if (target_date !== undefined) obUpdate.target_date = target_date;
      if (draft_date !== undefined) obUpdate.draft_date = draft_date;
      if (contract_sent_date !== undefined) obUpdate.contract_sent_date = contract_sent_date;
      if (signed_date !== undefined) obUpdate.signed_date = signed_date;
      if (porting_submitted_date !== undefined) obUpdate.porting_submitted_date = porting_submitted_date;
      if (sof_review_date !== undefined) obUpdate.sof_review_date = sof_review_date;
      if (foc_confirmed_date !== undefined) obUpdate.foc_confirmed_date = foc_confirmed_date;
      if (live_cutover_date !== undefined) obUpdate.live_cutover_date = live_cutover_date;
      if (assigned_to !== undefined) obUpdate.assigned_to = assigned_to;
      if (assigned_to_name !== undefined) obUpdate.assigned_to_name = assigned_to_name;
      if (internal_notes !== undefined) obUpdate.internal_notes = internal_notes;
      if (attachments !== undefined) obUpdate.attachments = attachments;
      if (status === 'COMPLETED') obUpdate.completed_at = new Date().toISOString();

      await db
        .from('onboardings')
        .update(obUpdate)
        .eq('organization_property_id', orgPropId);
    }

    // 4. Insert new attachments into porting_attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newAtts = attachments.filter((a: any) => !a.id);
      if (newAtts.length > 0) {
        const attRows = newAtts.map((att: any) => ({
          porting_request_id: id,
          uploaded_by: user?.id || null,
          file_name: att.file_name,
          file_size: att.file_size || 0,
          mime_type: att.mime_type || 'application/pdf',
          storage_path: att.storage_path,
        }));
        await db.from('porting_attachments').insert(attRows);
      }
    }

    await logAuditEvent({
      action: 'PORTING_STATUS_CHANGED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: updated.property_name || 'Porting Request',
      changes: updatePayload,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
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
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    const { error } = await db.from('porting_requests').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_DELETED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: `Porting Request ${id}`,
      changes: { id },
    });

    return NextResponse.json({ success: true, message: 'Porting request deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
