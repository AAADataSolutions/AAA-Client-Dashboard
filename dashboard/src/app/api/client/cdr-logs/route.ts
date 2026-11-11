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
      return NextResponse.json({
        success: true,
        data: [],
        didOptions: [],
        properties: [],
        metrics: { totalCalls: 0, answeredCalls: 0, missedOrFailedCalls: 0, totalDurationSeconds: 0 },
      });
    }

    const orgId = member.organization_id;
    const { data: org } = await db
      .from('organizations')
      .select('id, name, email, portal_username')
      .eq('id', orgId)
      .maybeSingle();

    const portalUsername = normalizePortalUsername(org?.portal_username || org?.email, org?.name || 'client');

    const { searchParams } = new URL(request.url);
    const actionParam = searchParams.get('action') || 'incoming_calls';
    const action: 'incoming_calls' | 'outgoing_calls' | 'e911_calls' =
      actionParam === 'outgoing_calls' || actionParam === 'e911_calls' ? actionParam : 'incoming_calls';
    const propertyId = searchParams.get('property_id') || '';
    const serviceId = searchParams.get('service_id') || '';
    const phoneParam = searchParams.get('phone_number') || '';
    const fromDate = formatToPbxDatetime(searchParams.get('from'), false);
    const toDate = formatToPbxDatetime(searchParams.get('to'), true);

    const { data: orgProps } = await db
      .from('organization_properties')
      .select('id, property_id, property:properties(id, name, main_phone, default_pbx_server_id)')
      .eq('organization_id', orgId);

    const orgPropIds = (orgProps || []).map((op: any) => op.id);
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

    const didOptions: {
      service_id: string;
      phone_number: string;
      normalized_did: string;
      property_id: string;
      property_name: string;
      pbx_server_id: PbxServerId;
      pbx_server_label: string;
    }[] = [];

    if (orgPropIds.length > 0) {
      const { data: opsLinks } = await db
        .from('organization_property_services')
        .select('organization_property_id, service:services(id, phone_number, normalized_did, pbx_server_id, property_id)')
        .in('organization_property_id', orgPropIds);

      (opsLinks || []).forEach((link: any) => {
        const s = Array.isArray(link.service) ? link.service[0] : link.service;
        if (!s) return;
        const p = propByOpId.get(link.organization_property_id) || (s.property_id ? propById.get(s.property_id) : null);
        const sId = ([1, 2, 3].includes(Number(s.pbx_server_id)) ? Number(s.pbx_server_id) : 1) as PbxServerId;
        didOptions.push({
          service_id: s.id,
          phone_number: s.phone_number,
          normalized_did: s.normalized_did || normalizeDid(s.phone_number),
          property_id: p?.id || s.property_id || '',
          property_name: p?.name || 'Property',
          pbx_server_id: sId,
          pbx_server_label: getPbxServerLabel(sId),
        });
      });
    }

    // Also include property main_phone if a property has no service lines attached yet
    propertiesList.forEach((pItem) => {
      const fullProp = propById.get(pItem.id);
      if (fullProp?.main_phone && !didOptions.some((d) => d.property_id === pItem.id)) {
        const sId = ([1, 2, 3].includes(Number(fullProp.default_pbx_server_id)) ? Number(fullProp.default_pbx_server_id) : 1) as PbxServerId;
        didOptions.push({
          service_id: `prop-${pItem.id}`,
          phone_number: fullProp.main_phone,
          normalized_did: normalizeDid(fullProp.main_phone),
          property_id: pItem.id,
          property_name: pItem.name,
          pbx_server_id: sId,
          pbx_server_label: getPbxServerLabel(sId),
        });
      }
    });

    let targetDids = didOptions;
    if (serviceId && serviceId !== 'ALL') {
      targetDids = didOptions.filter((d) => d.service_id === serviceId);
    } else if (phoneParam) {
      const cleanParam = normalizeDid(phoneParam);
      targetDids = didOptions.filter((d) => d.normalized_did === cleanParam);
    } else if (propertyId && propertyId !== 'ALL') {
      targetDids = didOptions.filter((d) => d.property_id === propertyId);
    } else {
      targetDids = didOptions.slice(0, 3);
    }

    const combinedCalls: Array<
      CdrCallRecord & {
        id: string;
        property_id: string;
        property_name: string;
        pbx_server_id: number;
        pbx_server_label: string;
        call_type: string;
      }
    > = [];

    for (const didItem of targetDids.slice(0, 5)) {
      if (!didItem.normalized_did) continue;
      const cdrRes = await pbxGetCdrLogs({
        action,
        username: portalUsername,
        server_id: didItem.pbx_server_id,
        phone_number: didItem.normalized_did,
        from_datetime: fromDate,
        to_datetime: toDate,
        organization_id: orgId,
        property_id: didItem.property_id || null,
        service_id: didItem.service_id.startsWith('prop-') ? null : didItem.service_id,
      });

      const calls = cdrRes.data?.calls || [];
      calls.forEach((c, idx) => {
        combinedCalls.push({
          ...c,
          id: `${didItem.normalized_did}-${c.date_time}-${idx}`,
          property_id: didItem.property_id,
          property_name: didItem.property_name,
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
      properties: propertiesList,
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

