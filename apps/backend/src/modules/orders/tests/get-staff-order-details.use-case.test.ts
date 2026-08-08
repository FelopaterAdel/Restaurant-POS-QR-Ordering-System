import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import {
  OrderRepository,
  type StaffOrderWithRelations,
} from "../repositories/order.repository.js";
import { GetStaffOrderDetailsUseCase } from "../use-cases/get-staff-order-details.use-case.js";
import { OrderNotFoundError } from "../use-cases/get-order.use-case.js";

function buildStaffOrder(
  overrides: Partial<StaffOrderWithRelations> = {},
): StaffOrderWithRelations {
  return {
    id: "order_1",
    tableId: "table_1",
    status: OrderStatus.SERVED,
    paymentStatus: PaymentStatus.PENDING,
    totalAmount: new Prisma.Decimal(450),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    items: [
      {
        id: "item_1",
        orderId: "order_1",
        productId: "prod_1",
        quantity: 2,
        unitPrice: new Prisma.Decimal(150),
        totalPrice: new Prisma.Decimal(300),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        product: { id: "prod_1", name: "Margherita Pizza" },
      },
      {
        id: "item_2",
        orderId: "order_1",
        productId: "prod_2",
        quantity: 3,
        unitPrice: new Prisma.Decimal(50),
        totalPrice: new Prisma.Decimal(150),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        product: { id: "prod_2", name: "Cola" },
      },
    ],
    table: { id: "table_1", number: 5 },
    payments: [],
    ...overrides,
  };
}

function createMockRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    findTableById: vi.fn(),
    findProductsByIds: vi.fn(),
    createWithItems: vi.fn(),
    findById: vi.fn(),
    findStaffDetailsById: vi.fn(),
    findMany: vi.fn(),
    updateStatus: vi.fn(),
    completeOrderAndReleaseTable: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("GetStaffOrderDetailsUseCase", () => {
  it("returns order, table and items for a paid order", async () => {
    const repository = createMockRepository();
    const useCase = new GetStaffOrderDetailsUseCase(repository);

    vi.mocked(repository.findStaffDetailsById).mockResolvedValueOnce(
      buildStaffOrder(),
    );

    const result = await useCase.execute("order_1");

    expect(result.order).toEqual({
      id: "order_1",
      status: OrderStatus.SERVED,
      totalAmount: 450,
    });
    expect(result.table).toEqual({ id: "table_1", number: 5 });
    expect(result.items).toEqual([
      {
        product: { id: "prod_1", name: "Margherita Pizza" },
        quantity: 2,
        unitPrice: 150,
        totalPrice: 300,
      },
      {
        product: { id: "prod_2", name: "Cola" },
        quantity: 3,
        unitPrice: 50,
        totalPrice: 150,
      },
    ]);
    expect(result.payment).toBeNull();
  });

  it("returns the payment when the order has been paid", async () => {
    const repository = createMockRepository();
    const useCase = new GetStaffOrderDetailsUseCase(repository);

    vi.mocked(repository.findStaffDetailsById).mockResolvedValueOnce(
      buildStaffOrder({
        paymentStatus: PaymentStatus.PAID,
        payments: [
          {
            status: PaymentStatus.PAID,
            method: PaymentMethod.CASH,
            amount: new Prisma.Decimal(450),
            paidAt: new Date("2026-01-02T10:00:00.000Z"),
          },
        ],
      }),
    );

    const result = await useCase.execute("order_1");

    expect(result.payment).toEqual({
      status: PaymentStatus.PAID,
      method: PaymentMethod.CASH,
      amount: 450,
      paidAt: new Date("2026-01-02T10:00:00.000Z"),
    });
  });

  it("does not expose sensitive or internal fields", async () => {
    const repository = createMockRepository();
    const useCase = new GetStaffOrderDetailsUseCase(repository);

    vi.mocked(repository.findStaffDetailsById).mockResolvedValueOnce(
      buildStaffOrder({
        paymentStatus: PaymentStatus.PAID,
        payments: [
          {
            status: PaymentStatus.PAID,
            method: PaymentMethod.CARD,
            amount: new Prisma.Decimal(450),
            paidAt: new Date("2026-01-02T10:00:00.000Z"),
          },
        ],
      }),
    );

    const result = await useCase.execute("order_1");
    const serialized = JSON.parse(JSON.stringify(result)) as {
      payment: Record<string, unknown>;
      items: Array<Record<string, unknown>>;
    };

    expect(serialized).not.toHaveProperty("password");
    expect(serialized).not.toHaveProperty("refreshToken");
    expect(serialized.payment).not.toHaveProperty("id");
    expect(serialized.payment).not.toHaveProperty("orderId");
    expect(serialized.items[0]).not.toHaveProperty("id");
  });

  it("throws OrderNotFoundError when the order does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetStaffOrderDetailsUseCase(repository);

    vi.mocked(repository.findStaffDetailsById).mockResolvedValueOnce(null);

    await expect(useCase.execute("order_missing")).rejects.toBeInstanceOf(
      OrderNotFoundError,
    );
  });
});
