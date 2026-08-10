import { UserRole, TableStatus } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  advanceOrderToReady,
  api,
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
  TestData,
} from "./test-utils.js";

const td = new TestData();
let ownerToken: string;
let kitchenToken: string;
let cashierToken: string;
let productId: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("order lifecycle (HTTP)", () => {
  beforeAll(async () => {
    const owner = await ensureOwner(td);
    ownerToken = await loginAsAndGetToken(owner.email);

    const kitchen = await createUserDirect(td, { role: UserRole.KITCHEN });
    kitchenToken = await loginAsAndGetToken(kitchen.email);
    const cashier = await createUserDirect(td, { role: UserRole.CASHIER });
    cashierToken = await loginAsAndGetToken(cashier.email);

    const category = await createCategory(td);
    const product = await createProduct(td, category.id);
    productId = product.id;
  }, 30_000);

  afterAll(async () => {
    await td.cleanup();
  });

  it("creates a PENDING order and marks the table OCCUPIED", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("PENDING");

    const tableRes = await getTableById(table.id, ownerToken);
    expect(tableRes.status).toBe(200);
    expect(tableRes.body.data.status).toBe(TableStatus.OCCUPIED);
  });

  it("rejects completing an unpaid order with ORDER_NOT_PAID", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);

    const res = await completeOrder(created.body.data.id, ownerToken);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ORDER_NOT_PAID");
  });

  it("completes a paid order and releases the table", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    await advanceOrderToReady(orderId, ownerToken);

    const payment = await payOrder(orderId, ownerToken);
    expect(payment.status).toBe(201);
    expect(payment.body.data.status).toBe("PAID");

    const paidOrder = await api
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(paidOrder.status).toBe(200);
    expect(paidOrder.body.data.paymentStatus).toBe("PAID");

    const completed = await completeOrder(orderId, ownerToken);
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe("COMPLETED");

    const tableRes = await getTableById(table.id, ownerToken);
    expect(tableRes.status).toBe(200);
    expect(tableRes.body.data.status).toBe(TableStatus.AVAILABLE);
  });

  it("rejects an invalid status transition with ORDER_INVALID_STATUS", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);

    const res = await api
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "SERVED" });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("ORDER_INVALID_STATUS");
  });

  it("forbids a kitchen user from serving an order", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    await advanceOrderToReady(orderId, ownerToken);

    const res = await api
      .patch(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${kitchenToken}`)
      .send({ status: "SERVED" });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("forbids a cashier from changing order status", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);

    const res = await api
      .patch(`/api/v1/orders/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${cashierToken}`)
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
