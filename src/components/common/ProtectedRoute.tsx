import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../hooks";
import { isAuthProtectionEnabled } from "../../config/auth";
import { isTokenExpired } from "../../utils/jwt";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactElement;
}) {
  // Read toggle from env: VITE_AUTH_PROTECTION
  // If disabled, allow all navigation (useful for local/dev).
  if (!isAuthProtectionEnabled()) return children;

  const token = useAppSelector((s) => s.auth.token);
  const location = useLocation();

  // also ensure token is not expired
  if (!token || isTokenExpired(token)) {
    // remove any stale session
    try { sessionStorage.removeItem("session"); } catch {}
    // redirect to signin and preserve the original location
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}
