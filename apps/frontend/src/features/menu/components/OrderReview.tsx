import { Button } from "@/components/ui";
import type { CartItem as CartItemType } from "../menu.types";
import { formatPrice } from "../format-price";

interface OrderReviewProps {
  items: CartItemType[];
  totalAmount: number;
  tableNumber: number;
  couponCode: string;
  onCouponChange: (code: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  onlineProvider: string | null;
  onOnlineProviderChange: (provider: string | null) => void;
  availableProviders: Array<{ id: string; label: string }>;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function OrderReview({
  items,
  totalAmount,
  tableNumber,
  couponCode,
  onCouponChange,
  phone,
  onPhoneChange,
  onlineProvider,
  onOnlineProviderChange,
  availableProviders,
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

      <div className="order-review__coupon">
        <label htmlFor="order-coupon-code">Coupon code (optional)</label>
        <input
          id="order-coupon-code"
          type="text"
          placeholder="e.g. WELCOME10"
          value={couponCode}
          onChange={(e) => onCouponChange(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="order-review__phone">
        <label htmlFor="order-phone">
          Phone for loyalty points (optional)
        </label>
        <input
          id="order-phone"
          type="tel"
          placeholder="e.g. 01012345678"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <fieldset className="order-review__payment">
        <legend>Payment method</legend>
        <label>
          <input
            type="radio"
            name="payment-method"
            value="counter"
            checked={onlineProvider === null}
            onChange={() => onOnlineProviderChange(null)}
            disabled={isSubmitting}
          />
          Pay at the counter
        </label>
        {availableProviders.map((provider) => (
          <label key={provider.id}>
            <input
              type="radio"
              name="payment-method"
              value={provider.id}
              checked={onlineProvider === provider.id}
              onChange={() => onOnlineProviderChange(provider.id)}
              disabled={isSubmitting}
            />
            {provider.label}
          </label>
        ))}
      </fieldset>

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
          loading={isSubmitting}
          loadingText="Placing Order…"
          className="order-review__confirm-btn"
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}
