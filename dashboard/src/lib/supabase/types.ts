export type AppRole = 'SUPER_ADMIN' | 'SUB_SUPER_ADMIN' | 'CLIENT_USER';
export type OrgMemberRole = 'ADMIN' | 'USER';
export type ProfileStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_ONBOARDING' | 'ARCHIVED';
export type MemberStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';
export type InviteType = 'INTERNAL_TEAM' | 'CLIENT_MEMBER';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  status: ProfileStatus;
  avatar_url?: string | null;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country: string;
  logo_url?: string | null;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  profile_id: string;
  organization_id: string;
  role: OrgMemberRole;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface UserAuthContext {
  profile: Profile | null;
  orgMembership: OrganizationMember | null;
  effectiveRole: 'SUPER_ADMIN' | 'SUB_SUPER_ADMIN' | 'ADMIN' | 'USER' | null;
}
