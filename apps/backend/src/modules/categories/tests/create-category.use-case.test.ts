import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { CategoryRepository } from "../repositories/category.repository.js";
import {
  CategoryNameAlreadyExistsError,
  CreateCategoryUseCase,
} from "../use-cases/create-category.use-case.js";
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

describe("CreateCategoryUseCase", () => {
  it("creates a category", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCategoryUseCase(repository);
    const category = buildCategory();

    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockResolvedValueOnce(category);

    const result = await useCase.execute({ name: "Pizza" });

    expect(repository.create).toHaveBeenCalledWith({ name: "Pizza" });
    expect(result).toEqual(category);
  });

  it("rejects a duplicate category name", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCategoryUseCase(repository);

    vi.mocked(repository.findByName).mockResolvedValueOnce(
      buildCategory({ name: "Pizza" }),
    );

    await expect(useCase.execute({ name: "Pizza" })).rejects.toBeInstanceOf(
      CategoryNameAlreadyExistsError,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new CreateCategoryUseCase(repository);

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`name`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockRejectedValueOnce(p2002);

    await expect(useCase.execute({ name: "Pizza" })).rejects.toBeInstanceOf(
      CategoryNameAlreadyExistsError,
    );
  });
});
