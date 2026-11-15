import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Verify property belongs to user's organization
    const { data: orgProp, error } = await supabase
      .from('organization_properties')
      .select(`
        id,
        status,
        created_at,
        property:properties(*),
        services:organization_property_services(
          id,
          service:services(id, phone_number, status, description, service_type:service_types(name))
        ),
        e911:e911_records(*),
        onboardings(*),
        tickets(
          id,
          subject,
          description,
          status,
          priority,
          created_at,
          creator:profiles!tickets_created_by_fkey(full_name, email)
        )
      `)
      .eq('organization_id', member.organization_id)
      .eq('property_id', id)
      .maybeSingle();

    if (error || !orgProp) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    const prop: any = orgProp.property ? { ...orgProp.property } : {};
    delete prop.server_id;
    delete prop.vendor_id;
    delete prop.server;
    delete prop.vendor;
    delete prop.server_name;
    delete prop.vendor_name;
    const servicesList = (orgProp.services || []).map((s: any) => s.service).filter(Boolean);
    const e911Record = Array.isArray(orgProp.e911) && orgProp.e911.length > 0 ? orgProp.e911[0] : null;
    const onboardingRecord = Array.isArray(orgProp.onboardings) && orgProp.onboardings.length > 0 ? orgProp.onboardings[0] : null;

    // Fetch primary data circuit for client (client-safe: no wholesaler info)
    const { data: dcList } = await supabase
      .from('data_circuits')
      .select('id, property_id, status, carrier_name, bandwidth, circuit_monthly_price, site_survey_status, foc_status, foc_date, installed_at, technical_details, agreement_file_name, agreement_file_url, agreement_file_size, paperwork_signed_at, created_at')
      .eq('property_id', id)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    const primaryCircuit = dcList && dcList.length > 0 ? dcList[0] : null;
    const isRayBaumActive = Boolean(
      prop.ray_baum_status && String(prop.ray_baum_status).trim().toUpperCase() === 'ACTIVE'
    );

    // Collect deduplicated porting attachments from properties, onboardings, and porting_requests
    const portingDocsList: any[] = [];
    const seenStoragePaths = new Set<string>();
    const pushAttachment = (att: any) => {
      if (Array.isArray(att)) {
        att.forEach(pushAttachment);
        return;
      }
      if (!att || !att.storage_path) return;
      if (seenStoragePaths.has(att.storage_path)) return;
      seenStoragePaths.add(att.storage_path);
      portingDocsList.push({
        id: att.id || att.storage_path,
        file_name: att.file_name || att.storage_path.split('/').pop() || 'Document',
        file_size: Number(att.file_size || 0),
        mime_type: att.mime_type || 'application/octet-stream',
        storage_path: att.storage_path,
        created_at: att.created_at || prop.created_at,
      });
    };

    if (Array.isArray(prop.attachments)) {
      prop.attachments.forEach(pushAttachment);
    }
    if (Array.isArray(onboardingRecord?.attachments)) {
      onboardingRecord.attachments.forEach(pushAttachment);
    }

    const dbClient = createAdminClient() || supabase;
    const { data: orgPortingReqs } = await dbClient
      .from('porting_requests')
      .select(`
        id,
        property_id,
        organization_property_id,
        property_name,
        notes,
        attachments,
        porting_attachments(id, file_name, file_size, mime_type, storage_path, created_at)
      `)
      .eq('organization_id', member.organization_id);

    const propNameClean = (prop.name || '').trim().toLowerCase();
    (orgPortingReqs || []).forEach((pr: any) => {
      const isMatchByPropId = pr.property_id && pr.property_id === id;
      const isMatchByOpId = pr.organization_property_id && pr.organization_property_id === orgProp.id;
      const isMatchByName = pr.property_name && pr.property_name.trim().toLowerCase() === propNameClean;
      if (isMatchByPropId || isMatchByOpId || isMatchByName) {
        if (Array.isArray(pr.porting_attachments)) {
          pr.porting_attachments.forEach(pushAttachment);
        }
        if (Array.isArray(pr.attachments)) {
          pr.attachments.forEach(pushAttachment);
        }
        if (typeof pr.notes === 'string') {
          const metaMatch = pr.notes.match(/<!--METADATA:([\s\S]*?)-->/);
          if (metaMatch) {
            try {
              const meta = JSON.parse(metaMatch[1]);
              if (Array.isArray(meta?.attachments)) {
                meta.attachments.forEach(pushAttachment);
              }
            } catch {
              // ignore invalid metadata JSON
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...prop,
        org_property_id: orgProp.id,
        org_property_status: orgProp.status,
        services: servicesList,
        e911_record: e911Record,
        onboarding: onboardingRecord,
        tickets: orgProp.tickets || [],
        data_circuit: primaryCircuit,
        data_circuits: dcList || [],
        ray_baum_status: isRayBaumActive ? 'Active' : 'Inactive',
        is_ray_baum_active: isRayBaumActive,
        porting_attachments: portingDocsList,
      },
    });
  } catch (err: any) {
    console.error('Client Single Property API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch property details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Verify property belongs to user's organization (either property.id or organization_property.id)
    const { data: orgProp, error: checkErr } = await supabase
      .from('organization_properties')
      .select('id, property_id')
      .eq('organization_id', member.organization_id)
      .or(`property_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (checkErr || !orgProp) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    const targetPropertyId = orgProp.property_id || id;
    const body = await request.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name ? body.name.trim() : null;
    if (body.address !== undefined) updatePayload.address = body.address ? body.address.trim() : null;
    if (body.main_phone !== undefined) updatePayload.main_phone = body.main_phone ? body.main_phone.trim() : null;
    if (body.fax !== undefined) updatePayload.fax = body.fax ? body.fax.trim() : null;

    if (body.general_manager_name !== undefined) {
      updatePayload.general_manager_name = body.general_manager_name ? body.general_manager_name.trim() : null;
      if (updatePayload.contact_person_name === undefined) {
        updatePayload.contact_person_name = updatePayload.general_manager_name;
      }
    }
    if (body.general_manager_phone !== undefined) {
      updatePayload.general_manager_phone = body.general_manager_phone ? body.general_manager_phone.trim() : null;
      if (body.main_phone === undefined && updatePayload.general_manager_phone) {
        updatePayload.main_phone = updatePayload.general_manager_phone;
      }
    }
    if (body.general_manager_email !== undefined) {
      updatePayload.general_manager_email = body.general_manager_email ? body.general_manager_email.trim() : null;
      if (updatePayload.contact_person_email === undefined) {
        updatePayload.contact_person_email = updatePayload.general_manager_email;
      }
    }
    if (body.contact_person_name !== undefined) {
      updatePayload.contact_person_name = body.contact_person_name ? body.contact_person_name.trim() : null;
    }
    if (body.contact_person_email !== undefined) {
      updatePayload.contact_person_email = body.contact_person_email ? body.contact_person_email.trim() : null;
    }

    const { data: updatedProp, error: updateErr } = await supabase
      .from('properties')
      .update(updatePayload)
      .eq('id', targetPropertyId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: updatedProp,
      message: 'Property details updated successfully.',
    });
  } catch (err: any) {
    console.error('Client Property PATCH error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update property' },
      { status: 500 }
    );
  }
}
