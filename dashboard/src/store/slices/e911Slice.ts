import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface CorrectionNoteItem {
  id: string;
  author_name: string;
  created_at: string;
  note: string;
}

export interface E911Record {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  property_details?: any;
  organization_id?: string | null;
  organization_name: string;
  emergency_address: string;
  status: 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUIRED' | 'FAILED';
  ray_baum_compliant: boolean;
  correction_notes?: string | null;
  correction_history?: CorrectionNoteItem[];
  psap_id?: string | null;
  verified_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export type E911Item = E911Record;

export interface E911Metrics {
  totalRecordsCount: number;
  psapVerifiedCount: number;
  verifiedCount: number;
  correctionRequiredCount: number;
  pendingValidationCount: number;
  pendingOrFailedCount: number;
}

export interface E911State {
  items: E911Record[];
  selectedRecord: E911Record | null;
  availableProperties: { id: string; name: string; address: string; organization_name?: string }[];
  metrics: E911Metrics;
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
    compliance: string;
    selectedCompliance: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedStatusFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: E911State = {
  items: [],
  selectedRecord: null,
  availableProperties: [],
  metrics: {
    totalRecordsCount: 0,
    psapVerifiedCount: 0,
    verifiedCount: 0,
    correctionRequiredCount: 0,
    pendingValidationCount: 0,
    pendingOrFailedCount: 0,
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
    compliance: 'ALL',
    selectedCompliance: 'ALL',
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedStatusFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchE911Records = createAsyncThunk(
  'e911/fetchE911Records',
  async (params: any = {}) => {
    const q = new URLSearchParams();
    const searchVal = params.searchQuery || params.search;
    if (searchVal) q.set('search', searchVal);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    const compVal = params.compliance || params.complianceFilter;
    if (compVal && compVal !== 'ALL') q.set('compliance', compVal);
    if (params.page) q.set('page', String(params.page));
    const limitVal = params.limit || params.page_size;
    if (limitVal) q.set('limit', String(limitVal));
    if (params.sortBy) q.set('sortBy', params.sortBy);

    const res = await fetch(`/api/admin/e911?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch E911 records');
    }
    return json;
  }
);

export const e911Slice = createSlice({
  name: 'e911',
  initialState,
  reducers: {
    setE911Records: (
      state,
      action: PayloadAction<{
        data: E911Record[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: Partial<E911Metrics>;
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
          totalRecordsCount: m.totalRecordsCount ?? 0,
          psapVerifiedCount: m.psapVerifiedCount ?? m.verifiedCount ?? 0,
          verifiedCount: m.verifiedCount ?? m.psapVerifiedCount ?? 0,
          correctionRequiredCount: m.correctionRequiredCount ?? 0,
          pendingValidationCount: m.pendingValidationCount ?? m.pendingOrFailedCount ?? 0,
          pendingOrFailedCount: m.pendingOrFailedCount ?? m.pendingValidationCount ?? 0,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedRecord: (state, action: PayloadAction<E911Record | null>) => {
      state.selectedRecord = action.payload;
    },
    setAvailableProperties: (
      state,
      action: PayloadAction<{ id: string; name: string; address: string; organization_name?: string }[]>
    ) => {
      state.availableProperties = action.payload;
    },
    addRecordOptimistic: (state, action: PayloadAction<E911Record>) => {
      state.items.unshift(action.payload);
      state.metrics.totalRecordsCount += 1;
      if (action.payload.status === 'VERIFIED') {
        state.metrics.psapVerifiedCount += 1;
        state.metrics.verifiedCount += 1;
      } else if (action.payload.status === 'CORRECTION_REQUIRED') {
        state.metrics.correctionRequiredCount += 1;
      } else {
        state.metrics.pendingValidationCount += 1;
        state.metrics.pendingOrFailedCount += 1;
      }
    },
    updateRecordOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<E911Record> }>
    ) => {
      const idx = state.items.findIndex((r) => r.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        state.selectedRecord = { ...state.selectedRecord, ...action.payload.updates };
      }
    },
    optimisticUpdateE911Status: (
      state,
      action: PayloadAction<{ id: string; status: E911Record['status'] }>
    ) => {
      const item = state.items.find((r) => r.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        state.selectedRecord.status = action.payload.status;
      }
    },
    addCorrectionNoteOptimistic: (
      state,
      action: PayloadAction<{ id: string; note: CorrectionNoteItem }>
    ) => {
      const item = state.items.find((r) => r.id === action.payload.id);
      if (item) {
        if (!item.correction_history) item.correction_history = [];
        item.correction_history.unshift(action.payload.note);
        item.correction_notes = action.payload.note.note;
        item.status = 'CORRECTION_REQUIRED';
      }
      if (state.selectedRecord && state.selectedRecord.id === action.payload.id) {
        if (!state.selectedRecord.correction_history) state.selectedRecord.correction_history = [];
        state.selectedRecord.correction_history.unshift(action.payload.note);
        state.selectedRecord.correction_notes = action.payload.note.note;
        state.selectedRecord.status = 'CORRECTION_REQUIRED';
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
    setComplianceFilter: (state, action: PayloadAction<string>) => {
      state.filters.compliance = action.payload;
      state.filters.selectedCompliance = action.payload;
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
      .addCase(fetchE911Records.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchE911Records.fulfilled, (state, action) => {
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
            totalRecordsCount: m.totalRecordsCount ?? 0,
            psapVerifiedCount: m.psapVerifiedCount ?? m.verifiedCount ?? 0,
            verifiedCount: m.verifiedCount ?? m.psapVerifiedCount ?? 0,
            correctionRequiredCount: m.correctionRequiredCount ?? 0,
            pendingValidationCount: m.pendingValidationCount ?? m.pendingOrFailedCount ?? 0,
            pendingOrFailedCount: m.pendingOrFailedCount ?? m.pendingValidationCount ?? 0,
          };
        }
      })
      .addCase(fetchE911Records.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch E911 records';
      });
  },
});

export const {
  setE911Records,
  setSelectedRecord,
  setAvailableProperties,
  addRecordOptimistic,
  updateRecordOptimistic,
  optimisticUpdateE911Status,
  addCorrectionNoteOptimistic,
  setSearchQuery,
  setStatusFilter,
  setComplianceFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = e911Slice.actions;

export default e911Slice.reducer;
