import { useCallback, createContext, useContext } from "react";
import type { Notification, NotificationAdapter } from "./types";
import { useQuery } from "@tanstack/react-query";

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
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => adapter.getNotifications(),
    refetchInterval: 15000,
  });

  const notifications = data ?? [];

  const markAsRead = useCallback(async (id: string) => {
    await adapter.markAsRead(id);
    await refetch();
  }, [adapter, refetch]);

  const markAllAsRead = useCallback(async () => {
    await adapter.markAllAsRead();
    await refetch();
  }, [adapter, refetch]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: async () => { await refetch(); },
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
