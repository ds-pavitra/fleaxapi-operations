import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { removeNotification, Notification } from "../../../features/notifications/notificationsSlice";
import Alert from "../alert/Alert";

const TOAST_DEFAULT = 4000;

export default function Toaster() {
  const notifications = useAppSelector((s) => s.notifications as Notification[]);
  const dispatch = useAppDispatch();
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));

    // Add timers for newly added notifications
    notifications.forEach((n) => {
      if (!timersRef.current.has(n.id)) {
        const t = window.setTimeout(() => dispatch(removeNotification(n.id)), n.timeout || TOAST_DEFAULT);
        timersRef.current.set(n.id, t);
      }
    });

    // Clear timers for notifications that were removed
    for (const [id, t] of Array.from(timersRef.current.entries())) {
      if (!currentIds.has(id)) {
        clearTimeout(t);
        timersRef.current.delete(id);
      }
    }

    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    };
  }, [notifications, dispatch]);

  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {notifications.map((n) => (
        <div
          key={n.id}
          // slide-in: default is visible; Tailwind handles transition on mount
          className={"transform transition-all duration-300 ease-in-out translate-x-0 opacity-100"}
        >
          <Alert variant={n.variant} title={n.title} message={n.message} />
        </div>
      ))}
    </div>
  );
}
