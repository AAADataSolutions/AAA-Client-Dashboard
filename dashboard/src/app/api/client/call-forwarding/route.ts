import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import {
  PbxServerId,
  getPbxServerLabel,
  normalizeDid,
  normalizePortalUsername,
  pbxAddDid,
  pbxEnableCallForwarding,
  pbxDisableCallForwarding,
  pbxGetForwardingNumberList,
  pbxGetForwardingStatus,
} from '@/lib/pbx/client';

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

    const db = createAdminClient() || supabase;

    const { data: member } = await db
      .from('organization_members')
      .select('organization_id, role')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({
        success: true,
        data: [],
        savedContacts: [],
        properties: [],
        metrics: { totalDids: 0, forwardingOnCount: 0, forwardingOffCount: 0 },
      });
    }

    const orgId = member.organization_id;

    // 1. Fetch Organization details
    const { data: org } = await db
      .from('organizations')
      .select('id, name, email, phone, portal_username, portal_user_id')
      .eq('id', orgId)
      .maybeSingle();

    const portalUsername = normalizePortalUsername(org?.portal_username || org?.email, org?.name || 'client');

    // 2. Fetch properties belonging to this organization
    const { data: orgProps } = await db
      .from('organization_properties')
      .select('id, property_id, property:properties(id, name, city, state, address, main_phone, general_manager_name, general_manager_phone, default_pbx_server_id)')
      .eq('organization_id', orgId);

    const orgPropIds = (orgProps || []).map((op: any) => op.id);
    const propIds = (orgProps || [])
      .map((op: any) => {
        const p = Array.isArray(op.property) ? op.property[0] : op.property;
        return p?.id || op.property_id;
      })
      .filter(Boolean);

    const propById = new Map<string, any>();
    const propByOpId = new Map<string, any>();
    const propertiesList: { id: string; name: string }[] = [];

    (orgProps || []).forEach((op: any) => {
      const p = Array.isArray(op.property) ? op.property[0] : op.property;
      if (p) {
        propById.set(p.id, p);
        propByOpId.set(op.id, p);
        propertiesList.push({ id: p.id, name: p.name });
      }
    });

    // 3. Fetch services linked via organization_property_services OR direct property_id
    let rawServices: any[] = [];
    if (orgPropIds.length > 0) {
      const { data: opsLinks } = await db
        .from('organization_property_services')
        .select('id, organization_property_id, service:services(*, service_type:service_types(name))')
        .in('organization_property_id', orgPropIds);

      (opsLinks || []).forEach((link: any) => {
        const svc = Array.isArray(link.service) ? link.service[0] : link.service;
        if (svc) {
          rawServices.push({
            ...svc,
            _linked_prop: propByOpId.get(link.organization_property_id) || (svc.property_id ? propById.get(svc.property_id) : null),
          });
        }
      });
    }

    if (propIds.length > 0) {
      const { data: directSvcs } = await db
        .from('services')
        .select('*, service_type:service_types(name)')
        .in('property_id', propIds);

      (directSvcs || []).forEach((svc: any) => {
        if (!rawServices.some((existing) => existing.id === svc.id)) {
          rawServices.push({
            ...svc,
            _linked_prop: propById.get(svc.property_id) || null,
          });
        }
      });
    }

    // 4. Fetch saved forwarding contacts for this organization
    let savedContacts: any[] = [];
    try {
      const { data: cfContacts } = await db
        .from('call_forwarding_contacts')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      savedContacts = cfContacts || [];
    } catch {
      savedContacts = [];
    }

    // Include GM contacts from properties as suggested contacts
    propertiesList.forEach((pItem) => {
      const fullProp = propById.get(pItem.id);
      if (fullProp?.general_manager_phone && fullProp.general_manager_phone !== 'N/A' && fullProp.general_manager_phone !== '—') {
        const gmNum = normalizeDid(fullProp.general_manager_phone);
        if (gmNum && !savedContacts.some((c: any) => normalizeDid(c.phone_number) === gmNum)) {
          savedContacts.push({
            id: `gm-${fullProp.id}`,
            organization_id: orgId,
            property_id: fullProp.id,
            name: fullProp.general_manager_name && fullProp.general_manager_name !== 'N/A'
              ? `${fullProp.general_manager_name} (GM - ${fullProp.name})`
              : `General Manager (${fullProp.name})`,
            phone_number: fullProp.general_manager_phone,
            is_suggested: true,
          });
        }
      }
    });

    const formatted = rawServices.map((s: any) => {
      const prop = s._linked_prop;
      const serverId = ([1, 2, 3].includes(Number(s.pbx_server_id))
        ? Number(s.pbx_server_id)
        : ([1, 2, 3].includes(Number(prop?.default_pbx_server_id)) ? Number(prop.default_pbx_server_id) : 1)) as PbxServerId;

      const activeTargets: { name: string; number: string }[] = Array.isArray(s.active_forwarding_numbers)
        ? s.active_forwarding_numbers.map((item: any) =>
            typeof item === 'string' ? { name: 'Forwarded Number', number: item } : { name: item.name || 'Contact', number: item.number || '' }
          )
        : [];

      return {
        id: s.id,
        custom_service_id: s.custom_service_id || `SVC-${s.id.slice(0, 6).toUpperCase()}`,
        service_name: s.service_name || `Line ${s.phone_number}`,
        phone_number: s.phone_number,
        normalized_did: s.normalized_did || normalizeDid(s.phone_number),
        service_type: s.service_type?.name || 'Voice Line / DID',
        status: s.status || 'ACTIVE',
        property_id: prop?.id || s.property_id || null,
        property_name: prop?.name || 'Property',
        property_location: prop ? [prop.city, prop.state].filter(Boolean).join(', ') : '',
        organization_id: orgId,
        organization_name: org?.name || 'My Organization',
        portal_username: portalUsername,
        pbx_server_id: serverId,
        pbx_server_label: getPbxServerLabel(serverId),
        call_forwarding_state: s.call_forwarding_state === 'ON' ? 'ON' : 'OFF',
        active_forwarding_numbers: activeTargets,
        forwarding_updated_at: s.forwarding_updated_at || s.updated_at || s.created_at,
      };
    });

    const totalDids = formatted.length;
    const forwardingOnCount = formatted.filter((i) => i.call_forwarding_state === 'ON').length;
    const forwardingOffCount = formatted.filter((i) => i.call_forwarding_state !== 'ON').length;

    return NextResponse.json({
      success: true,
      data: formatted,
      savedContacts,
      properties: propertiesList,
      portalUsername,
      metrics: {
        totalDids,
        forwardingOnCount,
        forwardingOffCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
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

    const db = createAdminClient() || supabase;

    const { data: member } = await db
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (!member?.organization_id) {
      return NextResponse.json({ success: false, error: 'No organization membership found.' }, { status: 403 });
    }

    const orgId = member.organization_id;
    const { data: org } = await db
      .from('organizations')
      .select('id, name, email, portal_username')
      .eq('id', orgId)
      .maybeSingle();

    const portalUsername = normalizePortalUsername(org?.portal_username || org?.email, org?.name || 'client');

    const body = await request.json();
    const {
      action,
      service_id,
      property_id,
      property_name,
      did,
      server_id = 1,
      forwarding_numbers = [],
      contact_name,
      contact_number,
      contact_id,
    } = body;

    const pbxServerId = ([1, 2, 3].includes(Number(server_id)) ? Number(server_id) : 1) as PbxServerId;
    const cleanDid = normalizeDid(did);

    if (action === 'forward_on') {
      if (!cleanDid || !Array.isArray(forwarding_numbers) || forwarding_numbers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'DID and at least one forwarding destination are required.' },
          { status: 400 }
        );
      }

      await pbxAddDid({
        username: portalUsername,
        property_name: property_name || org?.name || 'Property',
        did: cleanDid,
        server_id: pbxServerId,
        organization_id: orgId,
        property_id,
        service_id,
        triggered_by: user.id,
      });

      const pbxRes = await pbxEnableCallForwarding({
        username: portalUsername,
        did: cleanDid,
        server_id: pbxServerId,
        forwarding_numbers,
        organization_id: orgId,
        property_id,
        service_id,
        triggered_by: user.id,
      });

      if (!pbxRes.success) {
        return NextResponse.json({ success: false, error: pbxRes.message || 'Failed to enable call forwarding.' }, { status: 400 });
      }

      if (service_id) {
        await db
          .from('services')
          .update({
            call_forwarding_state: 'ON',
            active_forwarding_numbers: forwarding_numbers,
            forwarding_updated_at: new Date().toISOString(),
            forwarding_updated_by: user.id,
          })
          .eq('id', service_id);
      }

      // Save any new forwarding contacts to call_forwarding_contacts
      for (const target of forwarding_numbers) {
        const tNum = normalizeDid(target.number);
        if (!tNum) continue;
        try {
          const { data: existingC } = await db
            .from('call_forwarding_contacts')
            .select('id')
            .eq('organization_id', orgId)
            .eq('phone_number', target.number)
            .maybeSingle();
          if (!existingC) {
            await db.from('call_forwarding_contacts').insert({
              organization_id: orgId,
              property_id: property_id || null,
              name: target.name || 'Forwarding Contact',
              phone_number: target.number,
            });
          }
        } catch {}
      }

      await logAuditEvent({
        action: 'CLIENT_CALL_FORWARDING_ENABLED',
        entity_type: 'SERVICE',
        entity_id: service_id || cleanDid,
        entity_name: `DID ${cleanDid}`,
        changes: { did: cleanDid, forwarding_numbers },
      });

      return NextResponse.json({
        success: true,
        message: `Call forwarding enabled for ${cleanDid}.`,
        data: {
          did: cleanDid,
          call_forwarding_state: 'ON',
          active_forwarding_numbers: forwarding_numbers,
        },
      });
    }

    if (action === 'forward_off') {
      const pbxRes = await pbxDisableCallForwarding({
        username: portalUsername,
        did: cleanDid,
        server_id: pbxServerId,
        organization_id: orgId,
        property_id,
        service_id,
        triggered_by: user.id,
      });

      if (!pbxRes.success) {
        return NextResponse.json({ success: false, error: pbxRes.message || 'Failed to disable call forwarding.' }, { status: 400 });
      }

      if (service_id) {
        await db
          .from('services')
          .update({
            call_forwarding_state: 'OFF',
            active_forwarding_numbers: [],
            forwarding_updated_at: new Date().toISOString(),
            forwarding_updated_by: user.id,
          })
          .eq('id', service_id);
      }

      await logAuditEvent({
        action: 'CLIENT_CALL_FORWARDING_DISABLED',
        entity_type: 'SERVICE',
        entity_id: service_id || cleanDid,
        entity_name: `DID ${cleanDid}`,
        changes: { did: cleanDid },
      });

      return NextResponse.json({
        success: true,
        message: `Call forwarding turned OFF for ${cleanDid}. Normal routing restored.`,
        data: {
          did: cleanDid,
          call_forwarding_state: 'OFF',
          active_forwarding_numbers: [],
        },
      });
    }

    if (action === 'refresh_status') {
      const [statusRes, listRes] = await Promise.all([
        pbxGetForwardingStatus({
          username: portalUsername,
          did: cleanDid,
          server_id: pbxServerId,
          organization_id: orgId,
          service_id,
        }),
        pbxGetForwardingNumberList({
          username: portalUsername,
          organization_id: orgId,
        }),
      ]);
      return NextResponse.json({
        success: true,
        statusData: statusRes.data,
        savedNumbersData: listRes.data,
      });
    }

    if (action === 'add_contact') {
      if (!contact_name?.trim() || !contact_number?.trim()) {
        return NextResponse.json({ success: false, error: 'Name and phone number are required.' }, { status: 400 });
      }
      const { data: newContact, error: cErr } = await db
        .from('call_forwarding_contacts')
        .insert({
          organization_id: orgId,
          property_id: property_id || null,
          name: contact_name.trim(),
          phone_number: contact_number.trim(),
        })
        .select()
        .single();

      if (cErr) {
        return NextResponse.json({ success: false, error: cErr.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: newContact, message: 'Contact saved.' });
    }

    if (action === 'delete_contact') {
      if (!contact_id) {
        return NextResponse.json({ success: false, error: 'Contact ID is required.' }, { status: 400 });
      }
      await db
        .from('call_forwarding_contacts')
        .delete()
        .eq('id', contact_id)
        .eq('organization_id', orgId);
      return NextResponse.json({ success: true, message: 'Contact removed.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

