// Utilities for token parsing and configurable expiry

// Session TTL is configurable via `src/config/session.ts` (SESSION_TTL_SECONDS) or Vite env var `VITE_SESSION_TTL_SECONDS`.
import { SESSION_TTL_SECONDS } from "../config/session";

// Export base URL reference here for convenience
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.15:8080";

export function parseJwt(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // atob is available in browsers; handle URL-safe base64
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Returns the token's exp (seconds since epoch) if present, otherwise
 * if SESSION_EXPIRY_SECONDS is configured, returns (now + SESSION_EXPIRY_SECONDS).
 * Returns null if neither is available.
 */
export function getTokenExpirySeconds(token: string | null): number | null {
  if (!token) return null;
  const parsed = parseJwt(token);
  if (parsed && typeof parsed.exp === "number") return parsed.exp;

  // fallback to configured session TTL from `src/config/session.ts`
  if (SESSION_TTL_SECONDS) {
    const now = Math.floor(Date.now() / 1000);
    return now + SESSION_TTL_SECONDS;
  }

  return null;
}

export function getTokenExpiryMs(token: string | null): number | null {
  const sec = getTokenExpirySeconds(token);
  if (!sec) return null;
  return sec * 1000;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const exp = getTokenExpirySeconds(token);
  if (!exp) return true;
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

export function tokenTimeLeftSeconds(token: string | null): number | null {
  const exp = getTokenExpirySeconds(token);
  if (!exp) return null;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
}