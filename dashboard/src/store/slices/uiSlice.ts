import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastAlert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface UiState {
  toasts: ToastAlert[];
  isSidebarCollapsed: boolean;
}

const initialState: UiState = {
  toasts: [],
  isSidebarCollapsed: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<ToastAlert, 'id'> & { id?: string }>) => {
      const id = action.payload.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      state.toasts.push({
        id,
        type: action.payload.type,
        title: action.payload.title,
        message: action.payload.message,
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
  },
});

export const { addToast, removeToast, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
