import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OrgContact {
  id: string;
  profile_id?: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_primary: boolean;
  status: string;
  created_at?: string;
}

export interface OrgRecord {
  id: string;
  name: string;
  logo_url?: string | null;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  status: string;
  properties_count: number;
  people_count: number;
  created_at: string;
  updated_at?: string;
  properties?: any[];
  contacts?: OrgContact[];
  members?: any;
}

export interface OrgMetrics {
  totalOrganizations: number;
  activeOrganizations: number;
  pendingOrInvited: number;
  totalProperties: number;
  noPropertiesCount: number;
}

interface OrganizationsState {
  items: OrgRecord[];
  selectedOrg: OrgRecord | null;
  orgContacts: Record<string, OrgContact[]>;
  orgProperties: Record<string, any[]>;
  metrics: OrgMetrics;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  selectedStatus: string;
  selectedPropFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationsState = {
  items: [],
  selectedOrg: null,
  orgContacts: {},
  orgProperties: {},
  metrics: {
    totalOrganizations: 0,
    activeOrganizations: 0,
    pendingOrInvited: 0,
    totalProperties: 0,
    noPropertiesCount: 0,
  },
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  searchQuery: '',
  selectedStatus: 'ALL',
  selectedPropFilter: 'ALL',
  loading: false,
  error: null,
};

export const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setOrganizations: (
      state,
      action: PayloadAction<{
        data: OrgRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: OrgMetrics;
      }>
    ) => {
      state.items = action.payload.data;
      if (action.payload.pagination) {
        state.totalCount = action.payload.pagination.totalCount;
        state.totalPages = action.payload.pagination.totalPages;
        state.currentPage = action.payload.pagination.currentPage;
      }
      if (action.payload.metrics) {
        state.metrics = action.payload.metrics;
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedOrg: (state, action: PayloadAction<OrgRecord | null>) => {
      state.selectedOrg = action.payload;
    },
    setOrgContacts: (
      state,
      action: PayloadAction<{ orgId: string; contacts: OrgContact[] }>
    ) => {
      state.orgContacts[action.payload.orgId] = action.payload.contacts;
    },
    setOrgProperties: (
      state,
      action: PayloadAction<{ orgId: string; properties: any[] }>
    ) => {
      state.orgProperties[action.payload.orgId] = action.payload.properties;
    },
    addOrganizationOptimistic: (state, action: PayloadAction<OrgRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalOrganizations += 1;
      if (action.payload.status === 'ACTIVE') state.metrics.activeOrganizations += 1;
      else state.metrics.pendingOrInvited += 1;
      if (action.payload.properties_count === 0) state.metrics.noPropertiesCount += 1;
    },
    updateOrganizationOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<OrgRecord> }>
    ) => {
      const idx = state.items.findIndex((o) => o.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedOrg && state.selectedOrg.id === action.payload.id) {
        state.selectedOrg = { ...state.selectedOrg, ...action.payload.updates };
      }
    },
    updateOrgStatusOptimistic: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const org = state.items.find((o) => o.id === action.payload.id);
      if (org) {
        const oldStatus = org.status;
        org.status = action.payload.status;
        if (oldStatus === 'ACTIVE' && action.payload.status !== 'ACTIVE') {
          state.metrics.activeOrganizations = Math.max(0, state.metrics.activeOrganizations - 1);
        } else if (oldStatus !== 'ACTIVE' && action.payload.status === 'ACTIVE') {
          state.metrics.activeOrganizations += 1;
        }
      }
      if (state.selectedOrg && state.selectedOrg.id === action.payload.id) {
        state.selectedOrg.status = action.payload.status;
      }
    },
    setPrimaryContactOptimistic: (
      state,
      action: PayloadAction<{ orgId: string; contactId: string; name: string; email: string; phone?: string }>
    ) => {
      const { orgId, contactId, name, email, phone } = action.payload;
      // Update contacts list
      if (state.orgContacts[orgId]) {
        state.orgContacts[orgId] = state.orgContacts[orgId].map((c) => ({
          ...c,
          is_primary: c.id === contactId,
          role: c.id === contactId ? 'ADMIN' : 'USER',
        }));
      }
      // Update org record primary contact name & email
      const org = state.items.find((o) => o.id === orgId);
      if (org) {
        org.contact_name = name;
        org.email = email;
        if (phone) org.phone = phone;
      }
      if (state.selectedOrg && state.selectedOrg.id === orgId) {
        state.selectedOrg.contact_name = name;
        state.selectedOrg.email = email;
        if (phone) state.selectedOrg.phone = phone;
      }
    },
    addOrgContactOptimistic: (
      state,
      action: PayloadAction<{ orgId: string; contact: OrgContact }>
    ) => {
      const { orgId, contact } = action.payload;
      if (!state.orgContacts[orgId]) state.orgContacts[orgId] = [];
      if (contact.is_primary) {
        state.orgContacts[orgId] = state.orgContacts[orgId].map((c) => ({ ...c, is_primary: false }));
        const org = state.items.find((o) => o.id === orgId);
        if (org) {
          org.contact_name = contact.name;
          org.email = contact.email;
          if (contact.phone) org.phone = contact.phone;
        }
      }
      state.orgContacts[orgId].unshift(contact);
      const org = state.items.find((o) => o.id === orgId);
      if (org) org.people_count = (org.people_count || 0) + 1;
    },
    removeOrgContactOptimistic: (
      state,
      action: PayloadAction<{ orgId: string; contactId: string }>
    ) => {
      const { orgId, contactId } = action.payload;
      if (state.orgContacts[orgId]) {
        state.orgContacts[orgId] = state.orgContacts[orgId].filter((c) => c.id !== contactId);
      }
      const org = state.items.find((o) => o.id === orgId);
      if (org) {
        org.people_count = Math.max(0, (org.people_count || 1) - 1);
      }
    },
    unassignOrgPropertyOptimistic: (
      state,
      action: PayloadAction<{ orgId: string; propertyId: string }>
    ) => {
      const { orgId, propertyId } = action.payload;
      if (state.orgProperties[orgId]) {
        state.orgProperties[orgId] = state.orgProperties[orgId].filter((p) => p.id !== propertyId && p.property_id !== propertyId);
      }
      const org = state.items.find((o) => o.id === orgId);
      if (org) {
        org.properties_count = Math.max(0, org.properties_count - 1);
      }
    },
    setFilters: (
      state,
      action: PayloadAction<{
        searchQuery?: string;
        selectedStatus?: string;
        selectedPropFilter?: string;
        currentPage?: number;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) state.searchQuery = action.payload.searchQuery;
      if (action.payload.selectedStatus !== undefined) state.selectedStatus = action.payload.selectedStatus;
      if (action.payload.selectedPropFilter !== undefined) state.selectedPropFilter = action.payload.selectedPropFilter;
      if (action.payload.currentPage !== undefined) state.currentPage = action.payload.currentPage;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setOrganizations,
  setSelectedOrg,
  setOrgContacts,
  setOrgProperties,
  addOrganizationOptimistic,
  updateOrganizationOptimistic,
  updateOrgStatusOptimistic,
  setPrimaryContactOptimistic,
  addOrgContactOptimistic,
  removeOrgContactOptimistic,
  unassignOrgPropertyOptimistic,
  setFilters,
  setLoading,
  setError,
} = organizationsSlice.actions;

export default organizationsSlice.reducer;
