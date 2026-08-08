import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../repositories/category.repository.js";
import { ListCategoriesUseCase } from "../use-cases/list-categories.use-case.js";
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

describe("ListCategoriesUseCase", () => {
  it("returns active categories only", async () => {
    const repository = createMockRepository();
    const useCase = new ListCategoriesUseCase(repository);

    const active = [
      buildCategory({ id: "cat_1", name: "Pizza" }),
      buildCategory({ id: "cat_2", name: "Drinks" }),
    ];
    const disabled = buildCategory({ id: "cat_3", name: "Desserts", isActive: false });

    vi.mocked(repository.findActive).mockResolvedValueOnce(active);

    const result = await useCase.execute();

    expect(repository.findActive).toHaveBeenCalledOnce();
    expect(result).toEqual(active);
    expect(result).not.toContain(disabled);
  });
});
