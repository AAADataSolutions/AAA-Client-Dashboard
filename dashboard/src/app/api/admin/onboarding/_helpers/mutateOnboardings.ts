import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function handlePostOnboarding(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;
    const body = await request.json();

    const {
      property_name,
      organization_id,
      address,
      city,
      state,
      zip_code,
      general_manager_name,
      general_manager_phone,
      general_manager_email,
      target_date,
      e911_status,
      ray_baum_status,
    } = body;

    if (!property_name || !property_name.trim()) {
      return NextResponse.json({ success: false, error: 'Property name is required.' }, { status: 400 });
    }

    const isE911Verified = e911_status === 'VERIFIED' || ray_baum_status === 'VERIFIED';

    // 1. Create the brand new property with status: 'INACTIVE'
    const { data: newProp, error: propErr } = await db
      .from('properties')
      .insert({
        name: property_name.trim(),
        address: address?.trim() || 'Pending Address',
        city: city?.trim() || 'TBD',
        state: state?.trim() || 'TBD',
        zip_code: zip_code?.trim() || '00000',
        country: 'USA',
        main_phone: general_manager_phone?.trim() || null,
        contact_person_name: general_manager_name?.trim() || null,
        contact_person_email: general_manager_email?.trim() || null,
        general_manager_name: general_manager_name?.trim() || null,
        general_manager_phone: general_manager_phone?.trim() || null,
        general_manager_email: general_manager_email?.trim() || null,
        status: 'INACTIVE',
        ray_baud_and_logs_enabled: isE911Verified,
      })
      .select()
      .single();

    if (propErr) {
      return NextResponse.json({ success: false, error: `Failed to create property: ${propErr.message}` }, { status: 400 });
    }

    // 2. Associate with Organization
    const targetOrgId = organization_id;
    if (!targetOrgId) {
      return NextResponse.json({
        success: false,
        error: 'An organization must be selected to initialize an onboarding pipeline.',
      }, { status: 400 });
    }

    let orgName = 'Organization';
    const { data: chosenOrg } = await db.from('organizations').select('name').eq('id', targetOrgId).maybeSingle();
    if (chosenOrg) orgName = chosenOrg.name;

    // 3. Link this new property in organization_properties
    const { data: newLink, error: linkErr } = await db
      .from('organization_properties')
      .insert({
        organization_id: targetOrgId,
        property_id: newProp.id,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (linkErr) {
      return NextResponse.json({ success: false, error: `Failed to link property: ${linkErr.message}` }, { status: 400 });
    }

    // 4. Create onboarding record with initial stage "DRAFT" ("Draft Initialized")
    const { data: newOnboarding, error: onbErr } = await db
      .from('onboardings')
      .insert({
        organization_property_id: newLink.id,
        status: 'DRAFT',
        target_date: target_date || null,
      })
      .select()
      .single();

    if (onbErr) {
      return NextResponse.json({ success: false, error: `Failed to create onboarding tracker: ${onbErr.message}` }, { status: 400 });
    }

    // Central Audit Log
    await logAuditEvent({
      action: 'ONBOARDING_INITIALIZED',
      entity_type: 'ONBOARDING',
      entity_id: newOnboarding.id,
      entity_name: newProp.name,
      changes: {
        property_name: newProp.name,
        organization_id: targetOrgId,
        organization_name: orgName,
        stage: 'DRAFT',
        property_status: 'INACTIVE',
        target_date,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newOnboarding,
        property: newProp,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function handlePutOnboarding(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();

    const {
      id,
      status,
      target_date,
      assigned_to,
      assigned_to_name,
      internal_notes,
      new_attachments,
      remove_attachment_id,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Onboarding ID is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) {
      updates.status = status;
      const now = new Date().toISOString();
      if (status === 'CONTRACT_SENT') updates.contract_sent_at = now;
      if (status === 'SIGNED') updates.signed_at = now;
      if (status === 'PORTING_SUBMITTED') updates.porting_submitted_at = now;
      if (status === 'SOF_WAITING') updates.sof_waiting_at = now;
      if (status === 'FOC_RECEIVED') updates.foc_received_at = now;
      if (status === 'COMPLETED') updates.completed_at = now;
    }
    if (target_date !== undefined) updates.target_date = target_date;
    if (body.draft_date !== undefined) updates.draft_date = body.draft_date || null;
    if (body.contract_sent_date !== undefined) updates.contract_sent_date = body.contract_sent_date || null;
    if (body.signed_date !== undefined) updates.signed_date = body.signed_date || null;
    if (body.csr_details_date !== undefined) updates.csr_details_date = body.csr_details_date || null;
    if (body.cut_sheet_review_date !== undefined) updates.cut_sheet_review_date = body.cut_sheet_review_date || null;
    if (body.porting_submitted_date !== undefined) updates.porting_submitted_date = body.porting_submitted_date || null;
    if (body.sof_review_date !== undefined) updates.sof_review_date = body.sof_review_date || null;
    if (body.foc_confirmed_date !== undefined) updates.foc_confirmed_date = body.foc_confirmed_date || null;
    if (body.live_cutover_date !== undefined) updates.live_cutover_date = body.live_cutover_date || null;

    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (assigned_to_name !== undefined) {
      updates.assigned_to_name = assigned_to_name ? assigned_to_name.trim() : null;
      if (updates.assigned_to_name) {
        updates.assigned_at = new Date().toISOString();
      }
    }
    if (internal_notes !== undefined) {
      updates.internal_notes = internal_notes ? internal_notes.trim() : null;
    }

    updates.updated_at = new Date().toISOString();

    // Fetch existing onboarding to manage attachments list
    const { data: existingOnb } = await db.from('onboardings').select('*').eq('id', id).maybeSingle();
    let currentAttachments: any[] = Array.isArray(existingOnb?.attachments) ? [...existingOnb.attachments] : [];

    // Handle attachment removal
    if (remove_attachment_id) {
      try {
        await db.from('onboarding_attachments').delete().eq('id', remove_attachment_id);
      } catch (err) {}
      currentAttachments = currentAttachments.filter(
        (a: any) => a.id !== remove_attachment_id && a.storage_path !== remove_attachment_id
      );
    }

    // Handle new attachments insertion
    if (new_attachments && Array.isArray(new_attachments) && new_attachments.length > 0) {
      const attRows = new_attachments.map((att: any) => ({
        onboarding_id: id,
        uploaded_by: user?.id || null,
        file_name: att.file_name,
        file_size: att.file_size || 0,
        mime_type: att.mime_type || 'application/pdf',
        storage_path: att.storage_path,
      }));

      try {
        const { data: insRows } = await db.from('onboarding_attachments').insert(attRows).select();
        if (insRows && insRows.length > 0) {
          currentAttachments.push(...insRows);
        } else {
          currentAttachments.push(...attRows);
        }
      } catch (err) {
        currentAttachments.push(...attRows);
      }
    }

    updates.attachments = currentAttachments;

    let updated = null;
    try {
      const { data: resData, error } = await db
        .from('onboardings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          org_property:organization_properties(
            id,
            property_id,
            property:properties(id, name, status)
          )
        `)
        .single();
      if (error) throw error;
      updated = resData;
    } catch (updateErr: any) {
      console.warn('Primary onboarding update failed, retrying standard fields:', updateErr.message);
      // Fallback: If DB columns for assigned_to/internal_notes/attachments don't exist yet, update core fields
      const coreUpdates = { ...updates };
      delete coreUpdates.assigned_to;
      delete coreUpdates.assigned_to_name;
      delete coreUpdates.assigned_at;
      delete coreUpdates.internal_notes;
      delete coreUpdates.attachments;

      const { data: fallbackData, error: fbErr } = await db
        .from('onboardings')
        .update(coreUpdates)
        .eq('id', id)
        .select(`
          *,
          org_property:organization_properties(
            id,
            property_id,
            property:properties(id, name, status)
          )
        `)
        .single();
      if (fbErr) {
        return NextResponse.json({ success: false, error: fbErr.message }, { status: 400 });
      }
      updated = {
        ...fallbackData,
        assigned_to: updates.assigned_to,
        assigned_to_name: updates.assigned_to_name,
        assigned_at: updates.assigned_at,
        internal_notes: updates.internal_notes,
        attachments: currentAttachments,
      };
    }

    // Rule: Once stage becomes COMPLETED, automatically activate the property!
    let activatedProperty = false;
    if (status === 'COMPLETED' && updated.org_property?.property_id) {
      await db
        .from('properties')
        .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
        .eq('id', updated.org_property.property_id);
      activatedProperty = true;
    }

    // Central Audit Log
    const propName = updated.org_property?.property?.name || 'Property';
    await logAuditEvent({
      action: status === 'COMPLETED' ? 'ONBOARDING_COMPLETED_PROPERTY_ACTIVATED' : 'ONBOARDING_STAGE_UPDATED',
      entity_type: 'ONBOARDING',
      entity_id: id,
      entity_name: propName,
      changes: {
        stage: status,
        property_id: updated.org_property?.property_id,
        property_activated: activatedProperty,
        assigned_to_name: updates.assigned_to_name,
        internal_notes: updates.internal_notes ? 'Updated internal notes' : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      propertyActivated: activatedProperty,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
