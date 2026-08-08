import { PaymentMethod, PaymentStatus, Prisma } from "@restaurant/database";
import type { Payment } from "@restaurant/database";

export function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay_1",
    orderId: "order_1",
    amount: new Prisma.Decimal(300),
    method: PaymentMethod.CASH,
    status: PaymentStatus.PAID,
    paidAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}
