import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../repositories/category.repository.js";
import { DisableCategoryUseCase } from "../use-cases/disable-category.use-case.js";
import { CategoryNotFoundError } from "../use-cases/get-category.use-case.js";
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

describe("DisableCategoryUseCase", () => {
  it("disables an active category", async () => {
    const repository = createMockRepository();
    const useCase = new DisableCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", isActive: true });
    const disabled = buildCategory({ id: "cat_1", isActive: false });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.disable).mockResolvedValueOnce(disabled);

    const result = await useCase.execute("cat_1");

    expect(repository.disable).toHaveBeenCalledWith("cat_1");
    expect(result).toEqual(disabled);
  });

  it("throws CategoryNotFoundError when the category does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new DisableCategoryUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute("cat_missing")).rejects.toBeInstanceOf(
      CategoryNotFoundError,
    );
  });

  it("does not update an already disabled category", async () => {
    const repository = createMockRepository();
    const useCase = new DisableCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", isActive: false });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("cat_1");

    expect(repository.disable).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
