import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  CategoryNotFoundError,
  GetCategoryUseCase,
} from "../use-cases/get-category.use-case.js";
import { buildCategory } from "./category.fixture.js";

function createMockRepository(
  overrides: Partial<CategoryRepository> = {},
): CategoryRepository {
  return {
    findById: vi.fn(),
    findByName: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as CategoryRepository;
}

describe("GetCategoryUseCase", () => {
  it("returns the category when it exists", async () => {
    const repository = createMockRepository();
    const useCase = new GetCategoryUseCase(repository);
    const category = buildCategory({ id: "cat_1" });

    vi.mocked(repository.findById).mockResolvedValueOnce(category);

    const result = await useCase.execute("cat_1");

    expect(repository.findById).toHaveBeenCalledWith("cat_1");
    expect(result).toEqual(category);
  });

  it("throws CategoryNotFoundError when the category does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new GetCategoryUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("cat_missing")).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });
});
