import type { Ingredient } from "@restaurant/database";
import { IngredientRepository } from "../repositories/ingredient.repository.js";

export class ListLowStockUseCase {
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
  }

  async execute(): Promise<Ingredient[]> {
    const ingredients = await this.ingredientRepository.findActive();
    return ingredients.filter(
      (ingredient) =>
        Number(ingredient.quantityInStock) <=
        Number(ingredient.lowStockThreshold),
    );
  }
}
