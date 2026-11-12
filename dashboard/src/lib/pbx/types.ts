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
