import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { DashboardRepository } from "../repositories/dashboard.repository.js";
import { GetTopProductsUseCase } from "../use-cases/get-top-products.use-case.js";

function setup() {
  const dashboardRepository = {
    findTopProducts: vi.fn(),
  } as unknown as DashboardRepository;
  const productRepository = {
    findProductsByIds: vi.fn(),
  } as unknown as ProductRepository;
  const useCase = new GetTopProductsUseCase(
    dashboardRepository,
    productRepository,
  );
  return { dashboardRepository, productRepository, useCase };
}

describe("GetTopProductsUseCase", () => {
  it("maps rows to named products with quantities and revenue", async () => {
    const { dashboardRepository, productRepository, useCase } = setup();

    vi.mocked(dashboardRepository.findTopProducts).mockResolvedValueOnce([
      { productId: "prod_1", quantity: 12, revenue: new Prisma.Decimal(1800) },
      { productId: "prod_2", quantity: 5, revenue: new Prisma.Decimal(250) },
    ]);
    vi.mocked(productRepository.findProductsByIds).mockResolvedValueOnce([
      { id: "prod_1", name: "Margherita" },
      { id: "prod_2", name: "Cola" },
    ] as never);

    const result = await useCase.execute({
      from: "2026-09-01",
      to: "2026-09-28",
      limit: 10,
    });

    expect(dashboardRepository.findTopProducts).toHaveBeenCalledTimes(1);
    const [range, limit] = vi.mocked(dashboardRepository.findTopProducts).mock
      .calls[0];
    expect(limit).toBe(10);
    expect(range.start).toBeInstanceOf(Date);
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    expect(result).toEqual([
      {
        productId: "prod_1",
        productName: "Margherita",
        quantity: 12,
        revenue: 1800,
      },
      { productId: "prod_2", productName: "Cola", quantity: 5, revenue: 250 },
    ]);
  });

  it("falls back to an unknown label for deleted products", async () => {
    const { dashboardRepository, productRepository, useCase } = setup();

    vi.mocked(dashboardRepository.findTopProducts).mockResolvedValueOnce([
      { productId: "prod_gone", quantity: 2, revenue: new Prisma.Decimal(60) },
    ]);
    vi.mocked(productRepository.findProductsByIds).mockResolvedValueOnce([]);

    const result = await useCase.execute({});

    expect(result).toEqual([
      {
        productId: "prod_gone",
        productName: "Unknown product",
        quantity: 2,
        revenue: 60,
      },
    ]);
  });

  it("returns an empty list without touching products", async () => {
    const { dashboardRepository, productRepository, useCase } = setup();

    vi.mocked(dashboardRepository.findTopProducts).mockResolvedValueOnce([]);

    const result = await useCase.execute({});

    expect(result).toEqual([]);
    expect(productRepository.findProductsByIds).not.toHaveBeenCalled();
  });
});
