import { describe, expect, it } from "vitest";
import type { Order } from "@/features/orders/orders.types";
import {
  getNextWaiterAction,
  isReadyStatus,
  sortByReadyPriority,
} from "./waiter.actions";

function buildOrder(overrides: Partial<Order> & { id: string }): Order {
  return {
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 12,
    status: "READY",
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

describe("isReadyStatus", () => {
  it("accepts READY", () => {
    expect(isReadyStatus("READY")).toBe(true);
  });

  it("rejects every other status", () => {
    for (const status of [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ] as const) {
      expect(isReadyStatus(status)).toBe(false);
    }
  });
});

describe("getNextWaiterAction", () => {
  it("maps READY to Mark Served", () => {
    const action = getNextWaiterAction(buildOrder({ id: "o1" }));

    expect(action).toEqual({
      label: "Mark Served",
      nextStatus: "SERVED",
      variant: "primary",
    });
  });

  it("returns no action for statuses outside READY", () => {
    for (const status of [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "SERVED",
      "COMPLETED",
      "CANCELLED",
    ] as const) {
      expect(getNextWaiterAction(buildOrder({ id: "o1", status }))).toBeNull();
    }
  });
});

describe("sortByReadyPriority", () => {
  it("orders longest-waiting orders first", () => {
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

    const sorted = sortByReadyPriority([newest, oldest, middle]);

    expect(sorted.map((order) => order.id)).toEqual(["old", "mid", "new"]);
  });

  it("does not mutate the input array", () => {
    const first = buildOrder({ id: "a", createdAt: "2025-01-15T12:00:00Z" });
    const second = buildOrder({ id: "b", createdAt: "2025-01-15T11:00:00Z" });
    const input = [first, second];

    sortByReadyPriority(input);

    expect(input.map((order) => order.id)).toEqual(["a", "b"]);
  });
});
