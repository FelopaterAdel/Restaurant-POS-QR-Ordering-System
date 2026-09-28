import { describe, expect, it, vi } from "vitest";
import {
  computePaymobHmac,
  PaymobPaymentService,
} from "./paymob.service.js";
import { PaymentProviderNotConfiguredError } from "../stripe/stripe.service.js";

const options = {
  apiKey: "test_api_key",
  integrationId: "123456",
  iframeId: "654321",
  hmacSecret: "test_hmac_secret",
  currency: "EGP",
};

function fakeFetch() {
  const calls: Array<{ url: string; body: unknown }> = [];
  const fn = vi.fn(async (url: string, init: { body: string }) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    if (url.endsWith("/auth/tokens")) {
      return { ok: true, status: 200, json: async () => ({ token: "auth_tok" }) };
    }
    if (url.endsWith("/ecommerce/orders")) {
      return { ok: true, status: 200, json: async () => ({ id: 987654 }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ token: "payment_token_abc" }),
    };
  });
  return { fn, calls };
}

describe("PaymobPaymentService", () => {
  it("reports unconfigured without credentials and fails fast", async () => {
    const service = new PaymobPaymentService({
      apiKey: "",
      integrationId: "",
      iframeId: "",
      hmacSecret: "",
    });

    expect(service.isConfigured()).toBe(false);
    await expect(
      service.createPaymentIntent({
        amountMinor: 1000,
        orderId: "order_1",
        orderNumber: 1001,
      }),
    ).rejects.toBeInstanceOf(PaymentProviderNotConfiguredError);
  });

  it("runs auth -> order -> payment key and returns an iframe URL", async () => {
    const { fn, calls } = fakeFetch();
    const service = new PaymobPaymentService(options, fn as never);

    expect(service.isConfigured()).toBe(true);
    const intent = await service.createPaymentIntent({
      amountMinor: 2550,
      orderId: "order_1",
      orderNumber: 1042,
      customerPhone: "01012345678",
    });

    expect(intent).toEqual({
      id: "987654",
      clientSecret: "payment_token_abc",
      redirectUrl:
        "https://accept.paymob.com/api/acceptance/iframes/654321?payment_token=payment_token_abc",
    });
    expect(calls.map((call) => call.url)).toEqual([
      "https://accept.paymob.com/api/auth/tokens",
      "https://accept.paymob.com/api/ecommerce/orders",
      "https://accept.paymob.com/api/acceptance/payment_keys",
    ]);
    expect(calls[1].body).toMatchObject({
      amount_cents: 2550,
      currency: "EGP",
      merchant_order_id: "order_1",
    });
    expect(calls[2].body).toMatchObject({
      amount_cents: 2550,
      order_id: 987654,
      integration_id: 123456,
    });
  });

  it("propagates Paymob API failures", async () => {
    const fn = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const service = new PaymobPaymentService(options, fn as never);

    await expect(
      service.createPaymentIntent({
        amountMinor: 1000,
        orderId: "order_1",
        orderNumber: 1,
      }),
    ).rejects.toThrowError(/status 401/);
  });

  it("verifies callbacks with HMAC_SHA512 over the documented fields", () => {
    const service = new PaymobPaymentService(options);
    const obj = {
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
      order: { id: 987654 },
      owner: 555,
      pending: false,
      source_data: { pan: "2346", sub_type: "Mastercard", type: "card" },
      success: true,
    };

    const hmac = computePaymobHmac(obj, options.hmacSecret);
    expect(service.verifyCallback(obj, hmac)).toBe(true);
    expect(service.verifyCallback({ ...obj, success: false }, hmac)).toBe(false);
    expect(
      service.verifyCallback(obj, computePaymobHmac(obj, "other-secret")),
    ).toBe(false);
  });
});
