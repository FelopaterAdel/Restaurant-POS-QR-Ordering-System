import type { NextFunction, Request, Response } from "express";
import type Stripe from "stripe";
import { BadRequestError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { PaymobPaymentService } from "../../../infra/paymob/paymob.service.js";
import { StripePaymentService } from "../../../infra/stripe/stripe.service.js";
import { ConfirmOnlinePaymentUseCase } from "../use-cases/confirm-online-payment.use-case.js";

const stripeService = new StripePaymentService();
const paymobService = new PaymobPaymentService();
const confirmOnlinePayment = new ConfirmOnlinePaymentUseCase();

export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string" || signature.length === 0) {
    throw new BadRequestError(
      AppErrorCode.PAYMENT_PROVIDER_INVALID_SIGNATURE,
      "Missing webhook signature",
    );
  }

  // Mounted with express.raw(): body is a Buffer for signature verification.
  const event = stripeService.constructWebhookEvent(
    req.body as Buffer,
    signature,
  );

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await confirmOnlinePayment.execute(intent.id);
  }
  // payment_intent.payment_failed and other types: acknowledge and leave
  // the payment PENDING so the customer can retry or pay at the counter.

  res.status(200).json({ received: true });
}

export async function paymobCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const hmac = req.query.hmac;
  const obj = (req.body as { obj?: unknown } | undefined)?.obj;
  if (typeof hmac !== "string" || !obj || typeof obj !== "object") {
    throw new BadRequestError(
      AppErrorCode.PAYMENT_PROVIDER_INVALID_SIGNATURE,
      "Invalid Paymob callback",
    );
  }

  const record = obj as Record<string, any>;
  if (!paymobService.verifyCallback(record, hmac)) {
    throw new BadRequestError(
      AppErrorCode.PAYMENT_PROVIDER_INVALID_SIGNATURE,
      "Invalid Paymob callback signature",
    );
  }

  // Only successful transactions confirm payment; anything else stays
  // PENDING so the customer can retry or pay at the counter.
  if (record.success === true && record.order?.id != null) {
    await confirmOnlinePayment.execute(String(record.order.id));
  }

  res.status(200).json({ received: true });
}
