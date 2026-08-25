import { describe, it, expect, beforeEach } from "vitest";
import { MockNotificationAdapter } from "./mock.adapter";
import type { Notification } from "./types";

describe("MockNotificationAdapter", () => {
  let adapter: MockNotificationAdapter;
  const mockData: Notification[] = [
    {
      id: "1",
      type: "ORDER_CREATED",
      title: "New Order",
      message: "Table 5",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "2",
      type: "PAYMENT_RECEIVED",
      title: "Payment",
      message: "Order #100",
      createdAt: new Date().toISOString(),
      read: true,
    },
  ];

  beforeEach(() => {
    adapter = new MockNotificationAdapter();
    adapter.seedMockData(mockData);
  });

  it("returns notifications", async () => {
    const result = await adapter.getNotifications();
    expect(result.length).toBe(2);
  });

  it("marks single notification as read", async () => {
    await adapter.markAsRead("1");
    const result = await adapter.getNotifications();
    const n = result.find(x => x.id === "1");
    expect(n?.read).toBe(true);
  });

  it("marks all as read", async () => {
    await adapter.markAllAsRead();
    const result = await adapter.getNotifications();
    expect(result.every(n => n.read)).toBe(true);
  });
});
