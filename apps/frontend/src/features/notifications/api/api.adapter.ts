import type { Notification, NotificationAdapter } from "../types";
import {
  fetchNotifications,
  markAsRead as apiMarkRead,
  markAllAsRead as apiMarkAll,
  type NotificationDTO,
} from "./notifications.api";

function map(dto: NotificationDTO): Notification {
  return {
    id: dto.id,
    type: dto.type as any,
    title: dto.title,
    message: dto.message,
    createdAt: dto.createdAt,
    read: dto.isRead,
    entityId: dto.entityId,
    entityType: dto.entityType,
  };
}

export class ApiNotificationAdapter implements NotificationAdapter {
  async getNotifications(): Promise<Notification[]> {
    const res = await fetchNotifications(1, 50);
    return res.items.map(map);
  }

  async markAsRead(id: string): Promise<void> {
    await apiMarkRead(id);
  }

  async markAllAsRead(): Promise<void> {
    await apiMarkAll();
  }
}

export const apiNotificationAdapter = new ApiNotificationAdapter();
