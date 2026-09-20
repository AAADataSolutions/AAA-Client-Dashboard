import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface TicketAttachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  url?: string;
  created_at: string;
}

export interface TicketComment {
  id: string;
  author_name: string;
  author_role?: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketRecord {
  id: string;
  ticket_number?: string;
  subject: string;
  description: string;
  category?: string;
  organization_name?: string;
  organization_id?: string;
  property_name?: string;
  property_id?: string;
  organization_property_id?: string;
  created_by_name: string;
  created_by_phone?: string;
  assigned_to_name?: string;
  assigned_to?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';
  comments_count: number;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  created_at: string;
  updated_at: string;
}

export type TicketItem = TicketRecord;

export interface TicketMetrics {
  totalOpen: number;
  totalUrgent: number;
  totalWaiting: number;
  totalResolved: number;
  openCount: number;
  urgentCount: number;
  waitingCount: number;
  resolvedCount: number;
}

export interface TicketsState {
  items: TicketRecord[];
  selectedTicket: TicketRecord | null;
  metrics: TicketMetrics;
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
    priority: string;
    selectedPriority: string;
    status: string;
    selectedStatus: string;
    orgId: string;
    selectedOrgFilter: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedPriorityFilter: string;
  selectedStatusFilter: string;
  selectedOrgFilter: string;
  loading: boolean;
  error: string | null;
}

const initialState: TicketsState = {
  items: [],
  selectedTicket: null,
  metrics: {
    totalOpen: 0,
    totalUrgent: 0,
    totalWaiting: 0,
    totalResolved: 0,
    openCount: 0,
    urgentCount: 0,
    waitingCount: 0,
    resolvedCount: 0,
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
    priority: 'ALL',
    selectedPriority: 'ALL',
    status: 'ALL',
    selectedStatus: 'ALL',
    orgId: 'ALL',
    selectedOrgFilter: 'ALL',
    sortBy: 'NEWEST',
    sortOrder: 'desc',
  },
  searchQuery: '',
  selectedPriorityFilter: 'ALL',
  selectedStatusFilter: 'ALL',
  selectedOrgFilter: 'ALL',
  loading: false,
  error: null,
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params: any = {}) => {
    const q = new URLSearchParams();
    const searchVal = params.searchQuery || params.search;
    if (searchVal) q.set('search', searchVal);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    if (params.priority && params.priority !== 'ALL') q.set('priority', params.priority);
    const orgVal = params.orgId || params.org_id;
    if (orgVal && orgVal !== 'ALL') q.set('org_id', orgVal);
    if (params.page) q.set('page', String(params.page));
    const limitVal = params.limit || params.page_size;
    if (limitVal) q.set('limit', String(limitVal));
    if (params.sortBy) q.set('sortBy', params.sortBy);

    const res = await fetch(`/api/admin/tickets?${q.toString()}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to fetch tickets');
    }
    return json;
  }
);

export const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets: (
      state,
      action: PayloadAction<{
        data: TicketRecord[];
        pagination?: { totalCount: number; totalPages: number; currentPage: number };
        metrics?: Partial<TicketMetrics>;
      }>
    ) => {
      state.items = action.payload.data;
      if (action.payload.pagination) {
        state.totalCount = action.payload.pagination.totalCount;
        state.totalPages = action.payload.pagination.totalPages;
        state.currentPage = action.payload.pagination.currentPage;
        state.pagination.page = action.payload.pagination.currentPage;
        state.pagination.currentPage = action.payload.pagination.currentPage;
        state.pagination.total = action.payload.pagination.totalCount;
        state.pagination.totalCount = action.payload.pagination.totalCount;
        state.pagination.totalPages = action.payload.pagination.totalPages;
      }
      if (action.payload.metrics) {
        const m = action.payload.metrics;
        state.metrics = {
          totalOpen: m.totalOpen ?? m.openCount ?? 0,
          totalUrgent: m.totalUrgent ?? m.urgentCount ?? 0,
          totalWaiting: m.totalWaiting ?? m.waitingCount ?? 0,
          totalResolved: m.totalResolved ?? m.resolvedCount ?? 0,
          openCount: m.openCount ?? m.totalOpen ?? 0,
          urgentCount: m.urgentCount ?? m.totalUrgent ?? 0,
          waitingCount: m.waitingCount ?? m.totalWaiting ?? 0,
          resolvedCount: m.resolvedCount ?? m.totalResolved ?? 0,
        };
      }
      state.loading = false;
      state.error = null;
    },
    setSelectedTicket: (state, action: PayloadAction<TicketRecord | null>) => {
      state.selectedTicket = action.payload;
    },
    addTicketOptimistic: (state, action: PayloadAction<TicketRecord>) => {
      state.items.unshift(action.payload);
      state.metrics.totalOpen += 1;
      state.metrics.openCount += 1;
      if (action.payload.priority === 'URGENT') {
        state.metrics.totalUrgent += 1;
        state.metrics.urgentCount += 1;
      }
    },
    updateTicketOptimistic: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<TicketRecord> }>
    ) => {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload.updates };
      }
      if (state.selectedTicket && state.selectedTicket.id === action.payload.id) {
        state.selectedTicket = { ...state.selectedTicket, ...action.payload.updates };
      }
    },
    updateTicketStatusOptimistic: (
      state,
      action: PayloadAction<{ id: string; status: TicketRecord['status'] }>
    ) => {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (t) {
        t.status = action.payload.status;
      }
      if (state.selectedTicket && state.selectedTicket.id === action.payload.id) {
        state.selectedTicket.status = action.payload.status;
      }
    },
    optimisticUpdateTicketStatus: (
      state,
      action: PayloadAction<{ id: string; status: TicketRecord['status'] }>
    ) => {
      const t = state.items.find((x) => x.id === action.payload.id);
      if (t) {
        t.status = action.payload.status;
      }
      if (state.selectedTicket && state.selectedTicket.id === action.payload.id) {
        state.selectedTicket.status = action.payload.status;
      }
    },
    addTicketCommentOptimistic: (
      state,
      action: PayloadAction<{ ticketId: string; comment: TicketComment }>
    ) => {
      const { ticketId, comment } = action.payload;
      const t = state.items.find((x) => x.id === ticketId);
      if (t) {
        t.comments = t.comments || [];
        t.comments.push(comment);
        t.comments_count = (t.comments_count || 0) + 1;
      }
      if (state.selectedTicket && state.selectedTicket.id === ticketId) {
        state.selectedTicket.comments = state.selectedTicket.comments || [];
        state.selectedTicket.comments.push(comment);
        state.selectedTicket.comments_count = (state.selectedTicket.comments_count || 0) + 1;
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
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.selectedPriorityFilter = action.payload;
      state.filters.priority = action.payload;
      state.filters.selectedPriority = action.payload;
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
    setOrgFilter: (state, action: PayloadAction<string>) => {
      state.selectedOrgFilter = action.payload;
      state.filters.orgId = action.payload;
      state.filters.selectedOrgFilter = action.payload;
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
        selectedPriorityFilter?: string;
        selectedStatusFilter?: string;
        selectedOrgFilter?: string;
        currentPage?: number;
      }>
    ) => {
      if (action.payload.searchQuery !== undefined) {
        state.searchQuery = action.payload.searchQuery;
        state.filters.search = action.payload.searchQuery;
        state.filters.searchQuery = action.payload.searchQuery;
      }
      if (action.payload.selectedPriorityFilter !== undefined) {
        state.selectedPriorityFilter = action.payload.selectedPriorityFilter;
        state.filters.priority = action.payload.selectedPriorityFilter;
        state.filters.selectedPriority = action.payload.selectedPriorityFilter;
      }
      if (action.payload.selectedStatusFilter !== undefined) {
        state.selectedStatusFilter = action.payload.selectedStatusFilter;
        state.filters.status = action.payload.selectedStatusFilter;
        state.filters.selectedStatus = action.payload.selectedStatusFilter;
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
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
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
            totalOpen: m.totalOpen ?? m.openCount ?? 0,
            totalUrgent: m.totalUrgent ?? m.urgentCount ?? 0,
            totalWaiting: m.totalWaiting ?? m.waitingCount ?? 0,
            totalResolved: m.totalResolved ?? m.resolvedCount ?? 0,
            openCount: m.openCount ?? m.totalOpen ?? 0,
            urgentCount: m.urgentCount ?? m.totalUrgent ?? 0,
            waitingCount: m.waitingCount ?? m.totalWaiting ?? 0,
            resolvedCount: m.resolvedCount ?? m.totalResolved ?? 0,
          };
        }
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
      });
  },
});

export const {
  setTickets,
  setSelectedTicket,
  addTicketOptimistic,
  updateTicketOptimistic,
  updateTicketStatusOptimistic,
  optimisticUpdateTicketStatus,
  addTicketCommentOptimistic,
  setSearchQuery,
  setPriorityFilter,
  setStatusFilter,
  setOrgFilter,
  setSortBy,
  setPagination,
  setFilters,
  setLoading,
  setError,
} = ticketsSlice.actions;

export default ticketsSlice.reducer;
