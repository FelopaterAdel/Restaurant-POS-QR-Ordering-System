import { describe, expect, it } from "vitest";
import type { Order } from "@/features/orders/orders.types";
import {
  getNextKitchenAction,
  isKitchenStatus,
  sortByKitchenPriority,
} from "./kitchen.actions";

function buildOrder(overrides: Partial<Order> & { id: string }): Order {
  return {
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 5,
    status: "CONFIRMED",
    paymentStatus: "PENDING",
    totalAmount: 450,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [],
    ...overrides,
  };
}

describe("isKitchenStatus", () => {
  it("accepts CONFIRMED, PREPARING and READY", () => {
    expect(isKitchenStatus("CONFIRMED")).toBe(true);
    expect(isKitchenStatus("PREPARING")).toBe(true);
    expect(isKitchenStatus("READY")).toBe(true);
  });

  it("rejects PENDING and terminal statuses", () => {
    expect(isKitchenStatus("PENDING")).toBe(false);
    expect(isKitchenStatus("SERVED")).toBe(false);
    expect(isKitchenStatus("COMPLETED")).toBe(false);
    expect(isKitchenStatus("CANCELLED")).toBe(false);
  });
});

describe("getNextKitchenAction", () => {
  it("maps CONFIRMED to Start Preparing", () => {
    const action = getNextKitchenAction(buildOrder({ id: "o1" }));

    expect(action).toEqual({
      label: "Start Preparing",
      nextStatus: "PREPARING",
      variant: "primary",
    });
  });

  it("maps PREPARING to Mark Ready", () => {
    const action = getNextKitchenAction(
      buildOrder({ id: "o1", status: "PREPARING" }),
    );

    expect(action).toEqual({
      label: "Mark Ready",
      nextStatus: "READY",
      variant: "primary",
    });
  });

  it("returns no action for READY orders", () => {
    const action = getNextKitchenAction(
      buildOrder({ id: "o1", status: "READY" }),
    );

    expect(action).toBeNull();
  });

  it("returns no action for statuses outside the kitchen workflow", () => {
    for (const status of [
      "PENDING",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ] as const) {
      expect(getNextKitchenAction(buildOrder({ id: "o1", status }))).toBeNull();
    }
  });
});

describe("sortByKitchenPriority", () => {
  it("orders oldest first so the most urgent order is shown first", () => {
    const newest = buildOrder({
      id: "new",
      createdAt: "2025-01-15T13:00:00Z",
    });
    const oldest = buildOrder({
      id: "old",
      createdAt: "2025-01-15T11:00:00Z",
    });
    const middle = buildOrder({
      id: "mid",
      createdAt: "2025-01-15T12:00:00Z",
    });

    const sorted = sortByKitchenPriority([newest, oldest, middle]);

    expect(sorted.map((order) => order.id)).toEqual(["old", "mid", "new"]);
  });

  it("does not mutate the input array", () => {
    const first = buildOrder({ id: "a", createdAt: "2025-01-15T12:00:00Z" });
    const second = buildOrder({ id: "b", createdAt: "2025-01-15T11:00:00Z" });
    const input = [first, second];

    sortByKitchenPriority(input);

    expect(input.map((order) => order.id)).toEqual(["a", "b"]);
  });
});
