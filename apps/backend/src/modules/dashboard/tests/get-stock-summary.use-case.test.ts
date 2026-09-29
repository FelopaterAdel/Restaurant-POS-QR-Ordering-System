import { describe, expect, it, vi } from "vitest";
import { IngredientRepository } from "../../ingredients/repositories/ingredient.repository.js";
import { GetStockSummaryUseCase } from "../use-cases/get-stock-summary.use-case.js";
import { buildIngredient } from "../../ingredients/tests/ingredient.fixture.js";

describe("GetStockSummaryUseCase", () => {
  it("counts low and out-of-stock ingredients", async () => {
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
          id: "empty",
          quantityInStock: "0" as never,
          lowStockThreshold: "10" as never,
        }),
      ]),
    } as unknown as IngredientRepository;
    const useCase = new GetStockSummaryUseCase(repository);

    const result = await useCase.execute();

    expect(result.totalActive).toBe(3);
    expect(result.lowCount).toBe(2);
    expect(result.outOfStockCount).toBe(1);
    expect(result.lowStock.map((row) => row.id).sort()).toEqual([
      "empty",
      "low",
    ]);
  });
});
