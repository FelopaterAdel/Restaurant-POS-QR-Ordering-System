import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../repositories/category.repository.js";
import { CategoryNameAlreadyExistsError } from "../use-cases/create-category.use-case.js";
import { CategoryNotFoundError } from "../use-cases/get-category.use-case.js";
import { UpdateCategoryUseCase } from "../use-cases/update-category.use-case.js";
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

describe("UpdateCategoryUseCase", () => {
  it("updates a category", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", name: "Pizza" });
    const updated = buildCategory({ id: "cat_1", name: "Pizzas" });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.update).mockResolvedValueOnce(updated);

    const result = await useCase.execute("cat_1", { name: "Pizzas" });

    expect(repository.update).toHaveBeenCalledWith("cat_1", { name: "Pizzas" });
    expect(result).toEqual(updated);
  });

  it("throws CategoryNotFoundError when the category does not exist", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateCategoryUseCase(repository);

    vi.mocked(repository.findById).mockResolvedValueOnce(null);

    await expect(
      useCase.execute("cat_missing", { name: "Pizzas" }),
    ).rejects.toBeInstanceOf(CategoryNotFoundError);
  });

  it("rejects updating to a name that already exists", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", name: "Pizza" });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.findByName).mockResolvedValueOnce(
      buildCategory({ id: "cat_2", name: "Drinks" }),
    );

    await expect(
      useCase.execute("cat_1", { name: "Drinks" }),
    ).rejects.toBeInstanceOf(CategoryNameAlreadyExistsError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", name: "Pizza" });

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`name`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);
    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.update).mockRejectedValueOnce(p2002);

    await expect(
      useCase.execute("cat_1", { name: "Pizzas" }),
    ).rejects.toBeInstanceOf(CategoryNameAlreadyExistsError);
  });

  it("returns the category unchanged when nothing is provided", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateCategoryUseCase(repository);
    const existing = buildCategory({ id: "cat_1", name: "Pizza" });

    vi.mocked(repository.findById).mockResolvedValueOnce(existing);

    const result = await useCase.execute("cat_1", {});

    expect(repository.update).not.toHaveBeenCalled();
    expect(result).toEqual(existing);
  });
});
