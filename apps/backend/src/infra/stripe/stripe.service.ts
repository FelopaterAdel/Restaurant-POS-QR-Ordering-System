import Stripe from "stripe";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../errors/app-error.js";
import { AppErrorCode } from "../../errors/codes.js";

export class PaymentProviderNotConfiguredError extends BadRequestError {
  constructor() {
    super(
      AppErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
      "Online payment is not configured",
    );
    this.name = "PaymentProviderNotConfiguredError";
  }
}

export interface CreateOnlineIntentInput {
  amountMinor: number;
  orderId: string;
  orderNumber: number;
  customerPhone?: string | null;
}

export interface OnlinePaymentIntent {
  id: string;
  clientSecret: string;
  /** Optional hosted-payment URL (e.g. Paymob iframe). */
  redirectUrl?: string;
}

export interface OnlinePaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createPaymentIntent(
    input: CreateOnlineIntentInput,
  ): Promise<OnlinePaymentIntent>;
  constructWebhookEvent?(rawBody: Buffer, signature: string): Stripe.Event;
}

/**
 * Stripe implementation of online card payments.
 *
 * Constructed lazily from env so the app boots fine without keys —
 * calls fail fast with PaymentProviderNotConfiguredError instead.
 */
export class StripePaymentService implements OnlinePaymentProvider {
  readonly name = "stripe";
  private readonly client: Stripe | null;
  private readonly webhookSecret: string;
  private readonly currency: string;

  constructor(
    secretKey: string = env.stripe.secretKey,
    webhookSecret: string = env.stripe.webhookSecret,
    currency: string = env.stripe.currency,
    clientFactory: (key: string) => Stripe = (key) => new Stripe(key),
  ) {
    this.client = secretKey ? clientFactory(secretKey) : null;
    this.webhookSecret = webhookSecret;
    this.currency = currency;
  }

  isConfigured(): boolean {
    return this.client !== null && this.webhookSecret.length > 0;
  }

  private requireClient(): Stripe {
    if (!this.client || this.webhookSecret.length === 0) {
      throw new PaymentProviderNotConfiguredError();
    }
    return this.client;
  }

  async createPaymentIntent(
    input: CreateOnlineIntentInput,
  ): Promise<OnlinePaymentIntent> {
    const client = this.requireClient();

    const intent = await client.paymentIntents.create({
      amount: input.amountMinor,
      currency: this.currency,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        orderId: input.orderId,
        orderNumber: String(input.orderNumber),
        ...(input.customerPhone ? { customerPhone: input.customerPhone } : {}),
      },
    });

    if (!intent.client_secret) {
      throw new BadRequestError(
        AppErrorCode.PAYMENT_PROVIDER_NOT_CONFIGURED,
        "Stripe did not return a client secret",
      );
    }

    return { id: intent.id, clientSecret: intent.client_secret };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const client = this.requireClient();
    try {
      return client.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new BadRequestError(
        AppErrorCode.PAYMENT_PROVIDER_INVALID_SIGNATURE,
        "Invalid webhook signature",
      );
    }
  }
}
