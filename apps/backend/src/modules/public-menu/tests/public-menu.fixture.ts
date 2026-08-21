import { Prisma, TableStatus } from "@restaurant/database";
import type {
  Category,
  Product,
  Restaurant,
  RestaurantTable,
} from "@restaurant/database";

export interface CategoryWithProducts extends Category {
  products: Product[];
}

export function buildTable(
  overrides: Partial<RestaurantTable> = {},
): RestaurantTable {
  return {
    id: "table_1",
    number: 5,
    name: "Table 5",
    qrCode: "tbl_abc123",
    status: TableStatus.AVAILABLE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function buildProduct(
  overrides: Partial<Product> = {},
): Product {
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

export function buildCategory(
  overrides: Partial<CategoryWithProducts> = {},
): CategoryWithProducts {
  return {
    id: "cat_1",
    name: "Pizza",
    description: null,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    products: [],
    ...overrides,
  };
}

export function buildRestaurant(
  overrides: Partial<Restaurant> = {},
): Restaurant {
  return {
    id: "rest_1",
    name: "Test Restaurant",
    description: null,
    phone: null,
    address: null,
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#059669",
    secondaryColor: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
