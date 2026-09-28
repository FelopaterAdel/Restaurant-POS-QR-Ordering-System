import { describe, expect, it, vi } from "vitest";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { ListLowStockUseCase } from "../use-cases/list-low-stock.use-case.js";
import { buildIngredient } from "./ingredient.fixture.js";

describe("ListLowStockUseCase", () => {
  it("returns only active ingredients at or below threshold", async () => {
    const repository = {
      findActive: vi.fn().mockResolvedValue([
        buildIngredient({
          id: "ok",
          quantityInStock: "50" as never,
          lowStockThreshold: "10" as never,
        }),
        buildIngredient({
          id: "low",
          quantityInStock: "5" as never,
          lowStockThreshold: "10" as never,
        }),
        buildIngredient({
          id: "exact",
          quantityInStock: "10" as never,
          lowStockThreshold: "10" as never,
        }),
      ]),
    } as unknown as IngredientRepository;
    const useCase = new ListLowStockUseCase(repository);

    const result = await useCase.execute();

    expect(result.map((row) => row.id).sort()).toEqual(["exact", "low"]);
  });
});
