import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import organizationsReducer from './slices/organizationsSlice';
import propertiesReducer from './slices/propertiesSlice';
import servicesReducer from './slices/servicesSlice';
import onboardingReducer from './slices/onboardingSlice';
import e911Reducer from './slices/e911Slice';
import ticketsReducer from './slices/ticketsSlice';
import auditLogsReducer from './slices/auditLogsSlice';
import uiReducer from './slices/uiSlice';
import portingReducer from './slices/portingSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  organizations: organizationsReducer,
  properties: propertiesReducer,
  services: servicesReducer,
  onboarding: onboardingReducer,
  e911: e911Reducer,
  tickets: ticketsReducer,
  auditLogs: auditLogsReducer,
  ui: uiReducer,
  porting: portingReducer,
});

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
