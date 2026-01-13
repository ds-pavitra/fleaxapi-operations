import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "../features/api/apiSlice";
import authReducer from "../features/auth/authSlice";
import { usersApi } from "../features/users/usersApi";
import notificationsReducer from "../features/notifications/notificationsSlice";
import apisApi from "../features/apis/apisApi";
import merchantsApi from "../features/merchants/merchantsApi";
import vendorsApi from "../features/vendors/vendorsApi";
import reportsApi from "../features/reports/reportsApi";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [apisApi.reducerPath]: apisApi.reducer,
    [merchantsApi.reducerPath]: merchantsApi.reducer,
    [vendorsApi.reducerPath]: vendorsApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer,
    notifications: notificationsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, usersApi.middleware, apisApi.middleware, merchantsApi.middleware, vendorsApi.middleware, reportsApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
