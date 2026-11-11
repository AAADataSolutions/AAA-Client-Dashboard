import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PbxServerId,
  getPbxServerLabel,
  normalizeDid,
  normalizePortalUsername,
  pbxGetCdrLogs,
  CdrCallRecord,
} from '@/lib/pbx/client';

function formatToPbxDatetime(rawDate?: string | null, isEndOfDay = false): string {
  if (!rawDate) {
    const now = new Date();
    if (!isEndOfDay) {
      const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      return `${start.toISOString().slice(0, 10)} 00:00:00`;
    }
    return `${now.toISOString().slice(0, 10)} 23:59:59`;
  }
  const clean = rawDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return `${clean} ${isEndOfDay ? '23:59:59' : '00:00:00'}`;
  }
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(clean)) {
    return clean;
  }
  const d = new Date(clean);
  if (isNaN(d.getTime())) {
    const fallback = new Date().toISOString().slice(0, 10);
    return `${fallback} ${isEndOfDay ? '23:59:59' : '00:00:00'}`;
  }
  return `${d.toISOString().slice(0, 10)} ${isEndOfDay ? '23:59:59' : '00:00:00'}`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get('action') || 'incoming_calls';
    const action: 'incoming_calls' | 'outgoing_calls' | 'e911_calls' =
      actionParam === 'outgoing_calls' || actionParam === 'e911_calls' ? actionParam : 'incoming_calls';

    const propertyId = searchParams.get('property_id') || '';
    const serviceId = searchParams.get('service_id') || '';
    const phoneParam = searchParams.get('phone_number') || '';
    const serverParam = searchParams.get('server_id') || '';
    const fromDate = formatToPbxDatetime(searchParams.get('from'), false);
    const toDate = formatToPbxDatetime(searchParams.get('to'), true);

    // Fetch available DIDs so the UI dropdown has all DIDs, properties, and servers
    const { data: rawServices } = await db
      .from('services')
      .select(`
        id,
        service_name,
        phone_number,
        normalized_did,
        pbx_server_id,
        property_id,
        property_links:organization_property_services(
          org_property:organization_properties(
            property:properties(id, name, main_phone, default_pbx_server_id),
            organization:organizations(id, name, email, portal_username)
          )
        )
      `)
      .order('created_at', { ascending: false });

    const { data: allProps } = await db
      .from('properties')
      .select('id, name, main_phone, default_pbx_server_id');
    const { data: allOrgProps } = await db
      .from('organization_properties')
      .select('property_id, organization:organizations(id, name, email, portal_username)');

    const propMap = new Map<string, any>();
    (allProps || []).forEach((p: any) => propMap.set(p.id, p));

    const orgByPropMap = new Map<string, any>();
    (allOrgProps || []).forEach((op: any) => {
      const org = Array.isArray(op.organization) ? op.organization[0] : op.organization;
      if (op.property_id && org) orgByPropMap.set(op.property_id, org);
    });

    const didOptions = (rawServices || []).map((s: any) => {
      const links = Array.isArray(s.property_links) ? s.property_links : s.property_links ? [s.property_links] : [];
      const firstOp = links[0]?.org_property;
      const p = (Array.isArray(firstOp?.property) ? firstOp?.property[0] : firstOp?.property) || (s.property_id ? propMap.get(s.property_id) : null);
      const o = (Array.isArray(firstOp?.organization) ? firstOp?.organization[0] : firstOp?.organization) || (p?.id ? orgByPropMap.get(p.id) : null);
      const serverId = ([1, 2, 3].includes(Number(s.pbx_server_id)) ? Number(s.pbx_server_id) : 1) as PbxServerId;
      return {
        service_id: s.id,
        phone_number: s.phone_number,
        normalized_did: s.normalized_did || normalizeDid(s.phone_number),
        property_id: p?.id || s.property_id || '',
        property_name: p?.name || 'Unassigned Property',
        organization_id: o?.id || '',
        organization_name: o?.name || 'Unassigned',
        portal_username: normalizePortalUsername(o?.portal_username || o?.email, o?.name || 'admin'),
        pbx_server_id: serverId,
        pbx_server_label: getPbxServerLabel(serverId),
      };
    });

    // Determine which DIDs to query
    let targetDids = didOptions;
    if (serviceId) {
      targetDids = didOptions.filter((d) => d.service_id === serviceId);
    } else if (phoneParam) {
      const cleanParam = normalizeDid(phoneParam);
      targetDids = didOptions.filter((d) => d.normalized_did === cleanParam);
      if (targetDids.length === 0 && cleanParam) {
        const prop = propertyId ? propMap.get(propertyId) : null;
        const org = propertyId ? orgByPropMap.get(propertyId) : null;
        const sId = ([1, 2, 3].includes(Number(serverParam)) ? Number(serverParam) : 1) as PbxServerId;
        targetDids = [
          {
            service_id: '',
            phone_number: phoneParam,
            normalized_did: cleanParam,
            property_id: propertyId,
            property_name: prop?.name || 'Property',
            organization_id: org?.id || '',
            organization_name: org?.name || 'Organization',
            portal_username: normalizePortalUsername(org?.portal_username || org?.email, org?.name || 'admin'),
            pbx_server_id: sId,
            pbx_server_label: getPbxServerLabel(sId),
          },
        ];
      }
    } else if (propertyId && propertyId !== 'ALL') {
      targetDids = didOptions.filter((d) => d.property_id === propertyId);
      // Fallback to property main_phone if property has no service lines attached yet
      if (targetDids.length === 0) {
        const prop = propMap.get(propertyId);
        const org = orgByPropMap.get(propertyId);
        if (prop?.main_phone) {
          const sId = ([1, 2, 3].includes(Number(prop.default_pbx_server_id)) ? Number(prop.default_pbx_server_id) : 1) as PbxServerId;
          targetDids = [
            {
              service_id: '',
              phone_number: prop.main_phone,
              normalized_did: normalizeDid(prop.main_phone),
              property_id: prop.id,
              property_name: prop.name,
              organization_id: org?.id || '',
              organization_name: org?.name || 'Organization',
              portal_username: normalizePortalUsername(org?.portal_username || org?.email, org?.name || prop.name),
              pbx_server_id: sId,
              pbx_server_label: getPbxServerLabel(sId),
            },
          ];
        }
      }
    } else {
      // Default to first 3 DIDs so initial page load is fast and informative
      targetDids = didOptions.slice(0, 3);
    }

    if (serverParam && serverParam !== 'ALL') {
      targetDids = targetDids.filter((d) => String(d.pbx_server_id) === String(serverParam));
    }

    const combinedCalls: Array<
      CdrCallRecord & {
        id: string;
        property_id: string;
        property_name: string;
        organization_name: string;
        pbx_server_id: number;
        pbx_server_label: string;
        call_type: string;
      }
    > = [];

    for (const didItem of targetDids.slice(0, 5)) {
      if (!didItem.normalized_did) continue;
      const cdrRes = await pbxGetCdrLogs({
        action,
        username: didItem.portal_username,
        server_id: didItem.pbx_server_id,
        phone_number: didItem.normalized_did,
        from_datetime: fromDate,
        to_datetime: toDate,
        organization_id: didItem.organization_id || null,
        property_id: didItem.property_id || null,
        service_id: didItem.service_id || null,
      });

      const calls = cdrRes.data?.calls || [];
      calls.forEach((c, idx) => {
        combinedCalls.push({
          ...c,
          id: `${didItem.normalized_did}-${c.date_time}-${idx}`,
          property_id: didItem.property_id,
          property_name: didItem.property_name,
          organization_name: didItem.organization_name,
          pbx_server_id: didItem.pbx_server_id,
          pbx_server_label: didItem.pbx_server_label,
          call_type: action,
        });
      });
    }

    combinedCalls.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

    const totalCalls = combinedCalls.length;
    const answeredCalls = combinedCalls.filter((c) => c.disposition === 'ANSWERED').length;
    const missedOrFailedCalls = totalCalls - answeredCalls;
    const totalDurationSeconds = combinedCalls.reduce((acc, c) => acc + (Number(c.duration) || 0), 0);

    return NextResponse.json({
      success: true,
      data: combinedCalls,
      didOptions,
      properties: (allProps || []).map((p: any) => ({ id: p.id, name: p.name })),
      queryWindow: { from_datetime: fromDate, to_datetime: toDate, action },
      metrics: {
        totalCalls,
        answeredCalls,
        missedOrFailedCalls,
        totalDurationSeconds,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}

