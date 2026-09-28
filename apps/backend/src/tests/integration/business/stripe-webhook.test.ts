import { Prisma, prisma } from "@restaurant/database";
import Stripe from "stripe";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_SECRET = "sk_test_webhook_123";
const TEST_WEBHOOK_SECRET = "whsec_test_webhook_123";

vi.stubEnv("STRIPE_SECRET_KEY", TEST_SECRET);
vi.stubEnv("STRIPE_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET);

// Fresh app import *after* stubbing env so the webhook service is configured.
// (Static imports of app/test-utils would bind the unconfigured service.)
const { default: app } = await import("../../../app.js");
const api = request(app);

const RUN_ID = `wh_${Date.now().toString(36)}`;
const PROVIDER_REF = `pi_${RUN_ID}`;

const dbAvailable = await prisma
  .$queryRaw`SELECT 1`
  .then(() => true)
  .catch(() => false);

const created = { orderIds: [] as string[], tableIds: [] as string[] };

function signPayload(payload: string): string {
  return Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: TEST_WEBHOOK_SECRET,
  });
}

function succeededEvent(providerRef: string): string {
  return JSON.stringify({
    id: `evt_${providerRef}`,
    object: "event",
    type: "payment_intent.succeeded",
    data: {
      object: { id: providerRef, object: "payment_intent" },
    },
  });
}

const describeWebhook = describe.skipIf(!dbAvailable);

describeWebhook("stripe webhook (HTTP, real signatures)", () => {
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
        totalAmount: new Prisma.Decimal(250),
      },
    });
    orderId = order.id;
    created.orderIds.push(order.id);

    await prisma.payment.create({
      data: {
        orderId,
        amount: new Prisma.Decimal(250),
        method: "CARD",
        status: "PENDING",
        provider: "stripe",
        providerRef: PROVIDER_REF,
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

  it("marks the payment and order PAID on payment_intent.succeeded", async () => {
    const payload = succeededEvent(PROVIDER_REF);

    const res = await api
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signPayload(payload))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const payment = await prisma.payment.findUnique({
      where: { providerRef: PROVIDER_REF },
    });
    expect(payment?.status).toBe("PAID");
    expect(payment?.paidAt).not.toBeNull();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    expect(order?.paymentStatus).toBe("PAID");
  });

  it("is idempotent on redelivery", async () => {
    const payload = succeededEvent(PROVIDER_REF);

    const res = await api
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signPayload(payload))
      .send(payload);

    expect(res.status).toBe(200);

    const count = await prisma.payment.count({ where: { orderId } });
    expect(count).toBe(1);
  });

  it("rejects a forged signature", async () => {
    const payload = succeededEvent(PROVIDER_REF);

    const res = await api
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "t=123,v1=deadbeef")
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PAYMENT_PROVIDER_INVALID_SIGNATURE");
  });

  it("acknowledges unknown payment references without failing", async () => {
    const payload = succeededEvent("pi_does_not_exist");

    const res = await api
      .post("/api/v1/payments/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signPayload(payload))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});
