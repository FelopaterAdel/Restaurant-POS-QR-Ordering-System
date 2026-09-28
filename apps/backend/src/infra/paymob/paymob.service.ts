import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../errors/app-error.js";
import { AppErrorCode } from "../../errors/codes.js";
import {
  PaymentProviderNotConfiguredError,
  type OnlinePaymentIntent,
  type OnlinePaymentProvider,
} from "../stripe/stripe.service.js";

const PAYMOB_API_BASE = "https://accept.paymob.com/api";

export interface PaymobIntent extends OnlinePaymentIntent {
  /** Paymob-hosted card iframe URL the customer completes payment on. */
  redirectUrl: string;
}

type FetchFn = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Paymob (Accept) implementation of online payments for the Egyptian market.
 *
 * Flow: auth token -> register order -> payment key, then the customer pays
 * inside Paymob's hosted iframe. Success arrives on the processed-transaction
 * callback, verified with HMAC_SHA512.
 */
export class PaymobPaymentService implements OnlinePaymentProvider {
  readonly name = "paymob";
  private readonly apiKey: string;
  private readonly integrationId: string;
  private readonly iframeId: string;
  private readonly hmacSecret: string;
  private readonly currency: string;
  private readonly fetchFn: FetchFn;

  constructor(
    options: {
      apiKey?: string;
      integrationId?: string;
      iframeId?: string;
      hmacSecret?: string;
      currency?: string;
    } = {},
    fetchFn: FetchFn = fetch as unknown as FetchFn,
  ) {
    this.apiKey = options.apiKey ?? env.paymob.apiKey;
    this.integrationId = options.integrationId ?? env.paymob.integrationId;
    this.iframeId = options.iframeId ?? env.paymob.iframeId;
    this.hmacSecret = options.hmacSecret ?? env.paymob.hmacSecret;
    this.currency = options.currency ?? env.paymob.currency;
    this.fetchFn = fetchFn;
  }

  isConfigured(): boolean {
    return (
      this.apiKey.length > 0 &&
      this.integrationId.length > 0 &&
      this.iframeId.length > 0 &&
      this.hmacSecret.length > 0
    );
  }

  private requireConfigured(): void {
    if (!this.isConfigured()) {
      throw new PaymentProviderNotConfiguredError();
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await this.fetchFn(`${PAYMOB_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new BadRequestError(
        AppErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
        `Paymob request failed with status ${res.status}`,
      );
    }
    return (await res.json()) as T;
  }

  async createPaymentIntent(input: {
    amountMinor: number;
    orderId: string;
    orderNumber: number;
    customerPhone?: string | null;
  }): Promise<PaymobIntent> {
    this.requireConfigured();

    const { token } = await this.post<{ token: string }>("/auth/tokens", {
      api_key: this.apiKey,
    });

    const paymobOrder = await this.post<{ id: number }>("/ecommerce/orders", {
      auth_token: token,
      delivery_needed: false,
      amount_cents: input.amountMinor,
      currency: this.currency,
      merchant_order_id: input.orderId,
      items: [],
    });

    const { token: paymentToken } = await this.post<{ token: string }>(
      "/acceptance/payment_keys",
      {
        auth_token: token,
        amount_cents: input.amountMinor,
        expiration: 3600,
        order_id: paymobOrder.id,
        billing_data: {
          apartment: "NA",
          email: "customer@example.com",
          floor: "NA",
          first_name: "Restaurant",
          street: "NA",
          building: "NA",
          phone_number: input.customerPhone ?? "01000000000",
          shipping_method: "PKG",
          postal_code: "NA",
          city: "NA",
          country: "NA",
          last_name: "Customer",
          state: "NA",
        },
        currency: this.currency,
        integration_id: Number(this.integrationId),
      },
    );

    return {
      id: String(paymobOrder.id),
      clientSecret: paymentToken,
      redirectUrl: `${PAYMOB_API_BASE}/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`,
    };
  }

  /**
   * Verifies a processed-transaction callback. `obj` is the `obj` node of
   * the callback body, `hmac` the `hmac` query param.
   */
  verifyCallback(obj: Record<string, any>, hmac: string): boolean {
    this.requireConfigured();
    const expected = computePaymobHmac(obj, this.hmacSecret);
    if (expected.length !== hmac.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
  }
}

/** Field order mandated by Paymob for the processed-callback HMAC. */
export function computePaymobHmac(
  obj: Record<string, any>,
  secret: string,
): string {
  const pick = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "true" : "false";
    return String(value);
  };
  const concatenated = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success,
  ]
    .map(pick)
    .join("");
  return createHmac("sha512", secret).update(concatenated).digest("hex");
}
