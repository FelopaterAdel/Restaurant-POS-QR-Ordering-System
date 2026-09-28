import { Prisma } from "@restaurant/database";
import { describe, expect, it, vi } from "vitest";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import {
  CreateIngredientUseCase,
  IngredientNameAlreadyExistsError,
} from "../use-cases/create-ingredient.use-case.js";
import { buildIngredient } from "./ingredient.fixture.js";

function createMockRepository(
  overrides: Partial<IngredientRepository> = {},
): IngredientRepository {
  return {
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    disable: vi.fn(),
    ...overrides,
  } as unknown as IngredientRepository;
}

describe("CreateIngredientUseCase", () => {
  it("creates an ingredient", async () => {
    const repository = createMockRepository();
    const useCase = new CreateIngredientUseCase(repository);
    const ingredient = buildIngredient();

    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockResolvedValueOnce(ingredient);

    const result = await useCase.execute({ name: "Flour", unit: "kg" });

    expect(repository.create).toHaveBeenCalledWith({
      name: "Flour",
      unit: "kg",
      quantityInStock: 0,
      lowStockThreshold: 0,
    });
    expect(result).toEqual(ingredient);
  });

  it("rejects a duplicate ingredient name", async () => {
    const repository = createMockRepository();
    const useCase = new CreateIngredientUseCase(repository);

    vi.mocked(repository.findByName).mockResolvedValueOnce(
      buildIngredient({ name: "Flour" }),
    );

    await expect(
      useCase.execute({ name: "Flour", unit: "kg" }),
    ).rejects.toBeInstanceOf(IngredientNameAlreadyExistsError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate name reported by the database", async () => {
    const repository = createMockRepository();
    const useCase = new CreateIngredientUseCase(repository);

    const p2002 = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (`name`)",
      { code: "P2002", clientVersion: "7.9.1" },
    );

    vi.mocked(repository.findByName).mockResolvedValueOnce(null);
    vi.mocked(repository.create).mockRejectedValueOnce(p2002);

    await expect(
      useCase.execute({ name: "Flour", unit: "kg" }),
    ).rejects.toBeInstanceOf(IngredientNameAlreadyExistsError);
  });
});
