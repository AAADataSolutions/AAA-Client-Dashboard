import { AppRole, OrgMemberRole } from '../supabase/types';

export type EffectiveRole = 'SUPER_ADMIN' | 'SUB_SUPER_ADMIN' | 'ADMIN' | 'USER';

export function resolveEffectiveRole(
  appRole?: AppRole | null,
  orgRole?: OrgMemberRole | null
): EffectiveRole {
  if (appRole === 'SUPER_ADMIN') return 'SUPER_ADMIN';
  if (appRole === 'SUB_SUPER_ADMIN') return 'SUB_SUPER_ADMIN';
  if (orgRole === 'ADMIN') return 'ADMIN';
  return 'USER';
}

export function isInternalAdmin(role?: EffectiveRole | null): boolean {
  return role === 'SUPER_ADMIN' || role === 'SUB_SUPER_ADMIN';
}

export function isClientAdmin(role?: EffectiveRole | null): boolean {
  return role === 'ADMIN';
}

export function canManageOrganization(role?: EffectiveRole | null): boolean {
  return isInternalAdmin(role) || role === 'ADMIN';
}
