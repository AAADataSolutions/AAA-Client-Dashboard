import { createAdminClient } from '@/lib/supabase/admin';
import {
  PbxServerId,
  PBX_SERVERS,
  getPbxServerLabel,
  normalizeDid,
  normalizePortalUsername,
  PbxApiResponse,
  ForwardingTarget,
  SavedForwardingContact,
  CdrCallRecord,
} from './types';
import { buildSimulatedPbxResponse } from './simulation';

// Re-export everything from types and simulation so all callers work identically
export * from './types';
export * from './simulation';

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
