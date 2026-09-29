import type { Ingredient } from "@restaurant/database";
import { IngredientRepository } from "../../ingredients/repositories/ingredient.repository.js";

export interface StockSummaryDTO {
  totalActive: number;
  lowCount: number;
  outOfStockCount: number;
  lowStock: Ingredient[];
}

export class GetStockSummaryUseCase {
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
  }

  async execute(): Promise<StockSummaryDTO> {
    const ingredients = await this.ingredientRepository.findActive();

    const lowStock = ingredients.filter(
      (ingredient) =>
        Number(ingredient.quantityInStock) <=
        Number(ingredient.lowStockThreshold),
    );
    const outOfStockCount = ingredients.filter(
      (ingredient) => Number(ingredient.quantityInStock) <= 0,
    ).length;

    return {
      totalActive: ingredients.length,
      lowCount: lowStock.length,
      outOfStockCount,
      lowStock,
    };
  }
}
