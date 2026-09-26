import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingAttachment {
  id?: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  created_at?: string;
}

export interface OnboardingRecord {
  id: string;
  property_id: string;
  property_name: string;
  address: string;
  property_address?: string;
  city: string;
  property_city?: string;
  state: string;
  property_state?: string;
  zip_code: string;
  organization_id: string;
  organization_name: string;
  stage: string;
  target_date?: string | null;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  property_status: string;
  status?: string;
  progress_pct?: number;
  e911_status?: string;
  ray_baum_status?: string;
  contract_sent_at?: string | null;
  signed_at?: string | null;
  porting_waiting_at?: string | null;
  porting_submitted_at?: string | null;
  sof_waiting_at?: string | null;
  foc_received_at?: string | null;
  completed_at?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  assigned_at?: string | null;
  internal_notes?: string | null;
  attachments?: OnboardingAttachment[];
  created_at: string;
  updated_at?: string;
}

export type OnboardingItem = OnboardingRecord;

export interface OnboardingMetrics {
  totalOnboardings: number;
  liveCutoverCount: number;
  portingInFlightCount: number;
  draftAndContractCount: number;
  inProgressCount: number;
  pendingReviewCount: number;
  completedCount: number;
}

export interface OnboardingState {
  items: OnboardingRecord[];
  selectedRecord: OnboardingRecord | null;
  metrics: OnboardingMetrics;
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
    stage: string;
    selectedStage: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedStageFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: OnboardingState = {
  items: [],
  selectedRecord: null,
  metrics: {
    totalOnboardings: 0,
    liveCutoverCount: 0,
    portingInFlightCount: 0,
    draftAndContractCount: 0,
    inProgressCount: 0,
    pendingReviewCount: 0,
    completedCount: 0,
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
    stage: 'ALL',
    selectedStage: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedStageFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchOnboardings = createAsyncThunk(
  'onboarding/fetchOnboardings',
  async (params: any = {}) => {
    const q = new URLSearchParams();
    const searchVal = params.searchQuery || params.search;
    if (searchVal) q.set('search', searchVal);
    const stageVal = params.stage || params.selectedStage;
    if (stageVal && stageVal !== 'ALL') q.set('stage', stageVal);
    if (params.page) q.set('page', String(params.page));
    const limitVal = params.limit || params.page_size;
    if (limitVal) q.set('limit', String(limitVal));
    if (params.sortBy) q.set('sortBy', params.sortBy);

    const res = await fetch(`/api/admin/onboarding?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch onboarding records');
    }
    return json;
  }
);

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setOnboardings: (
      state,
      action: PayloadAction<{
        data: OnboardingRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: Partial<OnboardingMetrics>;
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
        const m = action.payload.metrics;
        state.metrics = {
          totalOnboardings: m.totalOnboardings ?? 0,
          liveCutoverCount: m.liveCutoverCount ?? m.completedCount ?? 0,
          completedCount: m.completedCount ?? m.liveCutoverCount ?? 0,
          portingInFlightCount: m.portingInFlightCount ?? m.inProgressCount ?? 0,
          inProgressCount: m.inProgressCount ?? m.portingInFlightCount ?? 0,
          draftAndContractCount: m.draftAndContractCount ?? m.pendingReviewCount ?? 0,
          pendingReviewCount: m.pendingReviewCount ?? m.draftAndContractCount ?? 0,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedRecord: (state, action: PayloadAction<OnboardingRecord | null>) => {
      state.selectedRecord = action.payload;
    },
    addOnboardingOptimistic: (state, action: PayloadAction<OnboardingRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalOnboardings += 1;
      state.metrics.draftAndContractCount += 1;
      state.metrics.pendingReviewCount += 1;
    },
    updateOnboardingOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<OnboardingRecord> }>
    ) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        state.selectedRecord = { ...state.selectedRecord, ...action.payload.updates };
      }
    },
    updateStageOptimistic: (
      state,
      action: PayloadAction<{ id: string; stage: string; status?: string; timestampKey?: string }>
    ) => {
      const item = state.items.find((r) => r.id === action.payload.id);
      if (item) {
        item.stage = action.payload.stage;
        if (action.payload.status) {
          item.property_status = action.payload.status;
          item.status = action.payload.status;
        } else if (action.payload.stage === 'COMPLETED') {
          item.property_status = 'ACTIVE';
          item.status = 'ACTIVE';
        }
        if (action.payload.timestampKey) {
          (item as any)[action.payload.timestampKey] = new Date().toISOString();
        }
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        state.selectedRecord.stage = action.payload.stage;
        if (action.payload.status) {
          state.selectedRecord.property_status = action.payload.status;
          state.selectedRecord.status = action.payload.status;
        } else if (action.payload.stage === 'COMPLETED') {
          state.selectedRecord.property_status = 'ACTIVE';
          state.selectedRecord.status = 'ACTIVE';
        }
        if (action.payload.timestampKey) {
          (state.selectedRecord as any)[action.payload.timestampKey] = new Date().toISOString();
        }
      }
    },
    optimisticUpdateStage: (
      state,
      action: PayloadAction<{ id: string; stage: string; status?: string; timestampKey?: string }>
    ) => {
      const item = state.items.find((r) => r.id === action.payload.id);
      if (item) {
        item.stage = action.payload.stage;
        if (action.payload.status) {
          item.property_status = action.payload.status;
          item.status = action.payload.status;
        } else if (action.payload.stage === 'COMPLETED') {
          item.property_status = 'ACTIVE';
          item.status = 'ACTIVE';
        }
        if (action.payload.timestampKey) {
          (item as any)[action.payload.timestampKey] = new Date().toISOString();
        }
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        state.selectedRecord.stage = action.payload.stage;
        if (action.payload.status) {
          state.selectedRecord.property_status = action.payload.status;
          state.selectedRecord.status = action.payload.status;
        } else if (action.payload.stage === 'COMPLETED') {
          state.selectedRecord.property_status = 'ACTIVE';
          state.selectedRecord.status = 'ACTIVE';
        }
        if (action.payload.timestampKey) {
          (state.selectedRecord as any)[action.payload.timestampKey] = new Date().toISOString();
        }
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
    setStageFilter: (state, action: PayloadAction<string>) => {
      state.selectedStageFilter = action.payload;
      state.filters.stage = action.payload;
      state.filters.selectedStage = action.payload;
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
        selectedStageFilter?: string;
        currentPage?: number;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) {
        state.searchQuery = action.payload.searchQuery;
        state.filters.search = action.payload.searchQuery;
        state.filters.searchQuery = action.payload.searchQuery;
      }
      if (action.payload.selectedStageFilter !== undefined) {
        state.selectedStageFilter = action.payload.selectedStageFilter;
        state.filters.stage = action.payload.selectedStageFilter;
        state.filters.selectedStage = action.payload.selectedStageFilter;
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
      .addCase(fetchOnboardings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnboardings.fulfilled, (state, action) => {
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
          const m = action.payload.metrics;
          state.metrics = {
            totalOnboardings: m.totalOnboardings ?? 0,
            liveCutoverCount: m.liveCutoverCount ?? m.completedCount ?? 0,
            completedCount: m.completedCount ?? m.liveCutoverCount ?? 0,
            portingInFlightCount: m.portingInFlightCount ?? m.inProgressCount ?? 0,
            inProgressCount: m.inProgressCount ?? m.portingInFlightCount ?? 0,
            draftAndContractCount: m.draftAndContractCount ?? m.pendingReviewCount ?? 0,
            pendingReviewCount: m.pendingReviewCount ?? m.draftAndContractCount ?? 0,
          };
        }
      })
      .addCase(fetchOnboardings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch onboarding records';
      });
  },
});

export const {
  setOnboardings,
  setSelectedRecord,
  addOnboardingOptimistic,
  updateOnboardingOptimistic,
  updateStageOptimistic,
  optimisticUpdateStage,
  setSearchQuery,
  setStageFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
