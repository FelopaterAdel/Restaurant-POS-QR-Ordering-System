import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../use-notifications";
import type { Notification, NotificationType } from "../types";
import "../notifications.css";

const TYPE_META: Record<NotificationType, { icon: string; tone: string; label: string }> = {
  ORDER_CREATED: { icon: "🧾", tone: "info", label: "New order" },
  ORDER_READY: { icon: "🔔", tone: "warning", label: "Ready" },
  ORDER_SERVED: { icon: "🍽️", tone: "success", label: "Served" },
  PAYMENT_RECEIVED: { icon: "💵", tone: "primary", label: "Payment" },
  ORDER_CANCELLED: { icon: "✕", tone: "danger", label: "Cancelled" },
};

function metaFor(type: NotificationType) {
  return TYPE_META[type] ?? { icon: "•", tone: "neutral", label: "Notice" };
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

function getNotificationLink(n: Notification): string | null {
  if (!n.entityId) return null;
  if (n.type.startsWith("ORDER")) return `/orders/${n.entityId}`;
  if (n.type === "PAYMENT_RECEIVED") return `/payments/${n.entityId}`;
  return null;
}

const VISIBLE_COUNT = 6;

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open ]);

  async function handleClick(n: Notification) {
    if (!n.read) await markAsRead(n.id);
    const link = getNotificationLink(n);
    if (link) navigate(link);
    setOpen(false);
  }

  const visible = notifications.slice(0, VISIBLE_COUNT);

  return (
    <div className="notification-bell" ref={ref}>
      <button
        type="button"
        className={`notification-bell__trigger${unreadCount > 0 ? " notification-bell__trigger--unread" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2.8a5.2 5.2 0 0 1 5.2 5.2v3l1.6 2.7H3.2L4.8 11V8A5.2 5.2 0 0 1 10 2.8z" />
          <path d="M8.3 16.4a1.8 1.8 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__header">
            <div className="notification-bell__header-text">
              <span className="notification-bell__title-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="notification-bell__unread-chip">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button type="button" onClick={() => void markAllAsRead()} className="notification-bell__mark-all">
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">
                <span className="notification-bell__empty-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 2.8a5.2 5.2 0 0 1 5.2 5.2v3l1.6 2.7H3.2L4.8 11V8A5.2 5.2 0 0 1 10 2.8z" />
                    <path d="M8.3 16.4a1.8 1.8 0 0 0 3.4 0" />
                  </svg>
                </span>
                <p className="notification-bell__empty-title">You&apos;re all caught up</p>
                <p className="notification-bell__empty-sub">New orders, payments and alerts will show up here.</p>
              </div>
            ) : (
              visible.map((n) => {
                const meta = metaFor(n.type);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`notification-bell__item${n.read ? " notification-bell__item--read" : " notification-bell__item--unread"}`}
                    onClick={() => void handleClick(n)}
                  >
                    <span className={`notification-bell__icon notification-bell__icon--${meta.tone}`} aria-hidden="true">
                      {meta.icon}
                    </span>
                    <span className="notification-bell__content">
                      <span className="notification-bell__title-row">
                        <span className="notification-bell__title">{n.title}</span>
                        {!n.read && <span className="notification-bell__dot" aria-label="Unread" />}
                      </span>
                      <span className="notification-bell__message">{n.message}</span>
                      <span className="notification-bell__meta">
                        <span className="notification-bell__type">{meta.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="notification-bell__time">{formatTime(n.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="notification-bell__footer">
            {notifications.length > VISIBLE_COUNT ? (
              <span className="notification-bell__count">
                Showing latest {VISIBLE_COUNT} of {notifications.length}
              </span>
            ) : (
              <span className="notification-bell__count">
                {notifications.length === 0
                  ? "No notifications"
                  : `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`}
              </span>
            )}
            <button
              type="button"
              onClick={() => { navigate("/notifications"); setOpen(false); }}
              className="notification-bell__view-all"
            >
              View all →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
