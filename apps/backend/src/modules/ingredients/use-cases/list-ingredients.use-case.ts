import type { Ingredient } from "@restaurant/database";
import { IngredientRepository } from "../repositories/ingredient.repository.js";

export class ListIngredientsUseCase {
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
  }

  async execute(activeOnly = false): Promise<Ingredient[]> {
    if (activeOnly) {
      return this.ingredientRepository.findActive();
    }
    return this.ingredientRepository.findAll();
  }
}
