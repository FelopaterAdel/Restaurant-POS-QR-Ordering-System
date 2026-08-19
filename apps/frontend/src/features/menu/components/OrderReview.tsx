import { Button } from "@/components/ui";
import type { CartItem as CartItemType } from "../menu.types";

interface OrderReviewProps {
  items: CartItemType[];
  totalAmount: number;
  tableNumber: number;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

function formatPrice(price: number): string {
  return `₹${price}`;
}

export function OrderReview({
  items,
  totalAmount,
  tableNumber,
  onConfirm,
  onBack,
  isSubmitting,
  error,
}: OrderReviewProps) {
  return (
    <div className="order-review">
      <div className="order-review__header">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back to Menu
        </Button>
        <h2 className="order-review__title">Review Your Order</h2>
        <p className="order-review__subtitle">Table {tableNumber}</p>
      </div>

      <div className="order-review__items">
        {items.map((item) => (
          <div key={item.productId} className="order-review__item">
            <div className="order-review__item-info">
              <span className="order-review__item-name">{item.name}</span>
              <span className="order-review__item-qty">× {item.quantity}</span>
            </div>
            <span className="order-review__item-price">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="order-review__total">
        <span>Total</span>
        <span className="order-review__total-amount">
          {formatPrice(totalAmount)}
        </span>
      </div>

      {error && <p className="order-review__error">{error}</p>}

      <div className="order-review__actions">
        <Button
          variant="primary"
          size="lg"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="order-review__confirm-btn"
        >
          {isSubmitting ? "Placing Order…" : "Place Order"}
        </Button>
      </div>
    </div>
  );
}
