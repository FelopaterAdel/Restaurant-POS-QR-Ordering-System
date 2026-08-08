import { describe, expect, it, vi } from "vitest";
import { ProductRepository } from "../repositories/product.repository.js";
import { ListProductsUseCase } from "../use-cases/list-products.use-case.js";
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

describe("ListProductsUseCase", () => {
  it("returns available products only", async () => {
    const repository = createMockRepository();
    const useCase = new ListProductsUseCase(repository);

    const available = [
      buildProduct({ id: "prod_1", name: "Margherita Pizza" }),
      buildProduct({ id: "prod_2", name: "Cola" }),
    ];
    const unavailable = buildProduct({
      id: "prod_3",
      name: "Chicken Pizza",
      isAvailable: false,
    });
    const deleted = buildProduct({
      id: "prod_4",
      name: "Old Pizza",
      isDeleted: true,
    });

    vi.mocked(repository.findAvailable).mockResolvedValueOnce(available);

    const result = await useCase.execute();

    expect(repository.findAvailable).toHaveBeenCalledOnce();
    expect(result).toEqual(available);
    expect(result).not.toContain(unavailable);
    expect(result).not.toContain(deleted);
  });
});
