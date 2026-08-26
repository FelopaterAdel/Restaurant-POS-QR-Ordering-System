import { apiClient } from "@/lib/api/client";

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: NotificationDTO[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export async function fetchNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>("/notifications", {
    params: { page, limit },
  });
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}
