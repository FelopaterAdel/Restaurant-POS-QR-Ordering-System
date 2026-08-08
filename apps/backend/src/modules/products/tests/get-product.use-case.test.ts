import { describe, expect, it, vi } from "vitest";
import { ProductRepository } from "../repositories/product.repository.js";
import {
  GetProductUseCase,
  ProductNotFoundError,
} from "../use-cases/get-product.use-case.js";
import { buildProduct } from "./product.fixture.js";

function createMockRepository(
  overrides: Partial<ProductRepository> = {},
): ProductRepository {
  return {
    findById: vi.fn(),
    findAvailable: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as ProductRepository;
}

describe("GetProductUseCase", () => {
  it("returns the product when it exists", async () => {
    const repository = createMockRepository();
    const useCase = new GetProductUseCase(repository);
    const product = buildProduct({ id: "prod_1" });

    vi.mocked(repository.findById).mockResolvedValueOnce(product);

    const result = await useCase.execute("prod_1");

    expect(repository.findById).toHaveBeenCalledWith("prod_1");
    expect(result).toEqual(product);
  });

  it("throws ProductNotFoundError when the product does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetProductUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("prod_missing")).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
  });
});
