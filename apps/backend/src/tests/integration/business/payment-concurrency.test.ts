import { prisma } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  advanceOrderToReady,
  api,
  createCategory,
  createOrderViaApi,
  createProduct,
  createTable,
  dbAvailable,
  ensureOwner,
  loginAsAndGetToken,
  payOrder,
  TestData,
} from "./test-utils.js";

const td = new TestData();
let ownerToken: string;
let tableId: string;
let productId: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("payment concurrency (HTTP)", () => {
  beforeAll(async () => {
    const owner = await ensureOwner(td);
    ownerToken = await loginAsAndGetToken(owner.email);

    const table = await createTable(td);
    tableId = table.id;
    const category = await createCategory(td);
    const product = await createProduct(td, category.id);
    productId = product.id;
  }, 30_000);

  afterAll(async () => {
    await td.cleanup();
  });

  it("allows exactly one of two concurrent payments to succeed", async () => {
    const created = await createOrderViaApi(td, tableId, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    await advanceOrderToReady(orderId, ownerToken);

    const [a, b] = await Promise.all([
      payOrder(orderId, ownerToken),
      payOrder(orderId, ownerToken),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);

    const loser = a.status === 409 ? a : b;
    expect(loser.body.success).toBe(false);
    expect(loser.body.error.code).toBe("PAYMENT_ALREADY_EXISTS");

    const winner = a.status === 201 ? a : b;
    expect(winner.body.data.status).toBe("PAID");

    const paymentCount = await prisma.payment.count({ where: { orderId } });
    expect(paymentCount).toBe(1);

    const order = await api
      .get(`/api/v1/orders/${orderId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(order.status).toBe(200);
    expect(order.body.data.paymentStatus).toBe("PAID");
  });

  it("rejects a second payment after the order is already paid", async () => {
    const created = await createOrderViaApi(td, tableId, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    await advanceOrderToReady(orderId, ownerToken);

    const first = await payOrder(orderId, ownerToken);
    expect(first.status).toBe(201);

    const second = await payOrder(orderId, ownerToken);
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe("PAYMENT_ALREADY_EXISTS");
  });
});
