import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../use-notifications";
import type { Notification } from "../types";

const ICONS: Record<string, string> = {
  ORDER_CREATED: "🔴",
  ORDER_READY: "🟡",
  ORDER_SERVED: "🟢",
  PAYMENT_RECEIVED: "✓",
  ORDER_CANCELLED: "✕",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getNotificationLink(n: Notification): string | null {
  if (!n.entityId) return null;
  if (n.type.startsWith("ORDER")) return `/orders/${n.entityId}`;
  if (n.type === "PAYMENT_RECEIVED") return `/payments/${n.entityId}`;
  return null;
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleClick(n: Notification) {
    if (!n.read) await markAsRead(n.id);
    const link = getNotificationLink(n);
    if (link) navigate(link);
    setOpen(false);
  }

  return (
    <div className="notification-bell" ref={ref}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button type="button" onClick={markAllAsRead} className="notification-bell__mark-all">
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">No notifications</div>
            ) : (
              notifications.slice(0, 5).map(n => (
                <button
                  key={n.id}
                  type="button"
                  className={`notification-bell__item ${n.read ? "read" : "unread"}`}
                  onClick={() => void handleClick(n)}
                >
                  <div className="notification-bell__icon">{ICONS[n.type] ?? "•"}</div>
                  <div className="notification-bell__content">
                    <div className="notification-bell__title">{n.title}</div>
                    <div className="notification-bell__message">{n.message}</div>
                    <div className="notification-bell__time">{formatTime(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="notification-bell__footer">
            <button type="button" onClick={() => { navigate("/notifications"); setOpen(false); }} className="notification-bell__view-all">
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
