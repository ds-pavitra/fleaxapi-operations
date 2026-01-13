import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Toaster from "../components/ui/toast/Toaster";
import { useAppDispatch } from "../hooks";
import { logout } from "../features/auth/authSlice";
import { addNotification } from "../features/notifications/notificationsSlice";
import { useNavigate } from "react-router";
import { getTokenExpirySeconds } from "../utils/jwt";


const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
        <Toaster />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const token = ((): string | null => {
    try {
      const s = sessionStorage.getItem("session");
      if (!s) return null;
      const parsed = JSON.parse(s);
      return parsed?.token || null;
    } catch {
      return null;
    }
  })();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Immediately redirect to signin if there is no session token (extra guard)
  useEffect(() => {
    if (!token) {
      try {
        dispatch(logout());
        sessionStorage.removeItem("session");
      } catch { }
      navigate("/signin", { replace: true });
    }
  }, [token, dispatch, navigate]);

  useEffect(() => {
    let timer: number | null = null;
    if (token) {
      try {
        // Prefer explicit session expiry if present (set by setCredentials)
        const s = sessionStorage.getItem("session");
        let secondsLeft: number | null = null;
        if (s) {
          try {
            const parsed = JSON.parse(s);
            if (parsed?._expiresAt) {
              const msLeft = parsed._expiresAt - Date.now();
              secondsLeft = Math.ceil(msLeft / 1000);
            }
          } catch { }
        }

        if (secondsLeft == null) {
          // fallback to token expiry (JWT exp or configured SESSION_TTL)
          const exp = getTokenExpirySeconds(token);

          if (exp) {
            const now = Math.floor(Date.now() / 1000);
            secondsLeft = exp - now;
          }
        }


        if (secondsLeft != null) {
          if (secondsLeft <= 0) {
            // already expired
            dispatch(logout());
            try { sessionStorage.removeItem("session"); } catch { }
            navigate("/signin", { replace: true });
          } else {
            timer = window.setTimeout(() => {
              dispatch(logout());
              try { sessionStorage.removeItem("session"); } catch { }
              // notify user
              dispatch(addNotification({ variant: "info", title: "Session expired", message: "Your session has expired. Please sign in again.", timeout: 5000 }));
              navigate("/signin", { replace: true });
            }, secondsLeft * 1000);
          }
        }
      } catch (e) {
        // failed to set timer - ignore
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [token, dispatch, navigate]);

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
