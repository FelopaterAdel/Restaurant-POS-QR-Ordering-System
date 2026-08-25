export const NOTIFICATION_TYPES = [
  "ORDER_CREATED",
  "ORDER_READY",
  "ORDER_SERVED",
  "PAYMENT_RECEIVED",
  "ORDER_CANCELLED",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
  role?: string;
}

export interface NotificationAdapter {
  getNotifications(): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
}
