import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { getStageDateKeyForStatus, toSafeLegacyEnum } from './portingMetadata';

export async function handlePostPorting(request: NextRequest) {
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
    const numericPrice = monthly_price !== null && monthly_price !== undefined && monthly_price !== '' ? Number(monthly_price) : null;
    const requestedStatus = status || 'DRAFT';
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeStageDateKey = getStageDateKeyForStatus(requestedStatus) || 'draft_date';
    const initialStageDateVal = body[activeStageDateKey] || target_date || todayStr;

    let createdOpId: string | null = null;
    let newProp: any = null;

    // 1. ALWAYS create property record in properties table (whether organization_id is provided or unassigned!)
    const propInsertPayload: Record<string, any> = {
      name: property_name.trim(),
      address: fullAddress,
      city: finalCity,
      state: finalState,
      zip_code: finalZip,
      country: country?.trim() || 'USA',
      main_phone: property_phone.trim(),
      fax: fax ? fax.trim() : null,
      base_price: numericPrice,
      monthly_price: numericPrice,
      partner_id: partner_id || null,
      partner_commission_override:
        partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
          ? Number(partner_commission_override)
          : null,
      general_manager_name: general_manager_name ? general_manager_name.trim() : null,
      general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
      general_manager_email: general_manager_email ? general_manager_email.trim() : null,
      ray_baud_and_logs_enabled: isE911,
      status: requestedStatus === 'COMPLETED' ? 'ACTIVE' : 'ONBOARDING',
    };

    const { data: propData, error: propErr } = await db
      .from('properties')
      .insert({
        ...propInsertPayload,
        ray_baum_status: ray_baum_status || (isE911 ? 'ACTIVE' : 'INACTIVE'),
      })
      .select()
      .single();

    if (propErr) {
      // Fallback insert without optional newer columns if any column doesn't exist yet
      const { data: fallbackProp } = await db
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
          monthly_price: numericPrice,
          general_manager_name: general_manager_name ? general_manager_name.trim() : null,
          general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
          general_manager_email: general_manager_email ? general_manager_email.trim() : null,
          ray_baud_and_logs_enabled: isE911,
          status: requestedStatus === 'COMPLETED' ? 'ACTIVE' : 'ONBOARDING',
        })
        .select()
        .single();
      newProp = fallbackProp;
    } else {
      newProp = propData;
    }

    if (organization_id && newProp) {
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
          status: requestedStatus,
          target_date: target_date || initialStageDateVal,
          draft_date: body.draft_date || todayStr,
          [activeStageDateKey]: initialStageDateVal,
        };
        if (body.contract_sent_date) onboardingData.contract_sent_date = body.contract_sent_date;
        if (body.signed_date) onboardingData.signed_date = body.signed_date;
        if (body.csr_details_date) onboardingData.csr_details_date = body.csr_details_date;
        if (body.cut_sheet_review_date) onboardingData.cut_sheet_review_date = body.cut_sheet_review_date;
        if (body.porting_submitted_date) onboardingData.porting_submitted_date = body.porting_submitted_date;
        if (body.sof_review_date) onboardingData.sof_review_date = body.sof_review_date;
        if (body.foc_confirmed_date) onboardingData.foc_confirmed_date = body.foc_confirmed_date;
        if (body.live_cutover_date) onboardingData.live_cutover_date = body.live_cutover_date;
        if (body.assigned_to) onboardingData.assigned_to = body.assigned_to;
        if (body.assigned_to_name) onboardingData.assigned_to_name = body.assigned_to_name;
        if (body.internal_notes) onboardingData.internal_notes = body.internal_notes;

        const { error: obInsertErr } = await db.from('onboardings').insert(onboardingData);
        if (obInsertErr) {
          // Retry with safe legacy enum & core columns if enum/columns aren't migrated yet
          await db.from('onboardings').insert({
            organization_property_id: newOp.id,
            status: toSafeLegacyEnum(requestedStatus),
            target_date: target_date || initialStageDateVal,
          });
        }

        // 4. Create e911 record
        await db.from('e911_records').insert({
          organization_property_id: newOp.id,
          emergency_address: `${fullAddress}, ${finalCity}, ${finalState} ${finalZip}`,
          status: isE911 ? 'VERIFIED' : 'PENDING',
          verified_at: isE911 ? new Date().toISOString() : null,
        });
      }
    }

    // Build initial metadata to store in porting_requests.notes so monthly_price, stage_dates, effective_stage, and attachments are 100% persisted
    const initialMeta = {
      effective_stage: requestedStatus,
      stage_dates: {
        effective_stage: requestedStatus,
        target_date: target_date || initialStageDateVal,
        draft_date: body.draft_date || todayStr,
        [activeStageDateKey]: initialStageDateVal,
        ...(body.contract_sent_date ? { contract_sent_date: body.contract_sent_date } : {}),
        ...(body.signed_date ? { signed_date: body.signed_date } : {}),
        ...(body.csr_details_date ? { csr_details_date: body.csr_details_date } : {}),
        ...(body.cut_sheet_review_date ? { cut_sheet_review_date: body.cut_sheet_review_date } : {}),
        ...(body.porting_submitted_date ? { porting_submitted_date: body.porting_submitted_date } : {}),
        ...(body.foc_confirmed_date ? { foc_confirmed_date: body.foc_confirmed_date } : {}),
        ...(body.live_cutover_date ? { live_cutover_date: body.live_cutover_date } : {}),
      },
      stage_assignments: {
        effective_stage: requestedStatus,
        ...(body.assigned_to ? { assigned_to: body.assigned_to } : {}),
        ...(body.assigned_to_name ? { assigned_to_name: body.assigned_to_name } : {}),
        ...(body.stage_assignments ? { all_stages: body.stage_assignments } : {}),
      },
      property_details: {
        street_address: fullAddress,
        city: finalCity,
        state: finalState,
        zip_code: finalZip,
        country: country?.trim() || 'USA',
        property_phone: property_phone.trim(),
        fax: fax ? fax.trim() : null,
        monthly_price: numericPrice,
        partner_id: partner_id || null,
        partner_commission_override:
          partner_commission_override !== null && partner_commission_override !== '' && partner_commission_override !== undefined
            ? Number(partner_commission_override)
            : null,
        general_manager_name: general_manager_name ? general_manager_name.trim() : null,
        general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null,
        general_manager_email: general_manager_email ? general_manager_email.trim() : null,
        e911_status: isE911 ? 'VERIFIED' : 'AUDIT_REQUIRED',
        ray_baum_status: ray_baum_status || (isE911 ? 'ACTIVE' : 'INACTIVE'),
      },
      attachments: Array.isArray(attachments) ? attachments : [],
    };
    const metaNotesString = `<!--METADATA:${JSON.stringify(initialMeta)}-->${body.internal_notes ? `\n${body.internal_notes}` : ''}`;

    // 5. Insert porting request (with automatic fallback if status enum isn't migrated yet)
    const basePrPayload = {
      organization_id: organization_id || null,
      organization_property_id: createdOpId,
      created_by: user?.id || null,
      property_name: property_name.trim(),
      property_address: `${fullAddress}${finalCity !== 'Pending' ? `, ${finalCity}, ${finalState} ${finalZip}` : ''}`,
      property_phone: property_phone.trim(),
      fax: fax ? fax.trim() : null,
      carrier_details: carrier_details ? carrier_details.trim() : null,
      target_date: target_date || initialStageDateVal,
      notes: metaNotesString,
      is_activated: false,
    };

    let { data: newPorting, error: insertErr } = await db
      .from('porting_requests')
      .insert({
        ...basePrPayload,
        status: requestedStatus,
      })
      .select()
      .single();

    if (insertErr && insertErr.message?.includes('invalid input value for enum')) {
      const retry = await db
        .from('porting_requests')
        .insert({
          ...basePrPayload,
          status: toSafeLegacyEnum(requestedStatus),
        })
        .select()
        .single();
      newPorting = retry.data;
      insertErr = retry.error;
    }

    if (insertErr || !newPorting) {
      return NextResponse.json({ success: false, error: insertErr?.message || 'Failed to create porting request' }, { status: 400 });
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
      if (newProp?.id) {
        await db.from('properties').update({ attachments }).eq('id', newProp.id);
      }
      await db.from('porting_requests').update({ property_id: newProp?.id || null, attachments }).eq('id', newPorting.id);
    } else if (newProp?.id) {
      await db.from('porting_requests').update({ property_id: newProp.id }).eq('id', newPorting.id);
    }

    await logAuditEvent({
      action: 'PORTING_REQUEST_CREATED',
      entity_type: 'PORTING_REQUEST',
      entity_id: newPorting.id,
      entity_name: newPorting.property_name,
      changes: body,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newPorting,
        status: requestedStatus,
        stage: requestedStatus,
        monthly_price: numericPrice,
        attachments: Array.isArray(attachments) ? attachments : [],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
