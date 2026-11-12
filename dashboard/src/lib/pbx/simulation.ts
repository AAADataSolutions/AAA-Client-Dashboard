import { PbxApiResponse, CdrCallRecord, normalizeDid } from './types';

/**
 * Provides spec-accurate responses matching Third-portal-integration.md
 * when PBX_PORTAL_BASE_URL is not yet configured in environment variables.
 */
export function buildSimulatedPbxResponse<T = any>(endpointPath: string, payload: Record<string, any>): PbxApiResponse<T> {
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
