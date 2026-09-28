import { describe, expect, it, vi } from "vitest";
import { ProductRepository } from "../../products/repositories/product.repository.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { ProductRecipeRepository } from "../repositories/product-recipe.repository.js";
import { SetProductRecipeUseCase } from "../use-cases/set-product-recipe.use-case.js";
import { IngredientNotFoundError } from "../use-cases/get-ingredient.use-case.js";
import { buildIngredient } from "./ingredient.fixture.js";

function createUseCase() {
  const productRepository = {
    findById: vi.fn(),
  } as unknown as ProductRepository;
  const ingredientRepository = {
    findById: vi.fn(),
  } as unknown as IngredientRepository;
  const recipeRepository = {
    getRecipe: vi.fn(),
    setRecipe: vi.fn(),
  } as unknown as ProductRecipeRepository;
  const useCase = new SetProductRecipeUseCase(
    productRepository,
    ingredientRepository,
    recipeRepository,
  );
  return { productRepository, ingredientRepository, recipeRepository, useCase };
}

describe("SetProductRecipeUseCase", () => {
  it("saves a recipe when product and ingredients exist", async () => {
    const { productRepository, ingredientRepository, recipeRepository, useCase } =
      createUseCase();

    vi.mocked(productRepository.findById).mockResolvedValueOnce({
      id: "prod_1",
    } as never);
    vi.mocked(ingredientRepository.findById).mockResolvedValue(
      buildIngredient() as never,
    );
    vi.mocked(recipeRepository.setRecipe).mockResolvedValueOnce([] as never);

    await useCase.execute("prod_1", {
      items: [{ ingredientId: "ing_1", quantityUsed: 2 }],
    });

    expect(recipeRepository.setRecipe).toHaveBeenCalledWith("prod_1", [
      { ingredientId: "ing_1", quantityUsed: 2 },
    ]);
  });

  it("rejects an unknown ingredient", async () => {
    const { productRepository, ingredientRepository, recipeRepository, useCase } =
      createUseCase();

    vi.mocked(productRepository.findById).mockResolvedValueOnce({
      id: "prod_1",
    } as never);
    vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(null as never);

    await expect(
      useCase.execute("prod_1", {
        items: [{ ingredientId: "missing", quantityUsed: 1 }],
      }),
    ).rejects.toBeInstanceOf(IngredientNotFoundError);
    expect(recipeRepository.setRecipe).not.toHaveBeenCalled();
  });
});
