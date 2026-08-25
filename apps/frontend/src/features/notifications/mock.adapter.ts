import type { Notification, NotificationAdapter } from "./types";

const STORAGE_KEY = "notifications";

function loadFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(notifications: Notification[]) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }
}

export class MockNotificationAdapter implements NotificationAdapter {
  private notifications: Notification[] = loadFromStorage();

  async getNotifications(): Promise<Notification[]> {
    return [...this.notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markAsRead(id: string): Promise<void> {
    this.notifications = this.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveToStorage(this.notifications);
  }

  async markAllAsRead(): Promise<void> {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    saveToStorage(this.notifications);
  }

  // Dev helper to seed mock data
  seedMockData(notifications: Notification[]) {
    this.notifications = notifications;
    saveToStorage(this.notifications);
  }
}

export const mockNotificationAdapter = new MockNotificationAdapter();
