import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { toSafeLegacyEnum } from './portingMetadata';

export async function syncRelatedPortingEntities(params: {
  db: any;
  supabase: any;
  id: string;
  body: Record<string, any>;
  updated: any;
  effectiveStatus: string;
  isCompletedOrOnboarded: boolean;
  todayStr: string;
  mergedDates: Record<string, any>;
  mergedPropDetails: Record<string, any>;
}) {
  const {
    db,
    supabase,
    id,
    body,
    updated,
    effectiveStatus,
    isCompletedOrOnboarded,
    todayStr,
    mergedDates,
    mergedPropDetails,
  } = params;

  const {
    status,
    target_date,
    live_cutover_date,
    completed_at,
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
    organization_id,
  } = body;

  let orgPropId = updated?.organization_property_id;
  let propId = updated?.organization_property?.property_id || updated?.property_id;

  // Fallback: If propId is not found via organization_property, look up property by name
  if (!propId) {
    const pName = (property_name?.trim() || updated?.property_name || '').trim();
    if (pName) {
      const { data: matchedProp } = await db
        .from('properties')
        .select('id')
        .ilike('name', pName)
        .maybeSingle();
      if (matchedProp) {
        propId = matchedProp.id;
      }
    }
  }

  // If porting request doesn't have an organization_property link yet, auto-create one when organization is assigned
  const effectiveOrgId = organization_id !== undefined ? organization_id : updated?.organization_id;
  if (effectiveOrgId && (!orgPropId || !propId)) {
    const isE911Initial = ray_baud_and_logs_enabled !== undefined ? Boolean(ray_baud_and_logs_enabled) : (e911_status === 'VERIFIED');
    const initPrice = monthly_price !== undefined
      ? (monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null)
      : (mergedPropDetails.monthly_price ?? null);

    if (!propId) {
      const { data: createdProp } = await db
        .from('properties')
        .insert({
          name: property_name?.trim() || updated.property_name || 'Property',
          address: property_address?.trim() || updated.property_address || 'Address pending',
          city: city?.trim() || mergedPropDetails.city || 'City',
          state: state?.trim() || mergedPropDetails.state || 'IL',
          zip_code: zip_code?.trim() || mergedPropDetails.zip_code || '00000',
          country: country?.trim() || mergedPropDetails.country || 'USA',
          main_phone: property_phone?.trim() || updated.property_phone || null,
          fax: fax ? fax.trim() : null,
          base_price: initPrice,
          monthly_price: initPrice,
          partner_id: partner_id || mergedPropDetails.partner_id || null,
          partner_commission_override:
            partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
              ? Number(partner_commission_override)
              : (mergedPropDetails.partner_commission_override ?? null),
          general_manager_name: general_manager_name ? general_manager_name.trim() : (mergedPropDetails.general_manager_name || null),
          general_manager_phone: general_manager_phone ? general_manager_phone.trim() : (mergedPropDetails.general_manager_phone || null),
          general_manager_email: general_manager_email ? general_manager_email.trim() : (mergedPropDetails.general_manager_email || null),
          ray_baud_and_logs_enabled: isE911Initial,
          status: isCompletedOrOnboarded ? 'ACTIVE' : 'ONBOARDING',
          onboarding_date: isCompletedOrOnboarded
            ? (live_cutover_date || completed_at || updated.completed_at || todayStr).slice(0, 10)
            : null,
        })
        .select('id')
        .single();

      if (createdProp) {
        propId = createdProp.id;
      }
    }

    if (propId && !orgPropId) {
      const { data: createdOp } = await db
        .from('organization_properties')
        .insert({
          organization_id: effectiveOrgId,
          property_id: propId,
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

        const obInsertPayload = {
          organization_property_id: createdOp.id,
          status: effectiveStatus,
          target_date: mergedDates.target_date || null,
          draft_date: mergedDates.draft_date || null,
          contract_sent_date: mergedDates.contract_sent_date || null,
          signed_date: mergedDates.signed_date || null,
          csr_details_date: mergedDates.csr_details_date || null,
          cut_sheet_review_date: mergedDates.cut_sheet_review_date || null,
          porting_submitted_date: mergedDates.porting_submitted_date || null,
          sof_review_date: mergedDates.sof_review_date || null,
          foc_confirmed_date: mergedDates.foc_confirmed_date || null,
          live_cutover_date: mergedDates.live_cutover_date || null,
        };

        const { error: obCreateErr } = await db.from('onboardings').insert(obInsertPayload);
        if (obCreateErr) {
          await db.from('onboardings').insert({
            organization_property_id: createdOp.id,
            status: toSafeLegacyEnum(effectiveStatus),
            target_date: mergedDates.target_date || null,
          });
        }

        await db.from('e911_records').insert({
          organization_property_id: createdOp.id,
          emergency_address: property_address?.trim() || updated.property_address || 'Address pending',
          status: isE911Initial ? 'VERIFIED' : 'PENDING',
          verified_at: isE911Initial ? new Date().toISOString() : null,
        });
      }
    }
  }

  // If propId is STILL missing (e.g. unassigned porting with no properties row yet), create it in properties table
  if (!propId) {
    const isE911Initial = ray_baud_and_logs_enabled !== undefined ? Boolean(ray_baud_and_logs_enabled) : (e911_status === 'VERIFIED');
    const initPrice = monthly_price !== undefined
      ? (monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null)
      : (mergedPropDetails.monthly_price ?? null);

    const { data: createdProp } = await db
      .from('properties')
      .insert({
        name: property_name?.trim() || updated.property_name || 'Property',
        address: property_address?.trim() || updated.property_address || 'Address pending',
        city: city?.trim() || mergedPropDetails.city || 'City',
        state: state?.trim() || mergedPropDetails.state || 'IL',
        zip_code: zip_code?.trim() || mergedPropDetails.zip_code || '00000',
        country: country?.trim() || mergedPropDetails.country || 'USA',
        main_phone: property_phone?.trim() || updated.property_phone || null,
        fax: fax ? fax.trim() : null,
        base_price: initPrice,
        monthly_price: initPrice,
        general_manager_name: general_manager_name ? general_manager_name.trim() : (mergedPropDetails.general_manager_name || null),
        general_manager_phone: general_manager_phone ? general_manager_phone.trim() : (mergedPropDetails.general_manager_phone || null),
        general_manager_email: general_manager_email ? general_manager_email.trim() : (mergedPropDetails.general_manager_email || null),
        ray_baud_and_logs_enabled: isE911Initial,
        status: isCompletedOrOnboarded ? 'ACTIVE' : 'ONBOARDING',
        onboarding_date: isCompletedOrOnboarded
          ? (live_cutover_date || completed_at || updated.completed_at || todayStr).slice(0, 10)
          : null,
      })
      .select('id')
      .single();
    if (createdProp) {
      propId = createdProp.id;
    }
  }

  // Calculate total services price currently assigned to this porting request
  const { data: prServices } = await db
    .from('porting_request_services')
    .select('service:services(price)')
    .eq('porting_request_id', id);
  const servicesTotal = (prServices || []).reduce((acc: number, item: any) => {
    const p = Number((item.service as any)?.price || 0);
    return acc + p;
  }, 0);

  // 1. Update Property table if propId exists
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
      const rawBase = (monthly_price !== null && monthly_price !== '' && monthly_price !== undefined) ? Number(monthly_price) : null;
      propUpdate.base_price = rawBase;
      propUpdate.monthly_price = rawBase !== null ? (rawBase + servicesTotal) : (servicesTotal > 0 ? servicesTotal : null);
    } else if (servicesTotal > 0) {
      const { data: curProp } = await db.from('properties').select('base_price, monthly_price').eq('id', propId).maybeSingle();
      const base = Number(curProp?.base_price ?? curProp?.monthly_price ?? 0);
      propUpdate.monthly_price = base + servicesTotal;
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

    if (body.onboarding_date !== undefined) {
      propUpdate.onboarding_date = body.onboarding_date ? String(body.onboarding_date).trim() : null;
      if (isCompletedOrOnboarded) propUpdate.status = 'ACTIVE';
    } else if (isCompletedOrOnboarded) {
      propUpdate.status = 'ACTIVE';
      const effectiveOnbDate = live_cutover_date || completed_at || updated.completed_at || todayStr;
      propUpdate.onboarding_date = effectiveOnbDate.slice(0, 10);
    }

    if (body.billing_status !== undefined) propUpdate.billing_status = body.billing_status;
    if (attachments !== undefined && Array.isArray(attachments)) propUpdate.attachments = attachments;

    const { error: propUpdErr } = await db.from('properties').update(propUpdate).eq('id', propId);
    if (propUpdErr) {
      // Fallback update with guaranteed core columns
      const corePropUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
      if (propUpdate.name !== undefined) corePropUpdate.name = propUpdate.name;
      if (propUpdate.address !== undefined) corePropUpdate.address = propUpdate.address;
      if (propUpdate.city !== undefined) corePropUpdate.city = propUpdate.city;
      if (propUpdate.state !== undefined) corePropUpdate.state = propUpdate.state;
      if (propUpdate.zip_code !== undefined) corePropUpdate.zip_code = propUpdate.zip_code;
      if (propUpdate.main_phone !== undefined) corePropUpdate.main_phone = propUpdate.main_phone;
      if (propUpdate.fax !== undefined) corePropUpdate.fax = propUpdate.fax;
      if (propUpdate.monthly_price !== undefined) corePropUpdate.monthly_price = propUpdate.monthly_price;
      if (propUpdate.status !== undefined) corePropUpdate.status = propUpdate.status;
      if (propUpdate.onboarding_date !== undefined) corePropUpdate.onboarding_date = propUpdate.onboarding_date;
      await db.from('properties').update(corePropUpdate).eq('id', propId);
    }

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
    if (organization_id) orgPropUpdate.organization_id = organization_id;
    if (isCompletedOrOnboarded) orgPropUpdate.status = 'ACTIVE';

    if (Object.keys(orgPropUpdate).length > 1) {
      await db
        .from('organization_properties')
        .update(orgPropUpdate)
        .eq('id', orgPropId);
    }
  }

  // 3. Sync onboarding table if linked (resilient to enum or missing optional column errors)
  if (orgPropId) {
    const obUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) obUpdate.status = isCompletedOrOnboarded ? 'COMPLETED' : status;
    if (target_date !== undefined) obUpdate.target_date = target_date;
    if (mergedDates.draft_date !== undefined) obUpdate.draft_date = mergedDates.draft_date;
    if (mergedDates.contract_sent_date !== undefined) obUpdate.contract_sent_date = mergedDates.contract_sent_date;
    if (mergedDates.signed_date !== undefined) obUpdate.signed_date = mergedDates.signed_date;
    if (mergedDates.csr_details_date !== undefined) obUpdate.csr_details_date = mergedDates.csr_details_date;
    if (mergedDates.cut_sheet_review_date !== undefined) obUpdate.cut_sheet_review_date = mergedDates.cut_sheet_review_date;
    if (mergedDates.porting_submitted_date !== undefined) obUpdate.porting_submitted_date = mergedDates.porting_submitted_date;
    if (mergedDates.sof_review_date !== undefined) obUpdate.sof_review_date = mergedDates.sof_review_date;
    if (mergedDates.foc_confirmed_date !== undefined) obUpdate.foc_confirmed_date = mergedDates.foc_confirmed_date;
    if (mergedDates.live_cutover_date !== undefined) obUpdate.live_cutover_date = mergedDates.live_cutover_date;
    if (assigned_to !== undefined) obUpdate.assigned_to = assigned_to;
    if (assigned_to_name !== undefined) obUpdate.assigned_to_name = assigned_to_name;
    if (internal_notes !== undefined) obUpdate.internal_notes = internal_notes;
    if (body.stage3_assigned_to !== undefined) obUpdate.stage3_assigned_to = body.stage3_assigned_to;
    if (body.stage3_assigned_to_name !== undefined) obUpdate.stage3_assigned_to_name = body.stage3_assigned_to_name;
    if (body.stage3_notes !== undefined) obUpdate.stage3_notes = body.stage3_notes;
    if (body.stage4_assigned_to !== undefined) obUpdate.stage4_assigned_to = body.stage4_assigned_to;
    if (body.stage4_assigned_to_name !== undefined) obUpdate.stage4_assigned_to_name = body.stage4_assigned_to_name;
    if (body.stage4_notes !== undefined) obUpdate.stage4_notes = body.stage4_notes;
    if (attachments !== undefined) obUpdate.attachments = attachments;
    if (body.stage_assignments !== undefined) obUpdate.stage_assignments = body.stage_assignments;
    if (body.billing_status !== undefined) obUpdate.billing_status = body.billing_status;
    if (isCompletedOrOnboarded) obUpdate.completed_at = new Date().toISOString();

    const { data: existingOb } = await db
      .from('onboardings')
      .select('id')
      .eq('organization_property_id', orgPropId)
      .maybeSingle();

    if (existingOb) {
      const { error: obErr } = await db
        .from('onboardings')
        .update(obUpdate)
        .eq('id', existingOb.id);
      if (obErr) {
        // Retry with safe legacy enum and core columns so it never blocks stage transition
        const safeObUpdate: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (status !== undefined) safeObUpdate.status = toSafeLegacyEnum(obUpdate.status);
        if (target_date !== undefined) safeObUpdate.target_date = target_date;
        if (isCompletedOrOnboarded) safeObUpdate.completed_at = new Date().toISOString();
        await db.from('onboardings').update(safeObUpdate).eq('id', existingOb.id);
      }
    } else {
      const { error: obErr } = await db
        .from('onboardings')
        .insert({
          organization_property_id: orgPropId,
          status: obUpdate.status || 'DRAFT',
          ...obUpdate,
        });
      if (obErr) {
        await db.from('onboardings').insert({
          organization_property_id: orgPropId,
          status: toSafeLegacyEnum(obUpdate.status || 'DRAFT'),
          target_date: target_date || null,
        });
      }
    }
  }

  // 4. Sync optional columns on porting_requests & porting_attachments table
  const prExtraUpdate: Record<string, any> = {};
  if (propId) prExtraUpdate.property_id = propId;
  if (body.stage_assignments !== undefined) prExtraUpdate.stage_assignments = body.stage_assignments;
  if (body.billing_status !== undefined) prExtraUpdate.billing_status = body.billing_status;
  if (attachments !== undefined && Array.isArray(attachments)) prExtraUpdate.attachments = attachments;
  if (Object.keys(prExtraUpdate).length > 0) {
    await db.from('porting_requests').update(prExtraUpdate).eq('id', id);
  }

  if (attachments !== undefined && Array.isArray(attachments)) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sync porting_attachments table: remove deleted ones and insert new ones
    const { data: existingAttRows } = await db
      .from('porting_attachments')
      .select('id, storage_path')
      .eq('porting_request_id', id);

    const keepPaths = new Set(attachments.map((a: any) => a.storage_path).filter(Boolean));
    const toDeleteIds = (existingAttRows || [])
      .filter((row: any) => row.storage_path && !keepPaths.has(row.storage_path))
      .map((row: any) => row.id);

    if (toDeleteIds.length > 0) {
      await db.from('porting_attachments').delete().in('id', toDeleteIds);
    }

    const existingPaths = new Set((existingAttRows || []).map((r: any) => r.storage_path));
    const newAtts = attachments.filter((a: any) => a.storage_path && !existingPaths.has(a.storage_path));
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
}

export async function handleDeletePorting(request: NextRequest) {
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
