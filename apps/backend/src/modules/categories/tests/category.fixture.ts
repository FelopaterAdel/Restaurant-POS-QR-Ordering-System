import type { Category } from "@restaurant/database";

export function buildCategory(
  overrides: Partial<Category> = {},
): Category {
  return {
    id: "cat_1",
    name: "Pizza",
    description: null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
