import { createAdminClient } from '@/lib/supabase/admin';

export type PbxServerId = 1 | 2 | 3;

export const PBX_SERVERS: { id: PbxServerId; name: string; code: string; description: string }[] = [
  { id: 1, name: 'PBX 115', code: 'PBX-115', description: 'Primary Voice Cluster (Server 1)' },
  { id: 2, name: 'PBX 142', code: 'PBX-142', description: 'Secondary Voice Cluster (Server 2)' },
  { id: 3, name: 'PBX 240', code: 'PBX-240', description: 'Tertiary Voice Cluster (Server 3)' },
];

export function getPbxServerLabel(serverId?: number | null): string {
  switch (Number(serverId)) {
    case 1:
      return 'PBX 115 (Server 1)';
    case 2:
      return 'PBX 142 (Server 2)';
    case 3:
      return 'PBX 240 (Server 3)';
    default:
      return 'PBX 115 (Server 1)';
  }
}

export function normalizeDid(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  return String(rawPhone).replace(/[^0-9]/g, '');
}

export function normalizePortalUsername(rawInput?: string | null, fallbackName?: string | null): string {
  const candidate = (rawInput || '').trim().toLowerCase();
  if (candidate && candidate.length >= 3 && candidate.length <= 50 && /^[a-z0-9][a-z0-9._+@-]*$/i.test(candidate)) {
    return candidate;
  }
  const cleanFallback = (fallbackName || 'org_user')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 40);
  return cleanFallback.length >= 3 ? cleanFallback : `user_${cleanFallback}`;
}

export interface PbxApiResponse<T = any> {
  success: boolean;
  message?: string;
  error_code?: string;
  data?: T;
  simulated?: boolean;
  httpStatus?: number;
}

export interface ForwardingTarget {
  name: string;
  number: string;
}

export interface SavedForwardingContact {
  id: number | string;
  name: string;
  number: string;
  created_at?: string;
  updated_at?: string;
}

export interface CdrCallRecord {
  phone_number: string;
  date_time: string;
  src: string;
  dst: string;
  duration: number;
  disposition: 'ANSWERED' | 'NO ANSWER' | 'BUSY' | 'FAILED' | string;
}

function getPbxConfig() {
  const baseUrl = (process.env.PBX_PORTAL_BASE_URL || process.env.API_BASE_URL || '').trim().replace(/\/+$/, '');
  const username = (process.env.PBX_PORTAL_API_USERNAME || process.env.API_USERNAME || '').trim();
  const password = (process.env.PBX_PORTAL_API_PASSWORD || process.env.API_PASSWORD || '').trim();
  const isConfigured = Boolean(baseUrl && !baseUrl.includes('YOUR_DOMAIN') && !baseUrl.includes('<approved-api-host>') && username && password);
  return { baseUrl, username, password, isConfigured };
}

async function logPbxSyncEvent(params: {
  endpoint: string;
  action: string;
  organization_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  request_payload: Record<string, any>;
  response_status?: number;
  response_body?: Record<string, any>;
  success: boolean;
  error_code?: string | null;
  triggered_by?: string | null;
}) {
  try {
    const adminDb = createAdminClient();
    if (!adminDb) return;

    // Never log temporary_password in plain text per Section 3.1 & 16 security rules
    const sanitizedResponse = params.response_body ? JSON.parse(JSON.stringify(params.response_body)) : {};
    if (sanitizedResponse?.data?.temporary_password) {
      sanitizedResponse.data.temporary_password = '[REDACTED]';
    }

    await adminDb.from('pbx_sync_logs').insert({
      endpoint: params.endpoint,
      action: params.action,
      organization_id: params.organization_id || null,
      property_id: params.property_id || null,
      service_id: params.service_id || null,
      request_payload: params.request_payload,
      response_status: params.response_status || 200,
      response_body: sanitizedResponse,
      success: params.success,
      error_code: params.error_code || null,
      triggered_by: params.triggered_by || null,
    });
  } catch {
    // Non-blocking if pbx_sync_logs table is not migrated yet
  }
}

async function callPbxEndpoint<T = any>(
  endpointPath: string,
  payload: Record<string, any>,
  meta?: {
    organization_id?: string | null;
    property_id?: string | null;
    service_id?: string | null;
    triggered_by?: string | null;
  }
): Promise<PbxApiResponse<T>> {
  const { baseUrl, username, password, isConfigured } = getPbxConfig();
  const endpointName = endpointPath.replace('/api_v1/', '').replace('.php', '');
  const actionName = String(payload.action || 'status_check');

  if (!isConfigured) {
    const simulatedResult = buildSimulatedPbxResponse<T>(endpointPath, payload);
    await logPbxSyncEvent({
      endpoint: endpointName,
      action: actionName,
      organization_id: meta?.organization_id,
      property_id: meta?.property_id,
      service_id: meta?.service_id,
      request_payload: payload,
      response_status: 200,
      response_body: simulatedResult as any,
      success: true,
      triggered_by: meta?.triggered_by,
    });
    return simulatedResult;
  }

  try {
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    const url = `${baseUrl}${endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const rawText = await response.text();
    let jsonBody: any = {};
    try {
      jsonBody = rawText ? JSON.parse(rawText) : {};
    } catch {
      jsonBody = { success: false, error_code: 'INVALID_JSON_RESPONSE', message: rawText.slice(0, 300) };
    }

    const isSuccess = response.ok && jsonBody.success !== false;
    const result: PbxApiResponse<T> = {
      success: isSuccess,
      message: jsonBody.message,
      error_code: jsonBody.error_code,
      data: jsonBody.data,
      simulated: false,
      httpStatus: response.status,
    };

    await logPbxSyncEvent({
      endpoint: endpointName,
      action: actionName,
      organization_id: meta?.organization_id,
      property_id: meta?.property_id,
      service_id: meta?.service_id,
      request_payload: payload,
      response_status: response.status,
      response_body: jsonBody,
      success: isSuccess,
      error_code: jsonBody.error_code || (!isSuccess ? `HTTP_${response.status}` : null),
      triggered_by: meta?.triggered_by,
    });

    return result;
  } catch (err: any) {
    const errRes: PbxApiResponse<T> = {
      success: false,
      error_code: 'NETWORK_ERROR',
      message: err.message || 'Failed to reach Call Forwarding Portal API',
      httpStatus: 503,
    };

    await logPbxSyncEvent({
      endpoint: endpointName,
      action: actionName,
      organization_id: meta?.organization_id,
      property_id: meta?.property_id,
      service_id: meta?.service_id,
      request_payload: payload,
      response_status: 503,
      response_body: errRes as any,
      success: false,
      error_code: 'NETWORK_ERROR',
      triggered_by: meta?.triggered_by,
    });

    return errRes;
  }
}

/**
 * Provides spec-accurate responses matching Third-portal-integration.md
 * when PBX_PORTAL_BASE_URL is not yet configured in environment variables.
 */
function buildSimulatedPbxResponse<T = any>(endpointPath: string, payload: Record<string, any>): PbxApiResponse<T> {
  if (endpointPath.includes('management_group.php')) {
    const action = payload.action;
    if (action === 'create') {
      return {
        success: true,
        simulated: true,
        httpStatus: 201,
        message: 'Management group user created',
        data: {
          user_id: Math.floor(100 + Math.random() * 900),
          username: payload.username,
          hotel_name: payload.hotel_name,
          contact_name: payload.contact_name,
        } as any,
      };
    }
    if (action === 'get') {
      return {
        success: true,
        simulated: true,
        httpStatus: 200,
        data: {
          user_id: 101,
          username: payload.username,
          contact_name: payload.contact_name || 'Organization Admin',
          active: 1,
          hotel_name: payload.hotel_name || 'Hotel Portfolio',
        } as any,
      };
    }
    if (action === 'list') {
      return {
        success: true,
        simulated: true,
        httpStatus: 200,
        data: [] as any,
      };
    }
    if (action === 'update') {
      return {
        success: true,
        simulated: true,
        httpStatus: 200,
        message: 'Management group updated',
        data: {
          username: payload.new_username || payload.username,
          user_id: 101,
        } as any,
      };
    }
    if (action === 'deactivate') {
      return {
        success: true,
        simulated: true,
        httpStatus: 200,
        message: 'User deactivated',
      };
    }
  }

  if (endpointPath.includes('did_management_api.php')) {
    return {
      success: true,
      simulated: true,
      httpStatus: 200,
      message: 'DID associated with management user and PBX server successfully.',
      data: {
        username: payload.username,
        property_name: payload.property_name,
        did: payload.did,
        server_id: payload.server_id || 1,
      } as any,
    };
  }

  if (endpointPath.includes('call_forwarding_api.php')) {
    const isForwardOn = payload.action === 'forward_on';
    return {
      success: true,
      simulated: true,
      httpStatus: 200,
      message: isForwardOn
        ? 'Call forwarding enabled successfully.'
        : 'Call forwarding disabled and inbound route restored.',
      data: {
        did: payload.did,
        server_id: payload.server_id,
        call_forwarding_state: isForwardOn ? 'ON' : 'OFF',
        forwarding_numbers: isForwardOn ? payload.forwarding_numbers || [] : [],
      } as any,
    };
  }

  if (endpointPath.includes('forwarding_number_list_api.php')) {
    return {
      success: true,
      simulated: true,
      httpStatus: 200,
      message: 'Forwarding numbers retrieved successfully.',
      data: {
        username: payload.username,
        user_id: 101,
        total: 0,
        forwarding_numbers: [],
      } as any,
    };
  }

  if (endpointPath.includes('forwarding_status_api.php')) {
    return {
      success: true,
      simulated: true,
      httpStatus: 200,
      message: 'Call forwarding status retrieved successfully.',
      data: {
        did: payload.did,
        call_forwarding_state: 'OFF',
        numbers: [],
      } as any,
    };
  }

  if (endpointPath.includes('cdr_logs_api.php')) {
    const phone = normalizeDid(payload.phone_number) || '9497481060';
    const action = payload.action || 'incoming_calls';
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().replace('T', ' ').substring(0, 19);

    let sampleCalls: CdrCallRecord[] = [];
    if (action === 'incoming_calls') {
      sampleCalls = [
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 2 * 3600 * 1000)),
          src: '18025953380',
          dst: phone,
          duration: 142,
          disposition: 'ANSWERED',
        },
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 5 * 3600 * 1000)),
          src: '13125550194',
          dst: phone,
          duration: 68,
          disposition: 'ANSWERED',
        },
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 18 * 3600 * 1000)),
          src: '14075550122',
          dst: phone,
          duration: 0,
          disposition: 'NO ANSWER',
        },
      ];
    } else if (action === 'outgoing_calls') {
      sampleCalls = [
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 3 * 3600 * 1000)),
          src: phone,
          dst: '19048299088',
          duration: 95,
          disposition: 'ANSWERED',
        },
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 9 * 3600 * 1000)),
          src: phone,
          dst: '18005551212',
          duration: 210,
          disposition: 'ANSWERED',
        },
      ];
    } else if (action === 'e911_calls') {
      sampleCalls = [
        {
          phone_number: phone,
          date_time: fmt(new Date(now.getTime() - 48 * 3600 * 1000)),
          src: phone,
          dst: '933',
          duration: 34,
          disposition: 'ANSWERED',
        },
      ];
    }

    return {
      success: true,
      simulated: true,
      httpStatus: 200,
      message: 'CDR logs retrieved successfully.',
      data: {
        phone_number: phone,
        total: sampleCalls.length,
        calls: sampleCalls,
      } as any,
    };
  }

  return { success: true, simulated: true, httpStatus: 200 };
}

// ============================================================================
// PART I — MANAGEMENT GROUP API (/api_v1/management_group.php)
// ============================================================================

export async function pbxCreateManagementUser(params: {
  username: string;
  hotel_name: string;
  contact_name: string;
  organization_id?: string;
  triggered_by?: string;
}) {
  // Check if user already exists first (per Section 7: validate before create)
  const existing = await pbxGetManagementUser({
    username: params.username,
    organization_id: params.organization_id,
  });
  if (existing.success && existing.data?.user_id && !existing.simulated) {
    return existing;
  }

  return callPbxEndpoint<{
    user_id: number;
    username: string;
    hotel_name: string;
    contact_name: string;
    temporary_password?: string;
  }>(
    '/api_v1/management_group.php',
    {
      action: 'create',
      username: params.username,
      hotel_name: params.hotel_name,
      contact_name: params.contact_name,
    },
    { organization_id: params.organization_id, triggered_by: params.triggered_by }
  );
}

export async function pbxGetManagementUser(params: {
  username: string;
  organization_id?: string;
}) {
  return callPbxEndpoint<{
    user_id: number;
    username: string;
    contact_name: string;
    active: number;
    hotel_name: string;
  }>(
    '/api_v1/management_group.php',
    {
      action: 'get',
      username: params.username,
    },
    { organization_id: params.organization_id }
  );
}

export async function pbxListManagementUsers(params?: {
  limit?: number;
  offset?: number;
  triggered_by?: string;
}) {
  return callPbxEndpoint<
    Array<{
      user_id: number;
      username: string;
      contact_name: string;
      active: number;
      hotel_name: string;
    }>
  >(
    '/api_v1/management_group.php',
    {
      action: 'list',
      limit: Math.min(100, Math.max(1, params?.limit || 50)),
      offset: Math.max(0, params?.offset || 0),
    },
    { triggered_by: params?.triggered_by }
  );
}

export async function pbxUpdateManagementUser(params: {
  username: string;
  new_username?: string;
  hotel_name?: string;
  contact_name?: string;
  organization_id?: string;
  triggered_by?: string;
}) {
  const payload: Record<string, any> = {
    action: 'update',
    username: params.username,
  };
  if (params.new_username && params.new_username !== params.username) {
    payload.new_username = params.new_username;
  }
  if (params.hotel_name) payload.hotel_name = params.hotel_name;
  if (params.contact_name) payload.contact_name = params.contact_name;

  return callPbxEndpoint<{ username: string; user_id: number }>(
    '/api_v1/management_group.php',
    payload,
    { organization_id: params.organization_id, triggered_by: params.triggered_by }
  );
}

export async function pbxDeactivateManagementUser(params: {
  username: string;
  organization_id?: string;
  triggered_by?: string;
}) {
  return callPbxEndpoint(
    '/api_v1/management_group.php',
    {
      action: 'deactivate',
      username: params.username,
    },
    { organization_id: params.organization_id, triggered_by: params.triggered_by }
  );
}

// ============================================================================
// PART II — DID MANAGEMENT, CALL FORWARDING & CDR APIs
// ============================================================================

export async function pbxAddDid(params: {
  username: string;
  property_name: string;
  did: string;
  server_id: PbxServerId;
  organization_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  triggered_by?: string | null;
}) {
  const cleanDid = normalizeDid(params.did);
  return callPbxEndpoint(
    '/api_v1/did_management_api.php',
    {
      action: 'add',
      username: params.username,
      property_name: params.property_name,
      did: cleanDid,
      server_id: Number(params.server_id) || 1,
    },
    {
      organization_id: params.organization_id,
      property_id: params.property_id,
      service_id: params.service_id,
      triggered_by: params.triggered_by,
    }
  );
}

export async function pbxEnableCallForwarding(params: {
  username: string;
  did: string;
  server_id: PbxServerId;
  forwarding_numbers: ForwardingTarget[];
  organization_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  triggered_by?: string | null;
}) {
  const cleanDid = normalizeDid(params.did);
  const cleanedTargets = (params.forwarding_numbers || [])
    .map((t) => ({
      name: (t.name || 'Forwarding Contact').trim(),
      number: normalizeDid(t.number),
    }))
    .filter((t) => t.number.length > 0);

  return callPbxEndpoint(
    '/api_v1/call_forwarding_api.php',
    {
      action: 'forward_on',
      username: params.username,
      did: cleanDid,
      server_id: Number(params.server_id) || 1,
      forwarding_numbers: cleanedTargets,
    },
    {
      organization_id: params.organization_id,
      property_id: params.property_id,
      service_id: params.service_id,
      triggered_by: params.triggered_by,
    }
  );
}

export async function pbxDisableCallForwarding(params: {
  username: string;
  did: string;
  server_id: PbxServerId;
  organization_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  triggered_by?: string | null;
}) {
  const cleanDid = normalizeDid(params.did);
  return callPbxEndpoint(
    '/api_v1/call_forwarding_api.php',
    {
      action: 'forward_off',
      username: params.username,
      did: cleanDid,
      server_id: Number(params.server_id) || 1,
    },
    {
      organization_id: params.organization_id,
      property_id: params.property_id,
      service_id: params.service_id,
      triggered_by: params.triggered_by,
    }
  );
}

export async function pbxGetForwardingNumberList(params: {
  username: string;
  organization_id?: string | null;
}) {
  return callPbxEndpoint<{
    username: string;
    user_id: number;
    total: number;
    forwarding_numbers: SavedForwardingContact[];
  }>(
    '/api_v1/forwarding_number_list_api.php',
    {
      username: params.username,
      action: 'forwarding_number_list',
    },
    { organization_id: params.organization_id }
  );
}

export async function pbxGetForwardingStatus(params: {
  username: string;
  did: string;
  server_id: PbxServerId;
  organization_id?: string | null;
  service_id?: string | null;
}) {
  const cleanDid = normalizeDid(params.did);
  return callPbxEndpoint<{
    did: string;
    call_forwarding_state: 'ON' | 'OFF';
    numbers: string[];
  }>(
    '/api_v1/forwarding_status_api.php',
    {
      username: params.username,
      did: cleanDid,
      server_id: Number(params.server_id) || 1,
    },
    { organization_id: params.organization_id, service_id: params.service_id }
  );
}

export async function pbxGetCdrLogs(params: {
  action: 'incoming_calls' | 'outgoing_calls' | 'e911_calls';
  username: string;
  server_id: PbxServerId;
  phone_number: string;
  from_datetime: string;
  to_datetime: string;
  organization_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
}) {
  const cleanDid = normalizeDid(params.phone_number);
  return callPbxEndpoint<{
    phone_number: string;
    total: number;
    calls: CdrCallRecord[];
  }>(
    '/api_v1/cdr_logs_api.php',
    {
      action: params.action,
      username: params.username,
      server_id: Number(params.server_id) || 1,
      phone_number: cleanDid,
      from_datetime: params.from_datetime,
      to_datetime: params.to_datetime,
    },
    {
      organization_id: params.organization_id,
      property_id: params.property_id,
      service_id: params.service_id,
    }
  );
}

