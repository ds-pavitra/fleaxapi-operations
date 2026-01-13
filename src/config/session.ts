// Session configuration
// Change SESSION_TTL_SECONDS here to adjust how long the session should last (in seconds).
// Default: 3600 seconds (1 hour)
// You can also override via Vite env var `VITE_SESSION_TTL_SECONDS`.

export const SESSION_TTL_SECONDS: number = (() => {
  try {
    const v = (import.meta as any)?.env?.VITE_SESSION_TTL_SECONDS;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  } catch {}
  return 3600; // default 1 hour
})();
