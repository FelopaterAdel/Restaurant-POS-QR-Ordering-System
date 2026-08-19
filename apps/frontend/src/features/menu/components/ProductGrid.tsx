import { ProductCard } from "./ProductCard";
import type { PublicProduct } from "../menu.types";

interface ProductGridProps {
  products: PublicProduct[];
  getItemQuantity: (productId: string) => number;
  onAdd: (product: PublicProduct) => void;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
}

export function ProductGrid({
  products,
  getItemQuantity,
  onAdd,
  onIncrement,
  onDecrement,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="product-grid__empty">
        <p>No products available</p>
      </div>
    );
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={getItemQuantity(product.id)}
          onAdd={() => onAdd(product)}
          onIncrement={() => onIncrement(product.id)}
          onDecrement={() => onDecrement(product.id)}
        />
      ))}
    </div>
  );
}
