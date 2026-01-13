import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  title: string;
  message: string;
  variant: ToastVariant;
  timeout?: number; // ms
}

const genId = (prefix = "ntf_") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

const initialState: Notification[] = [];

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: {
      reducer(state, action: PayloadAction<Notification>) {
        state.push(action.payload);
      },
      prepare(payload: Omit<Notification, "id">) {
        return { payload: { id: genId(), ...payload } };
      },
    },
    removeNotification(state, action: PayloadAction<string>) {
      return state.filter((n) => n.id !== action.payload);
    },
    clearNotifications() {
      return [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;