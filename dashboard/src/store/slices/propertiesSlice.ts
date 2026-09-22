import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface PropertyContact {
  id: string;
  property_id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: string;
  is_primary: boolean;
  created_at?: string;
}

export interface PropertyRecord {
  id: string;
  name: string;
  monthly_price?: number | null;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone?: string | null;
  fax?: string | null;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  contact_person_name?: string | null;
  contact_person_email?: string | null;
  status: string;
  onboarding_stage?: string;
  services_count: number;
  e911_status: string;
  ray_baum_status: string;
  ray_baud_and_logs_enabled?: boolean;
  organization_id?: string | null;
  organization_name?: string | null;
  organization_property_id?: string | null;
  is_assigned?: boolean;
  primary_organization?: any;
  organizations?: any;
  created_at: string;
  updated_at?: string;
}

export type PropertyItem = PropertyRecord;

export interface PropertyMetrics {
  totalProperties: number;
  psapVerifiedCount: number;
  e911VerifiedCount: number;
  associatedServicesCount: number;
  totalServicesCount: number;
  pendingOrInactiveCount: number;
}

export interface PropertiesState {
  items: PropertyRecord[];
  selectedProperty: PropertyRecord | null;
  propertyContacts: Record<string, PropertyContact[]>;
  propertyServices: Record<string, any[]>;
  metrics: PropertyMetrics;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    totalCount: number;
  };
  filters: {
    search: string;
    searchQuery: string;
    status: string;
    selectedStatus: string;
    orgId: string;
    selectedOrg: string;
    selectedOrgFilter: string;
    e911Status: string;
    selectedE911: string;
    selectedE911Filter: string;
    rayBaum?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedStatus: string;
  selectedOrgFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: PropertiesState = {
  items: [],
  selectedProperty: null,
  propertyContacts: {},
  propertyServices: {},
  metrics: {
    totalProperties: 0,
    psapVerifiedCount: 0,
    e911VerifiedCount: 0,
    associatedServicesCount: 0,
    totalServicesCount: 0,
    pendingOrInactiveCount: 0,
  },
  totalCount: 0,
  totalPages: 1,
  currentPage: 1,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    totalCount: 0,
  },
  filters: {
    search: '',
    searchQuery: '',
    status: 'ALL',
    selectedStatus: 'ALL',
    orgId: 'ALL',
    selectedOrg: 'ALL',
    selectedOrgFilter: 'ALL',
    e911Status: 'ALL',
    selectedE911: 'ALL',
    selectedE911Filter: 'ALL',
    rayBaum: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedStatus: 'ALL',
  selectedOrgFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (params: any = {}) => {
    const q = new URLSearchParams();
    const searchVal = params.searchQuery || params.search;
    if (searchVal) q.set('search', searchVal);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    const orgVal = params.orgId || params.org_id;
    if (orgVal && orgVal !== 'ALL') q.set('orgId', orgVal);
    const e911Val = params.e911Status || params.selectedE911 || params.e911;
    if (e911Val && e911Val !== 'ALL') q.set('e911', e911Val);
    const rayBaumVal = params.rayBaum || params.selectedRayBaum;
    if (rayBaumVal && rayBaumVal !== 'ALL') q.set('rayBaum', rayBaumVal);
    if (params.page) q.set('page', String(params.page));
    const limitVal = params.limit || params.page_size;
    if (limitVal) q.set('limit', String(limitVal));
    if (params.sortBy) q.set('sortBy', params.sortBy);

    const res = await fetch(`/api/admin/properties?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch properties');
    }
    return json;
  }
);

export const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setProperties: (
      state,
      action: PayloadAction<{
        data: PropertyRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: PropertyMetrics;
      }>
    ) => {
      state.items = action.payload.data;
      if (action.payload.pagination) {
        const p = action.payload.pagination;
        state.totalCount = p.totalCount;
        state.totalPages = p.totalPages;
        state.currentPage = p.currentPage;
        state.pagination.page = p.currentPage;
        state.pagination.currentPage = p.currentPage;
        state.pagination.total = p.totalCount;
        state.pagination.totalCount = p.totalCount;
        state.pagination.totalPages = p.totalPages;
      }
      if (action.payload.metrics) {
        state.metrics = {
          ...state.metrics,
          ...action.payload.metrics,
          e911VerifiedCount: (action.payload.metrics as any).e911VerifiedCount ?? action.payload.metrics.psapVerifiedCount,
          totalServicesCount: (action.payload.metrics as any).totalServicesCount ?? action.payload.metrics.associatedServicesCount,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedProperty: (state, action: PayloadAction<PropertyRecord | null>) => {
      state.selectedProperty = action.payload;
    },
    setPropertyContacts: (
      state,
      action: PayloadAction<{ propertyId: string; contacts: PropertyContact[] }>
    ) => {
      state.propertyContacts[action.payload.propertyId] = action.payload.contacts;
    },
    setPropertyServices: (
      state,
      action: PayloadAction<{ propertyId: string; services: any[] }>
    ) => {
      state.propertyServices[action.payload.propertyId] = action.payload.services;
    },
    addPropertyOptimistic: (state, action: PayloadAction<PropertyRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalProperties += 1;
      if (action.payload.status === 'ACTIVE') {
        state.metrics.psapVerifiedCount += 1;
        state.metrics.e911VerifiedCount += 1;
      } else {
        state.metrics.pendingOrInactiveCount += 1;
      }
    },
    updatePropertyOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<PropertyRecord> }>
    ) => {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedProperty && state.selectedProperty.id === action.payload.id) {
        state.selectedProperty = { ...state.selectedProperty, ...action.payload.updates };
      }
    },
    updatePropertyStatusOptimistic: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const prop = state.items.find((p) => p.id === action.payload.id);
      if (prop) {
        prop.status = action.payload.status;
      }
      if (state.selectedProperty && state.selectedProperty.id === action.payload.id) {
        state.selectedProperty.status = action.payload.status;
      }
    },
    optimisticUpdatePropertyStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const prop = state.items.find((p) => p.id === action.payload.id);
      if (prop) {
        prop.status = action.payload.status;
      }
      if (state.selectedProperty && state.selectedProperty.id === action.payload.id) {
        state.selectedProperty.status = action.payload.status;
      }
    },
    optimisticRemoveProperty: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      state.metrics.totalProperties = Math.max(0, state.metrics.totalProperties - 1);
    },
    addPropertyContactOptimistic: (
      state,
      action: PayloadAction<{ propertyId: string; contact: PropertyContact }>
    ) => {
      const { propertyId, contact } = action.payload;
      if (!state.propertyContacts[propertyId]) state.propertyContacts[propertyId] = [];
      if (contact.is_primary) {
        state.propertyContacts[propertyId] = state.propertyContacts[propertyId].map((c) => ({
          ...c,
          is_primary: false,
        }));
      }
      state.propertyContacts[propertyId].unshift(contact);
    },
    removePropertyContactOptimistic: (
      state,
      action: PayloadAction<{ propertyId: string; contactId: string }>
    ) => {
      const { propertyId, contactId } = action.payload;
      if (state.propertyContacts[propertyId]) {
        state.propertyContacts[propertyId] = state.propertyContacts[propertyId].filter(
          (c) => c.id !== contactId
        );
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filters.search = action.payload;
      state.filters.searchQuery = action.payload;
      state.currentPage = 1;
      state.pagination.page = 1;
      state.pagination.currentPage = 1;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.selectedStatus = action.payload;
      state.filters.status = action.payload;
      state.filters.selectedStatus = action.payload;
      state.currentPage = 1;
      state.pagination.page = 1;
      state.pagination.currentPage = 1;
    },
    setOrgFilter: (state, action: PayloadAction<string>) => {
      state.selectedOrgFilter = action.payload;
      state.filters.orgId = action.payload;
      state.filters.selectedOrgFilter = action.payload;
      state.currentPage = 1;
      state.pagination.page = 1;
      state.pagination.currentPage = 1;
    },
    setE911Filter: (state, action: PayloadAction<string>) => {
      state.filters.e911Status = action.payload;
      state.filters.selectedE911Filter = action.payload;
      state.currentPage = 1;
      state.pagination.page = 1;
      state.pagination.currentPage = 1;
    },
    setRayBaumFilter: (state, action: PayloadAction<string>) => {
      state.filters.rayBaum = action.payload;
      state.currentPage = 1;
      state.pagination.page = 1;
      state.pagination.currentPage = 1;
    },
    setSortBy: (
      state,
      action: PayloadAction<string | { sortBy: string; sortOrder: 'asc' | 'desc' }>
    ) => {
      if (typeof action.payload === 'string') {
        state.filters.sortBy = action.payload;
      } else {
        state.filters.sortBy = action.payload.sortBy;
        state.filters.sortOrder = action.payload.sortOrder;
      }
    },
    setPagination: (
      state,
      action: PayloadAction<
        Partial<{
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
          currentPage: number;
          limit: number;
          totalCount: number;
        }>
      >
    ) => {
      const p = action.payload;
      const targetPage = p.currentPage ?? p.page;
      const targetLimit = p.limit ?? p.pageSize;
      const targetTotal = p.totalCount ?? p.total;

      if (targetPage !== undefined) {
        state.currentPage = targetPage;
        state.pagination.page = targetPage;
        state.pagination.currentPage = targetPage;
      }
      if (targetLimit !== undefined) {
        state.pagination.pageSize = targetLimit;
        state.pagination.limit = targetLimit;
      }
      if (targetTotal !== undefined) {
        state.totalCount = targetTotal;
        state.pagination.total = targetTotal;
        state.pagination.totalCount = targetTotal;
      }
      if (p.totalPages !== undefined) {
        state.totalPages = p.totalPages;
        state.pagination.totalPages = p.totalPages;
      }
    },
    setFilters: (
      state,
      action: PayloadAction<{
        searchQuery?: string;
        selectedStatus?: string;
        selectedOrgFilter?: string;
        currentPage?: number;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) {
        state.searchQuery = action.payload.searchQuery;
        state.filters.search = action.payload.searchQuery;
        state.filters.searchQuery = action.payload.searchQuery;
      }
      if (action.payload.selectedStatus !== undefined) {
        state.selectedStatus = action.payload.selectedStatus;
        state.filters.status = action.payload.selectedStatus;
        state.filters.selectedStatus = action.payload.selectedStatus;
      }
      if (action.payload.selectedOrgFilter !== undefined) {
        state.selectedOrgFilter = action.payload.selectedOrgFilter;
        state.filters.orgId = action.payload.selectedOrgFilter;
        state.filters.selectedOrgFilter = action.payload.selectedOrgFilter;
      }
      if (action.payload.currentPage !== undefined) {
        state.currentPage = action.payload.currentPage;
        state.pagination.page = action.payload.currentPage;
        state.pagination.currentPage = action.payload.currentPage;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        if (action.payload.pagination) {
          const p = action.payload.pagination;
          state.totalCount = p.totalCount;
          state.totalPages = p.totalPages;
          state.currentPage = p.currentPage;
          state.pagination = {
            page: p.currentPage,
            currentPage: p.currentPage,
            pageSize: (p as any).pageSize || 10,
            limit: (p as any).pageSize || 10,
            total: p.totalCount,
            totalCount: p.totalCount,
            totalPages: p.totalPages,
          };
        }
        if (action.payload.metrics) {
          state.metrics = {
            ...state.metrics,
            ...action.payload.metrics,
            e911VerifiedCount: (action.payload.metrics as any).e911VerifiedCount ?? action.payload.metrics.psapVerifiedCount,
            totalServicesCount: (action.payload.metrics as any).totalServicesCount ?? action.payload.metrics.associatedServicesCount,
          };
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch properties';
      });
  },
});

export const {
  setProperties,
  setSelectedProperty,
  setPropertyContacts,
  setPropertyServices,
  addPropertyOptimistic,
  updatePropertyOptimistic,
  updatePropertyStatusOptimistic,
  optimisticUpdatePropertyStatus,
  optimisticRemoveProperty,
  addPropertyContactOptimistic,
  removePropertyContactOptimistic,
  setSearchQuery,
  setStatusFilter,
  setOrgFilter,
  setE911Filter,
  setRayBaumFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = propertiesSlice.actions;

export default propertiesSlice.reducer;
