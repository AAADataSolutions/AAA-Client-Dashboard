import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'SUB_SUPER_ADMIN' | 'CLIENT_USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone_number?: string | null;
  avatar_url?: string | null;
}

export interface OrgMembership {
  id: string;
  organization_id: string;
  role: 'ADMIN' | 'USER';
  organization?: {
    id: string;
    name: string;
    status: string;
  };
}

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  orgMembership: OrgMembership | null;
  effectiveRole: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  orgMembership: null,
  effectiveRole: 'SUPER_ADMIN',
  isLoading: false,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (
      state,
      action: PayloadAction<{
        user: any;
        profile: UserProfile | null;
        orgMembership: OrgMembership | null;
        effectiveRole: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.profile = action.payload.profile;
      state.orgMembership = action.payload.orgMembership;
      state.effectiveRole = action.payload.effectiveRole;
      state.isAuthenticated = !!action.payload.user;
      state.isLoading = false;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.orgMembership = null;
      state.effectiveRole = '';
      state.isAuthenticated = false;
      state.isLoading = false;
    },
  },
});

export const { setAuthState, updateProfile, setLoading, logout } = authSlice.actions;
export default authSlice.reducer;
