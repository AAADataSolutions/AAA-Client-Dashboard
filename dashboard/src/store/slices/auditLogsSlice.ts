import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface AuditLogRecord {
  id: string;
  actor_email: string;
  actor_name?: string;
  actor_role: string;
  action: string;
  raw_action?: string;
  entity_type: string;
  entity_name?: string;
  entity_id?: string;
  description?: string;
  ip_address: string;
  changes?: Record<string, any>;
  created_at: string;
}

export type AuditLogItem = AuditLogRecord;

export interface AuditLogsState {
  items: AuditLogRecord[];
  selectedLog: AuditLogRecord | null;
  totalCount: number;
  filters: {
    search: string;
    searchQuery: string;
    action: string;
    selectedAction: string;
  };
  searchQuery: string;
  selectedActionFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: AuditLogsState = {
  items: [],
  selectedLog: null,
  totalCount: 0,
  filters: {
    search: '',
    searchQuery: '',
    action: 'ALL',
    selectedAction: 'ALL',
  },
  searchQuery: '',
  selectedActionFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAuditLogs',
  async (params: Record<string, string> | void = {}) => {
    const p = (params || {}) as Record<string, string>;
    const q = new URLSearchParams();
    if (p.search) q.set('search', p.search);
    if (p.action && p.action !== 'ALL') q.set('action', p.action);

    const res = await fetch(`/api/admin/audit-logs?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch audit logs');
    }
    return json;
  }
);

export const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {
    setAuditLogs: (state, action: PayloadAction<AuditLogRecord[]>) => {
      state.items = action.payload;
      state.totalCount = action.payload.length;
      state.loading = false;
      state.error = null;
    },
    addAuditLogOptimistic: (state, action: PayloadAction<AuditLogRecord>) => {
      state.items.unshift(action.payload);
      state.totalCount += 1;
    },
    setSelectedLog: (state, action: PayloadAction<AuditLogRecord | null>) => {
      state.selectedLog = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filters.search = action.payload;
      state.filters.searchQuery = action.payload;
    },
    setActionFilter: (state, action: PayloadAction<string>) => {
      state.selectedActionFilter = action.payload;
      state.filters.action = action.payload;
      state.filters.selectedAction = action.payload;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        searchQuery?: string;
        selectedActionFilter?: string;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) {
        state.searchQuery = action.payload.searchQuery;
        state.filters.search = action.payload.searchQuery;
        state.filters.searchQuery = action.payload.searchQuery;
      }
      if (action.payload.selectedActionFilter !== undefined) {
        state.selectedActionFilter = action.payload.selectedActionFilter;
        state.filters.action = action.payload.selectedActionFilter;
        state.filters.selectedAction = action.payload.selectedActionFilter;
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
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data || [];
        state.totalCount = (action.payload.data || []).length;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch audit logs';
      });
  },
});

export const {
  setAuditLogs,
  addAuditLogOptimistic,
  setSelectedLog,
  setSearchQuery,
  setActionFilter,
  setFilters,
  setLoading,
  setError,
} = auditLogsSlice.actions;

export default auditLogsSlice.reducer;
