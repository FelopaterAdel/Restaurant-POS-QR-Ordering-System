import { describe, expect, it, vi } from "vitest";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  getOrder,
  getOrderHistory,
  getOrderQueue,
  getStaffOrderDetails,
  listOrders,
  payOrder,
  updateOrderStatus,
} from "./orders.api";
import type { Order } from "./orders.types";

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
    getPaginated: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "@/lib/api";

const mockGet = vi.mocked(api.get);
const mockGetPaginated = vi.mocked(api.getPaginated);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);

const mockOrder: Order = {
  id: "ord_1",
  orderNumber: 1,
  tableId: "tbl_1",
  tableNumber: 5,
  status: "PENDING",
  paymentStatus: "PENDING",
  totalAmount: 250,
  cancelledAt: null,
  cancelledReason: null,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  items: [],
};

describe("orders.api", () => {
  describe("listOrders", () => {
    it("calls GET /orders with no params", async () => {
      const paginated = { success: true as const, data: [mockOrder], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
      mockGetPaginated.mockResolvedValueOnce(paginated);

      const result = await listOrders();

      expect(mockGetPaginated).toHaveBeenCalledWith("/orders", { params: undefined });
      expect(result).toEqual(paginated);
    });

    it("passes pagination params", async () => {
      const paginated = { success: true as const, data: [mockOrder], pagination: { page: 2, limit: 10, total: 25, totalPages: 3 } };
      mockGetPaginated.mockResolvedValueOnce(paginated);

      await listOrders({ page: 2, limit: 10 });

      expect(mockGetPaginated).toHaveBeenCalledWith("/orders", { params: { page: 2, limit: 10 } });
    });
  });

  describe("getOrder", () => {
    it("calls GET /orders/:id", async () => {
      mockGet.mockResolvedValueOnce(mockOrder);

      const result = await getOrder("ord_1");

      expect(mockGet).toHaveBeenCalledWith("/orders/ord_1");
      expect(result).toEqual(mockOrder);
    });
  });

  describe("getOrderQueue", () => {
    it("calls GET /orders/queue with status filter", async () => {
      const paginated = { success: true as const, data: [mockOrder], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } };
      mockGetPaginated.mockResolvedValueOnce(paginated);

      await getOrderQueue({ status: "PENDING" });

      expect(mockGetPaginated).toHaveBeenCalledWith("/orders/queue", { params: { status: "PENDING" } });
    });
  });

  describe("getOrderHistory", () => {
    it("calls GET /orders/history with filters", async () => {
      const paginated = { success: true as const, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      mockGetPaginated.mockResolvedValueOnce(paginated);

      await getOrderHistory({ date: "2025-01-15", status: "COMPLETED" });

      expect(mockGetPaginated).toHaveBeenCalledWith("/orders/history", {
        params: { date: "2025-01-15", status: "COMPLETED" },
      });
    });
  });

  describe("getStaffOrderDetails", () => {
    it("calls GET /staff/orders/:orderId", async () => {
      const details = { order: { id: "ord_1", orderNumber: 1, status: "PENDING", totalAmount: 250 }, table: { id: "tbl_1", number: 5 }, items: [], payment: null };
      mockGet.mockResolvedValueOnce(details);

      const result = await getStaffOrderDetails("ord_1");

      expect(mockGet).toHaveBeenCalledWith("/staff/orders/ord_1");
      expect(result).toEqual(details);
    });
  });

  describe("createOrder", () => {
    it("calls POST /public/orders", async () => {
      mockPost.mockResolvedValueOnce({ ...mockOrder, items: [] });

      await createOrder({ tableId: "tbl_1", items: [{ productId: "prod_1", quantity: 2 }] });

      expect(mockPost).toHaveBeenCalledWith(
        "/public/orders",
        { tableId: "tbl_1", items: [{ productId: "prod_1", quantity: 2 }] },
        { skipAuthRefresh: true },
      );
    });
  });

  describe("updateOrderStatus", () => {
    it("calls PATCH /orders/:id/status", async () => {
      mockPatch.mockResolvedValueOnce({ ...mockOrder, status: "CONFIRMED" });

      const result = await updateOrderStatus("ord_1", { status: "CONFIRMED" });

      expect(mockPatch).toHaveBeenCalledWith("/orders/ord_1/status", { status: "CONFIRMED" });
      expect(result.status).toBe("CONFIRMED");
    });
  });

  describe("cancelOrder", () => {
    it("calls PATCH /orders/:id/cancel with reason", async () => {
      mockPatch.mockResolvedValueOnce({ ...mockOrder, status: "CANCELLED" });

      await cancelOrder("ord_1", { reason: "Customer left" });

      expect(mockPatch).toHaveBeenCalledWith("/orders/ord_1/cancel", { reason: "Customer left" });
    });

    it("calls PATCH /orders/:id/cancel without reason", async () => {
      mockPatch.mockResolvedValueOnce({ ...mockOrder, status: "CANCELLED" });

      await cancelOrder("ord_1");

      expect(mockPatch).toHaveBeenCalledWith("/orders/ord_1/cancel", undefined);
    });
  });

  describe("completeOrder", () => {
    it("calls POST /orders/:id/complete", async () => {
      mockPost.mockResolvedValueOnce({ ...mockOrder, status: "COMPLETED" });

      const result = await completeOrder("ord_1");

      expect(mockPost).toHaveBeenCalledWith("/orders/ord_1/complete");
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("payOrder", () => {
    it("calls POST /orders/:orderId/payment", async () => {
      const payment = { id: "pay_1", orderId: "ord_1", amount: 250, method: "CASH", status: "PAID", paidAt: "2025-01-15T11:00:00Z", createdAt: "2025-01-15T11:00:00Z" };
      mockPost.mockResolvedValueOnce(payment);

      const result = await payOrder("ord_1", { method: "CASH" });

      expect(mockPost).toHaveBeenCalledWith("/orders/ord_1/payment", { method: "CASH" });
      expect(result).toEqual(payment);
    });
  });
});
