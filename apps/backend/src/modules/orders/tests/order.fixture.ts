import {
  OrderStatus,
  Prisma,
  TableStatus,
  UserRole,
  UserStatus,
} from "@restaurant/database";
import type {
  Order,
  OrderItem,
  Product,
  RestaurantTable,
} from "@restaurant/database";
import type { AuthenticatedUser } from "../../../types/auth.js";

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

export interface OrderItemWithProduct extends OrderItem {
  product: Pick<Product, "id" | "name">;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface OrderWithTable extends OrderWithItems {
  table: Pick<RestaurantTable, "number">;
}

export function buildOrderItem(
  overrides: Partial<OrderItemWithProduct> = {},
): OrderItemWithProduct {
  return {
    id: "item_1",
    orderId: "order_1",
    productId: "prod_1",
    quantity: 2,
    unitPrice: new Prisma.Decimal(150),
    totalPrice: new Prisma.Decimal(300),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    product: { id: "prod_1", name: "Margherita Pizza" },
    ...overrides,
  };
}

export function buildUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: "user_1",
    name: "Test User",
    email: "user@test.com",
    role: UserRole.OWNER,
    status: UserStatus.ACTIVE,
    ...overrides,
  };
}

export function buildOrder(
  overrides: Partial<OrderWithTable> = {},
): OrderWithTable {
  return {
    id: "order_1",
    tableId: "table_1",
    status: OrderStatus.PENDING,
    totalAmount: new Prisma.Decimal(300),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    items: [],
    table: { number: 5 },
    ...overrides,
  };
}
