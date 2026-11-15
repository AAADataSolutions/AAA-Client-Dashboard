import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import { getStageDateKeyForStatus, parseNotesMetadata, toSafeLegacyEnum } from './portingMetadata';
import { syncRelatedPortingEntities } from './syncPortingEntities';
import { handlePostPorting } from './postPorting';

export async function handlePatchPorting(request: NextRequest) {
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
      csr_details_date,
      cut_sheet_review_date,
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
      ray_baum_status,
      carrier_details,
      organization_id,
    } = body;

    if (!id) {
      const resolvedName = property_name || body.name || body.propertyName;
      const resolvedPhone = property_phone || body.main_phone || body.phone || body.propertyPhone;
      if (resolvedName) {
        // Fallback: If client sent creation payload to PATCH, route to handlePostPorting
        const dummyReq = new NextRequest(request.url, {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({
            ...body,
            property_name: resolvedName,
            property_phone: resolvedPhone || 'Pending Phone',
          }),
        });
        return handlePostPorting(dummyReq);
      }
      return NextResponse.json({ success: false, error: 'Porting Request ID is required.' }, { status: 400 });
    }

    // Fetch existing porting request first so we can merge metadata cleanly
    const { data: existingPr } = await db
      .from('porting_requests')
      .select('*, organization_property:organization_properties(id, property_id)')
      .eq('id', id)
      .maybeSingle();

    if (!existingPr) {
      return NextResponse.json({ success: false, error: 'Porting request not found.' }, { status: 404 });
    }

    const parsedMeta = parseNotesMetadata(existingPr.notes);
    const effectiveStatus =
      status !== undefined
        ? (status === 'COMPLETED' || status === 'ONBOARDED' ? 'COMPLETED' : status)
        : (parsedMeta.effective_stage || existingPr.status || 'DRAFT');

    const isCompletedOrOnboarded = effectiveStatus === 'COMPLETED' || effectiveStatus === 'ONBOARDED';
    const activeStageDateKey = getStageDateKeyForStatus(effectiveStatus);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Merge stage dates into metadata
    const mergedDates: Record<string, any> = {
      ...parsedMeta.stage_dates,
      effective_stage: effectiveStatus,
      ...(target_date !== undefined ? { target_date } : {}),
      ...(draft_date !== undefined ? { draft_date } : {}),
      ...(contract_sent_date !== undefined ? { contract_sent_date } : {}),
      ...(signed_date !== undefined ? { signed_date } : {}),
      ...(csr_details_date !== undefined ? { csr_details_date } : {}),
      ...(cut_sheet_review_date !== undefined ? { cut_sheet_review_date } : {}),
      ...(porting_submitted_date !== undefined ? { porting_submitted_date } : {}),
      ...(sof_review_date !== undefined ? { sof_review_date } : {}),
      ...(foc_confirmed_date !== undefined || foc_date !== undefined
        ? { foc_confirmed_date: foc_confirmed_date !== undefined ? foc_confirmed_date : foc_date }
        : {}),
      ...(live_cutover_date !== undefined ? { live_cutover_date } : {}),
    };

    // Ensure the active stage has a date if status changed or date was provided via target_date
    if (activeStageDateKey && !mergedDates[activeStageDateKey]) {
      mergedDates[activeStageDateKey] = target_date || mergedDates.target_date || todayStr;
    }

    const effectiveBillingStatus: string | undefined =
      body.billing_status ??
      (existingPr as any).billing_status ??
      parsedMeta.stage_assignments?.billing_status ??
      (isCompletedOrOnboarded ? 'BILLING_PENDING' : undefined);

    // Merge stage assignments into metadata
    const mergedAssignments: Record<string, any> = {
      ...parsedMeta.stage_assignments,
      effective_stage: effectiveStatus,
      ...(assigned_to !== undefined ? { assigned_to } : {}),
      ...(assigned_to_name !== undefined ? { assigned_to_name } : {}),
      ...(body.stage3_assigned_to !== undefined ? { stage3_assigned_to: body.stage3_assigned_to } : {}),
      ...(body.stage3_assigned_to_name !== undefined ? { stage3_assigned_to_name: body.stage3_assigned_to_name } : {}),
      ...(body.stage3_notes !== undefined ? { stage3_notes: body.stage3_notes } : {}),
      ...(body.stage4_assigned_to !== undefined ? { stage4_assigned_to: body.stage4_assigned_to } : {}),
      ...(body.stage4_assigned_to_name !== undefined ? { stage4_assigned_to_name: body.stage4_assigned_to_name } : {}),
      ...(body.stage4_notes !== undefined ? { stage4_notes: body.stage4_notes } : {}),
      ...(body.stage_assignments !== undefined ? { all_stages: body.stage_assignments } : {}),
      ...(effectiveBillingStatus !== undefined ? { billing_status: effectiveBillingStatus } : {}),
    };

    // Merge property details into metadata
    const mergedPropDetails: Record<string, any> = {
      ...parsedMeta.property_details,
      ...(property_address !== undefined ? { street_address: property_address.trim() } : {}),
      ...(city !== undefined ? { city: city.trim() } : {}),
      ...(state !== undefined ? { state: state.trim() } : {}),
      ...(zip_code !== undefined ? { zip_code: zip_code.trim() } : {}),
      ...(country !== undefined ? { country: country.trim() } : {}),
      ...(property_phone !== undefined ? { property_phone: property_phone.trim() } : {}),
      ...(fax !== undefined ? { fax: fax ? fax.trim() : null } : {}),
      ...(monthly_price !== undefined
        ? { monthly_price: monthly_price !== null && monthly_price !== '' ? Number(monthly_price) : null }
        : {}),
      ...(partner_id !== undefined ? { partner_id: partner_id || null } : {}),
      ...(partner_commission_override !== undefined
        ? {
            partner_commission_override:
              partner_commission_override !== null && partner_commission_override !== ''
                ? Number(partner_commission_override)
                : null,
          }
        : {}),
      ...(general_manager_name !== undefined ? { general_manager_name: general_manager_name ? general_manager_name.trim() : null } : {}),
      ...(general_manager_phone !== undefined ? { general_manager_phone: general_manager_phone ? general_manager_phone.trim() : null } : {}),
      ...(general_manager_email !== undefined ? { general_manager_email: general_manager_email ? general_manager_email.trim() : null } : {}),
      ...(e911_status !== undefined ? { e911_status } : {}),
      ...(ray_baum_status !== undefined ? { ray_baum_status } : {}),
    };

    const mergedMetaAttachments =
      attachments !== undefined && Array.isArray(attachments)
        ? attachments
        : parsedMeta.attachments;

    const userNotes =
      notes !== undefined || internal_notes !== undefined
        ? (internal_notes ?? notes ?? '')
        : parsedMeta.cleanNotes;

    const metaString = `<!--METADATA:${JSON.stringify({
      effective_stage: effectiveStatus,
      stage_dates: mergedDates,
      stage_assignments: mergedAssignments,
      property_details: mergedPropDetails,
      attachments: mergedMetaAttachments,
    })}-->`;
    const finalNotes = `${metaString}${userNotes ? `\n${userNotes}` : ''}`;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      notes: finalNotes,
    };
    if (status !== undefined) updatePayload.status = isCompletedOrOnboarded ? 'COMPLETED' : status;
    if (target_date !== undefined) updatePayload.target_date = target_date;
    if (rejection_reason !== undefined) updatePayload.rejection_reason = rejection_reason;
    if (property_name !== undefined) updatePayload.property_name = property_name.trim();
    if (property_address !== undefined) updatePayload.property_address = property_address.trim();
    if (property_phone !== undefined) updatePayload.property_phone = property_phone.trim();
    if (fax !== undefined) updatePayload.fax = fax ? fax.trim() : null;
    if (carrier_details !== undefined) updatePayload.carrier_details = carrier_details ? carrier_details.trim() : null;
    if (organization_id !== undefined) {
      updatePayload.organization_id = organization_id || null;
      if (!organization_id) {
        updatePayload.organization_property_id = null;
      }
    }
    if (isCompletedOrOnboarded) {
      updatePayload.status = 'COMPLETED';
      updatePayload.completed_at = new Date().toISOString();
      updatePayload.is_activated = true;
    }

    let { data: updated, error } = await db
      .from('porting_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*, organization_property:organization_properties(id, property_id)')
      .single();

    // If PostgreSQL enum porting_status_enum hasn't had the new stage value added yet, fallback to safe legacy enum
    if (error && error.message?.includes('invalid input value for enum')) {
      const retryPayload = {
        ...updatePayload,
        status: toSafeLegacyEnum(updatePayload.status),
      };
      const retry = await db
        .from('porting_requests')
        .update(retryPayload)
        .eq('id', id)
        .select('*, organization_property:organization_properties(id, property_id)')
        .single();
      updated = retry.data;
      error = retry.error;
    }

    if (error || !updated) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update porting request' }, { status: 400 });
    }

    await syncRelatedPortingEntities({
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
      effectiveBillingStatus,
    });

    await logAuditEvent({
      action: 'PORTING_STATUS_CHANGED',
      entity_type: 'PORTING_REQUEST',
      entity_id: id,
      entity_name: updated.property_name || 'Porting Request',
      changes: updatePayload,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        status: effectiveStatus,
        stage: effectiveStatus,
        attachments: mergedMetaAttachments,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
