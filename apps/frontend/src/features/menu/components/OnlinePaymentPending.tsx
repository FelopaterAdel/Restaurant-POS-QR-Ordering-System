import { Button } from "@/components/ui";
import type { CreatePublicOrderResult } from "../menu.types";
import { formatPrice } from "../format-price";

interface OnlinePaymentPendingProps {
  order: CreatePublicOrderResult;
  tableNumber: number;
  onTrackOrder: () => void;
  onNewOrder: () => void;
}

/**
 * Shown after an order is created with an online PaymentIntent.
 * Card details are collected by Stripe Elements once a publishable key
 * is configured; until then the customer pays at the counter.
 */
export function OnlinePaymentPending({
  order,
  tableNumber,
  onTrackOrder,
  onNewOrder,
}: OnlinePaymentPendingProps) {
  return (
    <div className="order-success">
      <div className="order-success__icon">◷</div>
      <h2 className="order-success__title">Order Placed!</h2>
      <p className="order-success__subtitle">
        Order #{order.orderNumber} · Table {tableNumber} ·{" "}
        {formatPrice(order.totalAmount)}
      </p>

      <p className="order-success__note">
        Your card payment is reserved. If the payment doesn&apos;t complete
        on this device, you can pay at the counter — just mention order #
        {order.orderNumber}.
      </p>

      <div className="order-success__actions">
        {order.paymentRedirectUrl && (
          <a
            href={order.paymentRedirectUrl}
            target="_blank"
            rel="noreferrer"
            className="button button--primary button--lg"
          >
            Pay now
          </a>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={onTrackOrder}
          className="order-success__track-btn"
        >
          View Order
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewOrder}
          className="order-success__new-btn"
        >
          Place Another Order
        </Button>
      </div>
    </div>
  );
}
