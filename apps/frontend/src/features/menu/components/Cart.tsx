import { Button } from "@/components/ui";
import { CartItem } from "./CartItem";
import type { CartItem as CartItemType } from "../menu.types";
import { formatPrice } from "../format-price";

interface CartProps {
  items: CartItemType[];
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
  onToggle: () => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  totalItems,
  totalAmount,
  isOpen,
  onToggle,
  onIncrement,
  onDecrement,
  onRemove,
  onCheckout,
}: CartProps) {
  if (totalItems === 0) return null;

  return (
    <div className={`cart ${isOpen ? "cart--open" : ""}`}>
      <button
        className="cart__toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="cart__toggle-info">
          <span className="cart__toggle-count">{totalItems} item(s)</span>
          <span className="cart__toggle-total">{formatPrice(totalAmount)}</span>
        </span>
        <span className="cart__toggle-icon">{isOpen ? "▼" : "▲"}</span>
      </button>

      {isOpen && (
        <div className="cart__panel">
          <div className="cart__items">
            {items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>

          <div className="cart__footer">
            <div className="cart__total">
              <span>Subtotal</span>
              <span className="cart__total-amount">
                {formatPrice(totalAmount)}
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={onCheckout}
              className="cart__checkout-btn"
            >
              Review Order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
