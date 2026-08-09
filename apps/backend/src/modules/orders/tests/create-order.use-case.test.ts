import { OrderStatus, Prisma, TableStatus } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { OrderRepository } from "../repositories/order.repository.js";
import type { CreateOrderDTO } from "../schemas/create-order.schema.js";
import {
  CreateOrderUseCase,
  ProductNotFoundError,
  ProductUnavailableError,
  TableDisabledError,
  TableNotFoundError,
} from "../use-cases/create-order.use-case.js";
import {
  buildOrder,
  buildOrderItem,
  buildProduct,
  buildTable,
} from "./order.fixture.js";

function createMockRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    findTableById: vi.fn(),
    findProductsByIds: vi.fn(),
    createWithItems: vi.fn(),
    ...overrides,
  } as unknown as OrderRepository;
}

describe("CreateOrderUseCase", () => {
  it("creates an order using database prices and a backend-calculated total", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);
    const pizza = buildProduct({
      id: "prod_1",
      name: "Margherita Pizza",
      price: new Prisma.Decimal(150),
    });
    const cola = buildProduct({
      id: "prod_2",
      name: "Cola",
      price: new Prisma.Decimal(30),
    });
    const createdOrder = buildOrder({
      totalAmount: new Prisma.Decimal(330),
      items: [
        buildOrderItem({ product: { id: "prod_1", name: "Margherita Pizza" } }),
        buildOrderItem({
          id: "item_2",
          productId: "prod_2",
          quantity: 1,
          unitPrice: new Prisma.Decimal(30),
          totalPrice: new Prisma.Decimal(30),
          product: { id: "prod_2", name: "Cola" },
        }),
      ],
    });

    vi.mocked(repository.findTableById).mockResolvedValueOnce(buildTable());
    vi.mocked(repository.findProductsByIds).mockResolvedValueOnce([
      pizza,
      cola,
    ]);
    vi.mocked(repository.createWithItems).mockResolvedValueOnce(createdOrder);

    const result = await useCase.execute({
      tableId: "table_1",
      items: [
        { productId: "prod_1", quantity: 2 },
        { productId: "prod_2", quantity: 1 },
      ],
    });

    const createCall = vi.mocked(repository.createWithItems).mock.calls[0][0];
    expect(createCall.tableId).toBe("table_1");
    expect(createCall.totalAmount.toNumber()).toBe(330);
    expect(createCall.items).toHaveLength(2);
    expect(createCall.items[0]).toEqual({
      productId: "prod_1",
      quantity: 2,
      unitPrice: expect.any(Prisma.Decimal),
      totalPrice: expect.any(Prisma.Decimal),
    });
    expect(createCall.items[0].unitPrice.toNumber()).toBe(150);
    expect(createCall.items[0].totalPrice.toNumber()).toBe(300);
    expect(createCall.items[1].unitPrice.toNumber()).toBe(30);
    expect(createCall.items[1].totalPrice.toNumber()).toBe(30);

    expect(result.totalAmount).toBe(330);
    expect(result.status).toBe(OrderStatus.PENDING);
    expect(result.orderNumber).toBe(1001);
    expect(result.items).toEqual([
      {
        id: "item_1",
        productId: "prod_1",
        productName: "Margherita Pizza",
        quantity: 2,
        unitPrice: 150,
        totalPrice: 300,
      },
      {
        id: "item_2",
        productId: "prod_2",
        productName: "Cola",
        quantity: 1,
        unitPrice: 30,
        totalPrice: 30,
      },
    ]);
  });

  it("ignores a client-provided price and uses the database price", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);
    const pizza = buildProduct({
      id: "prod_1",
      price: new Prisma.Decimal(150),
    });

    vi.mocked(repository.findTableById).mockResolvedValueOnce(buildTable());
    vi.mocked(repository.findProductsByIds).mockResolvedValueOnce([pizza]);
    vi.mocked(repository.createWithItems).mockResolvedValueOnce(buildOrder());

    await useCase.execute({
      tableId: "table_1",
      items: [{ productId: "prod_1", quantity: 2, price: 1 }],
    } as unknown as CreateOrderDTO);

    const createCall = vi.mocked(repository.createWithItems).mock.calls[0][0];
    expect(createCall.items[0].unitPrice.toNumber()).toBe(150);
    expect(createCall.items[0].totalPrice.toNumber()).toBe(300);
    expect(createCall.totalAmount.toNumber()).toBe(300);
  });

  it("ignores a client-provided orderNumber and lets the server generate it", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    vi.mocked(repository.findTableById).mockResolvedValueOnce(buildTable());
    vi.mocked(repository.findProductsByIds).mockResolvedValueOnce([
      buildProduct({ id: "prod_1", price: new Prisma.Decimal(150) }),
    ]);
    vi.mocked(repository.createWithItems).mockResolvedValueOnce(buildOrder());

    const result = await useCase.execute({
      tableId: "table_1",
      items: [{ productId: "prod_1", quantity: 1 }],
      orderNumber: 9999,
    } as unknown as CreateOrderDTO);

    const createCall = vi.mocked(repository.createWithItems).mock.calls[0][0];
    expect(createCall).not.toHaveProperty("orderNumber");
    expect(result.orderNumber).toBe(1001);
  });

  it("throws TableNotFoundError when the table does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    vi.mocked(repository.findTableById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute({
        tableId: "table_missing",
        items: [{ productId: "prod_1", quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(TableNotFoundError);
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it("throws TableDisabledError when the table is disabled", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    vi.mocked(repository.findTableById).mockResolvedValueOnce(
      buildTable({ status: TableStatus.DISABLED }),
    );

    await expect(
      useCase.execute({
        tableId: "table_1",
        items: [{ productId: "prod_1", quantity: 2 }],
      }),
    ).rejects.toBeInstanceOf(TableDisabledError);
    expect(repository.findProductsByIds).not.toHaveBeenCalled();
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it("throws ProductNotFoundError when a product does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);
    const pizza = buildProduct({ id: "prod_1" });

    vi.mocked(repository.findTableById).mockResolvedValueOnce(buildTable());
    vi.mocked(repository.findProductsByIds).mockResolvedValueOnce([pizza]);

    await expect(
      useCase.execute({
        tableId: "table_1",
        items: [
          { productId: "prod_1", quantity: 2 },
          { productId: "prod_missing", quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it("throws ProductUnavailableError when a product is not available", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    vi.mocked(repository.findTableById).mockResolvedValueOnce(buildTable());
    vi.mocked(repository.findProductsByIds).mockResolvedValueOnce([
      buildProduct({ id: "prod_1", isAvailable: false }),
    ]);

    await expect(
      useCase.execute({
        tableId: "table_1",
        items: [{ productId: "prod_1", quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(ProductUnavailableError);
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it("rejects a request without items", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    await expect(
      useCase.execute({ tableId: "table_1", items: [] }),
    ).rejects.toThrow();
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });

  it("rejects a non-positive quantity", async () => {
    const repository = createMockRepository();
    const useCase = new CreateOrderUseCase(repository);

    await expect(
      useCase.execute({
        tableId: "table_1",
        items: [{ productId: "prod_1", quantity: 0 }],
      }),
    ).rejects.toThrow();
    await expect(
      useCase.execute({
        tableId: "table_1",
        items: [{ productId: "prod_1", quantity: -3 }],
      }),
    ).rejects.toThrow();
    expect(repository.createWithItems).not.toHaveBeenCalled();
  });
});
