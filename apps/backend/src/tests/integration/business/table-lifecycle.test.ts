import { TableStatus } from "@restaurant/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  advanceOrderToReady,
  api,
  cancelOrder,
  completeOrder,
  createCategory,
  createOrderViaApi,
  createProduct,
  createTable,
  dbAvailable,
  ensureOwner,
  getTableById,
  loginAsAndGetToken,
  payOrder,
  TestData,
} from "./test-utils.js";

const td = new TestData();
let ownerToken: string;
let productId: string;

const describeAuth = describe.skipIf(!dbAvailable);

describeAuth("table lifecycle (HTTP)", () => {
  beforeAll(async () => {
    const owner = await ensureOwner(td);
    ownerToken = await loginAsAndGetToken(owner.email);

    const category = await createCategory(td);
    const product = await createProduct(td, category.id);
    productId = product.id;
  }, 30_000);

  afterAll(async () => {
    await td.cleanup();
  });

  it("moves from AVAILABLE to OCCUPIED when an order is created", async () => {
    const table = await createTable(td);

    const before = await getTableById(table.id, ownerToken);
    expect(before.status).toBe(200);
    expect(before.body.data.status).toBe(TableStatus.AVAILABLE);

    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);

    const after = await getTableById(table.id, ownerToken);
    expect(after.status).toBe(200);
    expect(after.body.data.status).toBe(TableStatus.OCCUPIED);
  });

  it("returns to AVAILABLE when the order is cancelled", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);

    const cancelled = await cancelOrder(created.body.data.id, ownerToken);
    expect(cancelled.status).toBe(200);

    const tableRes = await getTableById(table.id, ownerToken);
    expect(tableRes.status).toBe(200);
    expect(tableRes.body.data.status).toBe(TableStatus.AVAILABLE);
  });

  it("returns to AVAILABLE when the order is completed", async () => {
    const table = await createTable(td);
    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(201);
    const orderId = created.body.data.id as string;

    await advanceOrderToReady(orderId, ownerToken);
    const paid = await payOrder(orderId, ownerToken);
    expect(paid.status).toBe(201);
    const completed = await completeOrder(orderId, ownerToken);
    expect(completed.status).toBe(200);

    const tableRes = await getTableById(table.id, ownerToken);
    expect(tableRes.status).toBe(200);
    expect(tableRes.body.data.status).toBe(TableStatus.AVAILABLE);
  });

  it("rejects creating an order on a disabled table", async () => {
    const table = await createTable(td);

    const disabled = await api
      .delete(`/api/v1/tables/${table.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(disabled.status).toBe(200);

    const after = await getTableById(table.id, ownerToken);
    expect(after.body.data.status).toBe(TableStatus.DISABLED);

    const created = await createOrderViaApi(td, table.id, productId);
    expect(created.status).toBe(409);
    expect(created.body.success).toBe(false);
    expect(created.body.error.code).toBe("TABLE_DISABLED");
  });
});
