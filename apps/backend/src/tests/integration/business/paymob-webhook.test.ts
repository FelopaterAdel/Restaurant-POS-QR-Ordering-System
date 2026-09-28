import { Prisma, prisma } from "@restaurant/database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_HMAC_SECRET = "test_paymob_hmac_secret";

vi.stubEnv("PAYMOB_API_KEY", "test_api_key");
vi.stubEnv("PAYMOB_INTEGRATION_ID", "123456");
vi.stubEnv("PAYMOB_IFRAME_ID", "654321");
vi.stubEnv("PAYMOB_HMAC_SECRET", TEST_HMAC_SECRET);

// Dynamic imports *after* stubbing env: static imports would evaluate
// config/env.js first and freeze the unconfigured values.
const { computePaymobHmac } = await import(
  "../../../infra/paymob/paymob.service.js"
);
const { default: app } = await import("../../../app.js");
const api = request(app);

const RUN_ID = `pm_${Date.now().toString(36)}`;
const PAYMOB_ORDER_ID = 770000 + Math.floor(Math.random() * 10000);

const dbAvailable = await prisma
  .$queryRaw`SELECT 1`
  .then(() => true)
  .catch(() => false);

const created = { orderIds: [] as string[], tableIds: [] as string[] };

function callbackObj(overrides: Record<string, unknown> = {}) {
  return {
    amount_cents: 2550,
    created_at: "2026-09-28T10:00:00.000Z",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    id: 2000001,
    integration_id: 123456,
    is_3d_secure: true,
    is_auth: false,
    is_capture: true,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: PAYMOB_ORDER_ID },
    owner: 555,
    pending: false,
    source_data: { pan: "2346", sub_type: "Mastercard", type: "card" },
    success: true,
    ...overrides,
  };
}

async function postCallback(obj: Record<string, unknown>, hmac?: string) {
  const signed = hmac ?? computePaymobHmac(obj, TEST_HMAC_SECRET);
  return api
    .post("/api/v1/payments/webhook/paymob")
    .query({ hmac: signed })
    .send({ obj, type: "TRANSACTION" });
}

const describeWebhook = describe.skipIf(!dbAvailable);

describeWebhook("paymob callback (HTTP, real HMAC)", () => {
  let orderId: string;

  beforeAll(async () => {
    const table = await prisma.restaurantTable.create({
      data: {
        number: Math.floor(Math.random() * 90_000_000) + 10_000_000,
        name: `Tbl ${RUN_ID}`,
        qrCode: `tbl_${RUN_ID}`,
      },
    });
    created.tableIds.push(table.id);

    const order = await prisma.order.create({
      data: {
        tableId: table.id,
        totalAmount: new Prisma.Decimal(25.5),
      },
    });
    orderId = order.id;
    created.orderIds.push(order.id);

    await prisma.payment.create({
      data: {
        orderId,
        amount: new Prisma.Decimal(25.5),
        method: "CARD",
        status: "PENDING",
        provider: "paymob",
        providerRef: String(PAYMOB_ORDER_ID),
      },
    });
  }, 30_000);

  afterAll(async () => {
    await prisma.payment.deleteMany({
      where: { orderId: { in: created.orderIds } },
    });
    await prisma.order.deleteMany({ where: { id: { in: created.orderIds } } });
    await prisma.restaurantTable.deleteMany({
      where: { id: { in: created.tableIds } },
    });
    vi.unstubAllEnvs();
  });

  it("marks the payment and order PAID on a successful callback", async () => {
    const res = await postCallback(callbackObj());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const payment = await prisma.payment.findUnique({
      where: { providerRef: String(PAYMOB_ORDER_ID) },
    });
    expect(payment?.status).toBe("PAID");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.paymentStatus).toBe("PAID");
  });

  it("rejects a tampered callback", async () => {
    const obj = callbackObj();
    const res = await postCallback(
      { ...obj, amount_cents: 1 },
      computePaymobHmac(obj, TEST_HMAC_SECRET),
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("PAYMENT_PROVIDER_INVALID_SIGNATURE");
  });

  it("leaves failed transactions pending for retry", async () => {
    const failedRef = `${PAYMOB_ORDER_ID}_failed`;
    const table = await prisma.restaurantTable.create({
      data: {
        number: Math.floor(Math.random() * 90_000_000) + 10_000_000,
        name: `Tbl ${RUN_ID} failed`,
        qrCode: `tbl_${RUN_ID}_failed`,
      },
    });
    created.tableIds.push(table.id);
    const order = await prisma.order.create({
      data: { tableId: table.id, totalAmount: new Prisma.Decimal(25.5) },
    });
    created.orderIds.push(order.id);
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: new Prisma.Decimal(25.5),
        method: "CARD",
        status: "PENDING",
        provider: "paymob",
        providerRef: failedRef,
      },
    });

    const res = await postCallback(
      callbackObj({ success: false, order: { id: failedRef } }),
    );

    expect(res.status).toBe(200);

    const payment = await prisma.payment.findUnique({
      where: { providerRef: failedRef },
    });
    expect(payment?.status).toBe("PENDING");
    const freshOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(freshOrder?.paymentStatus).toBe("PENDING");
  });
});
