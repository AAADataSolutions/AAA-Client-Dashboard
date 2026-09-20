import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface PortingRecord {
  id: string;
  org_property_id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  property_location: string;
  property_phone: string;
  organization_id: string;
  organization_name: string;
  status: string;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  fax?: string;
  carrier_details?: string;
  is_activated?: boolean;
  attachments?: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }[];
  services_count: number;
  services: {
    id: string;
    phone_number: string;
    status: string;
    description?: string;
    service_type: string;
  }[];
  created_at: string;
  updated_at: string;
}

export type PortingItem = PortingRecord;

export interface PortingMetrics {
  totalRequests: number;
  inProgressCount: number;
  focReceivedCount: number;
  completedCount: number;
  actionRequiredCount: number;
  submittedCount: number;
}

export interface PortingState {
  items: PortingRecord[];
  selectedPorting: PortingRecord | null;
  metrics: PortingMetrics;
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
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedStatusFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: PortingState = {
  items: [],
  selectedPorting: null,
  metrics: {
    totalRequests: 0,
    inProgressCount: 0,
    focReceivedCount: 0,
    completedCount: 0,
    actionRequiredCount: 0,
    submittedCount: 0,
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
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedStatusFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchPortingRequests = createAsyncThunk(
  'porting/fetchPortingRequests',
  async (params: Record<string, any> | void = {}) => {
    const p = (params || {}) as Record<string, any>;
    const q = new URLSearchParams();
    if (p.search || p.searchQuery) q.set('search', p.search || p.searchQuery);
    if (p.status && p.status !== 'ALL') q.set('status', p.status);
    if (p.page) q.set('page', String(p.page));
    if (p.limit || p.page_size) q.set('limit', String(p.limit || p.page_size));
    if (p.sortBy) q.set('sortBy', p.sortBy);

    const res = await fetch(`/api/admin/porting?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch porting requests');
    }
    return json;
  }
);

export const portingSlice = createSlice({
  name: 'porting',
  initialState,
  reducers: {
    setPortingRequests: (
      state,
      action: PayloadAction<{
        data: PortingRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: Partial<PortingMetrics>;
      }>
    ) => {
      state.items = action.payload.data;
      if (action.payload.pagination) {
        const pg = action.payload.pagination;
        state.totalCount = pg.totalCount;
        state.totalPages = pg.totalPages;
        state.currentPage = pg.currentPage;
        state.pagination.page = pg.currentPage;
        state.pagination.currentPage = pg.currentPage;
        state.pagination.total = pg.totalCount;
        state.pagination.totalCount = pg.totalCount;
        state.pagination.totalPages = pg.totalPages;
      }
      if (action.payload.metrics) {
        const m = action.payload.metrics;
        state.metrics = {
          totalRequests: m.totalRequests ?? 0,
          inProgressCount: m.inProgressCount ?? 0,
          focReceivedCount: m.focReceivedCount ?? 0,
          completedCount: m.completedCount ?? 0,
          actionRequiredCount: m.actionRequiredCount ?? 0,
          submittedCount: m.submittedCount ?? 0,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedPorting: (state, action: PayloadAction<PortingRecord | null>) => {
      state.selectedPorting = action.payload;
    },
    addPortingOptimistic: (state, action: PayloadAction<PortingRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalRequests += 1;
      state.metrics.submittedCount += 1;
    },
    updatePortingOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<PortingRecord> }>
    ) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedPorting && state.selectedPorting.id === action.payload.id) {
        state.selectedPorting = { ...state.selectedPorting, ...action.payload.updates };
      }
    },
    optimisticUpdatePortingStatus: (
      state,
      action: PayloadAction<{ id: string; status: string }>
    ) => {
      const item = state.items.find((r) => r.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
      if (state.selectedPorting && state.selectedPorting.id === action.payload.id) {
        state.selectedPorting.status = action.payload.status;
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
      state.selectedStatusFilter = action.payload;
      state.filters.status = action.payload;
      state.filters.selectedStatus = action.payload;
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
      const pg = action.payload;
      const targetPage = pg.currentPage ?? pg.page;
      const targetLimit = pg.limit ?? pg.pageSize;
      const targetTotal = pg.totalCount ?? pg.total;

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
      if (pg.totalPages !== undefined) {
        state.totalPages = pg.totalPages;
        state.pagination.totalPages = pg.totalPages;
      }
    },
    setFilters: (
      state,
      action: PayloadAction<{
        searchQuery?: string;
        selectedStatusFilter?: string;
        currentPage?: number;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) {
        state.searchQuery = action.payload.searchQuery;
        state.filters.search = action.payload.searchQuery;
        state.filters.searchQuery = action.payload.searchQuery;
      }
      if (action.payload.selectedStatusFilter !== undefined) {
        state.selectedStatusFilter = action.payload.selectedStatusFilter;
        state.filters.status = action.payload.selectedStatusFilter;
        state.filters.selectedStatus = action.payload.selectedStatusFilter;
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
      .addCase(fetchPortingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        if (action.payload.pagination) {
          const pg = action.payload.pagination;
          state.totalCount = pg.totalCount;
          state.totalPages = pg.totalPages;
          state.currentPage = pg.currentPage;
          state.pagination = {
            page: pg.currentPage,
            currentPage: pg.currentPage,
            pageSize: (pg as any).pageSize || 10,
            limit: (pg as any).pageSize || 10,
            total: pg.totalCount,
            totalCount: pg.totalCount,
            totalPages: pg.totalPages,
          };
        }
        if (action.payload.metrics) {
          const m = action.payload.metrics;
          state.metrics = {
            totalRequests: m.totalRequests ?? 0,
            inProgressCount: m.inProgressCount ?? 0,
            focReceivedCount: m.focReceivedCount ?? 0,
            completedCount: m.completedCount ?? 0,
            actionRequiredCount: m.actionRequiredCount ?? 0,
            submittedCount: m.submittedCount ?? 0,
          };
        }
      })
      .addCase(fetchPortingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch porting requests';
      });
  },
});

export const {
  setPortingRequests,
  setSelectedPorting,
  addPortingOptimistic,
  updatePortingOptimistic,
  optimisticUpdatePortingStatus,
  setSearchQuery,
  setStatusFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = portingSlice.actions;

export default portingSlice.reducer;
