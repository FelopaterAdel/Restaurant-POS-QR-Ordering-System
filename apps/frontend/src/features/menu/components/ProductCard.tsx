import { Button } from "@/components/ui";
import type { PublicProduct } from "../menu.types";

interface ProductCardProps {
  product: PublicProduct;
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function formatPrice(price: number): string {
  return `₹${price}`;
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: ProductCardProps) {
  return (
    <div className="product-card">
      <div className="product-card__info">
        <h3 className="product-card__name">{product.name}</h3>
        {product.description && (
          <p className="product-card__description">{product.description}</p>
        )}
        <span className="product-card__price">
          {formatPrice(product.price)}
        </span>
      </div>

      <div className="product-card__action">
        {!product.isAvailable ? (
          <span className="product-card__unavailable">Unavailable</span>
        ) : quantity === 0 ? (
          <Button variant="primary" size="sm" onClick={onAdd}>
            Add
          </Button>
        ) : (
          <div className="product-card__qty">
            <Button variant="outline" size="sm" onClick={onDecrement}>
              −
            </Button>
            <span className="product-card__qty-value">{quantity}</span>
            <Button variant="outline" size="sm" onClick={onIncrement}>
              +
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
