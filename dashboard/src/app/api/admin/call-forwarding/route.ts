import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit/logger';
import {
  PBX_SERVERS,
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
    const db = createAdminClient() || supabase;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const propertyIdFilter = searchParams.get('property_id') || 'ALL';
    const orgIdFilter = searchParams.get('organization_id') || 'ALL';
    const serverFilter = searchParams.get('server_id') || 'ALL';
    const stateFilter = searchParams.get('state') || 'ALL';

    // 1. Fetch all services with property & organization links
    const { data: rawServices, error } = await db
      .from('services')
      .select(`
        *,
        service_type:service_types(id, name),
        property_links:organization_property_services(
          id,
          org_property:organization_properties(
            id,
            property:properties(id, name, city, state, address, main_phone, general_manager_name, general_manager_phone),
            organization:organizations(id, name, email, phone, portal_username, portal_user_id)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Also fetch all properties & organizations for direct property_id lookup fallback
    const { data: allProps } = await db
      .from('properties')
      .select('id, name, city, state, address, main_phone, general_manager_name, general_manager_phone, default_pbx_server_id');
    const { data: allOrgProps } = await db
      .from('organization_properties')
      .select('id, property_id, organization_id, organization:organizations(id, name, email, phone, portal_username, portal_user_id)');

    const propMap = new Map<string, any>();
    (allProps || []).forEach((p: any) => propMap.set(p.id, p));

    const orgByPropMap = new Map<string, any>();
    (allOrgProps || []).forEach((op: any) => {
      const org = Array.isArray(op.organization) ? op.organization[0] : op.organization;
      if (op.property_id && org) orgByPropMap.set(op.property_id, org);
    });

    // Fetch saved forwarding contacts
    let savedContacts: any[] = [];
    try {
      const { data: cfContacts } = await db
        .from('call_forwarding_contacts')
        .select('*')
        .order('created_at', { ascending: false });
      savedContacts = cfContacts || [];
    } catch {
      savedContacts = [];
    }

    const items = (rawServices || []).map((s: any) => {
      const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];
      const firstLink = links[0]?.org_property;
      const linkedProp = Array.isArray(firstLink?.property) ? firstLink?.property[0] : firstLink?.property;
      const linkedOrg = Array.isArray(firstLink?.organization) ? firstLink?.organization[0] : firstLink?.organization;

      const fallbackProp = s.property_id ? propMap.get(s.property_id) : null;
      const prop = linkedProp || fallbackProp || null;
      const org = linkedOrg || (prop?.id ? orgByPropMap.get(prop.id) : null) || null;

      const serverId = ([1, 2, 3].includes(Number(s.pbx_server_id))
        ? Number(s.pbx_server_id)
        : ([1, 2, 3].includes(Number(prop?.default_pbx_server_id)) ? Number(prop.default_pbx_server_id) : 1)) as PbxServerId;

      const portalUsername = org
        ? normalizePortalUsername(org.portal_username || org.email, org.name)
        : 'admin@activetelephones.com';

      const activeTargets: { name: string; number: string }[] = Array.isArray(s.active_forwarding_numbers)
        ? s.active_forwarding_numbers.map((item: any) =>
            typeof item === 'string' ? { name: 'Forwarded Number', number: item } : { name: item.name || 'Contact', number: item.number || '' }
          )
        : [];

      const orgContacts = savedContacts.filter(
        (c: any) => (org?.id && c.organization_id === org.id) || (prop?.id && c.property_id === prop.id)
      );

      // Include GM phone as a quick-select contact if not already in savedContacts
      const suggestedContacts = [...orgContacts];
      if (prop?.general_manager_phone && prop.general_manager_phone !== 'N/A' && prop.general_manager_phone !== '—') {
        const gmNum = normalizeDid(prop.general_manager_phone);
        if (gmNum && !suggestedContacts.some((c: any) => normalizeDid(c.phone_number) === gmNum)) {
          suggestedContacts.push({
            id: `gm-${prop.id}`,
            name: prop.general_manager_name && prop.general_manager_name !== 'N/A' ? `${prop.general_manager_name} (GM)` : 'General Manager',
            phone_number: prop.general_manager_phone,
            is_suggested: true,
          });
        }
      }

      return {
        id: s.id,
        custom_service_id: s.custom_service_id || `SVC-${s.id.slice(0, 6).toUpperCase()}`,
        service_name: s.service_name || `DID ${s.phone_number}`,
        phone_number: s.phone_number,
        normalized_did: s.normalized_did || normalizeDid(s.phone_number),
        service_type: s.service_type?.name || 'Voice Line / DID',
        status: s.status || 'ACTIVE',
        property_id: prop?.id || s.property_id || null,
        property_name: prop?.name || 'Unassigned Property',
        property_location: prop ? [prop.city, prop.state].filter(Boolean).join(', ') : '',
        organization_id: org?.id || null,
        organization_name: org?.name || 'Unassigned Organization',
        portal_username: portalUsername,
        pbx_server_id: serverId,
        pbx_server_label: getPbxServerLabel(serverId),
        portal_did_synced: Boolean(s.portal_did_synced),
        call_forwarding_state: s.call_forwarding_state === 'ON' ? 'ON' : 'OFF',
        active_forwarding_numbers: activeTargets,
        saved_contacts: suggestedContacts,
        forwarding_updated_at: s.forwarding_updated_at || s.updated_at || s.created_at,
      };
    });

    const totalDids = items.length;
    const forwardingOnCount = items.filter((i: any) => i.call_forwarding_state === 'ON').length;
    const forwardingOffCount = items.filter((i: any) => i.call_forwarding_state !== 'ON').length;
    const pbx115Count = items.filter((i: any) => i.pbx_server_id === 1).length;
    const pbx142Count = items.filter((i: any) => i.pbx_server_id === 2).length;
    const pbx240Count = items.filter((i: any) => i.pbx_server_id === 3).length;

    let filtered = items;
    if (propertyIdFilter !== 'ALL') {
      filtered = filtered.filter((i: any) => i.property_id === propertyIdFilter);
    }
    if (orgIdFilter !== 'ALL') {
      filtered = filtered.filter((i: any) => i.organization_id === orgIdFilter);
    }
    if (serverFilter !== 'ALL') {
      filtered = filtered.filter((i: any) => String(i.pbx_server_id) === String(serverFilter));
    }
    if (stateFilter !== 'ALL') {
      filtered = filtered.filter((i: any) => i.call_forwarding_state === stateFilter);
    }
    if (search) {
      filtered = filtered.filter(
        (i: any) =>
          i.phone_number.toLowerCase().includes(search) ||
          i.normalized_did.includes(search) ||
          i.property_name.toLowerCase().includes(search) ||
          i.organization_name.toLowerCase().includes(search) ||
          i.portal_username.toLowerCase().includes(search) ||
          i.service_name.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      savedContacts,
      pbxServers: PBX_SERVERS,
      metrics: {
        totalDids,
        forwardingOnCount,
        forwardingOffCount,
        pbx115Count,
        pbx142Count,
        pbx240Count,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      action,
      service_id,
      organization_id,
      property_id,
      property_name,
      username,
      did,
      server_id = 1,
      forwarding_numbers = [],
      contact_name,
      contact_number,
      contact_id,
    } = body;

    const pbxServerId = ([1, 2, 3].includes(Number(server_id)) ? Number(server_id) : 1) as PbxServerId;
    const cleanUsername = normalizePortalUsername(username, property_name || 'hotel_admin');
    const cleanDid = normalizeDid(did);

    // Action 1: Enable Call Forwarding (forward_on)
    if (action === 'forward_on') {
      if (!cleanDid) {
        return NextResponse.json({ success: false, error: 'A valid DID / phone number is required.' }, { status: 400 });
      }
      if (!Array.isArray(forwarding_numbers) || forwarding_numbers.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one destination name and phone number is required to enable call forwarding.' },
          { status: 400 }
        );
      }

      // Ensure DID is registered on PBX server first
      await pbxAddDid({
        username: cleanUsername,
        property_name: property_name || 'Hotel Property',
        did: cleanDid,
        server_id: pbxServerId,
        organization_id,
        property_id,
        service_id,
        triggered_by: user?.id,
      });

      const pbxRes = await pbxEnableCallForwarding({
        username: cleanUsername,
        did: cleanDid,
        server_id: pbxServerId,
        forwarding_numbers,
        organization_id,
        property_id,
        service_id,
        triggered_by: user?.id,
      });

      if (!pbxRes.success) {
        return NextResponse.json(
          { success: false, error: pbxRes.message || 'Failed to enable call forwarding on PBX portal.' },
          { status: 400 }
        );
      }

      // Update service record in Supabase
      if (service_id) {
        await db
          .from('services')
          .update({
            pbx_server_id: pbxServerId,
            normalized_did: cleanDid,
            portal_did_synced: true,
            call_forwarding_state: 'ON',
            active_forwarding_numbers: forwarding_numbers,
            forwarding_updated_at: new Date().toISOString(),
            forwarding_updated_by: user?.id || null,
          })
          .eq('id', service_id);
      }

      // Save new contacts to call_forwarding_contacts for future quick selection
      if (organization_id) {
        for (const target of forwarding_numbers) {
          const tNum = normalizeDid(target.number);
          if (!tNum) continue;
          try {
            const { data: existingC } = await db
              .from('call_forwarding_contacts')
              .select('id')
              .eq('organization_id', organization_id)
              .eq('phone_number', target.number)
              .maybeSingle();
            if (!existingC) {
              await db.from('call_forwarding_contacts').insert({
                organization_id,
                property_id: property_id || null,
                name: target.name || 'Forwarding Contact',
                phone_number: target.number,
              });
            }
          } catch {}
        }
      }

      await logAuditEvent({
        action: 'CALL_FORWARDING_ENABLED',
        entity_type: 'SERVICE',
        entity_id: service_id || cleanDid,
        entity_name: `DID ${cleanDid}`,
        changes: {
          did: cleanDid,
          server_id: pbxServerId,
          forwarding_numbers,
          username: cleanUsername,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Call forwarding enabled on ${getPbxServerLabel(pbxServerId)} for ${cleanDid}.`,
        data: {
          did: cleanDid,
          call_forwarding_state: 'ON',
          active_forwarding_numbers: forwarding_numbers,
          pbx_server_id: pbxServerId,
        },
      });
    }

    // Action 2: Disable Call Forwarding (forward_off)
    if (action === 'forward_off') {
      if (!cleanDid) {
        return NextResponse.json({ success: false, error: 'A valid DID / phone number is required.' }, { status: 400 });
      }

      const pbxRes = await pbxDisableCallForwarding({
        username: cleanUsername,
        did: cleanDid,
        server_id: pbxServerId,
        organization_id,
        property_id,
        service_id,
        triggered_by: user?.id,
      });

      if (!pbxRes.success) {
        return NextResponse.json(
          { success: false, error: pbxRes.message || 'Failed to disable call forwarding on PBX portal.' },
          { status: 400 }
        );
      }

      if (service_id) {
        await db
          .from('services')
          .update({
            pbx_server_id: pbxServerId,
            call_forwarding_state: 'OFF',
            active_forwarding_numbers: [],
            forwarding_updated_at: new Date().toISOString(),
            forwarding_updated_by: user?.id || null,
          })
          .eq('id', service_id);
      }

      await logAuditEvent({
        action: 'CALL_FORWARDING_DISABLED',
        entity_type: 'SERVICE',
        entity_id: service_id || cleanDid,
        entity_name: `DID ${cleanDid}`,
        changes: {
          did: cleanDid,
          server_id: pbxServerId,
          username: cleanUsername,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Call forwarding disabled for ${cleanDid}. Inbound routing restored to normal PBX destination.`,
        data: {
          did: cleanDid,
          call_forwarding_state: 'OFF',
          active_forwarding_numbers: [],
          pbx_server_id: pbxServerId,
        },
      });
    }

    // Action 3: Register DID with PBX Server (did_management_api.php)
    if (action === 'register_did') {
      const pbxRes = await pbxAddDid({
        username: cleanUsername,
        property_name: property_name || 'Hotel Property',
        did: cleanDid,
        server_id: pbxServerId,
        organization_id,
        property_id,
        service_id,
        triggered_by: user?.id,
      });

      if (service_id) {
        await db
          .from('services')
          .update({
            pbx_server_id: pbxServerId,
            normalized_did: cleanDid,
            portal_did_synced: pbxRes.success,
          })
          .eq('id', service_id);
      }

      return NextResponse.json({
        success: pbxRes.success,
        message: pbxRes.message || `DID ${cleanDid} registered on ${getPbxServerLabel(pbxServerId)}.`,
        data: pbxRes.data,
      });
    }

    // Action 4: Refresh Live Status & Saved Contacts from PBX Portal
    if (action === 'refresh_status') {
      const [statusRes, listRes] = await Promise.all([
        pbxGetForwardingStatus({
          username: cleanUsername,
          did: cleanDid,
          server_id: pbxServerId,
          organization_id,
          service_id,
        }),
        pbxGetForwardingNumberList({
          username: cleanUsername,
          organization_id,
        }),
      ]);

      const portalContacts = listRes.data?.forwarding_numbers || [];
      if (organization_id && portalContacts.length > 0) {
        for (const pc of portalContacts) {
          try {
            const { data: existing } = await db
              .from('call_forwarding_contacts')
              .select('id')
              .eq('organization_id', organization_id)
              .eq('phone_number', pc.number)
              .maybeSingle();
            if (!existing) {
              await db.from('call_forwarding_contacts').insert({
                organization_id,
                property_id: property_id || null,
                portal_contact_id: Number(pc.id) || null,
                name: pc.name,
                phone_number: pc.number,
              });
            }
          } catch {}
        }
      }

      if (service_id && statusRes.success && !statusRes.simulated && statusRes.data) {
        const liveState = statusRes.data.call_forwarding_state === 'ON' ? 'ON' : 'OFF';
        const liveNums = (statusRes.data.numbers || []).map((num: string) => {
          const matchedContact = portalContacts.find((c) => normalizeDid(c.number) === normalizeDid(num));
          return {
            name: matchedContact?.name || 'Active Destination',
            number: num,
          };
        });
        await db
          .from('services')
          .update({
            call_forwarding_state: liveState,
            active_forwarding_numbers: liveNums,
            forwarding_updated_at: new Date().toISOString(),
          })
          .eq('id', service_id);
      }

      return NextResponse.json({
        success: true,
        statusData: statusRes.data,
        savedNumbersData: listRes.data,
      });
    }

    // Action 5: Add Saved Forwarding Contact
    if (action === 'add_contact') {
      if (!organization_id || !contact_name?.trim() || !contact_number?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Organization, Contact Name, and Phone Number are required.' },
          { status: 400 }
        );
      }
      const { data: newContact, error: cErr } = await db
        .from('call_forwarding_contacts')
        .insert({
          organization_id,
          property_id: property_id || null,
          name: contact_name.trim(),
          phone_number: contact_number.trim(),
        })
        .select()
        .single();

      if (cErr) {
        return NextResponse.json({ success: false, error: cErr.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: newContact, message: 'Forwarding contact saved.' });
    }

    // Action 6: Delete Saved Forwarding Contact
    if (action === 'delete_contact') {
      if (!contact_id) {
        return NextResponse.json({ success: false, error: 'Contact ID is required.' }, { status: 400 });
      }
      await db.from('call_forwarding_contacts').delete().eq('id', contact_id);
      return NextResponse.json({ success: true, message: 'Forwarding contact removed.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

