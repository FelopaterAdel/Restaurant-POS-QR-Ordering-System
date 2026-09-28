import { describe, expect, it, vi } from "vitest";
import {
  PaymentProviderNotConfiguredError,
  StripePaymentService,
} from "./stripe.service.js";

function fakeClient() {
  return {
    paymentIntents: {
      create: vi.fn(async () => ({
        id: "pi_test_123",
        client_secret: "pi_test_123_secret_abc",
      })),
    },
    webhooks: {
      constructEvent: vi.fn((payload: unknown) => ({
        id: "evt_test",
        type: "payment_intent.succeeded",
        payload,
      })),
    },
  };
}

describe("StripePaymentService", () => {
  it("reports unconfigured without keys and fails fast", async () => {
    const service = new StripePaymentService("", "", "egp");

    expect(service.isConfigured()).toBe(false);
    await expect(
      service.createPaymentIntent({
        amountMinor: 1000,
        orderId: "order_1",
        orderNumber: 1001,
      }),
    ).rejects.toBeInstanceOf(PaymentProviderNotConfiguredError);
    expect(() =>
      service.constructWebhookEvent(Buffer.from("{}"), "sig"),
    ).toThrow(PaymentProviderNotConfiguredError);
  });

  it("creates a payment intent with amount, currency and order metadata", async () => {
    const client = fakeClient();
    const service = new StripePaymentService(
      "sk_test_123",
      "whsec_test_123",
      "egp",
      () => client as never,
    );

    expect(service.isConfigured()).toBe(true);
    const intent = await service.createPaymentIntent({
      amountMinor: 2550,
      orderId: "order_1",
      orderNumber: 1042,
      customerPhone: "01012345678",
    });

    expect(intent).toEqual({
      id: "pi_test_123",
      clientSecret: "pi_test_123_secret_abc",
    });
    expect(client.paymentIntents.create).toHaveBeenCalledWith({
      amount: 2550,
      currency: "egp",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        orderId: "order_1",
        orderNumber: "1042",
        customerPhone: "01012345678",
      },
    });
  });

  it("wraps invalid webhook signatures", () => {
    const client = fakeClient();
    client.webhooks.constructEvent.mockImplementationOnce(() => {
      throw new Error("bad signature");
    });
    const service = new StripePaymentService(
      "sk_test_123",
      "whsec_test_123",
      "egp",
      () => client as never,
    );

    expect(() =>
      service.constructWebhookEvent(Buffer.from("{}"), "bad"),
    ).toThrowError(/Invalid webhook signature/);
  });
});
