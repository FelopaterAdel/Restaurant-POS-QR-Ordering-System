import { useState, useEffect, useCallback, createContext, useContext } from "react";
import type { Notification, NotificationAdapter } from "./types";
import { useAuth } from "@/features/auth";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

interface NotificationsProviderProps {
  children: React.ReactNode;
  adapter: NotificationAdapter;
}

export function NotificationsProvider({ children, adapter }: NotificationsProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adapter.getNotifications();
      // Client-side role filtering
      const filtered = user ? data.filter(n => !n.role || n.role === user.role) : data;
      setNotifications(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [adapter, user?.role]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await adapter.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, [adapter]);

  const markAllAsRead = useCallback(async () => {
    await adapter.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [adapter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotificationsContext must be used within NotificationsProvider");
  }
  return context;
}
