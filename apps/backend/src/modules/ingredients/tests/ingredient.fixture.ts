import type { Ingredient } from "@restaurant/database";

export function buildIngredient(
  overrides: Partial<Ingredient> = {},
): Ingredient {
  return {
    id: "ing_1",
    name: "Flour",
    unit: "kg",
    quantityInStock: "100" as unknown as Ingredient["quantityInStock"],
    lowStockThreshold: "10" as unknown as Ingredient["lowStockThreshold"],
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
