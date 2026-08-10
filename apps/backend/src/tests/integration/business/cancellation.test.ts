import { OrderStatus, TableStatus, UserRole } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  cancelOrder,
  completeOrder,
  createCategory,
  createOrderViaApi,
  createProduct,
  createTable,
  createUserDirect,
  dbAvailable,
  ensureOwner,
  getTableById,
  loginAsAndGetToken,
  payOrder,
  updateOrderStatus,
  TestData,
} from "./test-utils.js";

const td = new TestData();
let ownerToken: string;
let cashierToken: string;
let productId: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("order cancellation (HTTP)", () => {
  beforeAll(async () => {
    const owner = await ensureOwner(td);
    ownerToken = await loginAsAndGetToken(owner.email);

    const cashier = await createUserDirect(td, { role: UserRole.CASHIER });
    cashierToken = await loginAsAndGetToken(cashier.email);

    const category = await createCategory(td);
    const product = await createProduct(td, category.id);
    productId = product.id;
  }, 30_000);

  afterAll(async () => {
    await td.cleanup();
  });

  async function orderAtStatus(
    target: OrderStatus | "PAID",
    tableId: string,
  ): Promise<string> {
    const created = await createOrderViaApi(td, tableId, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;
    if (target === OrderStatus.PENDING) {
      return orderId;
    }

    for (const status of ["CONFIRMED", "PREPARING", "READY"] as const) {
      const res = await updateOrderStatus(orderId, status, ownerToken);
      expect(res.status).toBe(200);
      if (status === target) {
        return orderId;
      }
    }

    if (target === "PAID") {
      const pay = await payOrder(orderId, ownerToken);
      expect(pay.status).toBe(201);
    }

    if (target === OrderStatus.COMPLETED) {
      const pay = await payOrder(orderId, ownerToken);
      expect(pay.status).toBe(201);
      const complete = await completeOrder(orderId, ownerToken);
      expect(complete.status).toBe(200);
    }

    return orderId;
  }

  it.each([
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.PREPARING,
  ])("cancels a %s order", async (target) => {
    const table = await createTable(td);
    const orderId = await orderAtStatus(target, table.id);
    const res = await cancelOrder(orderId, ownerToken, "No longer needed");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("CANCELLED");
    expect(res.body.data.cancelledReason).toBe("No longer needed");
    expect(res.body.data.cancelledAt).not.toBeNull();
  });

  it.each([
    OrderStatus.READY,
    "PAID",
    OrderStatus.COMPLETED,
  ])("rejects cancelling a %s order", async (target) => {
    const table = await createTable(td);
    const orderId = await orderAtStatus(target as OrderStatus | "PAID", table.id);
    const res = await cancelOrder(orderId, ownerToken);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ORDER_CANNOT_BE_CANCELLED");
  });

  it("rejects cancelling an already-cancelled order", async () => {
    const table = await createTable(td);
    const orderId = await orderAtStatus(OrderStatus.PENDING, table.id);
    await cancelOrder(orderId, ownerToken, "First attempt");

    const res = await cancelOrder(orderId, ownerToken, "Second attempt");
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ORDER_ALREADY_CANCELLED");
  });

  it("releases the table when the order is cancelled", async () => {
    const table = await createTable(td);
    const orderId = await orderAtStatus(OrderStatus.PENDING, table.id);
    await cancelOrder(orderId, ownerToken);

    const tableRes = await getTableById(table.id, ownerToken);
    expect(tableRes.status).toBe(200);
    expect(tableRes.body.data.status).toBe(TableStatus.AVAILABLE);
  });

  it("forbids a cashier from cancelling an order", async () => {
    const table = await createTable(td);
    const orderId = await orderAtStatus(OrderStatus.PENDING, table.id);
    const res = await cancelOrder(orderId, cashierToken);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
