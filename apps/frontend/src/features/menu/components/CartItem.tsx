import { Button } from "@/components/ui";
import type { CartItem as CartItemType } from "../menu.types";

interface CartItemProps {
  item: CartItemType;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
}

function formatPrice(price: number): string {
  return `₹${price}`;
}

export function CartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  return (
    <div className="cart-item">
      <div className="cart-item__info">
        <span className="cart-item__name">{item.name}</span>
        <span className="cart-item__price">
          {formatPrice(item.price * item.quantity)}
        </span>
      </div>

      <div className="cart-item__controls">
        <div className="cart-item__qty">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDecrement(item.productId)}
          >
            −
          </Button>
          <span className="cart-item__qty-value">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onIncrement(item.productId)}
          >
            +
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.productId)}
        >
          ✕
        </Button>
      </div>
    </div>
  );
}
