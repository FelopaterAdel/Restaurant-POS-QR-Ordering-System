import { ReservationStatus } from "@restaurant/database";

export function buildReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: "res_1",
    customerName: "Ahmed Samy",
    phone: "01012345678",
    partySize: 4,
    tableId: "table_1",
    reservedFor: new Date("2030-01-15T19:00:00.000Z"),
    status: ReservationStatus.PENDING,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    table: { id: "table_1", number: 5, name: "Table 5" },
    ...overrides,
  };
}

export function buildTable(overrides: Record<string, unknown> = {}) {
  return {
    id: "table_1",
    number: 5,
    name: "Table 5",
    qrCode: "tbl_abc123",
    status: "AVAILABLE",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
