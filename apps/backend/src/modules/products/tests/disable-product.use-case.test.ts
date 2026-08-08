import { describe, expect, it, vi } from "vitest";
import { ProductRepository } from "../repositories/product.repository.js";
import { DisableProductUseCase } from "../use-cases/disable-product.use-case.js";
import { ProductNotFoundError } from "../use-cases/get-product.use-case.js";
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

describe("DisableProductUseCase", () => {
  it("soft deletes an existing product", async () => {
    const repository = createMockRepository();
    const useCase = new DisableProductUseCase(repository);
    const existing = buildProduct({ id: "prod_1", isDeleted: false });
    const deleted = buildProduct({ id: "prod_1", isDeleted: true });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.disable).mockResolvedValueOnce(deleted);

    const result = await useCase.execute("prod_1");

    expect(repository.disable).toHaveBeenCalledWith("prod_1");
    expect(result).toEqual(deleted);
  });

  it("throws ProductNotFoundError when the product does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new DisableProductUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("prod_missing")).rejects.toBeInstanceOf(
      ProductNotFoundError,
    );
  });

  it("does not update an already deleted product", async () => {
    const repository = createMockRepository();
    const useCase = new DisableProductUseCase(repository);
    const existing = buildProduct({ id: "prod_1", isDeleted: true });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("prod_1");

    expect(repository.disable).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
