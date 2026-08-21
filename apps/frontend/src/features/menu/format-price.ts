const CURRENCY = "EGP";

export function formatPrice(price: number): string {
  return `${CURRENCY} ${price}`;
}
