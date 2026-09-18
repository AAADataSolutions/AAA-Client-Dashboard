import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ServiceRecord {
  id: string;
  custom_service_id?: string | null;
  service_name?: string | null;
  phone_number: string;
  service_type: string;
  service_type_id?: string;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  attached_properties?: any[];
  attached_property_name: string;
  attached_property_id?: string;
  property_id?: string;
  attached_organization_name: string;
  attached_organization_id?: string;
  created_at: string;
  updated_at?: string;
}

export type ServiceItem = ServiceRecord;

export interface ServiceMetrics {
  totalServicesCount: number;
  activeServicesCount: number;
  assignedServicesCount: number;
  inactiveOrSuspendedCount: number;
}

export interface ServicesState {
  items: ServiceRecord[];
  selectedService: ServiceRecord | null;
  serviceTypes: { id: string; name: string }[];
  metrics: ServiceMetrics;
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
    type: string;
    selectedType: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedStatus: string;
  selectedTypeFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: ServicesState = {
  items: [],
  selectedService: null,
  serviceTypes: [],
  metrics: {
    totalServicesCount: 0,
    activeServicesCount: 0,
    assignedServicesCount: 0,
    inactiveOrSuspendedCount: 0,
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
    type: 'ALL',
    selectedType: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedStatus: 'ALL',
  selectedTypeFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (params: any = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.type && params.type !== 'ALL') q.set('type', params.type);
    if (params.page) q.set('page', String(params.page));
    if (params.page_size) q.set('page_size', String(params.page_size));

    const res = await fetch(`/api/admin/services?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch services');
    }
    return json;
  }
);

export const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices: (
      state,
      action: PayloadAction<{
        data: ServiceRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: ServiceMetrics;
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
        state.metrics = action.payload.metrics;
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedService: (state, action: PayloadAction<ServiceRecord | null>) => {
      state.selectedService = action.payload;
    },
    setServiceTypes: (state, action: PayloadAction<{ id: string; name: string }[]>) => {
      state.serviceTypes = action.payload;
    },
    addServiceOptimistic: (state, action: PayloadAction<ServiceRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalServicesCount += 1;
      if (action.payload.status === 'ACTIVE') state.metrics.activeServicesCount += 1;
      else state.metrics.inactiveOrSuspendedCount += 1;
      if (action.payload.attached_property_name !== 'Unassigned') {
        state.metrics.assignedServicesCount += 1;
      }
    },
    updateServiceOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ServiceRecord> }>
    ) => {
      const idx = state.items.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedService && state.selectedService.id === action.payload.id) {
        state.selectedService = { ...state.selectedService, ...action.payload.updates };
      }
    },
    updateServiceStatusOptimistic: (
      state,
      action: PayloadAction<{ id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }>
    ) => {
      const svc = state.items.find((s) => s.id === action.payload.id);
      if (svc) {
        svc.status = action.payload.status;
      }
      if (state.selectedService && state.selectedService.id === action.payload.id) {
        state.selectedService.status = action.payload.status;
      }
    },
    optimisticUpdateServiceStatus: (
      state,
      action: PayloadAction<{ id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }>
    ) => {
      const svc = state.items.find((s) => s.id === action.payload.id);
      if (svc) {
        svc.status = action.payload.status;
      }
      if (state.selectedService && state.selectedService.id === action.payload.id) {
        state.selectedService.status = action.payload.status;
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
    setTypeFilter: (state, action: PayloadAction<string>) => {
      state.selectedTypeFilter = action.payload;
      state.filters.type = action.payload;
      state.filters.selectedType = action.payload;
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
        selectedTypeFilter?: string;
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
      if (action.payload.selectedTypeFilter !== undefined) {
        state.selectedTypeFilter = action.payload.selectedTypeFilter;
        state.filters.type = action.payload.selectedTypeFilter;
        state.filters.selectedType = action.payload.selectedTypeFilter;
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
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
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
          state.metrics = action.payload.metrics;
        }
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch services';
      });
  },
});

export const {
  setServices,
  setSelectedService,
  setServiceTypes,
  addServiceOptimistic,
  updateServiceOptimistic,
  updateServiceStatusOptimistic,
  optimisticUpdateServiceStatus,
  setSearchQuery,
  setStatusFilter,
  setTypeFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = servicesSlice.actions;

export default servicesSlice.reducer;
