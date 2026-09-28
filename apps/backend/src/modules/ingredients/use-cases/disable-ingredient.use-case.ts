import type { Ingredient } from "@restaurant/database";
import { IngredientRepository } from "../repositories/ingredient.repository.js";
import { GetIngredientUseCase } from "./get-ingredient.use-case.js";

export class DisableIngredientUseCase {
  private readonly ingredientRepository: IngredientRepository;
  private readonly getIngredientUseCase: GetIngredientUseCase;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
    this.getIngredientUseCase = new GetIngredientUseCase(ingredientRepository);
  }

  async execute(id: string): Promise<Ingredient> {
    await this.getIngredientUseCase.execute(id);
    return this.ingredientRepository.disable(id);
  }
}
