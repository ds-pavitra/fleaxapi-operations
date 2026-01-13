import React, { createContext, useContext, useEffect, useState } from "react";
import { client } from "../api/client";
import { ENDPOINTS } from "../api/constants";

type AuthContextType = {
  token: string | null;
  user: any | null;
  login: (payload: { email: string; password: string; otp?: string }) => Promise<any>;
  logout: () => void;
  setToken: (t: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      const s = sessionStorage.getItem("session");
      if (!s) return null;
      const parsed = JSON.parse(s);
      return parsed?.token || null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<any | null>(() => {
    try {
      const s = sessionStorage.getItem("session");
      if (!s) return null;
      const parsed = JSON.parse(s);
      return parsed?.user || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (token) {
        // persist the whole session if it's set via setToken
        const existing = sessionStorage.getItem("session");
        const parsed = existing ? JSON.parse(existing) : {};
        parsed.token = token;
        if (user) parsed.user = user;
        sessionStorage.setItem("session", JSON.stringify(parsed));
      } else {
        sessionStorage.removeItem("session");
      }
    } catch {
      // ignore
    }
  }, [token, user]);

  const setToken = (t: string | null) => {
    setTokenState(t);
  };

  const login = async ({ email, password, otp }: { email: string; password: string; otp?: string }) => {
    // call API
    const payload: any = { email, password };
    if (otp) payload.otp = otp;

    const res = await client.post(ENDPOINTS.LOGIN, payload, { useAuth: false });

    // expect new shape: { success, message, data: { token, user } }
    const data = (res as any)?.data;
    if (data && data.token) {
      setToken(data.token);
      if (data.user) setUser(data.user);
      try {
        // persist the data object (token + user) and an expiry timestamp
        const { SESSION_TTL_SECONDS } = await import("../config/session");
        const expiresAt = Date.now() + (Number(SESSION_TTL_SECONDS) || 3600) * 1000;
        const toStore = { ...data, _expiresAt: expiresAt };
        sessionStorage.setItem("session", JSON.stringify(toStore));
      } catch {}
    }

    return res;
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    try {
      localStorage.removeItem("token");
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
