import { Prisma } from "@restaurant/database";
import type { Product } from "@restaurant/database";

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_1",
    categoryId: "cat_1",
    name: "Margherita Pizza",
    description: null,
    price: new Prisma.Decimal(150),
    imageUrl: null,
    isAvailable: true,
    isDeleted: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
