import { Button } from "@/components/ui";
import type { CreatePublicOrderResult } from "../menu.types";

interface OrderSuccessProps {
  order: CreatePublicOrderResult;
  tableNumber: number;
  onNewOrder: () => void;
}

function formatPrice(price: number): string {
  return `₹${price}`;
}

export function OrderSuccess({
  order,
  tableNumber,
  onNewOrder,
}: OrderSuccessProps) {
  return (
    <div className="order-success">
      <div className="order-success__icon">✓</div>
      <h2 className="order-success__title">Order Placed!</h2>
      <p className="order-success__subtitle">
        Your order has been sent to the kitchen
      </p>

      <div className="order-success__details">
        <div className="order-success__detail">
          <span className="order-success__detail-label">Order Number</span>
          <span className="order-success__detail-value">
            #{order.orderNumber}
          </span>
        </div>
        <div className="order-success__detail">
          <span className="order-success__detail-label">Table</span>
          <span className="order-success__detail-value">{tableNumber}</span>
        </div>
        <div className="order-success__detail">
          <span className="order-success__detail-label">Total</span>
          <span className="order-success__detail-value">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <div className="order-success__items">
        <h3 className="order-success__items-title">Order Summary</h3>
        {order.items.map((item) => (
          <div key={item.id} className="order-success__item">
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{formatPrice(item.totalPrice)}</span>
          </div>
        ))}
      </div>

      <p className="order-success__note">
        Please wait for your order to be served. You can call a staff member if
        you need assistance.
      </p>

      <Button
        variant="primary"
        size="lg"
        onClick={onNewOrder}
        className="order-success__new-btn"
      >
        Place Another Order
      </Button>
    </div>
  );
}
