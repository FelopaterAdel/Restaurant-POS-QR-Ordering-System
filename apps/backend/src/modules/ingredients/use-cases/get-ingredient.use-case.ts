import type { Ingredient } from "@restaurant/database";
import { NotFoundError } from "../../../errors/app-error.js";
import { AppErrorCode } from "../../../errors/codes.js";
import { IngredientRepository } from "../repositories/ingredient.repository.js";

export class IngredientNotFoundError extends NotFoundError {
  constructor() {
    super(AppErrorCode.INGREDIENT_NOT_FOUND, "Ingredient not found");
    this.name = "IngredientNotFoundError";
  }
}

export class GetIngredientUseCase {
  private readonly ingredientRepository: IngredientRepository;

  constructor(
    ingredientRepository: IngredientRepository = new IngredientRepository(),
  ) {
    this.ingredientRepository = ingredientRepository;
  }

  async execute(id: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findById(id);
    if (!ingredient) {
      throw new IngredientNotFoundError();
    }
    return ingredient;
  }
}
