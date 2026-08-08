import { TableStatus } from "@restaurant/database";
import type { RestaurantTable } from "@restaurant/database";

export function buildTable(
  overrides: Partial<RestaurantTable> = {},
): RestaurantTable {
  return {
    id: "table_1",
    number: 1,
    name: "Table 1",
    qrCode: "tbl_abc123",
    status: TableStatus.AVAILABLE,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
