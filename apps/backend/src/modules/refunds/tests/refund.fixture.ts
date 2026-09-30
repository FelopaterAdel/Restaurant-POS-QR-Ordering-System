import { PaymentMethod, PaymentStatus, Prisma } from "@restaurant/database";
import { RefundStatus } from "@restaurant/database";

export function buildPaidPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay_1",
    orderId: "order_1",
    amount: new Prisma.Decimal(300),
    method: PaymentMethod.CASH,
    status: PaymentStatus.PAID,
    tipAmount: new Prisma.Decimal(0),
    provider: null,
    providerRef: null,
    paidAt: new Date("2026-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function buildRefund(overrides: Record<string, unknown> = {}) {
  return {
    id: "ref_1",
    paymentId: "pay_1",
    orderId: "order_1",
    amount: new Prisma.Decimal(300),
    reason: "Customer complaint",
    status: RefundStatus.PENDING,
    requestedBy: "user_cashier",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    payment: {
      id: "pay_1",
      orderId: "order_1",
      amount: new Prisma.Decimal(300),
      tipAmount: new Prisma.Decimal(0),
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
    },
    order: {
      id: "order_1",
      orderNumber: 1001,
      totalAmount: new Prisma.Decimal(300),
    },
    ...overrides,
  };
}
