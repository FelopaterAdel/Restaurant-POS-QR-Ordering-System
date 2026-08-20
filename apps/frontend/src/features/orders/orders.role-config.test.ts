import { describe, expect, it } from "vitest";
import type { UserRole } from "@/features/auth/types";
import type { Order } from "./orders.types";
import {
  getRoleOrderConfig,
  getOrderActions,
  canPayOrder,
  canCompleteOrder,
} from "./orders.role-config";

function buildOrder(overrides?: Partial<Order>): Order {
  return {
    id: "ord_1",
    orderNumber: 1024,
    tableId: "tbl_1",
    tableNumber: 5,
    status: "PREPARING",
    paymentStatus: "PENDING",
    totalAmount: 290,
    cancelledAt: null,
    cancelledReason: null,
    createdAt: "2025-01-15T12:35:00Z",
    updatedAt: "2025-01-15T12:35:00Z",
    items: [],
    ...overrides,
  };
}

describe("getRoleOrderConfig", () => {
  describe("KITCHEN", () => {
    it("has correct visible statuses", () => {
      const config = getRoleOrderConfig("KITCHEN");
      expect(config.visibleStatuses).toEqual([
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
      ]);
    });

    it("has correct filters", () => {
      const config = getRoleOrderConfig("KITCHEN");
      expect(config.filters).toEqual([
        "all",
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
      ]);
    });

    it("cannot pay or complete", () => {
      const config = getRoleOrderConfig("KITCHEN");
      expect(config.canPay).toBe(false);
      expect(config.canComplete).toBe(false);
    });
  });

  describe("WAITER", () => {
    it("has correct visible statuses", () => {
      const config = getRoleOrderConfig("WAITER");
      expect(config.visibleStatuses).toEqual(["READY"]);
    });

    it("has correct filters", () => {
      const config = getRoleOrderConfig("WAITER");
      expect(config.filters).toEqual(["all", "READY"]);
    });

    it("cannot pay or complete", () => {
      const config = getRoleOrderConfig("WAITER");
      expect(config.canPay).toBe(false);
      expect(config.canComplete).toBe(false);
    });
  });

  describe("CASHIER", () => {
    it("has correct visible statuses", () => {
      const config = getRoleOrderConfig("CASHIER");
      expect(config.visibleStatuses).toEqual(["READY", "SERVED"]);
    });

    it("has correct filters", () => {
      const config = getRoleOrderConfig("CASHIER");
      expect(config.filters).toEqual(["all", "READY", "SERVED"]);
    });

    it("can pay and complete", () => {
      const config = getRoleOrderConfig("CASHIER");
      expect(config.canPay).toBe(true);
      expect(config.canComplete).toBe(true);
    });
  });

  describe("OWNER", () => {
    it("sees all active statuses", () => {
      const config = getRoleOrderConfig("OWNER");
      expect(config.visibleStatuses).toContain("PENDING");
      expect(config.visibleStatuses).toContain("CONFIRMED");
      expect(config.visibleStatuses).toContain("PREPARING");
      expect(config.visibleStatuses).toContain("READY");
      expect(config.visibleStatuses).toContain("SERVED");
    });

    it("can pay and complete", () => {
      const config = getRoleOrderConfig("OWNER");
      expect(config.canPay).toBe(true);
      expect(config.canComplete).toBe(true);
    });
  });

  describe("MANAGER", () => {
    it("sees all active statuses", () => {
      const config = getRoleOrderConfig("MANAGER");
      expect(config.visibleStatuses).toContain("PENDING");
      expect(config.visibleStatuses).toContain("READY");
      expect(config.visibleStatuses).toContain("SERVED");
    });

    it("can pay and complete", () => {
      const config = getRoleOrderConfig("MANAGER");
      expect(config.canPay).toBe(true);
      expect(config.canComplete).toBe(true);
    });
  });
});

describe("getOrderActions", () => {
  describe("KITCHEN", () => {
    it("PENDING -> CONFIRMED", () => {
      const order = buildOrder({ status: "PENDING" });
      const actions = getOrderActions(order, "KITCHEN");
      expect(actions).toHaveLength(1);
      expect(actions[0].nextStatus).toBe("CONFIRMED");
      expect(actions[0].label).toBe("Confirm");
    });

    it("CONFIRMED -> PREPARING", () => {
      const order = buildOrder({ status: "CONFIRMED" });
      const actions = getOrderActions(order, "KITCHEN");
      expect(actions).toHaveLength(1);
      expect(actions[0].nextStatus).toBe("PREPARING");
      expect(actions[0].label).toBe("Start Preparing");
    });

    it("PREPARING -> READY", () => {
      const order = buildOrder({ status: "PREPARING" });
      const actions = getOrderActions(order, "KITCHEN");
      expect(actions).toHaveLength(1);
      expect(actions[0].nextStatus).toBe("READY");
      expect(actions[0].label).toBe("Mark Ready");
    });

    it("READY -> no actions", () => {
      const order = buildOrder({ status: "READY" });
      const actions = getOrderActions(order, "KITCHEN");
      expect(actions).toHaveLength(0);
    });

    it("SERVED -> no actions", () => {
      const order = buildOrder({ status: "SERVED" });
      const actions = getOrderActions(order, "KITCHEN");
      expect(actions).toHaveLength(0);
    });
  });

  describe("WAITER", () => {
    it("READY -> SERVED", () => {
      const order = buildOrder({ status: "READY" });
      const actions = getOrderActions(order, "WAITER");
      expect(actions).toHaveLength(1);
      expect(actions[0].nextStatus).toBe("SERVED");
      expect(actions[0].label).toBe("Mark Served");
    });

    it("PREPARING -> no actions", () => {
      const order = buildOrder({ status: "PREPARING" });
      const actions = getOrderActions(order, "WAITER");
      expect(actions).toHaveLength(0);
    });

    it("SERVED -> no actions", () => {
      const order = buildOrder({ status: "SERVED" });
      const actions = getOrderActions(order, "WAITER");
      expect(actions).toHaveLength(0);
    });
  });

  describe("CASHIER", () => {
    it("never has status actions", () => {
      for (const status of [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "SERVED",
      ] as const) {
        const order = buildOrder({ status });
        const actions = getOrderActions(order, "CASHIER");
        expect(actions).toHaveLength(0);
      }
    });
  });

  describe("OWNER / MANAGER", () => {
    for (const role of ["OWNER", "MANAGER"] as UserRole[]) {
      it(`${role}: PENDING -> CONFIRMED + CANCEL`, () => {
        const order = buildOrder({ status: "PENDING" });
        const actions = getOrderActions(order, role);
        expect(actions).toHaveLength(2);
        expect(actions.map((a) => a.nextStatus)).toContain("CONFIRMED");
        expect(actions.map((a) => a.nextStatus)).toContain("CANCELLED");
      });

      it(`${role}: PREPARING -> READY + CANCEL`, () => {
        const order = buildOrder({ status: "PREPARING" });
        const actions = getOrderActions(order, role);
        expect(actions.map((a) => a.nextStatus)).toContain("READY");
        expect(actions.map((a) => a.nextStatus)).toContain("CANCELLED");
      });

      it(`${role}: READY -> SERVED (no cancel)`, () => {
        const order = buildOrder({ status: "READY" });
        const actions = getOrderActions(order, role);
        expect(actions.map((a) => a.nextStatus)).toContain("SERVED");
        expect(actions.map((a) => a.nextStatus)).not.toContain("CANCELLED");
      });

      it(`${role}: CANCELLED action is danger variant`, () => {
        const order = buildOrder({ status: "PENDING" });
        const actions = getOrderActions(order, role);
        const cancelAction = actions.find((a) => a.nextStatus === "CANCELLED");
        expect(cancelAction?.variant).toBe("danger");
      });
    }
  });
});

describe("canPayOrder", () => {
  it("OWNER can pay READY unpaid order", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PENDING" });
    expect(canPayOrder(order, "OWNER")).toBe(true);
  });

  it("CASHIER can pay SERVED unpaid order", () => {
    const order = buildOrder({ status: "SERVED", paymentStatus: "PENDING" });
    expect(canPayOrder(order, "CASHIER")).toBe(true);
  });

  it("KITCHEN cannot pay", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PENDING" });
    expect(canPayOrder(order, "KITCHEN")).toBe(false);
  });

  it("WAITER cannot pay", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PENDING" });
    expect(canPayOrder(order, "WAITER")).toBe(false);
  });

  it("cannot pay already paid order", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PAID" });
    expect(canPayOrder(order, "OWNER")).toBe(false);
  });

  it("cannot pay PREPARING order", () => {
    const order = buildOrder({ status: "PREPARING", paymentStatus: "PENDING" });
    expect(canPayOrder(order, "OWNER")).toBe(false);
  });
});

describe("canCompleteOrder", () => {
  it("OWNER can complete paid non-terminal order", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "OWNER")).toBe(true);
  });

  it("CASHIER can complete paid SERVED order", () => {
    const order = buildOrder({ status: "SERVED", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "CASHIER")).toBe(true);
  });

  it("KITCHEN cannot complete", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "KITCHEN")).toBe(false);
  });

  it("WAITER cannot complete", () => {
    const order = buildOrder({ status: "SERVED", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "WAITER")).toBe(false);
  });

  it("cannot complete unpaid order", () => {
    const order = buildOrder({ status: "READY", paymentStatus: "PENDING" });
    expect(canCompleteOrder(order, "OWNER")).toBe(false);
  });

  it("cannot complete CANCELLED order", () => {
    const order = buildOrder({ status: "CANCELLED", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "OWNER")).toBe(false);
  });

  it("cannot complete COMPLETED order", () => {
    const order = buildOrder({ status: "COMPLETED", paymentStatus: "PAID" });
    expect(canCompleteOrder(order, "OWNER")).toBe(false);
  });
});
