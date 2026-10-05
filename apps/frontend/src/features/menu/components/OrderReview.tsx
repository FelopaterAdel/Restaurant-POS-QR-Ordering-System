import { Button } from "@/components/ui";
import type { CartItem as CartItemType, CheckoutTip } from "../menu.types";
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
  tip: CheckoutTip;
  onTipChange: (tip: CheckoutTip) => void;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const TIP_PRESETS = [5, 10, 15];

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
  tip,
  onTipChange,
  onConfirm,
  onBack,
  isSubmitting,
  error,
}: OrderReviewProps) {
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="order-review">
      <div className="order-review__header">
        <div className="order-review__nav">
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back to menu">
            ← Back
          </Button>
          <span className="order-review__steps" aria-label="Step 2 of 3">
            <span className="order-review__step order-review__step--done" />
            <span className="order-review__step order-review__step--current" />
            <span className="order-review__step" />
          </span>
        </div>
        <div className="order-review__title-row">
          <div>
            <h2 className="order-review__title">Review Your Order</h2>
            <p className="order-review__subtitle">
              Check everything before sending to the kitchen
            </p>
          </div>
          <span className="order-review__table-badge">
            Table {tableNumber}
            <span className="order-review__table-count">
              {totalQty} item{totalQty === 1 ? "" : "s"}
            </span>
          </span>
        </div>
      </div>

      <section className="order-review__card" aria-label="Order items">
        <div className="order-review__card-head">
          <span className="order-review__card-icon" aria-hidden="true">
            🧾
          </span>
          <h3 className="order-review__card-title">Your items</h3>
        </div>
        <div className="order-review__items">
          {items.map((item) => (
            <div key={item.productId} className="order-review__item">
              <span className="order-review__qty-bubble" aria-label={`Quantity ${item.quantity}`}>
                {item.quantity}×
              </span>
              <div className="order-review__item-info">
                <span className="order-review__item-name">{item.name}</span>
                <span className="order-review__item-unit">
                  {formatPrice(item.price)} each
                </span>
              </div>
              <span className="order-review__item-price">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="order-review__card" aria-label="Savings and loyalty">
        <div className="order-review__card-head">
          <span className="order-review__card-icon" aria-hidden="true">
            🎟️
          </span>
          <h3 className="order-review__card-title">Savings & loyalty</h3>
        </div>
        <div className="order-review__fields">
          <div className="order-review__field">
            <label className="order-review__label" htmlFor="order-coupon-code">
              Coupon code <span className="order-review__optional">optional</span>
            </label>
            <input
              id="order-coupon-code"
              className="order-review__input"
              type="text"
              placeholder="e.g. WELCOME10"
              autoComplete="off"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="order-review__field">
            <label className="order-review__label" htmlFor="order-phone">
              Loyalty phone <span className="order-review__optional">optional</span>
            </label>
            <input
              id="order-phone"
              className="order-review__input"
              type="tel"
              inputMode="tel"
              placeholder="e.g. 01012345678"
              autoComplete="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="order-review__hint">Earn points on this order</p>
          </div>
        </div>
      </section>

      <section className="order-review__card" aria-label="Payment method">
        <div className="order-review__card-head">
          <span className="order-review__card-icon" aria-hidden="true">
            💳
          </span>
          <h3 className="order-review__card-title">How will you pay?</h3>
        </div>
        <fieldset className="order-review__payment">
          <legend className="order-review__legend">Payment method</legend>
          <div className="order-review__pay-grid">
            <label
              className={`order-review__pay-option${onlineProvider === null ? " order-review__pay-option--selected" : ""}`}
            >
              <input
                type="radio"
                name="payment-method"
                value="counter"
                checked={onlineProvider === null}
                onChange={() => onOnlineProviderChange(null)}
                disabled={isSubmitting}
              />
              <span className="order-review__pay-icon" aria-hidden="true">🧾</span>
              <span className="order-review__pay-text">
                <span className="order-review__pay-name">Pay at the counter</span>
                <span className="order-review__pay-sub">Cash or card on site</span>
              </span>
              <span className="order-review__pay-check" aria-hidden="true">✓</span>
            </label>
            {availableProviders.map((provider) => (
              <label
                key={provider.id}
                className={`order-review__pay-option${onlineProvider === provider.id ? " order-review__pay-option--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={provider.id}
                  checked={onlineProvider === provider.id}
                  onChange={() => onOnlineProviderChange(provider.id)}
                  disabled={isSubmitting}
                />
                <span className="order-review__pay-icon" aria-hidden="true">💳</span>
                <span className="order-review__pay-text">
                  <span className="order-review__pay-name">{provider.label}</span>
                  <span className="order-review__pay-sub">Pay now online</span>
                </span>
                <span className="order-review__pay-check" aria-hidden="true">✓</span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="order-review__card" aria-label="Tip">
        <div className="order-review__card-head">
          <span className="order-review__card-icon" aria-hidden="true">
            💚
          </span>
          <h3 className="order-review__card-title">Add a tip?</h3>
          <span className="order-review__optional">optional</span>
        </div>
        <fieldset className="order-review__tip">
          <legend className="order-review__legend">Add a tip (optional)</legend>
          <div className="order-review__tip-pills" role="group" aria-label="Tip percent">
            <label className={`order-review__tip-pill${tip.kind === "none" ? " order-review__tip-pill--selected" : ""}`}>
              <input
                type="radio"
                name="tip"
                value="none"
                checked={tip.kind === "none"}
                onChange={() => onTipChange({ kind: "none" })}
                disabled={isSubmitting}
              />
              <span>No tip</span>
            </label>
            {TIP_PRESETS.map((preset) => (
              <label
                key={preset}
                className={`order-review__tip-pill${tip.kind === "percent" && tip.value === preset ? " order-review__tip-pill--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="tip"
                  value={String(preset)}
                  checked={tip.kind === "percent" && tip.value === preset}
                  onChange={() => onTipChange({ kind: "percent", value: preset })}
                  disabled={isSubmitting}
                />
                <span>{preset}%</span>
              </label>
            ))}
          </div>
          <div className="order-review__field order-review__field--tip-fixed">
            <label className="order-review__label" htmlFor="order-tip-fixed">
              Or fixed amount
            </label>
            <input
              id="order-tip-fixed"
              className="order-review__input"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder="0"
              value={tip.kind === "fixed" ? String(tip.value) : ""}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                onTipChange(
                  e.target.value === "" || Number.isNaN(parsed)
                    ? { kind: "none" }
                    : { kind: "fixed", value: parsed },
                );
              }}
              disabled={isSubmitting}
            />
          </div>
        </fieldset>
      </section>

      {error && (
        <p className="order-review__error" role="alert">
          {error}
        </p>
      )}

      <div className="order-review__footer">
        <div className="order-review__total">
          <div>
            <span className="order-review__total-label">Total to pay</span>
            <span className="order-review__total-count">
              {totalQty} item{totalQty === 1 ? "" : "s"} · Table {tableNumber}
            </span>
          </div>
          <span className="order-review__total-amount">
            {formatPrice(totalAmount)}
          </span>
        </div>
        <div className="order-review__actions">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onConfirm}
            loading={isSubmitting}
            loadingText="Placing Order…"
            className="order-review__confirm-btn"
          >
            Place Order · {formatPrice(totalAmount)}
          </Button>
        </div>
      </div>
    </div>
  );
}
