// Helper to read whether auth protection is enabled.
// Use the Vite env var `VITE_AUTH_PROTECTION` set to "true" or "false".
// If the variable is NOT set, default to **disabled** in development (convenient for local dev)
// and **enabled** in production.

export const isAuthProtectionEnabled = (): boolean => {
  const env = (import.meta as any)?.env || {};
  const val = env?.VITE_AUTH_PROTECTION;
  if (typeof val === "string") return val === "true";

  const mode = env?.MODE || "development";
  // default behavior: protect in production, allow in dev
  return mode === "production";
};
