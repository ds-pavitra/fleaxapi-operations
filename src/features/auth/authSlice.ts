import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SESSION_TTL_SECONDS } from "../../config/session";

type AuthState = {
  token: string | null;
  user: any | null;
};

const readSession = () => {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const s = sessionStorage.getItem("session");
    if (!s) return { token: null, user: null };
    const parsed = JSON.parse(s);
    // session now stores the response.data object (with token and user) — be tolerant and also support older full-response shape
    const token = parsed?.token || parsed?.data?.token || null;
    const user = parsed?.user || parsed?.data?.user || null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const sess = readSession();

const initialState: AuthState = {
  token: sess.token,
  user: sess.user,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<any>) {
      // Expect payload to be the `data` object from the server: { token, user }
      // We store token/user in state, and persist the `data` object to session
      // with an explicit expiry timestamp so auto-logout can rely on it.
      const payload = action.payload;
      const token = payload?.token || null;
      const user = payload?.user || null;
      state.token = token;
      state.user = user;
      try {
        // compute expiry using configured TTL
        // (stored as milliseconds since epoch)
        const expiresAt = Date.now() + (Number(SESSION_TTL_SECONDS) || 3600) * 1000;
        const toStore = { ...payload, _expiresAt: expiresAt };
        sessionStorage.setItem("session", JSON.stringify(toStore));
      } catch {}
    },
    logout(state) {
      state.token = null;
      state.user = null;
      try {
        sessionStorage.removeItem("session");
      } catch {}
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
