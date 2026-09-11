'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '../supabase/client';
import { Profile, OrganizationMember } from '../supabase/types';
import { EffectiveRole, resolveEffectiveRole } from './role-guards';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  orgMembership: OrganizationMember | null;
  effectiveRole: EffectiveRole | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  orgMembership: null,
  effectiveRole: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgMembership, setOrgMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setOrgMembership(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!profileErr && profileData) {
        setProfile(profileData as Profile);
      } else {
        // Fallback profile from metadata if DB trigger is async
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: currentUser.user_metadata?.role || 'CLIENT_USER',
          status: 'ACTIVE',
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at || currentUser.created_at,
        });
      }

      // 2. Fetch Organization Membership
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('profile_id', currentUser.id)
        .maybeSingle();

      if (memberData) {
        setOrgMembership(memberData as OrganizationMember);
      } else if (currentUser.user_metadata?.initial_org_role) {
        // Temporary placeholder membership until organization onboarding step
        setOrgMembership({
          id: 'temp-id',
          profile_id: currentUser.id,
          organization_id: 'pending-org',
          role: currentUser.user_metadata.initial_org_role,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error fetching user auth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await fetchUserData(session?.user ?? null);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        await fetchUserData(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setOrgMembership(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrgMembership(null);
    setLoading(false);
    window.location.href = '/auth';
  };

  const effectiveRole = useMemo(() => {
    if (!profile) return null;
    return resolveEffectiveRole(profile.role, orgMembership?.role);
  }, [profile, orgMembership]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        orgMembership,
        effectiveRole,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
